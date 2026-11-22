/* =====================================================================
   maquina.js  -  Estado de la maquina y calculo por fotograma
   ---------------------------------------------------------------------
   Arquitectura funcional de la seccion 3 del documento:
     suministro -> gas fresco -> vaporizador -> salida comun (CGO)
     -> circuito circular -> paciente -> absorbedor -> ventilador/bolsa
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.maquina = (function () {
  'use strict';

  var M = SIM.modelo;

  /* ---------------------------------------------------------------- */
  /* Estado inicial                                                    */
  /* ---------------------------------------------------------------- */
  function estadoInicial(perfil) {
    var p = perfil || SIM.PERFIL_BASE;
    return {
      t: 0,                      // tiempo simulado en segundos

      suministro: {
        tuberia:   { o2: SIM.pv('suministro.presionNominalTuberia', p),
                     aire: SIM.pv('suministro.presionNominalTuberia', p),
                     n2o: SIM.pv('suministro.presionNominalTuberia', p) },
        cilindro:  { o2: SIM.pv('suministro.cilindroO2Lleno', p),
                     n2o: SIM.pv('suministro.cilindroN2OLleno', p) },
        cilindroAbierto: { o2: false, n2o: false },
        tipoCilindro: 'E',
        n2oCortado: false,       // estado del corte con histeresis
        interruptorAveriado: false  // el interruptor de presion dispara con presion normal
      },

      flujometros: { o2: 2.0, aire: 2.0, n2o: 0.0 },   // L/min solicitados

      vaporizador: {
        agente: 'sevoflurano',
        calentado: false,        // el vaporizador de este simulador es de derivacion variable
        dial: 2.0,               // vol.%
        dialNominal: 2.0,        // valor de partida, para saber si el usuario lo movio
        nivelLiquidoPct: 78,
        instalado: true,
        bloqueado: true,         // asentado y bloqueado en el colector
        restriccionSalida: false // obstruccion en la salida: cae el caudal al abrir el dial
      },

      ventilador: {
        encendido: true,
        modo: 'VCV',
        volumenTidal:  SIM.pv('ventilacion.volumenTidal', p),
        frecuencia:    SIM.pv('ventilacion.frecuencia', p),
        relacionIE:    SIM.pv('ventilacion.relacionIE', p),
        peep:          SIM.pv('ventilacion.peep', p),
        limitePresion: SIM.pv('ventilacion.limitePresion', p),
        presionInspiratoria: 16,
        gasMotrizKPa: 400
      },

      circuito: {
        modo: 'mecanica',        // 'mecanica' | 'manual'
        aplCmH2O: 20,            // ajuste de la valvula APL
        flushActivo: false,      // purga de O2 pulsada
        fugaQ30: 0,              // mL/min a 30 cmH2O (0 = estanco)
        desconectado: false,
        absorbedorAvance: 0.05,  // 0 nuevo, 1 agotado al criterio de cambio
        absorbedorInstalado: true,
        colorVirado: 0,          // 0..1 fraccion de cal virada
        colorEnganoso: false,    // el indicador volvio a blanco con la cal gastada
        valvulaIncompetente: false  // una valvula unidireccional no cierra
      },

      monitoreo: {
        lineaMuestreoOcluida: false,
        trampaAgua: 'ok',        // ok | llena | ausente
        celulaO2: 'ok',          // ok | descalibrada | agotada | desconectada
        moduloGases: 'ok'
      },

      /* valores calculados (se rellenan cada fotograma) */
      calc: null,

      /* historial para curvas */
      historia: { presion: [], capno: [], tam: 600 }
    };
  }

  /* ---------------------------------------------------------------- */
  /* Fase ventilatoria                                                 */
  /* ---------------------------------------------------------------- */
  function fraccionInspiratoria(relacionIE) {
    var partes = String(relacionIE).split(':');
    var i = Number(partes[0]) || 1;
    var e = Number(partes[1]) || 2;
    return i / (i + e);
  }

  /* ---------------------------------------------------------------- */
  /* Calculo principal                                                 */
  /* ---------------------------------------------------------------- */
  function calcular(est, perfil, dtSeg) {
    var p = perfil || SIM.PERFIL_BASE;
    var s = est.suministro;
    var out = { avisos: [] };

    /* ---------- 1. Suministro de gases ---------------------------- */
    var alarmaO2 = SIM.pv('suministro.alarmaO2Baja', p);
    var corteBajo = SIM.pv('suministro.corteN2O_bajo', p);
    var corteRepone = SIM.pv('suministro.corteN2O_repone', p);

    var presionEfectiva = {};
    var fuenteActiva = {};
    ['o2', 'aire', 'n2o'].forEach(function (g) {
      var pt = s.tuberia[g];
      var pc = (g !== 'aire' && s.cilindroAbierto[g]) ? s.cilindro[g] : 0;
      /* El regulador del cilindro entrega menos que la tuberia nominal [I];
         se usa la mayor de las dos fuentes disponibles. */
      var pcRegulada = pc > 500 ? Math.min(345, SIM.pv('suministro.presionNominalTuberia', p)) : 0;
      if (pcRegulada > pt) { presionEfectiva[g] = pcRegulada; fuenteActiva[g] = 'cilindro'; }
      else { presionEfectiva[g] = pt; fuenteActiva[g] = 'tuberia'; }
    });

    /* Corte de O2 con histeresis [V] M6 p.17 */
    if (presionEfectiva.o2 < corteBajo) s.n2oCortado = true;
    else if (presionEfectiva.o2 > corteRepone) s.n2oCortado = false;

    /* Entrega real: por debajo de la presion de alarma el flujo cae [I] */
    function entregado(g) {
      var pedido = est.flujometros[g] || 0;
      var pe = presionEfectiva[g];
      var nominal = SIM.pv('suministro.presionNominalTuberia', p);
      if (pe >= nominal * 0.85) return pedido;
      if (pe <= 0) return 0;
      /* el flujometro no alcanza el caudal fijado cuando falta presion [I] */
      var factor = M.limitar(pe / (nominal * 0.85), 0, 1);
      return pedido * factor;
    }

    var fO2 = entregado('o2');
    var fAire = entregado('aire');
    var fN2O = s.n2oCortado ? 0 : entregado('n2o');

    /* Relacion minima O2/N2O [M] M1 3-5 [41]; M3 B-5 [227] */
    var minO2Pct = SIM.pv('suministro.o2MinimoMezcla', p) / 100;
    if (fN2O > 0) {
      var totalMezcla = fO2 + fN2O;
      if (totalMezcla > 0 && fO2 / totalMezcla < minO2Pct) {
        fN2O = fO2 * (1 - minO2Pct) / minO2Pct;
        out.avisos.push('Limitacion de N2O por relacion minima de O2');
      }
    }

    var fgf = fO2 + fAire + fN2O;
    var fio2 = M.fio2Mezcla(fO2, fAire, fN2O);

    /* Consumo del cilindro abierto [M] M10 */
    ['o2', 'n2o'].forEach(function (g) {
      if (s.cilindroAbierto[g] && fuenteActiva[g] === 'cilindro') {
        var flujo = (g === 'o2') ? fO2 : fN2O;
        var factor = s.tipoCilindro === 'D'
          ? SIM.pv('suministro.factorCilindroD', p)
          : SIM.pv('suministro.factorCilindroE', p);
        var durMin = M.duracionCilindroMin(s.cilindro[g], flujo, factor);
        if (isFinite(durMin) && durMin > 0) {
          var caidaPorSeg = s.cilindro[g] / (durMin * 60);
          s.cilindro[g] = Math.max(0, s.cilindro[g] - caidaPorSeg * dtSeg);
        }
      }
    });

    /* ---------- 1c. Purga de O2 (flush) ---------------------------
       Toma oxigeno aguas arriba de los flujometros y del vaporizador y
       lo manda directo a la salida comun. Por eso hace tres cosas a la
       vez: mete mucho volumen, sube la FiO2 y diluye el agente, que es
       el riesgo que casi nadie tiene presente. */
    var flushLpm = est.circuito.flushActivo ? SIM.pv('flush.caudal', p) : 0;

    /* ---------- 2. Vaporizador ------------------------------------ */
    var vap = est.vaporizador;
    var dialAbierto = vap.instalado && vap.dial > 0;
    var fgfFijado = fgf;

    /* Una obstruccion en la salida del vaporizador hace caer el caudal que
       llega al circuito en cuanto se abre el dial, y el flotador del
       flujometro baja a la vista. Es justo lo que mide la prueba de
       contrapresion: M1 3-5 [41] no admite una caida mayor de 1 L/min con
       6 L/min fijados. La magnitud de la caida es [P]. */
    var caidaFgf = (dialAbierto && vap.restriccionSalida)
      ? Math.min(fgf, SIM.pv('vaporizador.caidaRestriccionSalida', p)) : 0;
    if (caidaFgf > 0 && fgf > 0) {
      var factorCaida = (fgf - caidaFgf) / fgf;
      fO2 *= factorCaida; fAire *= factorCaida; fN2O *= factorCaida;
      fgf = fO2 + fAire + fN2O;
      fio2 = M.fio2Mezcla(fO2, fAire, fN2O);   /* la proporcion no cambia */
      out.avisos.push('Caida de caudal al abrir el vaporizador');
    }

    /* Un vaporizador de insercion mal bloqueado fuga por el colector, y solo
       con el dial abierto: con el dial en cero sus valvulas de puerto cierran
       el paso [I]. Se pierde gas fresco con su agente antes de llegar al
       circuito, asi que baja la concentracion entregada. */
    var fugaColector = (dialAbierto && !vap.bloqueado)
      ? SIM.pv('vaporizador.fugaColectorQ30', p) : 0;
    var fraccionQueLlega = fgf > 0
      ? M.limitar((fgf * 1000 - fugaColector) / (fgf * 1000), 0, 1) : 0;

    var fraccO2 = fgf > 0 ? (fO2 + 0.21 * fAire) / fgf : 0.21;
    var fraccN2O = fgf > 0 ? fN2O / fgf : 0;
    var sinLiquido = vap.nivelLiquidoPct <= 0;
    var agentePct = (vap.instalado && fgf > 0 && !sinLiquido)
      ? M.salidaVaporizador(vap.dial, fraccO2, fraccN2O) * fraccionQueLlega
      : 0;

    /* El agente cargado. Un vaporizador de derivacion variable esta
       calibrado para un agente concreto: con otro mucho mas volatil
       entrega muy por encima de lo fijado. En la practica el sistema de
       llenado codificado lo impide, y por eso aqui se puede provocar
       pero se avisa. */
    var tablaAg = SIM.pv('agentes', p) || {};
    var infoAg = tablaAg[vap.agente] || tablaAg.sevoflurano;
    var agenteIncompatible = !!(infoAg && infoAg.calentado && !vap.calentado);
    if (agenteIncompatible) agentePct *= SIM.pv('vaporizadorAgente.factorIncompatible', p);

    /* El flush se suma al gas que llega al circuito, pero sin agente y
       como oxigeno puro: diluye las dos cosas. */
    var fgfTotal = fgf + flushLpm;
    if (flushLpm > 0 && fgfTotal > 0) {
      agentePct = agentePct * (fgf / fgfTotal);
      fio2 = (fio2 * fgf + 1.0 * flushLpm) / fgfTotal;   /* fraccion, no % */
      fraccN2O = fraccN2O * (fgf / fgfTotal);
    }

    /* ---------- 3. Ventilador y mecanica -------------------------- */
    var v = est.ventilador;
    var fi = fraccionInspiratoria(v.relacionIE);
    var cicloSeg = 60 / Math.max(1, v.frecuencia);
    var pos = (est.t % cicloSeg) / cicloSeg;
    var enInspiracion = pos < fi;
    var avanceFase = enInspiracion ? pos / fi : (pos - fi) / (1 - fi);

    var ventilaMecanica = v.encendido && est.circuito.modo === 'mecanica';
    var ventilaManual = est.circuito.modo === 'manual';
    var hayVentilacion = ventilaMecanica || ventilaManual;

    /* Volumen y presion objetivo sin falla.
       En ventilacion manual se supone que alguien aprieta la bolsa a la
       misma frecuencia con un volumen algo menor [P]. */
    var vtObjetivo = ventilaManual
      ? 400
      : (v.modo === 'PCV'
          ? M.limitar(v.presionInspiratoria * 34, 120, 900)   // [P] estimacion
          : v.volumenTidal);
    var ppicoNormal = v.modo === 'PCV'
      ? v.peep + v.presionInspiratoria
      : v.peep + vtObjetivo / 25;                          // [P] compliancia ~25 mL/cmH2O

    /* ----- Fuga y llenado del fuelle -----------------------------
       El fuelle solo entrega lo que el circuito tiene. El balance de
       volumen del circuito es:
         entra gas fresco - sale por la fuga - consume el paciente
       Si el balance es negativo, la concertina no alcanza el tope y el
       volumen entregado baja. Por eso el sintoma es mas claro con gas
       fresco bajo [M] M2 p.169 [177], y por eso subir el gas fresco lo
       compensa de forma temporal [M] M7 4.1.1 (p.54-55).
       La capacidad del fuelle y la constante de llenado son [P]. */
    /* ----- Valvula APL -------------------------------------------
       Solo esta en el circuito en ventilacion manual: el selector de
       bolsa/ventilador la saca del paso cuando se ventila con el
       fuelle. Abierta, el gas fresco se va a la evacuacion en lugar de
       llenar la bolsa, asi que se comporta como una fuga grande; y el
       volumen que llega al paciente cae, porque al apretar la bolsa el
       gas prefiere el camino libre. La escala y el umbral son [I]/[P],
       declarados en SUPUESTOS.md. */
    var aplEnCircuito = est.circuito.modo === 'manual';
    var aplMin = SIM.pv('apl.minima', p);
    var umbralSello = SIM.pv('apl.umbralSello', p);
    var aplSello = aplEnCircuito
      ? M.limitar((est.circuito.aplCmH2O - aplMin) / Math.max(0.1, umbralSello - aplMin), 0, 1)
      : 1;
    var fugaApl = aplEnCircuito ? (1 - aplSello) * 25000 : 0;   // mL/min a 30 cmH2O [P]

    var q30 = est.circuito.desconectado ? 40000
            : est.circuito.fugaQ30 + fugaColector + fugaApl;
    var pMediaPrev = est.circuito._pMedia || (v.peep + 2);
    var qFuga = M.flujoFuga(q30, pMediaPrev);                   // mL/min
    var consumoPaciente = SIM.pv('paciente.vo2', p) * SIM.pv('paciente.peso', p);  // mL/min
    var balance = (fgf + flushLpm) * 1000 - qFuga - (hayVentilacion ? consumoPaciente : 0);

    if (est.circuito.llenado === undefined) est.circuito.llenado = 1;
    if (balance >= 0) {
      est.circuito.llenado = M.primerOrden(est.circuito.llenado, 1, dtSeg, 4);   // [P] tau 4 s
    } else {
      est.circuito.llenado = M.limitar(
        est.circuito.llenado + (balance / 60) * dtSeg / 1200, 0, 1);             // [P] 1200 mL
    }

    var compliancia = 25;                                       // [P] mL/cmH2O
    /* vtAjustado es lo que el ventilador intenta entregar; vtEntregado es lo
       que el fuelle alcanza a dar con el gas que tiene el circuito. */
    /* Con la APL abierta, apretar la bolsa empuja el gas hacia la
       evacuacion y no hacia el paciente. */
    var vtAjustado = hayVentilacion ? vtObjetivo * (ventilaManual ? aplSello : 1) : 0;
    var vtEntregado = vtAjustado * est.circuito.llenado;
    var perdidaPorResp = qFuga / Math.max(1, v.frecuencia);
    var vte = Math.max(0, vtEntregado - perdidaPorResp);
    /* La presion la determina el volumen que se queda en el sistema, no el
       que sale del fuelle: el gas que escapa no presuriza el circuito [P].
       En manual, la valvula APL limita la presion. */
    var ppico = hayVentilacion ? v.peep + vte / compliancia : v.peep;

    /* En manual la APL pone el techo de presion: lo que sobra se va a
       la evacuacion. Cerrada del todo no hay techo, y si ademas entra
       gas fresco o se pulsa la purga, la presion se acumula sin via de
       escape. Eso es el riesgo de barotrauma. */
    if (aplEnCircuito) {
      var techoApl = est.circuito.aplCmH2O;
      ppico = Math.min(ppico, techoApl);
      var aplCasiCerrada = techoApl >= SIM.pv('apl.maxima', p) * 0.7;
      if (aplCasiCerrada) {
        var entrada = (fgf + flushLpm) * 1000;        // mL/min que no tienen salida
        est.circuito._acumulada = M.limitar(
          (est.circuito._acumulada || 0) + (entrada / 60) * dtSeg / 45, 0, techoApl);
        ppico = Math.min(techoApl, ppico + est.circuito._acumulada);
      } else {
        est.circuito._acumulada = Math.max(0, (est.circuito._acumulada || 0) - 12 * dtSeg);
      }
    } else {
      est.circuito._acumulada = 0;
    }

    /* La purga tambien presuriza de golpe mientras se mantiene pulsada:
       es el mecanismo del barotrauma por flush. */
    if (flushLpm > 0 && hayVentilacion) {
      var salidaLibre = aplEnCircuito ? aplSello < 0.9 : true;
      ppico += salidaLibre ? 3 : 18;                  // [P]
    }

    /* Gas motriz insuficiente: el fuelle no se mueve [M] M3 B-8 [230] */
    var gasMotrizOk = v.gasMotrizKPa >= SIM.pv('suministro.gasMotrizMin', p);
    if (!gasMotrizOk && ventilaMecanica) { vtEntregado = 0; vte = 0; ppico = v.peep; est.circuito.llenado = 0.25; }

    /* Con la APL cerrada no hay por donde soltar el gas que entra, asi
       que lo que sube no es solo el pico: sube toda la linea de base, y
       eso es lo que dispara la alarma de presion sostenida. */
    var baseExtra = aplEnCircuito ? (est.circuito._acumulada || 0) : 0;
    var peepEfectiva = v.peep + baseExtra;

    est.circuito._pMedia = peepEfectiva + Math.max(0, ppico - peepEfectiva) * 0.4;   // [P] I:E 1:2

    var presionViaAerea;
    if (!hayVentilacion) {
      presionViaAerea = Math.max(0.5, baseExtra);
    } else if (enInspiracion) {
      presionViaAerea = peepEfectiva + Math.max(0, ppico - peepEfectiva) * Math.sin(Math.min(1, avanceFase) * Math.PI * 0.85);
    } else {
      presionViaAerea = peepEfectiva + Math.max(0, ppico - peepEfectiva) * 0.15 * Math.pow(1 - avanceFase, 2);
    }
    presionViaAerea = Math.max(0, presionViaAerea);

    var mv = (vte * v.frecuencia) / 1000;    // L/min espirado

    /* ---------- 4. Circuito y absorbedor -------------------------- */
    var vco2 = SIM.pv('paciente.vco2', p);
    var vdvt = SIM.pv('paciente.espacioMuertoVdVt', p);

    /* Avance del absorbedor [M] M9 Tabla II p.45 */
    if (est.circuito.absorbedorInstalado) {
      var minPor100 = SIM.pv('absorbedor.vidaPor100g', p)[0];   // extremo conservador
      var capacidadMin = M.capacidadMinutos(SIM.pv('absorbedor.masaCanister', p), minPor100);
      /* la carga depende del CO2 que llega al absorbedor, es decir del
         volumen reinhalado [I] */
      var fR = M.fraccionReinhalada(fgf, Math.max(0.5, mv));
      var carga = (vco2 / 0.160) * Math.max(0.15, fR);
      est.circuito.absorbedorAvance += (dtSeg / 60) / capacidadMin * carga;
      /* El indicador de color puede quedarse atras: la cal que ha estado en
         reposo recupera el color blanco aunque siga gastada. Cuando eso
         pasa, el color deja de seguir al avance. */
      if (!est.circuito.colorEnganoso) {
        est.circuito.colorVirado = M.limitar(est.circuito.absorbedorAvance * 0.9, 0, 1);
      }
    }

    var fico2Pct;
    if (!est.circuito.absorbedorInstalado) {
      fico2Pct = M.fico2SinAbsorbedor(fgf, Math.max(0.5, mv), vco2);
    } else {
      var maxPorFgf = M.fico2SinAbsorbedor(fgf, Math.max(0.5, mv), vco2);
      fico2Pct = M.fico2PorAgotamiento(est.circuito.absorbedorAvance, maxPorFgf);
    }
    /* Una valvula unidireccional que no cierra devuelve al paciente parte
       del volumen espirado sin pasarlo por la cal, asi que hay CO2
       inspirado con un absorbedor perfectamente sano. Subir el gas fresco
       tambien lo diluye, igual que en el agotamiento. La fraccion es [P]. */
    if (est.circuito.valvulaIncompetente) {
      var techoSinCal = M.fico2SinAbsorbedor(fgf, Math.max(0.5, mv), vco2);
      fico2Pct = Math.max(fico2Pct,
        techoSinCal * SIM.pv('absorbedor.fraccionValvulaIncompetente', p));
    }
    if (est.circuito.desconectado) fico2Pct = 0;

    /* El CO2 espirado se calcula con la ventilacion ajustada y despues se
       escala por la fraccion de volumen que realmente vuelve. Asi, ante una
       fuga el trazo baja o desaparece, como indica la tabla de la seccion 6
       del documento, en lugar de subir por hipoventilacion. El proyecto no
       simula fisiologia completa (seccion 11), por lo que ese escalado es
       un supuesto de diseno [P]. */
    var mvAjustado = (vtObjetivo * v.frecuencia) / 1000;
    var etco2 = M.etco2mmHg(fico2Pct, Math.max(0.5, mvAjustado), vco2, vdvt);
    var fraccionDevuelta = vtObjetivo > 0 ? M.limitar(vte / vtObjetivo, 0, 1) : 0;
    if (est.circuito.desconectado) {
      etco2 = 0;
    } else if (!hayVentilacion) {
      etco2 = Math.max(0, etco2 * 0.05);
    } else {
      etco2 = etco2 * fraccionDevuelta;
    }

    /* ---------- 5. Monitoreo -------------------------------------- */
    /* Flujo de la bomba de muestreo. Es lo que delata una oclusion: el
       modulo aspira una muestra continua por una linea delgada y, si algo
       la tapa, la bomba deja de mover gas aunque el paciente este bien.
       El caudal nominal es un supuesto de diseno [P]; los umbrales son [M]. */
    var flujoNominal = SIM.pv('monitoreo.flujoMuestraNominal', p);
    var flujoMuestra;
    if (est.monitoreo.moduloGases !== 'ok') flujoMuestra = 0;
    else if (est.monitoreo.lineaMuestreoOcluida || est.monitoreo.trampaAgua === 'llena') flujoMuestra = 8;
    else if (est.monitoreo.trampaAgua === 'gotas') flujoMuestra = flujoNominal * 0.55;
    else if (est.monitoreo.trampaAgua === 'ausente') flujoMuestra = flujoNominal * 1.2;
    else flujoMuestra = flujoNominal;

    var fio2Medida = fio2 * 100;
    var etco2Medida = etco2;
    var fico2Medida = M.pctAmmHg(fico2Pct);
    var agenteMedido = agentePct;
    var monitorValido = true;

    if (est.monitoreo.moduloGases !== 'ok') { monitorValido = false; }
    if (est.monitoreo.lineaMuestreoOcluida || est.monitoreo.trampaAgua === 'llena') {
      etco2Medida = 0; fico2Medida = 0; agenteMedido = 0; monitorValido = false;
    }
    if (est.monitoreo.celulaO2 === 'agotada') fio2Medida = 3;
    if (est.monitoreo.celulaO2 === 'desconectada') fio2Medida = null;
    if (est.monitoreo.celulaO2 === 'descalibrada') fio2Medida = fio2Medida * 0.72;

    /* SpO2 estimado [P] - solo como senal de contexto, el proyecto no
       simula fisiologia completa (seccion 11: fuera de alcance) */
    var spo2 = 98;
    if (fio2 < 0.21) spo2 = M.limitar(98 - (0.21 - fio2) * 260, 60, 99);
    if (est.circuito.desconectado) spo2 = M.limitar(98 - est.t * 0, 60, 99);

    out.suministro = {
      presionEfectiva: presionEfectiva,
      fuenteActiva: fuenteActiva,
      cilindro: { o2: s.cilindro.o2, n2o: s.cilindro.n2o },
      n2oCortado: s.n2oCortado,
      /* La alarma puede venir de la presion real o de un interruptor que
         dispara estando la presion bien: M1 5-4 [124] describe como
         distinguirlos (si la alarma desaparece al cortocircuitar el
         interruptor, el averiado es el interruptor). */
      presionRealBaja: presionEfectiva.o2 < alarmaO2,
      interruptorAveriado: s.interruptorAveriado,
      o2BajoAlarma: (presionEfectiva.o2 < alarmaO2) || s.interruptorAveriado,
      /* Autonomia del cilindro abierto: M10 diap. 2-3 */
      autonomiaCilindroMin: (s.cilindroAbierto.o2 && fuenteActiva.o2 === 'cilindro' && fO2 > 0)
        ? M.duracionCilindroMin(s.cilindro.o2, fO2,
            s.tipoCilindro === 'D' ? SIM.pv('suministro.factorCilindroD', p)
                                   : SIM.pv('suministro.factorCilindroE', p))
        : null
    };
    /* El canister esta caliente mientras la cal reacciona: la reaccion es
       exotermica. Una cal gastada se enfria, y esa es la unica forma de
       distinguirla de una cal nueva cuando el indicador de color miente. */
    var calReacciona = est.circuito.absorbedorInstalado &&
      est.circuito.absorbedorAvance < SIM.pv('absorbedor.avanceCanisterCaliente', p) &&
      !est.circuito.desconectado;
    out.absorbedor = {
      instalado: est.circuito.absorbedorInstalado,
      avance: est.circuito.absorbedorAvance,
      colorVirado: est.circuito.colorVirado,
      colorEnganoso: est.circuito.colorEnganoso,
      valvulaIncompetente: est.circuito.valvulaIncompetente,
      caliente: calReacciona,
      tempC: calReacciona ? SIM.pv('absorbedor.tempCanisterReaccion', p)
                          : SIM.pv('absorbedor.tempCanisterInerte', p)
    };
    out.gasFresco = { o2: fO2, aire: fAire, n2o: fN2O, fgf: fgf, fio2: fio2, fgfFijado: fgfFijado,
                      flush: flushLpm, fgfTotal: fgf + flushLpm };
    out.apl = {
      ajuste: est.circuito.aplCmH2O,
      enCircuito: aplEnCircuito,
      sello: aplSello,
      fuga: fugaApl,
      acumulada: est.circuito._acumulada || 0
    };
    out.vaporizadorSalida = agentePct;
    out.vaporizador = {
      agente: vap.agente,
      color: infoAg ? infoAg.color : '#ff9f45',
      cam: infoAg ? infoAg.cam : 2.0,
      camEntregada: infoAg && infoAg.cam > 0 ? agentePct / infoAg.cam : 0,
      incompatible: agenteIncompatible,
      dial: vap.dial, salida: agentePct, nivelPct: vap.nivelLiquidoPct,
      instalado: vap.instalado, bloqueado: vap.bloqueado, sinLiquido: sinLiquido,
      fugaColector: fugaColector, caidaFgf: caidaFgf,
      /* desviacion relativa de lo entregado frente a lo fijado en el dial */
      desviacionPct: vap.dial > 0 ? Math.abs(agentePct - vap.dial) / vap.dial * 100 : 0
    };
    out.ventilacion = {
      enInspiracion: enInspiracion, avanceFase: avanceFase, cicloSeg: cicloSeg,
      vti: vtAjustado,            /* lo que el ventilador intenta entregar */
      vtEntregado: vtEntregado,   /* lo que el fuelle alcanza a dar */
      llenado: est.circuito.llenado,
      vte: vte, mv: mv, ppico: ppico, presionViaAerea: presionViaAerea,
      peep: v.peep, gasMotrizOk: gasMotrizOk, ventilaMecanica: ventilaMecanica,
      ventilaManual: ventilaManual, hayVentilacion: hayVentilacion
    };
    out.circuito = {
      fico2Pct: fico2Pct, etco2: etco2,
      absorbedorAvance: est.circuito.absorbedorAvance,
      colorVirado: est.circuito.colorVirado,
      fugaQ30: q30,
      flujoFugaActual: M.flujoFuga(q30, presionViaAerea)
    };
    out.monitor = {
      fio2: fio2Medida, etco2: etco2Medida, fico2: fico2Medida,
      agente: agenteMedido, spo2: spo2, valido: monitorValido,
      flujoMuestra: flujoMuestra, flujoMuestraNominal: flujoNominal,
      ppico: ppico, mv: mv, vte: vte, vti: vtAjustado
    };

    return out;
  }

  /* ---------------------------------------------------------------- */
  /* Muestreo de curvas                                                */
  /* ---------------------------------------------------------------- */
  function muestrear(est, calc) {
    var h = est.historia;
    h.presion.push(calc.ventilacion.presionViaAerea);

    var capno;
    if (!calc.monitor.valido) {
      capno = 0;
    } else if (!calc.ventilacion.enInspiracion && calc.ventilacion.ventilaMecanica) {
      /* meseta espiratoria [P] forma aproximada */
      var a = calc.ventilacion.avanceFase;
      capno = calc.monitor.etco2 * Math.min(1, 0.15 + a * 1.9);
    } else {
      /* en inspiracion el trazo baja hasta FiCO2, no hasta cero,
         cuando hay reinhalacion [M] M9 */
      capno = calc.monitor.fico2;
    }
    h.capno.push(Math.max(0, capno));

    while (h.presion.length > h.tam) h.presion.shift();
    while (h.capno.length > h.tam) h.capno.shift();
  }

  return {
    estadoInicial: estadoInicial,
    calcular: calcular,
    muestrear: muestrear,
    fraccionInspiratoria: fraccionInspiratoria
  };
})();
