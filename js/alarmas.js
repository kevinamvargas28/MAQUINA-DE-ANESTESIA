/* =====================================================================
   alarmas.js  -  Motor de alarmas con prioridad y temporizadores
   ---------------------------------------------------------------------
   Seccion 3g del documento: tres niveles de prioridad.
   Los umbrales y los retardos salen del perfil, no estan fijos aqui.
   Capa 1 muestra como maximo 6 alarmas (regla de diseno 5.3).
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.alarmas = (function () {
  'use strict';

  var MAX_CAPA1 = 6;

  /* Cada definicion: id, texto, prioridad (ruta del perfil o valor),
     condicion(calc, est, p) -> boolean, retardoSeg, porque [capa 2],
     fuente [capa 3]. */
  function definiciones(p) {
    return [
      /* ---- Suministro de O2 ------------------------------------- */
      {
        id: 'o2_supply',
        texto: 'Fallo de suministro de O2',
        prioridad: SIM.pv('suministro.prioridadAlarmaO2', p),
        retardoSeg: 1,
        condicion: function (c) { return c.suministro.o2BajoAlarma; },
        porque: 'La presion de O2 que llega a la maquina cayo por debajo del umbral del perfil. Sin presion suficiente el flujometro no entrega el caudal fijado y la proteccion corta el N2O.',
        fuente: ['suministro.alarmaO2Baja', 'suministro.prioridadAlarmaO2']
      },
      {
        id: 'n2o_cortado',
        texto: 'N2O cortado por falta de O2',
        prioridad: 'media',
        retardoSeg: 1,
        condicion: function (c) { return c.suministro.n2oCortado; },
        porque: 'El dispositivo de proteccion corta el N2O cuando la presion de O2 baja, para que no se entregue una mezcla hipoxica. Repone el suministro a una presion mas alta que la de corte: eso es una histeresis.',
        fuente: ['suministro.corteN2O_bajo', 'suministro.corteN2O_repone']
      },
      {
        id: 'fio2_baja',
        texto: 'FiO2 baja',
        prioridad: SIM.pv('monitoreo.prioridadFiO2Baja', p),
        retardoSeg: 3,
        condicion: function (c) {
          return c.monitor.fio2 !== null && c.monitor.valido &&
                 c.monitor.fio2 < SIM.pv('monitoreo.fiO2AlarmaBaja', p);
        },
        porque: 'La fraccion inspirada de oxigeno medida esta por debajo del limite. Se calcula con los flujos de la mezcla: FiO2 = [(0,21 x aire) + O2] / (aire + O2 + N2O).',
        fuente: ['monitoreo.fiO2AlarmaBaja', 'monitoreo.prioridadFiO2Baja']
      },
      {
        id: 'cilindro_bajo',
        texto: 'Presion baja en el cilindro de O2',
        prioridad: 'media',
        retardoSeg: 2,
        condicion: function (c, e) {
          return e.suministro.cilindroAbierto.o2 && c.suministro.cilindro.o2 < 3500;
        },
        porque: 'La reserva del cilindro se esta agotando. La duracion restante se estima con t(min) = presion(psi) x factor / flujo(L/min).',
        fuente: ['suministro.factorCilindroE']
      },

      /* ---- Presion y volumen ------------------------------------ */
      {
        id: 'paw_baja',
        texto: 'Presion baja de via aerea',
        prioridad: SIM.pv('ventilacion.prioridadPresionBaja', p),
        retardoSeg: SIM.pv('ventilacion.presionViaAereaBajaSeg', p),
        condicion: function (c) {
          if (!c.ventilacion.hayVentilacion) return false;
          var minimo = SIM.pv('ventilacion.limiteBajoPresion', p) + 4;  /* [M] M4 7-11: Ppico < Pmin+4 */
          return c.ventilacion.ppico < minimo;
        },
        porque: 'La presion pico no alcanza el minimo esperado. El gas que se pierde por una fuga o una desconexion no presuriza el circuito.',
        fuente: ['ventilacion.limiteBajoPresion', 'ventilacion.presionViaAereaBajaSeg', 'ventilacion.prioridadPresionBaja']
      },
      {
        id: 'fuga_circuito',
        texto: 'Fuga en el circuito',
        prioridad: SIM.pv('ventilacion.prioridadFugaCircuito', p),
        retardoSeg: SIM.pv('ventilacion.fugaVTeSeg', p),
        condicion: function (c) {
          if (!c.ventilacion.hayVentilacion || c.ventilacion.vti <= 0) return false;
          /* Sin gas motriz la maquina no esta entregando nada: no es una fuga. */
          if (!c.ventilacion.gasMotrizOk) return false;
          var umbral = SIM.pv('ventilacion.fugaVTeUmbral', p) / 100;
          return c.ventilacion.vte < c.ventilacion.vti * umbral;
        },
        porque: 'El volumen espirado es menor que la mitad del inspirado. La diferencia entre lo que entra y lo que vuelve es el gas que se escapa del circuito.',
        fuente: ['ventilacion.fugaVTeUmbral', 'ventilacion.fugaVTeSeg', 'pruebas.fraccionFugaEnVentilacion']
      },
      {
        id: 'vt_no_alcanzado',
        texto: 'VT no alcanzado',
        prioridad: 'baja',
        retardoSeg: 10,
        condicion: function (c) {
          if (!c.ventilacion.hayVentilacion || c.ventilacion.vti <= 0) return false;
          if (!c.ventilacion.gasMotrizOk) return false;
          return c.ventilacion.vte < c.ventilacion.vti * 0.9 &&
                 c.ventilacion.vte >= c.ventilacion.vti * (SIM.pv('ventilacion.fugaVTeUmbral', p) / 100);
        },
        porque: 'El volumen medido es menor que el ajustado, pero todavia no llega al umbral de la alarma de fuga. Es el primer aviso de que algo se pierde.',
        fuente: ['ventilacion.fugaVTeUmbral']
      },
      {
        id: 'apnea',
        texto: 'Apnea',
        prioridad: 'media',
        retardoSeg: SIM.pv('ventilacion.apneaSeg', p),
        condicion: function (c, e) {
          var minimo = e.ventilador.peep + 3;   /* [M] M3 D-2: Paw < PEEP+3 y VTe < 10 mL */
          return c.ventilacion.ppico < minimo && c.ventilacion.vte < 10;
        },
        porque: 'La maquina no detecta respiraciones: ni presion ni volumen medibles. Una desconexion completa se ve asi.',
        fuente: ['ventilacion.apneaSeg']
      },
      {
        id: 'apnea_alta',
        texto: 'Apnea mayor a 2 minutos',
        prioridad: 'alta',
        retardoSeg: SIM.pv('ventilacion.apneaAltaSeg', p),
        condicion: function (c, e) {
          var minimo = e.ventilador.peep + 3;
          return c.ventilacion.ppico < minimo && c.ventilacion.vte < 10;
        },
        porque: 'La apnea se mantuvo mas de dos minutos. La prioridad sube porque amenaza la vida del paciente.',
        fuente: ['ventilacion.apneaAltaSeg']
      },
      {
        id: 'presion_sostenida',
        texto: 'Presion sostenida en la via aerea',
        prioridad: 'alta',
        retardoSeg: SIM.pv('ventilacion.presionSostenidaSeg', p),
        condicion: function (c, e) {
          return c.ventilacion.presionViaAerea > e.ventilador.peep + 10 &&
                 c.ventilacion.presionViaAerea > 25;
        },
        porque: 'La presion no baja entre respiraciones. Puede haber una obstruccion o una evacuacion bloqueada.',
        fuente: ['ventilacion.presionSostenidaSeg']
      },

      /* ---- Ventilador ------------------------------------------- */
      {
        id: 'ventilador_sin_gas_motriz',
        texto: 'Ventilador sin gas motriz',
        prioridad: 'alta',
        retardoSeg: 1,
        condicion: function (c, e) {
          return e.ventilador.encendido && !c.ventilacion.gasMotrizOk;
        },
        porque: 'El fuelle se mueve con un gas motriz a presion. Sin esa presion no hay inspiracion mecanica, aunque la electronica funcione.',
        fuente: ['suministro.gasMotrizMin']
      },

      /* ---- Monitoreo de gases ----------------------------------- */
      {
        id: 'concertina_plegada',
        texto: 'Imposible mover la concertina',
        prioridad: 'baja',
        retardoSeg: 6,
        condicion: function (c) {
          return c.ventilacion.ventilaMecanica && c.ventilacion.vtEntregado < 10;
        },
        porque: 'La concertina no se mueve. O no le llega empuje, que es el gas motriz, o no le llega volumen, ' +
                'que es el gas fresco. M4 indica revisar el gas impulsor, aumentar el gas fresco o pulsar la purga de O2.',
        fuente: ['suministro.gasMotrizMin']
      },
      {
        id: 'via_aerea_ocluida',
        texto: 'Via aerea ocluida (modulo de gases)',
        prioridad: 'alta',
        retardoSeg: 1,
        condicion: function (c, e) {
          if (e.monitoreo.moduloGases !== 'ok') return false;
          return c.monitor.flujoMuestra !== undefined &&
                 c.monitor.flujoMuestra < SIM.pv('monitoreo.flujoViaAereaOcluida', p);
        },
        porque: 'La bomba del modulo de gases casi no mueve muestra. El modulo aspira gas por una linea ' +
                'delgada y, si algo la tapa, deja de medir aunque el paciente este perfectamente ventilado.',
        fuente: ['monitoreo.flujoViaAereaOcluida']
      },
      {
        id: 'salida_muestra',
        texto: 'Compruebe la salida del gas de muestra',
        prioridad: 'media',
        retardoSeg: 4,
        condicion: function (c, e) {
          if (e.monitoreo.moduloGases !== 'ok') return false;
          return c.monitor.flujoMuestra !== undefined &&
                 c.monitor.flujoMuestra < SIM.pv('monitoreo.flujoViaAereaOcluida', p);
        },
        porque: 'La maquina no sabe si lo que esta tapado es la entrada o la salida de la muestra: solo ve ' +
                'que la bomba no mueve gas. Por eso propone las dos hipotesis a la vez y te toca a ti separarlas.',
        fuente: ['monitoreo.flujoViaAereaOcluida']
      },
      {
        id: 'muestra_flujo_bajo',
        texto: 'Flujo de muestra de gas bajo',
        prioridad: 'baja',
        retardoSeg: 20,
        condicion: function (c, e) {
          if (e.monitoreo.moduloGases !== 'ok') return false;
          if (c.monitor.flujoMuestra === undefined) return false;
          var limite = c.monitor.flujoMuestraNominal * SIM.pv('monitoreo.flujoMuestraBajoPct', p) / 100;
          return c.monitor.flujoMuestra < limite;
        },
        porque: 'El caudal de muestra cayo por debajo del 80 % del nominal. Es el primer aviso, antes de que ' +
                'la oclusion sea completa: con la linea solo parcialmente tapada las lecturas se degradan ' +
                'antes de desaparecer.',
        fuente: ['monitoreo.flujoMuestraBajoPct', 'monitoreo.flujoMuestraNominal']
      },
      {
        id: 'linea_ocluida',
        texto: 'Linea de muestreo obstruida',
        prioridad: SIM.pv('monitoreo.prioridadLineaOcluida', p),
        retardoSeg: 2,
        condicion: function (c, e) {
          return e.monitoreo.lineaMuestreoOcluida || e.monitoreo.trampaAgua === 'llena';
        },
        porque: 'El monitor aspira una muestra de gas por una linea delgada. Si se acoda, se moja o la trampa de agua se llena, deja de medir aunque el paciente este bien.',
        fuente: ['monitoreo.prioridadLineaOcluida']
      },
      {
        id: 'modulo_detenido',
        texto: 'Modulo de gases: fallo de inicio o comunicacion',
        prioridad: 'alta',
        retardoSeg: 2,
        condicion: function (c, e) { return e.monitoreo.moduloGases === 'fallo'; },
        porque: 'El modulo no arranca o perdio la comunicacion con el sistema. No es un tapon en la linea: ' +
                'la bomba ni siquiera responde, asi que no hay nada que destapar.',
        fuente: ['monitoreo.prioridadLineaOcluida']
      },
      {
        id: 'modulo_no_disponible',
        texto: 'Monitorizacion de gas no disponible',
        prioridad: 'media',
        retardoSeg: 3,
        condicion: function (c, e) { return e.monitoreo.moduloGases === 'fallo'; },
        porque: 'Sin datos de CO2 ni de agente. M4 lo trata como fallo de hardware del modulo y pide ' +
                'sustituirlo; antes conviene reconectarlo o reiniciar, por si fuese solo comunicacion.',
        fuente: ['monitoreo.prioridadLineaOcluida']
      },
      {
        id: 'calibrar_celula',
        texto: 'Calibre el sensor de O2',
        prioridad: 'baja',
        retardoSeg: 4,
        condicion: function (c, e) { return e.monitoreo.celulaO2 === 'descalibrada'; },
        porque: 'La lectura de O2 se salio de rango o la calibracion fallo. Con aire ambiente la celula debe ' +
                'marcar 21 %: ese es el patron que tienes siempre a mano para comprobarla.',
        fuente: ['monitoreo.calibracionAireAmbiente']
      },
      {
        id: 'celula_o2',
        texto: 'Cambie el sensor de O2',
        prioridad: 'media',
        retardoSeg: 2,
        condicion: function (c, e) { return e.monitoreo.celulaO2 === 'agotada'; },
        porque: 'La celula mide menos del minimo aceptable. Con aire ambiente deberia leer 21 %.',
        fuente: ['monitoreo.celulaO2Minima', 'monitoreo.calibracionAireAmbiente']
      },
      {
        id: 'celula_desconectada',
        texto: 'Monitorizacion de O2 no conectada',
        prioridad: 'media',
        retardoSeg: 2,
        condicion: function (c, e) { return e.monitoreo.celulaO2 === 'desconectada'; },
        porque: 'La celula de O2 no responde. Sin ella la maquina no puede confirmar la concentracion entregada.',
        fuente: ['monitoreo.celulaO2Minima']
      },

      /* ---- Absorbedor ------------------------------------------- */
      {
        /* El vaporizador mecanico no avisa de nada: no sabe cuanto entrega
           ni cuanto le queda. Quien detecta la discrepancia es el
           analizador de gas, y por eso esta alarma viene del monitor y no
           del vaporizador. */
        id: 'agente_discrepante',
        texto: 'Concentracion de agente distinta de la fijada',
        prioridad: 'media', retardoSeg: 10,
        condicion: function (c, e, p) {
          if (!c.vaporizador || !c.monitor.valido) return false;
          if (e.vaporizador.dial <= 0) return false;
          return c.vaporizador.desviacionPct > SIM.pv('monitoreo.agenteDesviacionPct', p);
        },
        porque: 'Lo que el paciente recibe no es lo que marca el dial. Con el agente por debajo hay riesgo ' +
                'de despertar intraoperatorio, y por encima, de sobredosis. El dial es una orden, no una ' +
                'medida: lo unico que mide de verdad es el analizador.',
        fuente: ['Umbral de desviacion: supuesto de diseno [P]',
                 'Desviacion documentada por gas portador: 10 % relativo, maximo 0,4 vol.% (M11 3.3 [PDF 16])']
      },

      {
        id: 'agente_ausente',
        texto: 'Sin agente anestesico medido',
        prioridad: 'alta', retardoSeg: 15,
        condicion: function (c, e) {
          if (!c.vaporizador || !c.monitor.valido) return false;
          return e.vaporizador.dial > 0 && c.monitor.agente < 0.2;
        },
        porque: 'El dial esta abierto y el analizador no encuentra agente. O el vaporizador esta vacio, o el ' +
                'gas no esta pasando por el. Mientras eso siga asi el paciente puede estar paralizado y ' +
                'despierto, que es la peor combinacion posible.',
        fuente: ['Umbral de deteccion: supuesto de diseno [P]',
                 'El vaporizador mecanico no tiene alarma propia de nivel ni de salida [I]']
      },

      {
        id: 'fico2_alta',
        texto: 'FiCO2 alta. Revise el absorbente',
        prioridad: 'alta',
        retardoSeg: 5,
        condicion: function (c) {
          return c.monitor.valido && c.monitor.fico2 > SIM.pv('absorbedor.alarmaFiCO2Alta', p);
        },
        porque: 'Se esta inhalando CO2. Si el absorbente ya no retiene, el gas espirado vuelve al paciente: FETCO2 = FiCO2 + VCO2/MV.',
        fuente: ['absorbedor.alarmaFiCO2Alta', 'absorbedor.umbralCambio']
      },
      {
        id: 'etco2_baja',
        texto: 'EtCO2 baja',
        prioridad: 'media',
        retardoSeg: 8,
        condicion: function (c) {
          return c.monitor.valido && c.ventilacion.hayVentilacion &&
                 c.monitor.etco2 < SIM.pv('absorbedor.alarmaEtCO2Baja', p);
        },
        porque: 'El CO2 espirado cayo por debajo del limite. Si el gas se pierde antes de llegar al sensor, el trazo baja o desaparece.',
        fuente: ['absorbedor.alarmaEtCO2Baja']
      },
      {
        id: 'etco2_alta',
        texto: 'EtCO2 alta',
        prioridad: 'alta',
        retardoSeg: 5,
        condicion: function (c) {
          return c.monitor.valido && c.monitor.etco2 > SIM.pv('absorbedor.alarmaEtCO2Alta', p);
        },
        porque: 'El CO2 al final de la espiracion supera el limite. Puede venir de reinhalacion o de hipoventilacion.',
        fuente: ['absorbedor.alarmaEtCO2Alta']
      }
    ];
  }

  /* ---------------------------------------------------------------- */
  function crearEstado() {
    return { pendientes: {}, activas: {}, audioPausadoHasta: 0 };
  }

  var ORDEN = { alta: 0, media: 1, baja: 2 };

  /* Cuidado: ORDEN[p] || 3 daba 3 para 'alta', porque 0 es falso en
     JavaScript, y las alarmas de prioridad alta quedaban las ultimas. */
  function orden(p) { return ORDEN[p] === undefined ? 3 : ORDEN[p]; }

  function evaluar(estAlarmas, calc, est, perfil, dtSeg) {
    var defs = definiciones(perfil);
    var activas = [];

    defs.forEach(function (d) {
      var cumple = false;
      try { cumple = !!d.condicion(calc, est, perfil); } catch (e) { cumple = false; }

      if (cumple) {
        estAlarmas.pendientes[d.id] = (estAlarmas.pendientes[d.id] || 0) + dtSeg;
        if (estAlarmas.pendientes[d.id] >= d.retardoSeg) {
          activas.push({
            id: d.id, texto: d.texto, prioridad: d.prioridad,
            porque: d.porque, fuente: d.fuente,
            desdeSeg: estAlarmas.pendientes[d.id] - d.retardoSeg
          });
        }
      } else {
        delete estAlarmas.pendientes[d.id];
      }
    });

    /* Si apnea_alta esta activa, apnea (media) se absorbe [I] */
    var tieneApneaAlta = activas.some(function (a) { return a.id === 'apnea_alta'; });
    if (tieneApneaAlta) {
      activas = activas.filter(function (a) { return a.id !== 'apnea'; });
    }

    activas.sort(function (a, b) {
      var d = orden(a.prioridad) - orden(b.prioridad);
      if (d !== 0) return d;
      return b.desdeSeg - a.desdeSeg;
    });

    estAlarmas.activas = activas;
    return {
      todas: activas,
      capa1: activas.slice(0, MAX_CAPA1),
      ocultas: Math.max(0, activas.length - MAX_CAPA1),
      maxPrioridad: activas.length ? activas[0].prioridad : null
    };
  }

  return {
    crearEstado: crearEstado,
    evaluar: evaluar,
    definiciones: definiciones,
    MAX_CAPA1: MAX_CAPA1
  };
})();
