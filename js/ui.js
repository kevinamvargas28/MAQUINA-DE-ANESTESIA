/* =====================================================================
   ui.js  -  Interfaz: maquina, modulos, escenarios y las tres capas
   ---------------------------------------------------------------------
   Pantallas:
     inicio       elegir modo
     maquina      explorador: maquina completa y sus ocho modulos
     escenario    diagnostico, con la maquina siempre a la vista

   Reglas de diseno (seccion 5.3 del documento):
     - Capa 1 siempre visible: sintoma, 4 a 6 alarmas, maximo 5 variables
       y las acciones elegibles. Un solo valor por concepto.
     - Capa 2 ("por que"): dos o tres lineas con el principio fisico.
     - Capa 3 ("fuente"): de que manual sale el dato y en que pagina.
     - Las formulas solo aparecen en la capa 2 o 3.
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.ui = (function () {
  'use strict';

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  function n1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function n0(x) { return Math.round(x).toString(); }

  /* ================================================================ */
  /* Catalogo de variables de la capa 1                                */
  /* ================================================================ */
  var VARIABLES = {
    ppico: {
      et: 'Presion pico', uni: 'cmH2O',
      val: function (c) { return n0(c.ventilacion.ppico); },
      estado: function (c) {
        if (!c.ventilacion.hayVentilacion) return 'neutro';
        return c.ventilacion.ppico < SIM.pv('ventilacion.limiteBajoPresion', S.perfil) + 4 ? 'mal' : 'ok';
      },
      porque: 'Es la presion maxima que alcanza el circuito en cada inspiracion. Si el gas escapa, el circuito no llega a esa presion.',
      fuente: 'Alarma de presion baja: M4 7-11 [141] (Ppico < Pmin+4 cmH2O, 20 s); M3 D-1 [251].'
    },
    vti_vte: {
      et: 'VTi / VTe', uni: 'mL',
      val: function (c) { return n0(c.ventilacion.vti) + ' / ' + n0(c.ventilacion.vte); },
      estado: function (c) {
        if (c.ventilacion.vti <= 0) return 'neutro';
        return c.ventilacion.vte < c.ventilacion.vti * 0.5 ? 'mal'
             : (c.ventilacion.vte < c.ventilacion.vti * 0.9 ? 'aviso' : 'ok');
      },
      porque: 'Volumen que entra frente a volumen que vuelve. La diferencia es el gas que no regreso al circuito.',
      fuente: 'M4 7-7 [137] usa la relacion VTesp/VTinsp para declarar la fuga (menos de la mitad durante 30 s).'
    },
    agente: {
      et: 'Agente medido', uni: 'vol.%',
      val: function (c) {
        if (!c.monitor.valido) return '--';
        return n1(c.monitor.agente) + ' (dial ' + n1(c.vaporizador.dial) + ')';
      },
      estado: function (c) {
        if (!c.monitor.valido || c.vaporizador.dial <= 0) return 'neutro';
        if (c.monitor.agente < 0.2) return 'mal';
        return c.vaporizador.desviacionPct > SIM.pv('monitoreo.agenteDesviacionPct', S.perfil) ? 'mal' : 'ok';
      },
      porque: 'Lo que el analizador encuentra en el gas, frente a lo que pediste en el dial. El dial es una ' +
              'orden; esta cifra es la unica medida.',
      fuente: 'Desviacion por gas portador: 10 % relativo, max 0,4 vol.% (M11 3.3 [PDF 16]). El umbral de ' +
              'discrepancia del simulador es un supuesto [P].'
    },
    nivel_vaporizador: {
      et: 'Nivel del vaporizador', uni: '%',
      val: function (c) { return c.vaporizador.nivelPct <= 0 ? 'vacio' : n0(c.vaporizador.nivelPct); },
      estado: function (c) {
        if (c.vaporizador.nivelPct <= 0) return 'mal';
        return c.vaporizador.nivelPct < SIM.pv('vaporizador.nivelMinimoPct', S.perfil) ? 'aviso' : 'ok';
      },
      porque: 'Lo que queda de agente liquido en la mampara. No hay sensor: es una ventana que hay que mirar.',
      fuente: 'Marca de reserva: supuesto de diseno [P]. Los manuales piden comprobar el nivel antes de cada ' +
              'caso, sin fijar un porcentaje.'
    },
    fgf_entregado: {
      et: 'Gas fresco al circuito', uni: 'L/min',
      val: function (c) {
        var fj = c.gasFresco.fgfFijado;
        return n1(c.gasFresco.fgf) + (Math.abs(fj - c.gasFresco.fgf) > 0.15 ? ' (fijado ' + n1(fj) + ')' : '');
      },
      estado: function (c) {
        var fj = c.gasFresco.fgfFijado;
        if (fj <= 0) return 'neutro';
        return (fj - c.gasFresco.fgf) > SIM.pv('vaporizador.caidaMaximaContrapresion', S.perfil) ? 'mal'
             : ((fj - c.gasFresco.fgf) > 0.15 ? 'aviso' : 'ok');
      },
      porque: 'Lo que de verdad sale hacia el circuito, frente a lo que marcaste en los flujometros. Si una ' +
              'obstruccion se interpone, el flotador baja en cuanto se abre el dial.',
      fuente: 'La prueba de contrapresion de M1 3-5 [41] no admite una caida mayor de 1 L/min con 6 L/min ' +
              'fijados; M3 6-8 [90] la pide tambien.'
    },
    autonomia_cilindro: {
      et: 'Autonomia del cilindro', uni: 'min',
      val: function (c) {
        var a = c.suministro.autonomiaCilindroMin;
        if (a === null) return 'cerrado';
        return isFinite(a) ? n0(a) : '--';
      },
      estado: function (c) {
        var a = c.suministro.autonomiaCilindroMin;
        if (a === null) return 'neutro';
        return a < 10 ? 'mal' : (a < 30 ? 'aviso' : 'ok');
      },
      porque: 'Cuanto aguanta el cilindro al caudal que estas usando. El respaldo no es una solucion: es un ' +
              'reloj, y empieza a correr en cuanto lo abres.',
      fuente: 'M10 diap. 2-3: t(min) = presion x factor / flujo, con factor 0,28 para el cilindro E y 0,16 ' +
              'para el D.'
    },
    fico2: {
      et: 'CO2 inspirado', uni: 'mmHg',
      val: function (c) { return c.monitor.valido ? n1(c.monitor.fico2) : '--'; },
      estado: function (c) {
        if (!c.monitor.valido) return 'neutro';
        return c.monitor.fico2 > SIM.pv('absorbedor.alarmaFiCO2Alta', S.perfil) ? 'mal'
             : (c.monitor.fico2 > 1 ? 'aviso' : 'ok');
      },
      porque: 'CO2 que el paciente vuelve a inspirar. En un circuito circular con el absorbedor sano deberia ' +
              'ser cero: la linea base del capnograma toca el suelo. Si no lo toca, el paciente esta ' +
              'reinhalando su propio CO2.',
      fuente: 'Limite de fabrica 4 mmHg (M3 F-1 [269]). Criterio de cambio del absorbente: FiCO2 por encima ' +
              'de 0,5 % (3-4 mmHg), M9 p.43 y p.48.'
    },
    color_absorbente: {
      et: 'Color del absorbente', uni: '',
      val: function (c) {
        var v = c.absorbedor.colorVirado;
        if (v < 0.2) return 'blanco';
        if (v < 0.6) return 'virando';
        return 'violeta';
      },
      estado: function (c) { return c.absorbedor.colorVirado >= 0.6 ? 'mal'
             : (c.absorbedor.colorVirado >= 0.2 ? 'aviso' : 'ok'); },
      porque: 'El indicador de la cal vira de blanco a violeta al agotarse. Es util, pero no es de fiar: la ' +
              'cal que ha estado en reposo recupera el color blanco aunque siga gastada.',
      fuente: 'M9 p.43 y p.48 usan el CO2 inspirado, no el color, como criterio de cambio.'
    },
    temp_canister: {
      et: 'Temperatura del canister', uni: 'C',
      val: function (c) { return n0(c.absorbedor.tempC) + (c.absorbedor.caliente ? ' (templado)' : ' (frio)'); },
      estado: function (c) { return c.absorbedor.caliente ? 'ok' : 'mal'; },
      porque: 'La cal sodada se calienta mientras absorbe, porque la reaccion con el CO2 desprende calor. Un ' +
              'canister frio con el paciente ventilando significa que ahi dentro ya no esta pasando nada.',
      fuente: 'Temperaturas concretas: supuesto de diseno [P]. El caracter exotermico de la reaccion es el ' +
              'fundamento quimico del absorbedor.'
    },
    apl: {
      et: 'Valvula APL', uni: 'cmH2O',
      val: function (c) {
        if (!c.apl.enCircuito) return 'fuera del circuito';
        var a = Math.round(c.apl.ajuste);
        var et = c.apl.sello <= 0.05 ? ' (abierta)'
               : (c.apl.ajuste >= SIM.pv('apl.maxima', S.perfil) * 0.7 ? ' (cerrada)' : '');
        return a + et;
      },
      estado: function (c) {
        if (!c.apl.enCircuito) return 'neutro';
        if (c.apl.sello < 0.5) return 'mal';
        return c.apl.ajuste >= SIM.pv('apl.maxima', S.perfil) * 0.7 ? 'aviso' : 'ok';
      },
      porque: 'El techo de presion del circuito en ventilacion manual. Lo que pasa de ese valor se va a la ' +
              'evacuacion. Abierta del todo no se puede presurizar el circuito; cerrada del todo no hay por ' +
              'donde soltar lo que entra. Es un mando sin sensor: la maquina no sabe donde esta.',
      fuente: 'La prueba de fuga a 30 cmH2O exige cerrarla (M2 p.88 [96]; M12 p.1-2). La escala concreta es ' +
              'una inferencia [I]: las APL graduadas van de ~1 a ~70 cmH2O.'
    },
    mv: {
      et: 'Volumen minuto', uni: 'L/min',
      val: function (c) { return n1(c.ventilacion.mv); },
      estado: function (c) { return c.ventilacion.mv < 3 ? 'mal' : 'ok'; },
      porque: 'Volumen espirado por minuto: VTe x frecuencia. Sirve para calcular la reinhalacion frente al gas fresco.',
      fuente: 'M9 Fig. 1 (p.44): fR = 1 - FGF/MV.'
    },
    etco2: {
      et: 'EtCO2', uni: 'mmHg',
      val: function (c) { return c.monitor.valido ? n0(c.monitor.etco2) : '--'; },
      estado: function (c) {
        if (!c.monitor.valido) return 'neutro';
        return (c.monitor.etco2 < SIM.pv('absorbedor.alarmaEtCO2Baja', S.perfil) ||
                c.monitor.etco2 > SIM.pv('absorbedor.alarmaEtCO2Alta', S.perfil)) ? 'mal' : 'ok';
      },
      porque: 'CO2 al final de la espiracion. Si el gas no llega al paciente, el trazo baja o desaparece.',
      fuente: 'Limites de fabrica M3 F-1 [269]: EtCO2 alto 50, bajo 15. Formula: FETCO2 = FiCO2 + VCO2/MV (M9 p.46).'
    },
    concertina: {
      et: 'Concertina', uni: '',
      val: function (c) {
        if (!c.ventilacion.hayVentilacion) return 'detenida';
        if (c.ventilacion.ventilaManual) return 'manual (bolsa)';
        var t = c.ventilacion.llenado;
        return t > 0.9 ? 'llega al tope' : (t > 0.5 ? 'no llega al tope' : 'casi no sube');
      },
      estado: function (c) {
        if (!c.ventilacion.ventilaMecanica) return 'neutro';
        return c.ventilacion.llenado > 0.9 ? 'ok' : 'mal';
      },
      porque: 'Con una fuga, el fuelle ascendente no alcanza la parte superior de la camara. Es el sintoma mas visible.',
      fuente: 'M2 p.169 [177]: la concertina ascendente no llega arriba, sobre todo con gas fresco menor a 1 L/min.'
    },
    presion_o2: {
      et: 'Presion de O2', uni: 'kPa',
      val: function (c) { return n0(c.suministro.presionEfectiva.o2); },
      estado: function (c) { return c.suministro.o2BajoAlarma ? 'mal' : 'ok'; },
      porque: 'Presion efectiva de O2 que llega a la maquina, sea de la tuberia o del cilindro abierto.',
      fuente: 'Nominal 340 kPa (M6 p.84), rango 280-600 kPa (M3 B-4 [226]). Alarma del perfil: 250 kPa.'
    },
    presion_cilindro: {
      et: 'Cilindro de O2', uni: '',
      val: function (c, e) {
        return n0(c.suministro.cilindro.o2) + ' kPa' + (e.suministro.cilindroAbierto.o2 ? ', abierto' : ', cerrado');
      },
      estado: function (c, e) {
        if (!e.suministro.cilindroAbierto.o2) return 'neutro';
        return c.suministro.cilindro.o2 < 3500 ? 'aviso' : 'ok';
      },
      porque: 'Reserva disponible. La duracion se estima con t(min) = presion(psi) x factor / flujo(L/min).',
      fuente: 'Cilindros llenos 6,9-15 MPa (M1 2-5 [21]). Factor 0,28 para el cilindro E (M10 diap. 2-3).'
    },
    flujo_o2: {
      et: 'Flujo de O2 real', uni: 'L/min',
      val: function (c, e) { return n1(c.gasFresco.o2) + ' de ' + n1(e.flujometros.o2); },
      estado: function (c, e) { return c.gasFresco.o2 < e.flujometros.o2 * 0.9 ? 'mal' : 'ok'; },
      porque: 'El flujometro necesita presion de entrada estable. Sin presion suficiente no sostiene el caudal fijado.',
      fuente: 'Presion de entrada 280-600 kPa (M4 11-6 [212]).'
    },
    fio2: {
      et: 'FiO2', uni: '%',
      val: function (c) { return c.monitor.fio2 === null ? '--' : n0(c.monitor.fio2); },
      estado: function (c) {
        if (c.monitor.fio2 === null) return 'neutro';
        return c.monitor.fio2 < SIM.pv('monitoreo.fiO2AlarmaBaja', S.perfil) ? 'mal' : 'ok';
      },
      porque: 'Fraccion inspirada de oxigeno medida por la celula. Con aire ambiente deberia leer 21 %.',
      fuente: 'Alarma en 28 % para prevenir hipoxia (M7 3.6, p.48). FiO2 = [(0,21 x aire) + O2]/(aire + O2) (M8 3.2).'
    },
    flujo_muestra: {
      et: 'Flujo de muestra', uni: 'mL/min',
      val: function (c) {
        return c.monitor.flujoMuestra === undefined ? '--' : n0(c.monitor.flujoMuestra);
      },
      estado: function (c) {
        if (c.monitor.flujoMuestra === undefined) return 'neutro';
        var nom = c.monitor.flujoMuestraNominal || 200;
        if (c.monitor.flujoMuestra < SIM.pv('monitoreo.flujoViaAereaOcluida', S.perfil)) return 'mal';
        return c.monitor.flujoMuestra < nom * 0.8 ? 'aviso' : 'ok';
      },
      porque: 'Caudal que la bomba del modulo consigue aspirar por la linea de muestreo. Es la senal que ' +
              'delata una oclusion: si la bomba no mueve gas, el modulo no puede medir nada, por bien que ' +
              'este el paciente.',
      fuente: 'Via aerea ocluida con bomba por debajo de 20 mL/min mas de 1 s (M3 D-9 [259]). Flujo de ' +
              'muestra bajo por debajo del 80 % del nominal durante 20 s (M4 7-10 [140]). El caudal nominal ' +
              'de 200 mL/min es un supuesto de diseno [P].'
    },
    gas_motriz: {
      et: 'Gas motriz', uni: 'kPa',
      val: function (c, e) { return n0(e.ventilador.gasMotrizKPa); },
      estado: function (c) { return c.ventilacion.gasMotrizOk ? 'ok' : 'mal'; },
      porque: 'Es el gas a presion que comprime la concertina. El ventilador no genera gas: lo empuja. ' +
              'Sin esta presion no hay inspiracion mecanica aunque la electronica funcione.',
      fuente: 'Presion entregada 280-600 kPa (M3 B-8 [230]). El interruptor de presion se ajusta para ' +
              'disparar cerca de 0,14 MPa, dentro de 0,05-0,2 MPa (M1 5-21 [141]).'
    },
    n2o: {
      et: 'Flujo de N2O', uni: '',
      val: function (c, e) {
        if (c.suministro.n2oCortado) return 'cortado';
        return n1(c.gasFresco.n2o) + ' de ' + n1(e.flujometros.n2o) + ' L/min';
      },
      estado: function (c) { return c.suministro.n2oCortado ? 'aviso' : 'ok'; },
      porque: 'Si falta O2 a presion suficiente, el N2O se corta automaticamente para que la mezcla no quede sin oxigeno.',
      fuente: 'M2 p.130 [138]. Corte bajo 172 kPa y reposicion sobre 227 kPa (M6 p.17 [V]).'
    }
  };

  /* ================================================================ */
  /* Estado de la interfaz                                             */
  /* ================================================================ */
  var S = {
    pantalla: 'inicio',
    modo: 'practica',          // 'entrenamiento' | 'practica'
    escenario: null,
    variante: null,
    zonaModulo: null,
    registro: [],
    accionesHechas: [],
    revelados: {},
    zonasDescartadas: [],
    zonaSospechosa: null,
    resuelto: false,
    tSim: 0,
    audioPausadoHasta: -1,
    perfil: null,
    estado: null,
    refs: {},
    alSalir: null,
    alAbrirEscenario: null
  };

  function avisarTutorial(ev) {
    if (SIM.tutorial && SIM.tutorial.activo()) SIM.tutorial.notificar(ev);
  }

  /* ================================================================ */
  /* PANTALLA DE INICIO                                                */
  /* ================================================================ */
  function renderInicio(raiz, acciones) {
    raiz.innerHTML =
      '<div class="inicio">' +
        '<div class="inicio-cab">' +
          '<h1>Simulador de maquina de anestesia</h1>' +
          '<p class="sub">Diagnostico de fallas desde la ingenieria clinica. ' +
            'Maquina generica de arquitectura estandar, sin marca.</p>' +
          '<p class="aviso">Herramienta educativa. No representa un equipo certificado, no sustituye los ' +
            'manuales del fabricante ni al personal tecnico autorizado, y no es guia clinica.</p>' +
        '</div>' +

        '<div class="modos">' +
          '<button class="modo-tarj destacada" id="mEntreno">' +
            '<span class="modo-num">1</span>' +
            '<span class="modo-tit">Entrenamiento guiado</span>' +
            '<span class="modo-txt">Empieza aqui. Una guia paso a paso te ensena a usar el simulador y a ' +
              'diagnosticar cada falla, diciendote que hacer y por que.</span>' +
            '<span class="modo-pie">Recomendado la primera vez</span>' +
          '</button>' +
          '<button class="modo-tarj" id="mPractica">' +
            '<span class="modo-num">2</span>' +
            '<span class="modo-tit">Practica libre</span>' +
            '<span class="modo-txt">El mismo escenario, sin ayudas. Tu decides que mirar y en que orden. ' +
              'Al final ves que acertaste y que no.</span>' +
            '<span class="modo-pie">Cuando ya sepas moverte</span>' +
          '</button>' +
          '<button class="modo-tarj" id="mMaquina">' +
            '<span class="modo-num">3</span>' +
            '<span class="modo-tit">Conocer la maquina</span>' +
            '<span class="modo-txt">Recorre la maquina completa y entra a cada uno de sus ocho modulos: ' +
              'que es, que hace y en que se nota cuando falla.</span>' +
            '<span class="modo-pie">Consulta libre</span>' +
          '</button>' +
        '</div>' +

        '<div class="inicio-pie">' +
          '<button class="btn-sec" id="btnPerfil">Ver el perfil de la maquina</button>' +
          '<button class="btn-sec" id="btnSupuestos">Supuestos de diseno sin validar</button>' +
        '</div>' +
      '</div>';

    $('#mEntreno', raiz).addEventListener('click', function () { acciones.listaEscenarios('entrenamiento'); });
    $('#mPractica', raiz).addEventListener('click', function () { acciones.listaEscenarios('practica'); });
    $('#mMaquina', raiz).addEventListener('click', acciones.maquina);
    $('#btnPerfil', raiz).addEventListener('click', mostrarPerfil);
    $('#btnSupuestos', raiz).addEventListener('click', mostrarSupuestos);
  }

  /* ================================================================ */
  /* LISTA DE ESCENARIOS                                               */
  /* ================================================================ */
  function renderListaEscenarios(raiz, modo, acciones) {
    var entrenando = modo === 'entrenamiento';
    var tarjetas = SIM.escenarios.lista.map(function (e) {
      var guia = SIM.tutorial && SIM.tutorial.hayParaEscenario(e);
      var dis = e.disponible && (!entrenando || guia);
      var chip;
      if (!e.disponible) chip = 'Previsto para el ' + e.previsto;
      else if (entrenando && !guia) chip = 'Guia en preparacion';
      else chip = entrenando ? 'Con guia paso a paso' : 'Disponible';
      return '<button class="tarjeta' + (dis ? '' : ' no-disp') + '" ' +
             (dis ? 'data-esc="' + e.id + '"' : 'disabled') + '>' +
               '<span class="num">Escenario ' + e.numero + '</span>' +
               '<span class="tit">' + e.titulo + '</span>' +
               '<span class="idea">' + (e.ideaPrincipal || '') + '</span>' +
               '<span class="chip' + (dis ? '' : ' chip-off') + '">' + chip + '</span>' +
             '</button>';
    }).join('');

    raiz.innerHTML =
      '<div class="inicio">' +
        '<button class="btn-sec peq volver" id="btnVolverInicio">Volver al inicio</button>' +
        '<div class="inicio-cab">' +
          '<h1>' + (entrenando ? 'Entrenamiento guiado' : 'Practica libre') + '</h1>' +
          '<p class="sub">' + (entrenando
            ? 'Una tarjeta te ira diciendo que hacer en cada paso y por que. Puedes salir de la guia cuando quieras.'
            : 'Sin ayudas. Diagnostica por tu cuenta y al final revisa tus decisiones.') + '</p>' +
        '</div>' +
        '<div class="rejilla-tarjetas">' + tarjetas + '</div>' +
      '</div>';

    $$('.tarjeta[data-esc]', raiz).forEach(function (b) {
      b.addEventListener('click', function () {
        /* La variante se sortea al abrir, y se puede cambiar despues en
           el selector de la barra. */
        acciones.abrirEscenario(b.getAttribute('data-esc'), modo, null);
      });
    });
    $('#btnVolverInicio', raiz).addEventListener('click', acciones.inicio);
  }

  function renderMaquina(raiz, acciones) {
    raiz.innerHTML =
      '<div class="exp">' +
        '<header class="barra">' +
          '<button class="btn-sec peq" id="btnVolverInicio">Volver al inicio</button>' +
          '<div class="barra-tit">' +
            '<span class="barra-num">Conocer la maquina</span>' +
            '<span class="barra-nom" id="expTitulo">Maquina de anestesia generica</span>' +
          '</div>' +
          '<div class="barra-der">' +
            '<button class="btn-sec peq" id="btnRecorrido">Recorrido del gas</button>' +
            '<button class="btn-sec peq oculto" id="btnTodaMaquina">Ver la maquina completa</button>' +
          '</div>' +
        '</header>' +
        '<div class="exp-cuerpo" id="expCuerpo">' +
          '<section class="exp-maquina">' +
            '<div class="vista-caja" id="vistaCaja">' + SIM.maquinaVista.markup('svgVista') + '</div>' +
            '<p class="vista-pie" id="vistaPie">Pasa el cursor por la maquina y pulsa una parte para entrar.</p>' +
          '</section>' +
          '<section class="exp-detalle" id="expDetalle"></section>' +
        '</div>' +
        '<div class="modal oculto" id="modal">' +
          '<div class="modal-caja"><button class="cerrar" id="cerrarModal" aria-label="Cerrar">&times;</button>' +
          '<div id="modalCuerpo"></div></div>' +
        '</div>' +
      '</div>';

    S.refs = {
      svgVista: $('#svgVista', raiz),
      vistaPie: $('#vistaPie', raiz),
      expCuerpo: $('#expCuerpo', raiz),
      expDetalle: $('#expDetalle', raiz),
      expTitulo: $('#expTitulo', raiz),
      modal: $('#modal', raiz),
      modalCuerpo: $('#modalCuerpo', raiz)
    };

    SIM.maquinaVista.preparar(S.refs.svgVista, abrirModulo, pasarZona);

    $('#btnVolverInicio', raiz).addEventListener('click', acciones.inicio);
    $('#btnRecorrido', raiz).addEventListener('click', abrirRecorrido);
    $('#btnTodaMaquina', raiz).addEventListener('click', function () { abrirModulo(null); });
    $('#cerrarModal', raiz).addEventListener('click', cerrarModal);
    S.refs.modal.addEventListener('click', function (ev) { if (ev.target === S.refs.modal) cerrarModal(); });
    raiz.addEventListener('click', delegarCapas);

    abrirModulo(null);
  }

  function pasarZona(z) {
    if (!S.refs.vistaPie) return;
    if (z) S.refs.vistaPie.innerHTML = '<b>' + z.nombre + '.</b> ' + z.resumen;
    else if (S.zonaModulo) {
      var zz = SIM.maquinaVista.zona(S.zonaModulo);
      S.refs.vistaPie.innerHTML = zz ? '<b>Estas en: ' + zz.nombre + '.</b> Pulsa otra parte para cambiar.'
                                     : 'Pulsa una parte de la maquina.';
    } else {
      S.refs.vistaPie.textContent = 'Pasa el cursor por la maquina y pulsa una parte para entrar.';
    }
  }

  function abrirModulo(id) {
    S.zonaModulo = id;
    var cuerpo = S.refs.expCuerpo;
    if (cuerpo) cuerpo.classList.toggle('con-modulo', !!id);
    var btnTodo = document.getElementById('btnTodaMaquina');
    if (btnTodo) btnTodo.classList.toggle('oculto', !id);
    SIM.maquinaVista.marcar(S.refs.svgVista, id, null);
    pasarZona(null);

    if (!id) {
      if (S.refs.expTitulo) S.refs.expTitulo.textContent = 'Maquina de anestesia generica';
      S.refs.expDetalle.innerHTML =
        '<div class="bloque-capa1">' +
          '<div class="cab-bloque"><h3>Los ocho modulos</h3></div>' +
          '<p class="sintoma">Esta es una maquina de arquitectura estandar. El gas entra por el suministro, ' +
            'se dosifica en los flujometros, recoge el agente en el vaporizador, sale por la salida comun y ' +
            'recorre el circuito circular hasta el paciente y de vuelta. Pulsa cualquier parte del dibujo.</p>' +
          '<ul class="lista-modulos">' +
            SIM.maquinaVista.ZONAS.map(function (z) {
              return '<li><button data-zona="' + z.id + '"><b>' + z.nombre + '</b>' +
                     '<span>' + z.resumen + '</span></button></li>';
            }).join('') +
          '</ul>' +
        '</div>';
      $$('[data-zona]', S.refs.expDetalle).forEach(function (b) {
        b.addEventListener('click', function () { abrirModulo(b.getAttribute('data-zona')); });
      });
      return;
    }

    var m = SIM.modulos.porId(id);
    var z = SIM.maquinaVista.zona(id);
    if (!m || !z) return;
    if (S.refs.expTitulo) S.refs.expTitulo.textContent = m.nombre;

    var escBtns = (m.escenarios || []).map(function (eid) {
      var e = SIM.escenarios.porId(eid);
      if (!e) return '';
      return '<button class="btn-esc' + (e.disponible ? '' : ' off') + '" ' +
             (e.disponible ? 'data-abrir-esc="' + eid + '"' : 'disabled') + '>' +
             'Escenario ' + e.numero + ': ' + e.titulo +
             (e.disponible ? '' : ' (previsto ' + e.previsto + ')') + '</button>';
    }).join('');

    S.refs.expDetalle.innerHTML =
      '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>Que es</h3></div>' +
        '<p class="sintoma">' + m.queEs + '</p>' +
        '<div class="cab-bloque"><h3>Que hace</h3></div>' +
        '<p class="sintoma">' + m.queHace + '</p>' +
        '<div class="acciones-capa">' +
          '<button class="btn-capa2" data-por-que="mod:' + id + '">Por que</button>' +
          '<button class="btn-capa3" data-fuente="mod:' + id + '">Fuente</button>' +
        '</div>' +
      '</div>' +
      '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>En que se nota cuando falla</h3></div>' +
        '<ul class="lista-fallos">' + m.fallos.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      ((m.efectos || m.rangos) ? '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>Rangos y efectos</h3></div>' +
        (m.efectos ? '<ul class="lista-fallos">' +
          m.efectos.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="acciones-capa">' +
          '<button class="btn-capa3" data-fuente="rangos:' + id + '">Ver los valores con su cita</button>' +
        '</div></div>' : '') +
      (escBtns ? '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>Practicar con este modulo</h3></div>' +
        '<div class="escs">' + escBtns + '</div></div>' : '');

    $$('[data-abrir-esc]', S.refs.expDetalle).forEach(function (b) {
      b.addEventListener('click', function () {
        if (S.alAbrirEscenario) S.alAbrirEscenario(b.getAttribute('data-abrir-esc'), 'practica');
      });
    });
  }

  /* ================================================================ */
  /* PANTALLA DE ESCENARIO                                             */
  /* ================================================================ */
  function renderSimulacion(raiz, esc, modo) {
    var entrenando = modo === 'entrenamiento';
    var vr = S.variante;
    var sintoma = (vr && vr.sintoma) || esc.sintoma;
    raiz.innerHTML =
      '<div class="sim">' +
        '<header class="barra">' +
          '<button class="btn-sec peq" id="btnVolver">Salir</button>' +
          '<div class="barra-tit">' +
            '<span class="barra-num">Escenario ' + esc.numero +
              (entrenando ? ' - entrenamiento' : ' - practica libre') + '</span>' +
            '<span class="barra-nom">' + esc.titulo + '</span>' +
          '</div>' +
          '<div class="barra-der">' +
            (vr ? '<label class="sel-var" title="Cambiar de variante reinicia el escenario">' +
                    '<span>Variante</span>' +
                    '<select id="selVariante">' +
                      esc.variantes.map(function (v, i) {
                        return '<option value="' + v.id + '"' + (v.id === vr.id ? ' selected' : '') + '>' +
                               (i + 1) + '. ' + v.nombre + '</option>';
                      }).join('') +
                    '</select>' +
                  '</label>' : '') +
            '<span class="perfil-chip" id="chipPerfil">Perfil base v1</span>' +
            '<span class="reloj" id="reloj">00:00</span>' +
            '<button class="btn-sec peq" id="btnPausaAudio">Pausar audio 120 s</button>' +
          '</div>' +
        '</header>' +

        '<div class="lienzo2">' +
          '<section class="col-izq" id="colIzq">' +
            '<div class="vista-caja chica" id="vistaCaja">' + SIM.maquinaVista.markup('svgVista') + '</div>' +
            '<p class="vista-pie" id="vistaPie">La maquina completa. Pulsa una parte para consultarla.</p>' +
            '<div class="controles" id="controles"></div>' +
          '</section>' +

          '<section class="col-der">' +
            '<div class="banda-alarmas" id="bandaAlarmas"></div>' +

            '<div class="bloque-capa1">' +
              '<div class="cab-bloque"><h3>Que ocurre</h3></div>' +
              '<p class="sintoma" id="sintoma">' + sintoma + '</p>' +
              '<div class="acciones-capa">' +
                '<button class="btn-capa2" data-por-que="escenario">Por que</button>' +
                '<button class="btn-capa3" data-fuente="escenario">Fuente</button>' +
                '<button class="btn-sec peq" id="btnRecorrido">Recorrido del gas</button>' +
              '</div>' +
            '</div>' +

            '<div class="bloque-capa1">' +
              '<div class="cab-bloque"><h3>Variables</h3></div>' +
              '<div class="variables" id="variables"></div>' +
            '</div>' +

            '<div class="bloque-capa1" id="curvasMini">' +
              '<div class="cab-bloque"><h3>Curvas</h3>' +
                '<span class="cab-nota">la banda verde es el rango normal del perfil</span></div>' +
              '<div class="curvas-par">' +
                '<div class="curva-tarj">' +
                  '<div class="curva-cab"><span>Presion de via aerea</span>' +
                    '<b id="vPaw">--</b><small>cmH2O</small></div>' +
                  '<canvas id="cvPaw"></canvas>' +
                '</div>' +
                '<div class="curva-tarj">' +
                  '<div class="curva-cab"><span>Capnografia</span>' +
                    '<b id="vCapno">--</b><small>mmHg</small></div>' +
                  '<canvas id="cvCapno"></canvas>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="bloque-capa1">' +
              '<div class="cab-bloque"><h3>Que haces</h3></div>' +
              '<div class="acciones" id="acciones"></div>' +
            '</div>' +

            '<div class="bloque-capa1">' +
              '<div class="cab-bloque"><h3>Registro</h3></div>' +
              '<ol class="registro" id="registro"><li class="vacio">Todavia no has hecho nada.</li></ol>' +
            '</div>' +
          '</section>' +
        '</div>' +

        '<div class="modal oculto" id="modal">' +
          '<div class="modal-caja"><button class="cerrar" id="cerrarModal" aria-label="Cerrar">&times;</button>' +
          '<div id="modalCuerpo"></div></div>' +
        '</div>' +
        '<div class="retro oculto" id="retro"></div>' +
      '</div>';

    S.refs = {
      svgVista: $('#svgVista', raiz),
      vistaPie: $('#vistaPie', raiz),
      variables: $('#variables', raiz),
      acciones: $('#acciones', raiz),
      registro: $('#registro', raiz),
      banda: $('#bandaAlarmas', raiz),
      cvPaw: $('#cvPaw', raiz),
      cvCapno: $('#cvCapno', raiz),
      vPaw: $('#vPaw', raiz),
      vCapno: $('#vCapno', raiz),
      modal: $('#modal', raiz),
      modalCuerpo: $('#modalCuerpo', raiz),
      retro: $('#retro', raiz),
      reloj: $('#reloj', raiz),
      controles: $('#controles', raiz)
    };

    SIM.maquinaVista.preparar(S.refs.svgVista, consultarZona, pasarZonaSim);
    renderControles();
    renderAcciones(esc);

    $('#cerrarModal', raiz).addEventListener('click', cerrarModal);
    S.refs.modal.addEventListener('click', function (ev) { if (ev.target === S.refs.modal) cerrarModal(); });
    raiz.addEventListener('click', delegarCapas);
    $('#btnRecorrido', raiz).addEventListener('click', abrirRecorrido);

    /* Cambiar de variante vuelve a abrir el escenario desde cero, con la
       misma modalidad: es otra falla, no otro ajuste de la misma. */
    var selVar = $('#selVariante', raiz);
    if (selVar) {
      selVar.addEventListener('change', function () {
        if (S.alAbrirEscenario) S.alAbrirEscenario(esc.id, S.modo, selVar.value);
      });
    }

    $('#btnPausaAudio', raiz).addEventListener('click', function () {
      S.audioPausadoHasta = S.tSim + SIM.pv('alarmas.pausaAudioSeg', S.perfil);
      anotar('Pausa de audio de 120 s. La alarma reaparece si la condicion sigue presente (M4 7-2 [132]).', 'neutro');
    });
  }

  function pasarZonaSim(z) {
    if (!S.refs.vistaPie) return;
    if (z) S.refs.vistaPie.innerHTML = '<b>' + z.nombre + '.</b> ' + z.resumen;
    else S.refs.vistaPie.textContent = 'La maquina completa. Pulsa una parte para consultarla.';
  }

  /* Consultar un modulo sin salir del escenario */
  function consultarZona(id) {
    var m = SIM.modulos.porId(id);
    var z = SIM.maquinaVista.zona(id);
    if (!m || !z) return;
    abrirModal(
      '<h3 class="modal-tit">' + m.nombre + '</h3>' +
      '<p class="capa2">' + m.queEs + '</p>' +
      '<p class="capa2">' + m.queHace + '</p>' +
      '<h4 class="c3-sub">En que se nota cuando falla</h4>' +
      '<ul class="lista-fallos">' + m.fallos.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
      '<button class="btn-capa2 linea" data-por-que="mod:' + id + '">Por que</button> ' +
      '<button class="btn-capa3 linea" data-fuente="mod:' + id + '">Fuente</button>'
    );
    avisarTutorial('zona:' + id);
  }

  /* ---------------------------------------------------------------- */
  /* Controles minimos                                                 */
  /* ---------------------------------------------------------------- */
  function renderControles() {
    S.refs.controles.innerHTML =
      '<div class="ctrl"><label for="cO2">O2 <b id="lO2">2,0</b> L/min</label>' +
        '<input id="cO2" type="range" min="0" max="10" step="0.1" value="2"></div>' +
      '<div class="ctrl"><label for="cAire">Aire <b id="lAire">2,0</b> L/min</label>' +
        '<input id="cAire" type="range" min="0" max="10" step="0.1" value="2"></div>' +
      '<div class="ctrl"><label for="cN2O">N2O <b id="lN2O">0,0</b> L/min</label>' +
        '<input id="cN2O" type="range" min="0" max="10" step="0.1" value="0"></div>' +
      '<div class="ctrl"><label for="cDial">Vaporizador <b id="lDial">2,0</b> %</label>' +
        '<input id="cDial" type="range" min="0" max="8" step="0.1" value="2"></div>' +
      '<div class="ctrl" id="ctrlApl"><label for="cApl">Valvula APL <b id="lApl">20</b> cmH2O ' +
          '<span class="ctrl-nota" id="notaApl"></span></label>' +
        '<input id="cApl" type="range" min="' + SIM.pv('apl.minima') + '" max="' + SIM.pv('apl.maxima') +
          '" step="1" value="' + SIM.pv('apl.nominal') + '"></div>' +
      '<div class="ctrl-fila">' +
        '<button class="btn-flush" id="btnFlush" title="Mantener pulsado">Purga de O2</button>' +
        '<button class="btn-sec peq" id="btnModo">Pasar a manual</button>' +
        '<button class="btn-sec peq" id="btnCilO2">Abrir cilindro O2</button>' +
        '<button class="btn-capa3" data-fuente="rangos:flujometros">Rangos de referencia</button>' +
      '</div>';

    var est = S.estado;
    function liga(idInput, idLbl, aviso, aplica) {
      var inp = $('#' + idInput, S.refs.controles);
      inp.addEventListener('input', function () {
        var v = parseFloat(inp.value);
        $('#' + idLbl, S.refs.controles).textContent = n1(v);
        aplica(v);
        avisarTutorial(aviso);
      });
    }
    liga('cO2', 'lO2', 'control:o2', function (v) { est.flujometros.o2 = v; });
    liga('cAire', 'lAire', 'control:aire', function (v) { est.flujometros.aire = v; });
    liga('cN2O', 'lN2O', 'control:n2o', function (v) { est.flujometros.n2o = v; });
    liga('cDial', 'lDial', 'control:dial', function (v) { est.vaporizador.dial = v; });
    liga('cApl', 'lApl', 'control:apl', function (v) {
      est.circuito.aplCmH2O = v;
      notaApl();
    });

    /* La etiqueta del mando dice en que extremo esta, porque "20" no
       significa nada hasta que sabes que 1 es abierta y 70 cerrada. */
    function notaApl() {
      var na = $('#notaApl', S.refs.controles);
      if (!na) return;
      if (est.circuito.modo !== 'manual') {
        na.textContent = '— fuera del circuito en ventilacion mecanica';
      } else if (est.circuito.aplCmH2O <= SIM.pv('apl.umbralSello', S.perfil)) {
        na.textContent = '— abierta, el gas se va a la evacuacion';
      } else if (est.circuito.aplCmH2O >= SIM.pv('apl.maxima', S.perfil) * 0.7) {
        na.textContent = '— cerrada, sin via de escape';
      } else {
        na.textContent = '';
      }
    }
    notaApl();

    /* La purga es un pulsador: entrega mientras se mantiene apretado, y
       se suelta al levantar el dedo o al sacar el raton del boton. */
    var bf = $('#btnFlush', S.refs.controles);
    function flush(on) {
      if (est.circuito.flushActivo === on) return;
      est.circuito.flushActivo = on;
      bf.classList.toggle('activo', on);
      if (on) { anotar('Purga de O2 pulsada', 'neutro'); avisarTutorial('control:flush'); }
    }
    bf.addEventListener('mousedown', function () { flush(true); });
    bf.addEventListener('mouseup', function () { flush(false); });
    bf.addEventListener('mouseleave', function () { flush(false); });
    bf.addEventListener('touchstart', function (e) { e.preventDefault(); flush(true); });
    bf.addEventListener('touchend', function (e) { e.preventDefault(); flush(false); });

    $('#btnModo', S.refs.controles).addEventListener('click', function () {
      est.circuito.modo = est.circuito.modo === 'manual' ? 'mecanica' : 'manual';
      this.textContent = est.circuito.modo === 'manual' ? 'Volver a mecanica' : 'Pasar a manual';
    });
    $('#btnCilO2', S.refs.controles).addEventListener('click', function () {
      est.suministro.cilindroAbierto.o2 = !est.suministro.cilindroAbierto.o2;
      this.textContent = est.suministro.cilindroAbierto.o2 ? 'Cerrar cilindro O2' : 'Abrir cilindro O2';
      avisarTutorial(est.suministro.cilindroAbierto.o2 ? 'control:cilindro-abierto' : 'control:cilindro-cerrado');
    });
  }

  function sincronizarControles() {
    var est = S.estado, c = S.refs.controles;
    if (!c || !est) return;
    [['cO2', 'lO2', est.flujometros.o2], ['cAire', 'lAire', est.flujometros.aire],
     ['cN2O', 'lN2O', est.flujometros.n2o], ['cDial', 'lDial', est.vaporizador.dial]]
    .forEach(function (m) {
      var inp = $('#' + m[0], c), lbl = $('#' + m[1], c);
      if (inp && Math.abs(parseFloat(inp.value) - m[2]) > 0.01) inp.value = m[2];
      if (lbl) lbl.textContent = n1(m[2]);
    });
    var bm = $('#btnModo', c);
    if (bm) bm.textContent = est.circuito.modo === 'manual' ? 'Volver a mecanica' : 'Pasar a manual';

    /* La APL solo esta en el circuito en ventilacion manual. En
       mecanica el selector la deja fuera del paso, y conviene que el
       mando lo diga en lugar de limitarse a no hacer nada. */
    var manual = est.circuito.modo === 'manual';
    var ia = $('#cApl', c), la = $('#lApl', c), na = $('#notaApl', c), ca = $('#ctrlApl', c);
    if (ia && Math.abs(parseFloat(ia.value) - est.circuito.aplCmH2O) > 0.5) ia.value = est.circuito.aplCmH2O;
    if (la) la.textContent = n0(est.circuito.aplCmH2O);
    if (na) na.textContent = !manual ? '— fuera del circuito en ventilacion mecanica'
      : (est.circuito.aplCmH2O <= SIM.pv('apl.umbralSello', S.perfil) ? '— abierta, el gas se va a la evacuacion'
      : (est.circuito.aplCmH2O >= SIM.pv('apl.maxima', S.perfil) * 0.7 ? '— cerrada, sin via de escape' : ''));
    if (ca) ca.classList.toggle('inactivo', !manual);
    var bc = $('#btnCilO2', c);
    if (bc) bc.textContent = est.suministro.cilindroAbierto.o2 ? 'Cerrar cilindro O2' : 'Abrir cilindro O2';
  }

  /* ---------------------------------------------------------------- */
  /* Acciones elegibles                                                */
  /* ---------------------------------------------------------------- */
  function renderAcciones(esc) {
    S.refs.acciones.innerHTML = esc.acciones.map(function (a) {
      var hecha = S.accionesHechas.indexOf(a.id) >= 0;
      return '<button class="accion tipo-' + a.tipo + (hecha ? ' hecha' : '') + '" data-accion="' + a.id + '">' +
               '<span class="accion-tipo">' + etiquetaTipo(a.tipo) + '</span>' +
               '<span class="accion-cuerpo">' +
                 '<span class="accion-txt">' + a.etiqueta + '</span>' +
                 (a.proposito ? '<span class="accion-prop">' + a.proposito + '</span>' : '') +
               '</span>' +
             '</button>';
    }).join('');
    $$('[data-accion]', S.refs.acciones).forEach(function (b) {
      b.addEventListener('click', function () { ejecutarAccion(esc, b.getAttribute('data-accion')); });
    });
    if (SIM.tutorial) SIM.tutorial.reaplicarFoco();
  }

  function etiquetaTipo(t) {
    return { proteccion: 'Proteger', observacion: 'Observar', prueba: 'Probar', correccion: 'Corregir' }[t] || t;
  }

  var ctxAccion = {
    revelar: function (clave) { S.revelados[clave] = true; },
    abrirPrueba: function (tipo) { abrirPrueba(tipo); },
    descartar: function (zonas) {
      (zonas || []).forEach(function (z) {
        if (S.zonasDescartadas.indexOf(z) < 0) S.zonasDescartadas.push(z);
      });
    },
    sospechar: function (zona) { S.zonaSospechosa = zona; },
    pausarAudio: function () {
      S.audioPausadoHasta = S.tSim + SIM.pv('alarmas.pausaAudioSeg', S.perfil);
    }
  };

  function ejecutarAccion(esc, id) {
    var a = null;
    for (var i = 0; i < esc.acciones.length; i++) if (esc.acciones[i].id === id) a = esc.acciones[i];
    if (!a) return;

    var correcta = typeof a.correcta === 'function' ? a.correcta(S.estado) : a.correcta;
    if (a.efecto) a.efecto(S.estado, ctxAccion);
    if (S.accionesHechas.indexOf(a.id) < 0) S.accionesHechas.push(a.id);

    var clase = correcta === true ? 'bien' : (correcta === 'parcial' ? 'parcial' : 'mal');
    var texto = (correcta !== true && a.explicacionSiIncorrecta) ? a.explicacionSiIncorrecta : a.explicacion;
    if (!texto) texto = a.explicacion || '';

    anotar(a.etiqueta, clase);
    S._retroCuando = a.cuando || '';
    mostrarRetro(a.etiqueta, clase, texto, a.cita);
    renderAcciones(esc);
    sincronizarControles();
    avisarTutorial('accion:' + a.id);
  }

  /* ---------------------------------------------------------------- */
  /* Retroalimentacion                                                 */
  /* ---------------------------------------------------------------- */
  function mostrarRetro(que, clase, porque, cita) {
    var r = S.refs.retro;
    if (!r) return;
    var titulo = clase === 'bien' ? 'Correcto' : (clase === 'parcial' ? 'Parcialmente util' : 'No es lo indicado');
    r.className = 'retro ' + clase;
    r.innerHTML =
      '<div class="retro-cab"><b>' + titulo + ':</b> ' + que + '</div>' +
      '<p>' + (porque || '') + '</p>' +
      (S._retroCuando ? '<p class="retro-cuando"><b>Cuando si:</b> ' + S._retroCuando + '</p>' : '') +
      '<button class="btn-capa3 linea" data-fuente="cita:' + encodeURIComponent(cita || '') + '">Fuente</button>' +
      '<button class="cerrar-retro" aria-label="Cerrar">&times;</button>';
    r.classList.remove('oculto');
    $('.cerrar-retro', r).addEventListener('click', function () { r.classList.add('oculto'); });
    clearTimeout(S._retroT);
    S._retroT = setTimeout(function () { r.classList.add('oculto'); }, 13000);
  }

  function anotar(texto, clase) {
    S.registro.push({ t: S.tSim, texto: texto, clase: clase || 'neutro' });
    var lista = S.refs.registro;
    if (!lista) return;
    lista.innerHTML = S.registro.map(function (r) {
      return '<li class="' + r.clase + '"><span class="t">' + reloj(r.t) + '</span>' + r.texto + '</li>';
    }).join('');
    lista.scrollTop = lista.scrollHeight;
  }

  function reloj(seg) {
    var m = Math.floor(seg / 60), s = Math.floor(seg % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------------------------------------------------------------- */
  /* Capas 2 y 3                                                       */
  /* ---------------------------------------------------------------- */
  function abrirModal(html) {
    if (!S.refs.modalCuerpo) return;
    S.refs.modalCuerpo.innerHTML = html;
    S.refs.modal.classList.remove('oculto');
  }
  function cerrarModal() { if (S.refs.modal) S.refs.modal.classList.add('oculto'); }

  function delegarCapas(ev) {
    var b2 = ev.target.closest ? ev.target.closest('[data-por-que]') : null;
    if (b2) { abrirCapa2(b2.getAttribute('data-por-que')); return; }
    var b3 = ev.target.closest ? ev.target.closest('[data-fuente]') : null;
    if (b3) { abrirCapa3(b3.getAttribute('data-fuente')); return; }
  }

  function abrirCapa2(clave) {
    if (clave === 'escenario' && S.escenario) {
      abrirModal('<h3 class="modal-tit">Por que ocurre</h3><p class="capa2">' + S.escenario.capa2 + '</p>' +
                 '<button class="btn-capa3 linea" data-fuente="escenario">Ver las fuentes</button>');
      avisarTutorial('capa2');
      return;
    }
    if (clave.indexOf('mod:') === 0) {
      var m = SIM.modulos.porId(clave.slice(4));
      if (!m) return;
      abrirModal('<h3 class="modal-tit">' + m.nombre + ' - por que</h3><p class="capa2">' + m.capa2 + '</p>' +
                 '<button class="btn-capa3 linea" data-fuente="' + clave + '">Ver las fuentes</button>');
      avisarTutorial('capa2');
      return;
    }
    if (clave.indexOf('var:') === 0) {
      var v = VARIABLES[clave.slice(4)];
      if (!v) return;
      abrirModal('<h3 class="modal-tit">' + v.et + '</h3><p class="capa2">' + v.porque + '</p>' +
                 '<button class="btn-capa3 linea" data-fuente="var:' + clave.slice(4) + '">Ver la fuente</button>');
      avisarTutorial('capa2');
      return;
    }
    if (clave.indexOf('alarma:') === 0) {
      var id = clave.slice(7);
      var defs = SIM.alarmas.definiciones(S.perfil);
      for (var i = 0; i < defs.length; i++) {
        if (defs[i].id === id) {
          abrirModal('<h3 class="modal-tit">' + defs[i].texto + '</h3><p class="capa2">' + defs[i].porque + '</p>' +
                     '<button class="btn-capa3 linea" data-fuente="alarma:' + id + '">Ver la fuente</button>');
          avisarTutorial('capa2');
          return;
        }
      }
    }
  }

  function abrirCapa3(clave) {
    if (clave === 'escenario' && S.escenario) {
      var c3 = S.escenario.capa3;
      abrirModal(
        '<h3 class="modal-tit">Fuentes</h3>' +
        '<p class="c3-resumen">' + c3.resumen + '</p>' +
        '<ul class="citas">' + c3.citas.map(function (x) {
          return '<li><span class="c3-t">' + x.t + '</span><code>' + x.c + '</code></li>';
        }).join('') + '</ul>' +
        '<h4 class="c3-sub">Diferencias entre maquinas</h4><p class="c3-p">' + c3.diferencias + '</p>' +
        '<h4 class="c3-sub">Lo que no consta en los manuales</h4><p class="c3-p marca-p">' + c3.noConsta + '</p>' +
        '<p class="c3-nota">Formato de cita: <code>M4 7-11 [141]</code> = manual M4, pagina impresa 7-11, ' +
          'pagina 141 del PDF.</p>'
      );
      avisarTutorial('capa3');
      return;
    }
    if (clave.indexOf('mod:') === 0) {
      var m = SIM.modulos.porId(clave.slice(4));
      if (!m) return;
      abrirModal('<h3 class="modal-tit">Fuentes - ' + m.nombre + '</h3>' +
        '<ul class="citas">' + m.citas.map(function (x) {
          return '<li><span class="c3-t">' + x.t + '</span><code>' + x.c + '</code></li>';
        }).join('') + '</ul>' +
        '<p class="c3-nota">Formato de cita: <code>M4 7-11 [141]</code> = manual M4, pagina impresa 7-11, ' +
          'pagina 141 del PDF.</p>');
      avisarTutorial('capa3');
      return;
    }
    if (clave.indexOf('var:') === 0) {
      var v = VARIABLES[clave.slice(4)];
      if (!v) return;
      abrirModal('<h3 class="modal-tit">Fuente - ' + v.et + '</h3><p class="c3-p">' + v.fuente + '</p>');
      avisarTutorial('capa3');
      return;
    }
    if (clave.indexOf('rangos:') === 0) {
      var mm = SIM.modulos.porId(clave.slice(7));
      if (!mm) return;
      var ef = (mm.efectos || []).map(function (x) { return '<li>' + x + '</li>'; }).join('');
      /* Solo los valores. Las citas quedan detras de un boton: en la capa 1
         estorban mas de lo que ayudan (regla de diseno de la seccion 5.3). */
      var rg = (mm.rangos || []).map(function (x) {
        return '<li><span class="rg-q">' + x.q + '</span><span class="rg-v">' + x.v + '</span></li>';
      }).join('');
      abrirModal(
        '<h3 class="modal-tit">' + mm.nombre + ' - valores de referencia</h3>' +
        (ef ? '<h4 class="c3-sub">Que cambia al moverlo</h4><ul class="lista-fallos">' + ef + '</ul>' : '') +
        (rg ? '<h4 class="c3-sub">Valores</h4><ul class="rangos">' + rg + '</ul>' : '') +
        '<button class="btn-capa3 linea" data-fuente="rangosfuente:' + clave.slice(7) +
          '">De donde sale cada valor</button>'
      );
      avisarTutorial('capa3');
      return;
    }
    if (clave.indexOf('rangosfuente:') === 0) {
      var mf = SIM.modulos.porId(clave.slice(13));
      if (!mf) return;
      abrirModal(
        '<h3 class="modal-tit">Fuentes - ' + mf.nombre + '</h3>' +
        '<ul class="citas">' + (mf.rangos || []).map(function (x) {
          return '<li><span class="c3-t">' + x.q + ' <span class="ev ev-' + x.ev + '">[' + x.ev +
                 ']</span></span><code>' + x.c + '</code></li>';
        }).join('') + '</ul>' +
        '<p class="c3-nota">[M] consta en un manual | [I] inferencia | [P] propuesta sin validar | ' +
          '[V] consta pero es ambiguo.</p>'
      );
      return;
    }
    if (clave.indexOf('cita:') === 0) {
      var cita = decodeURIComponent(clave.slice(5));
      abrirModal('<h3 class="modal-tit">Fuente</h3><p class="c3-p"><code>' + (cita || 'sin cita') + '</code></p>' +
                 '<p class="c3-nota">Formato: manual, pagina impresa y, entre corchetes, pagina del PDF.</p>');
      avisarTutorial('capa3');
      return;
    }
    if (clave.indexOf('alarma:') === 0) {
      var id = clave.slice(7);
      var defs = SIM.alarmas.definiciones(S.perfil);
      for (var i = 0; i < defs.length; i++) {
        if (defs[i].id === id) {
          var filas = (defs[i].fuente || []).map(function (ruta) {
            var ref = SIM.pref(ruta, S.perfil);
            if (!ref) return '';
            return '<li><span class="c3-t">' + ruta.split('.').pop() + ': <b>' + ref.valor +
                   (ref.unidad ? ' ' + ref.unidad : '') + '</b> <span class="ev ev-' + ref.ev + '">[' +
                   ref.ev + ']</span></span><code>' + ref.cita + '</code></li>';
          }).join('');
          abrirModal('<h3 class="modal-tit">Fuente - ' + defs[i].texto + '</h3><ul class="citas">' + filas + '</ul>');
          avisarTutorial('capa3');
          return;
        }
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Recorrido del gas (diagrama funcional)                            */
  /* ---------------------------------------------------------------- */
  /* El circuito de gases es una pantalla completa, no una ventana: con el
     diagrama pequeno no se distingue nada. Se superpone a lo que haya
     debajo y el bucle que este corriendo la va refrescando, asi que el
     gas se mueve de verdad tanto en el explorador como en un escenario. */
  function abrirRecorrido() {
    cerrarRecorrido();
    var pane = document.createElement('div');
    pane.className = 'pane-gases';
    pane.id = 'paneGases';
    pane.innerHTML =
      '<header class="pane-barra">' +
        '<div class="barra-tit">' +
          '<span class="barra-num">Circuito de gases</span>' +
          '<span class="barra-nom">Por donde pasa el gas, etapa por etapa</span>' +
        '</div>' +
        '<div class="barra-der">' +
          '<button class="btn-sec peq" id="btnTourGases">Recorrido guiado</button>' +
          '<button class="btn-sec peq" id="cerrarGases">Cerrar</button>' +
        '</div>' +
      '</header>' +
      '<div class="pane-cuerpo">' +
        '<div class="gas-lienzo" id="gasLienzo">' + SIM.esquema.markup() + '</div>' +
        '<aside class="gas-panel"><div id="gasPanel"></div><div id="gasBanco"></div></aside>' +
      '</div>';
    document.body.appendChild(pane);

    var svg = pane.querySelector('#svgGases');
    S._recorrido = { svg: svg, particulas: SIM.esquema.crearParticulas(svg), sel: null };
    SIM.esquema.preparar(svg, elegirBloqueGas, pasarBloqueGas);
    panelGasPorDefecto();
    montarBancoGases();

    pane.querySelector('#cerrarGases').addEventListener('click', cerrarRecorrido);
    pane.querySelector('#btnTourGases').addEventListener('click', function () {
      if (SIM.tutorial && SIM.tutorial.hay('recorrido')) SIM.tutorial.iniciar('recorrido');
    });
    pane.addEventListener('click', delegarCapas);
    document.addEventListener('keydown', escCierraGases);
  }

  function escCierraGases(ev) { if (ev.key === 'Escape') cerrarRecorrido(); }

  function cerrarRecorrido() {
    var pane = document.getElementById('paneGases');
    if (pane && pane.parentNode) pane.parentNode.removeChild(pane);
    document.removeEventListener('keydown', escCierraGases);
    if (SIM.tutorial && SIM.tutorial.activo() && SIM.tutorial.guionActual() === 'recorrido') {
      SIM.tutorial.terminar();
    }
    S._recorrido = null;
  }


  /* ------------------------------------------------------------------ */
  /* Banco de pruebas del circuito de gases                              */
  /* Los mismos mandos de la maquina, pero aqui el objetivo no es        */
  /* resolver una falla sino ver que le pasa al circuito cuando se toca  */
  /* cada cosa. Cada cambio escribe en el recuadro de abajo que puede    */
  /* pasar, que es la parte que convierte el juego en aprendizaje.       */
  /* ------------------------------------------------------------------ */
  function montarBancoGases() {
    var cont = document.getElementById('gasBanco');
    if (!cont || !S.estado) return;
    var est = S.estado, ags = SIM.pv('agentes', S.perfil);

    cont.innerHTML =
      '<div class="bloque-capa1 banco">' +
        '<div class="cab-bloque"><h3>Banco de pruebas</h3>' +
          '<button class="btn-sec peq" id="bgReset">Volver al estado normal</button></div>' +
        '<p class="banco-intro">Mueve lo que quieras y observa el circuito. Nada de lo que hagas aqui ' +
          'cuenta como acierto o error: es para ver como responde.</p>' +

        '<div class="ctrl"><label for="bgO2">O2 <b id="bgLO2">1,0</b> L/min</label>' +
          '<input id="bgO2" type="range" min="0" max="10" step="0.1"></div>' +
        '<div class="ctrl"><label for="bgAire">Aire <b id="bgLAire">1,0</b> L/min</label>' +
          '<input id="bgAire" type="range" min="0" max="10" step="0.1"></div>' +
        '<div class="ctrl"><label for="bgN2O">N2O <b id="bgLN2O">0,0</b> L/min</label>' +
          '<input id="bgN2O" type="range" min="0" max="10" step="0.1"></div>' +

        '<div class="ctrl"><label for="bgAgente">Agente anestesico</label>' +
          '<select id="bgAgente" class="bg-select">' +
            Object.keys(ags).map(function (k) {
              return '<option value="' + k + '">' + k.charAt(0).toUpperCase() + k.slice(1) + '</option>';
            }).join('') +
          '</select></div>' +
        '<div class="ctrl"><label for="bgDial">Dial del vaporizador <b id="bgLDial">2,0</b> % ' +
            '<span class="ctrl-nota" id="bgCam"></span></label>' +
          '<input id="bgDial" type="range" min="0" max="8" step="0.1"></div>' +

        '<div class="ctrl"><label for="bgApl">Valvula APL <b id="bgLApl">20</b> cmH2O ' +
            '<span class="ctrl-nota" id="bgNotaApl"></span></label>' +
          '<input id="bgApl" type="range" min="' + SIM.pv('apl.minima') + '" max="' + SIM.pv('apl.maxima') + '" step="1"></div>' +

        '<div class="ctrl-fila">' +
          '<button class="btn-flush" id="bgFlush">Purga de O2</button>' +
          '<button class="btn-sec peq" id="bgModo">Pasar a manual</button>' +
          '<button class="btn-sec peq" id="bgCal">Agotar la cal</button>' +
        '</div>' +
      '</div>' +
      '<div class="bloque-capa1 banco-aviso" id="bgAviso">' +
        '<div class="cab-bloque"><h3>Que puede pasar</h3></div>' +
        '<p class="sintoma" id="bgTexto">Mueve cualquier mando y aqui aparece que consecuencia tiene.</p>' +
      '</div>';

    function decir(txt, clase) {
      var t = document.getElementById('bgTexto'), c = document.getElementById('bgAviso');
      if (t) t.textContent = txt;
      if (c) c.className = 'bloque-capa1 banco-aviso ' + (clase || '');
    }
    function liga(id, lbl, aplica, explica) {
      var inp = document.getElementById(id);
      inp.addEventListener('input', function () {
        var v = parseFloat(inp.value);
        var l = document.getElementById(lbl);
        if (l) l.textContent = id === 'bgApl' ? n0(v) : n1(v);
        aplica(v);
        decir(explica(v), explica.clase || '');
        sincronizarBanco();
      });
    }

    liga('bgO2', 'bgLO2', function (v) { est.flujometros.o2 = v; }, function (v) {
      var tot = est.flujometros.o2 + est.flujometros.aire + est.flujometros.n2o;
      if (v === 0 && est.flujometros.n2o > 0)
        return 'Sin oxigeno y con N2O abierto la proteccion corta el N2O: la maquina no deja entregar una ' +
               'mezcla hipoxica. Mira como se detienen las bolitas del ramal de N2O.';
      if (v === 0)
        return 'Flujometro de O2 cerrado. Si queda aire abierto el paciente sigue recibiendo su 21 %, pero ' +
               'has dejado de aportar oxigeno: en un circuito cerrado el paciente consume unos 250 mL por ' +
               'minuto y la FiO2 ira cayendo. Con N2O abierto, la proteccion lo cortaria.';
      if (tot < 1)
        return 'Con menos de 1 L/min en total estas en flujo muy bajo: se reinhala casi todo, el absorbedor ' +
               'trabaja al maximo y cualquier fuga se nota mucho mas. Si la cal esta agotada, el CO2 ' +
               'inspirado sube enseguida.';
      return 'Mas oxigeno sube la FiO2 y la velocidad del flujo en todo el circuito. Tambien diluye lo que ' +
             'vuelve del paciente: con mas gas fresco se reinhala menos.';
    });
    liga('bgAire', 'bgLAire', function (v) { est.flujometros.aire = v; }, function () {
      return 'El aire aporta 21 % de oxigeno, asi que subirlo baja la FiO2 de la mezcla aunque suba el ' +
             'caudal total. Es la forma habitual de dar volumen sin dar oxigeno de mas.';
    });
    liga('bgN2O', 'bgLN2O', function (v) { est.flujometros.n2o = v; }, function (v) {
      if (v > 0 && est.flujometros.o2 <= 0.3)
        return 'Cuidado: con el O2 tan bajo esta mezcla seria hipoxica. El dispositivo de proteccion limita ' +
               'o corta el N2O, y por eso no veras pasar todo el que pides.';
      return 'El N2O desplaza al oxigeno en la mezcla: a mas N2O, menos FiO2. Mira el color del ramal y ' +
             'como cambia la proporcion en el colector.';
    });

    document.getElementById('bgAgente').addEventListener('change', function () {
      var k = this.value, a = ags[k];
      est.vaporizador.agente = k;
      var dial = document.getElementById('bgDial');
      dial.max = a.dialMax;
      if (est.vaporizador.dial > a.dialMax) { est.vaporizador.dial = a.dialMax; dial.value = a.dialMax; }
      var comun = k === 'sevoflurano' || k === 'isoflurano';
      decir(a.calentado
        ? 'El desflurano hierve casi a temperatura ambiente: su presion de vapor es de 669 mmHg, mas de ' +
          'cuatro veces la del sevoflurano. Un vaporizador de derivacion variable como el de esta maquina ' +
          'no puede dosificarlo, y entrega muchisimo mas de lo que marca el dial. Por eso el desflurano ' +
          'necesita un vaporizador calentado y presurizado, y por eso el sistema de llenado esta codificado ' +
          'por agente: para que este error sea fisicamente imposible.'
        : 'Cada agente tiene su color y su potencia. Con el dial en el mismo numero, la profundidad cambia: ' +
          'la CAM del ' + k + ' es ' + n1(a.cam) + ' %, asi que ' + n1(est.vaporizador.dial) + ' % son ' +
          n1(est.vaporizador.dial / a.cam) + ' CAM. El dial dice concentracion, no profundidad.' +
          (comun ? '' : ' Este agente ya casi no se usa en quirofano.'),
        a.calentado ? 'mal' : '');
      sincronizarBanco();
    });

    liga('bgDial', 'bgLDial', function (v) { est.vaporizador.dial = v; }, function (v) {
      var a = ags[est.vaporizador.agente];
      return 'Con el dial en ' + n1(v) + ' % entregas ' + n1(v / a.cam) + ' CAM de ' +
             est.vaporizador.agente + '. Por debajo de 0,7 CAM hay riesgo de despertar; muy por encima de ' +
             '1,3 CAM, de hipotension. El numero del dial no significa lo mismo en dos agentes distintos.';
    });

    liga('bgApl', 'bgLApl', function (v) { est.circuito.aplCmH2O = v; }, function (v) {
      if (est.circuito.modo !== 'manual')
        return 'La APL solo esta en el circuito en ventilacion manual. Ahora mismo el selector la deja ' +
               'fuera del paso, asi que moverla no cambia nada: pasa a manual para verla trabajar.';
      if (v <= SIM.pv('apl.umbralSello', S.perfil))
        return 'Abierta: el gas fresco se va a la evacuacion en lugar de llenar la bolsa, y al apretar, el ' +
               'gas sale por ahi en vez de entrar al paciente. Parece una fuga enorme y no hay ninguna. ' +
               'Asi tambien es imposible hacer la prueba de fuga del circuito.';
      if (v >= SIM.pv('apl.maxima', S.perfil) * 0.7)
        return 'Cerrada: no hay por donde soltar lo que entra. La presion se acumula respiracion tras ' +
               'respiracion, sube la linea de base y acaba saltando la alarma de presion alta. Si ademas ' +
               'pulsas la purga, el pico se dispara en segundos: es el mecanismo del barotrauma.';
      return 'En posicion de trabajo la APL fija el techo de presion del circuito: lo que pase de ' + n0(v) +
             ' cmH2O se va a la evacuacion. No es un interruptor, es un limite graduable.';
    });

    var bf = document.getElementById('bgFlush');
    function flush(on) {
      if (est.circuito.flushActivo === on) return;
      est.circuito.flushActivo = on;
      bf.classList.toggle('activo', on);
      if (on) decir('Purga pulsada: unos ' + SIM.pv('flush.caudal') + ' L/min de oxigeno puro entran por el ' +
        'ramal de arriba, que esquiva los flujometros y el vaporizador. Mira las bolitas de ese ramal. ' +
        'Rellena el circuito en segundos y sube la FiO2, pero al no pasar por el vaporizador diluye el ' +
        'agente casi a cero: un flush sostenido puede dejar al paciente superficial.', 'aviso');
      sincronizarBanco();
    }
    bf.addEventListener('mousedown', function () { flush(true); });
    bf.addEventListener('mouseup', function () { flush(false); });
    bf.addEventListener('mouseleave', function () { flush(false); });
    bf.addEventListener('touchstart', function (e) { e.preventDefault(); flush(true); });
    bf.addEventListener('touchend', function (e) { e.preventDefault(); flush(false); });

    document.getElementById('bgModo').addEventListener('click', function () {
      est.circuito.modo = est.circuito.modo === 'manual' ? 'mecanica' : 'manual';
      decir(est.circuito.modo === 'manual'
        ? 'En manual el gas va a la bolsa y la valvula APL entra en el circuito: a partir de ahora el ' +
          'techo de presion lo pones tu con ese mando. El fuelle queda en reposo.'
        : 'En mecanica el gas va al fuelle y el selector deja la APL fuera del paso. Por eso en ventilacion ' +
          'mecanica no importa donde este la APL, y por eso una APL mal puesta solo se descubre al pasar a ' +
          'manual.');
      sincronizarBanco();
    });

    document.getElementById('bgCal').addEventListener('click', function () {
      var gastada = est.circuito.absorbedorAvance > 1;
      est.circuito.absorbedorAvance = gastada ? 0.05 : 1.05;
      est.circuito.colorEnganoso = false;
      est.circuito.colorVirado = gastada ? 0.045 : 0.95;
      decir(gastada
        ? 'Cal nueva: vuelve a retener el CO2, el color vuelve a blanco y el CO2 inspirado cae a cero. ' +
          'Fijate en que el canister se calienta cuando la cal trabaja, porque la reaccion desprende calor.'
        : 'Cal agotada: el CO2 que vuelve del paciente ya no se retiene y se reinhala. Sube el CO2 ' +
          'inspirado y con el el EtCO2. Cuanto mas bajo sea el gas fresco, peor, porque menos se diluye lo ' +
          'que vuelve. Prueba a subir el O2 y mira como baja.', gastada ? '' : 'aviso');
      sincronizarBanco();
    });

    document.getElementById('bgReset').addEventListener('click', function () {
      est.flujometros.o2 = 1.0; est.flujometros.aire = 1.0; est.flujometros.n2o = 0;
      est.vaporizador.agente = 'sevoflurano'; est.vaporizador.dial = 2.0;
      est.circuito.aplCmH2O = SIM.pv('apl.nominal'); est.circuito.modo = 'mecanica';
      est.circuito.flushActivo = false;
      est.circuito.absorbedorAvance = 0.05; est.circuito.colorVirado = 0.045;
      est.circuito.colorEnganoso = false; est.circuito.valvulaIncompetente = false;
      decir('Todo vuelve al estado normal de trabajo.');
      sincronizarBanco();
    });

    sincronizarBanco();
  }

  /* Deja los mandos del banco en el estado real de la maquina */
  function sincronizarBanco() {
    var est = S.estado, ags = SIM.pv('agentes', S.perfil);
    if (!est || !document.getElementById('gasBanco')) return;
    function pon(id, lbl, v, dec) {
      var i = document.getElementById(id), l = document.getElementById(lbl);
      if (i && Math.abs(parseFloat(i.value) - v) > 0.01) i.value = v;
      if (l) l.textContent = dec === 0 ? n0(v) : n1(v);
    }
    pon('bgO2', 'bgLO2', est.flujometros.o2);
    pon('bgAire', 'bgLAire', est.flujometros.aire);
    pon('bgN2O', 'bgLN2O', est.flujometros.n2o);
    pon('bgDial', 'bgLDial', est.vaporizador.dial);
    pon('bgApl', 'bgLApl', est.circuito.aplCmH2O, 0);

    var sa = document.getElementById('bgAgente');
    if (sa && sa.value !== est.vaporizador.agente) sa.value = est.vaporizador.agente;
    var a = ags[est.vaporizador.agente] || ags.sevoflurano;
    var cam = document.getElementById('bgCam');
    if (cam) cam.textContent = '— ' + n1(est.vaporizador.dial / a.cam) + ' CAM de ' + est.vaporizador.agente +
      (a.calentado ? ', vaporizador incompatible' : '');
    var na = document.getElementById('bgNotaApl');
    if (na) na.textContent = est.circuito.modo !== 'manual' ? '— fuera del circuito'
      : (est.circuito.aplCmH2O <= SIM.pv('apl.umbralSello', S.perfil) ? '— abierta'
      : (est.circuito.aplCmH2O >= SIM.pv('apl.maxima', S.perfil) * 0.7 ? '— cerrada' : ''));
    var bm = document.getElementById('bgModo');
    if (bm) bm.textContent = est.circuito.modo === 'manual' ? 'Volver a mecanica' : 'Pasar a manual';
    var bc = document.getElementById('bgCal');
    if (bc) bc.textContent = est.circuito.absorbedorAvance > 1 ? 'Poner cal nueva' : 'Agotar la cal';
  }

  function panelGasPorDefecto() {
    var p = document.getElementById('gasPanel');
    if (!p) return;
    p.innerHTML =
      '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>Como se lee</h3></div>' +
        '<p class="sintoma">Cada bloque es una etapa y cada linea es una tuberia real. El recorrido ' +
          'va siempre en horizontal o en vertical, como las tuberias de la maquina. Los puntos gruesos ' +
          'son uniones donde dos caminos se juntan de verdad.</p>' +
        '<p class="sintoma">Las bolitas en movimiento son el flujo. Si se detienen, por ahi no pasa gas. ' +
          'Van mas rapido cuanto mayor es el caudal.</p>' +
      '</div>' +
      '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>Colores</h3></div>' +
        '<ul class="leyenda">' +
          '<li><i style="background:' + SIM.esquema.COLORES.o2 + '"></i>Oxigeno</li>' +
          '<li><i style="background:' + SIM.esquema.COLORES.aire + '"></i>Aire</li>' +
          '<li><i style="background:' + SIM.esquema.COLORES.n2o + '"></i>Oxido nitroso</li>' +
          '<li><i style="background:' + SIM.esquema.COLORES.mezcla + '"></i>Mezcla fresca</li>' +
          '<li><i style="background:' + SIM.esquema.COLORES.agente + '"></i>Mezcla con agente</li>' +
          '<li><i style="background:' + SIM.esquema.COLORES.espirado + '"></i>Gas espirado</li>' +
          '<li><i style="background:' + SIM.esquema.COLORES.residual + '"></i>Gas evacuado</li>' +
        '</ul>' +
      '</div>' +
      '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>Prueba a mirar</h3></div>' +
        '<ul class="lista-fallos">' +
          '<li>Cierra el N2O: su rama se apaga y el resto sigue.</li>' +
          '<li>Abre el cilindro de O2: el flujo cambia de rama antes de la proteccion.</li>' +
          '<li>Con una fuga, el tramo inspiratorio y el espiratorio se marcan en rojo.</li>' +
          '<li>En ventilacion mecanica el gas va al fuelle; en manual, a la bolsa.</li>' +
        '</ul>' +
      '</div>' +
      '<p class="gas-pie">Pulsa cualquier bloque del diagrama para saber que hace.</p>';
  }

  function pasarBloqueGas(id, b) {
    var e = document.getElementById('gasPie');
    if (e) e.textContent = b ? b.t : '';
  }

  function elegirBloqueGas(id, b) {
    if (!S._recorrido) return;
    S._recorrido.sel = id;
    SIM.esquema.marcar(S._recorrido.svg, id);
    var m = SIM.modulos.porId(b.mod);
    var p = document.getElementById('gasPanel');
    if (!p || !m) return;
    p.innerHTML =
      '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>' + b.t + '</h3></div>' +
        '<p class="sintoma">' + m.queEs + '</p>' +
        '<p class="sintoma">' + m.queHace + '</p>' +
        '<div class="acciones-capa">' +
          '<button class="btn-capa2" data-por-que="mod:' + b.mod + '">Por que</button>' +
          '<button class="btn-capa3" data-fuente="mod:' + b.mod + '">Fuente</button>' +
        '</div>' +
      '</div>' +
      '<div class="bloque-capa1">' +
        '<div class="cab-bloque"><h3>En que se nota cuando falla</h3></div>' +
        '<ul class="lista-fallos">' +
          m.fallos.map(function (f) { return '<li>' + f + '</li>'; }).join('') +
        '</ul>' +
      '</div>' +
      '<button class="btn-sec peq" id="gasVolver">Volver a la leyenda</button>';
    var b2 = document.getElementById('gasVolver');
    if (b2) b2.addEventListener('click', function () {
      SIM.esquema.marcar(S._recorrido.svg, null);
      S._recorrido.sel = null;
      panelGasPorDefecto();
    });
  }

  function refrescarRecorrido(est, calc, perfil, dt) {
    if (!S._recorrido) return;
    if (!document.body.contains(S._recorrido.svg)) { S._recorrido = null; return; }
    SIM.esquema.actualizar(S._recorrido.svg, est, calc, perfil);
    SIM.esquema.actualizarParticulas(S._recorrido.particulas, calc, dt);
  }

  /* ---------------------------------------------------------------- */
  /* Prueba de fugas                                                   */
  /* ---------------------------------------------------------------- */
  function abrirPrueba(tipo) {
    if (tipo === 'muestreo') { abrirPruebaMuestreo(); return; }
    if (tipo === 'fugaDial') { abrirPruebaFugaDial(); return; }
    if (tipo === 'contrapresion') { abrirPruebaContrapresion(); return; }
    if (tipo !== 'fuga') return;
    var p = S.perfil;
    abrirModal(
      '<h3 class="modal-tit">Prueba de fugas del circuito</h3>' +
      '<p class="capa2">El circuito se cierra y se presuriza a ' + SIM.pv('pruebas.presionPruebaFuga', p) +
        ' cmH2O. Luego se mide el flujo de O2 necesario para mantener esa presion: ese flujo es la fuga. ' +
        'La valvula APL tiene que estar cerrada: con ella abierta el gas se va a la evacuacion y el ' +
        'circuito no llega nunca a la presion de prueba.</p>' +
      '<p class="prueba-aviso" id="avisoApl"></p>' +
      '<div class="prueba">' +
        '<div class="manometro-grande"><span id="pPresion">0</span><small>cmH2O</small></div>' +
        '<div class="prueba-datos">' +
          '<div><span>Flujo para sostener</span><b id="pFlujo">--</b></div>' +
          '<div><span>Limite del perfil</span><b>' + SIM.pv('pruebas.fugaAceptable', p) + ' mL/min</b></div>' +
        '</div>' +
      '</div>' +
      '<div id="pResultado" class="prueba-res"></div>' +
      '<button class="btn-pri" id="btnCorrer">Presurizar y medir</button>' +
      '<button class="btn-capa3 linea" data-fuente="cita:' +
        encodeURIComponent('M2 p.88 [96]; M3 B-5 [227]; M12 p.1-2; compliancia 1-10 mL/cmH2O en M2 p.169 [177]') +
        '">Fuente</button>'
    );
    var av = document.getElementById('avisoApl');
    if (av && S.estado.circuito.aplCmH2O < SIM.pv('apl.cierreFuga', p)) {
      av.className = 'prueba-aviso mal';
      av.textContent = 'Antes de medir: la valvula APL esta en ' +
        Math.round(S.estado.circuito.aplCmH2O) + ' cmH2O. Para presurizar el circuito tiene que estar cerrada.';
    }
    var b = document.getElementById('btnCorrer');
    if (b) b.addEventListener('click', correrPruebaFuga);
    if (SIM.tutorial) SIM.tutorial.reaplicarFoco();
  }

  /* Prueba que separa trampa de linea (M3 8-6 [114]): se desconecta la
     linea de la trampa y se mira si sigue apareciendo el mensaje de via
     aerea ocluida. Si sigue, lo tapado es la trampa; si no, la linea. */
  function abrirPruebaMuestreo() {
    abrirModal(
      '<h3 class="modal-tit">Separar la trampa de la linea</h3>' +
      '<p class="capa2">La maquina solo sabe que la bomba no mueve gas, pero no donde esta el tapon. ' +
      'La prueba de M3 lo separa en un gesto: desconecta la linea de muestreo de la trampa de agua y ' +
      'observa el mensaje. Si el aviso de via aerea ocluida sigue apareciendo, lo que esta tapado es la ' +
      'trampa. Si desaparece, lo que esta tapado es la linea.</p>' +
      '<div class="prueba">' +
        '<div class="manometro-grande"><span id="mFlujo">--</span><small>mL/min</small></div>' +
        '<div class="prueba-datos">' +
          '<div><span>Con la linea conectada</span><b id="mAntes">--</b></div>' +
          '<div><span>Con la linea desconectada</span><b id="mDespues">--</b></div>' +
        '</div>' +
      '</div>' +
      '<div id="mResultado" class="prueba-res"></div>' +
      '<button class="btn-pri" id="btnMuestreo">Desconectar y observar</button>' +
      '<button class="btn-capa3 linea" data-fuente="cita:' +
        encodeURIComponent('M3 8-6 [114]; M3 9-7 [131]; M3 D-9 [259]; M4 7-12 [142]') + '">Fuente</button>'
    );
    var b = document.getElementById('btnMuestreo');
    if (b) b.addEventListener('click', correrPruebaMuestreo);
    if (SIM.tutorial) SIM.tutorial.reaplicarFoco();
  }


  /* Prueba de fuga repetida con el dial cerrado y con el dial abierto. Un
     vaporizador mal bloqueado solo fuga cuando el dial esta abierto, asi que
     con todos los vaporizadores cerrados la fuga no se ve. Por eso el
     chequeo previo al uso se repite con cada vaporizador encendido
     (M1 3-5, 3-6 [41-42]; M3 6-8 [90]). */
  function abrirPruebaFugaDial() {
    var p = S.perfil;
    abrirModal(
      '<h3 class="modal-tit">Fuga con el dial cerrado y con el dial abierto</h3>' +
      '<p class="capa2">La misma prueba de fuga, dos veces. Con el dial en cero el gas no entra en el ' +
      'vaporizador: sus valvulas de puerto cierran el paso. Al abrir el dial se abre ese camino, y con el ' +
      'camino se abre cualquier fuga que haya en el vaporizador o en su colector. La diferencia entre las ' +
      'dos medidas senala al vaporizador sin necesidad de desmontar nada.</p>' +
      '<div class="prueba">' +
        '<div class="manometro-grande"><span id="fdValor">--</span><small>mL/min</small></div>' +
        '<div class="prueba-datos">' +
          '<div><span>Dial cerrado</span><b id="fdCerrado">--</b></div>' +
          '<div><span>Dial abierto</span><b id="fdAbierto">--</b></div>' +
          '<div><span>Limite del perfil</span><b>' + SIM.pv('pruebas.fugaAceptable', p) + ' mL/min</b></div>' +
        '</div>' +
      '</div>' +
      '<div id="fdResultado" class="prueba-res"></div>' +
      '<button class="btn-pri" id="btnFugaDial">Medir en las dos posiciones</button>' +
      '<button class="btn-capa3 linea" data-fuente="cita:' +
        encodeURIComponent('M1 3-5, 3-6 [41-42]; M3 6-8 [90]; M12 p.1-2; limite de fuga M2 p.88 [96]') +
        '">Fuente</button>'
    );
    var b = document.getElementById('btnFugaDial');
    if (b) b.addEventListener('click', correrPruebaFugaDial);
    if (SIM.tutorial) SIM.tutorial.reaplicarFoco();
  }

  function correrPruebaFugaDial() {
    var p = S.perfil, M = SIM.modelo, est = S.estado;
    var objetivo = SIM.pv('pruebas.presionPruebaFuga', p);
    var limite = SIM.pv('pruebas.fugaAceptable', p);
    var fugaVap = est.vaporizador.bloqueado ? 0 : SIM.pv('vaporizador.fugaColectorQ30', p);
    var conCerrado = Math.round(M.flujoFuga(est.circuito.fugaQ30, objetivo));
    var conAbierto = Math.round(M.flujoFuga(est.circuito.fugaQ30 + fugaVap, objetivo));

    var elV = $('#fdValor'), elC = $('#fdCerrado'), elA = $('#fdAbierto'), elR = $('#fdResultado');
    var btn = $('#btnFugaDial');
    if (btn) { btn.disabled = true; btn.textContent = 'Midiendo...'; }
    if (elC) elC.textContent = 'midiendo...';

    setTimeout(function () {
      if (elC) elC.textContent = conCerrado + ' mL/min';
      if (elV) elV.textContent = conCerrado;
      if (elA) elA.textContent = 'midiendo...';
      setTimeout(function () {
        if (elA) elA.textContent = conAbierto + ' mL/min';
        if (elV) elV.textContent = conAbierto;
        var salta = conAbierto - conCerrado;
        if (elR) {
          if (salta > limite) {
            elR.className = 'prueba-res mal';
            elR.innerHTML = '<b>La fuga aparece al abrir el dial.</b> Con el dial cerrado el circuito ' +
              'aguanta (' + conCerrado + ' mL/min, dentro del limite de ' + limite + '); al abrirlo la fuga ' +
              'sube a ' + conAbierto + ' mL/min. Esos ' + salta + ' mL/min de diferencia solo pueden salir ' +
              'del vaporizador o de su colector, porque es el unico camino que se abre al girar el dial.';
          } else {
            elR.className = 'prueba-res bien';
            elR.innerHTML = '<b>Sin diferencia significativa.</b> ' + conCerrado + ' mL/min con el dial ' +
              'cerrado y ' + conAbierto + ' con el dial abierto: el vaporizador y su colector sellan bien. ' +
              'La causa de la discrepancia del agente esta en otro sitio.';
          }
        }
        anotar('Prueba de fuga con el dial: ' + conCerrado + ' cerrado / ' + conAbierto + ' abierto mL/min',
               salta > limite ? 'bien' : 'neutro');
        if (btn) { btn.disabled = false; btn.textContent = 'Repetir la prueba'; }
        avisarTutorial('prueba:fugaDial');
      }, 1400);
    }, 1400);
  }

  /* Prueba de contrapresion del chequeo previo al uso: con 6 L/min fijados se
     abre el dial y se mira cuanto cae el flotador. M1 3-5 [41] no admite una
     caida mayor de 1 L/min. */
  function abrirPruebaContrapresion() {
    var p = S.perfil;
    var flujoPrueba = SIM.pv('vaporizador.pruebaContrapresionFlujo', p);
    var caidaMax = SIM.pv('vaporizador.caidaMaximaContrapresion', p);
    abrirModal(
      '<h3 class="modal-tit">Prueba de contrapresion del vaporizador</h3>' +
      '<p class="capa2">Se fijan ' + flujoPrueba + ' L/min en el flujometro de O2, se abre el dial del ' +
      'vaporizador y se mira el flotador. Si dentro del vaporizador o en su salida hay una resistencia, el ' +
      'gas no pasa igual y el caudal cae. El manual no admite una caida mayor de ' + caidaMax + ' L/min.</p>' +
      '<div class="prueba">' +
        '<div class="manometro-grande"><span id="cpValor">--</span><small>L/min</small></div>' +
        '<div class="prueba-datos">' +
          '<div><span>Dial cerrado</span><b id="cpCerrado">--</b></div>' +
          '<div><span>Dial abierto</span><b id="cpAbierto">--</b></div>' +
          '<div><span>Caida maxima</span><b>' + caidaMax + ' L/min</b></div>' +
        '</div>' +
      '</div>' +
      '<div id="cpResultado" class="prueba-res"></div>' +
      '<button class="btn-pri" id="btnContrapresion">Fijar ' + flujoPrueba + ' L/min y abrir el dial</button>' +
      '<button class="btn-capa3 linea" data-fuente="cita:' +
        encodeURIComponent('M1 3-5, 3-6 [41-42]; M3 6-8 [90]; contrapresion maxima 150 mbar M11 3.5 [PDF 18]') +
        '">Fuente</button>'
    );
    var b = document.getElementById('btnContrapresion');
    if (b) b.addEventListener('click', correrPruebaContrapresion);
    if (SIM.tutorial) SIM.tutorial.reaplicarFoco();
  }

  function correrPruebaContrapresion() {
    var p = S.perfil, est = S.estado;
    var flujoPrueba = SIM.pv('vaporizador.pruebaContrapresionFlujo', p);
    var caidaMax = SIM.pv('vaporizador.caidaMaximaContrapresion', p);
    var caida = est.vaporizador.restriccionSalida
      ? Math.min(flujoPrueba, SIM.pv('vaporizador.caidaRestriccionSalida', p)) : 0;
    var abierto = flujoPrueba - caida;

    var elV = $('#cpValor'), elC = $('#cpCerrado'), elA = $('#cpAbierto'), elR = $('#cpResultado');
    var btn = $('#btnContrapresion');
    if (btn) { btn.disabled = true; btn.textContent = 'Midiendo...'; }
    if (elC) elC.textContent = n1(flujoPrueba) + ' L/min';
    if (elV) elV.textContent = n1(flujoPrueba);

    var t = 0;
    var timer = setInterval(function () {
      t += 0.1;
      var actual = flujoPrueba - caida * Math.min(1, t / 1.2);
      if (elV) elV.textContent = n1(actual);
      if (elA) elA.textContent = n1(actual) + ' L/min';
      if (t >= 1.6) {
        clearInterval(timer);
        var pasa = caida <= caidaMax;
        if (elR) {
          elR.className = 'prueba-res ' + (pasa ? 'bien' : 'mal');
          elR.innerHTML = pasa
            ? '<b>Prueba aprobada.</b> El caudal cae ' + n1(caida) + ' L/min al abrir el dial, dentro del ' +
              'limite de ' + caidaMax + ' L/min. La salida del vaporizador esta libre: la causa es otra.'
            : '<b>Prueba no aprobada.</b> El caudal cae ' + n1(caida) + ' L/min al abrir el dial, muy por ' +
              'encima del limite de ' + caidaMax + ' L/min. Hay una resistencia dentro del vaporizador o en ' +
              'su salida, y eso explica que al circuito le llegue menos gas del que marcaste. No se repara ' +
              'en quirofano: el vaporizador se retira de servicio.';
        }
        anotar('Prueba de contrapresion: caida de ' + n1(caida) + ' L/min (' +
               (pasa ? 'aprobada' : 'no aprobada') + ')', pasa ? 'neutro' : 'bien');
        if (btn) { btn.disabled = false; btn.textContent = 'Repetir la prueba'; }
        avisarTutorial('prueba:contrapresion');
      }
    }, 100);
  }

  function correrPruebaMuestreo() {
    var est = S.estado;
    var nominal = SIM.pv('monitoreo.flujoMuestraNominal', S.perfil);
    var umbral = SIM.pv('monitoreo.flujoViaAereaOcluida', S.perfil);
    var trampaTapada = est.monitoreo.trampaAgua === 'llena';
    var lineaTapada = est.monitoreo.lineaMuestreoOcluida;
    var moduloCaido = est.monitoreo.moduloGases !== 'ok';

    /* Sin la linea, la bomba aspira solo a traves de la trampa. */
    var antes = moduloCaido ? 0 : (trampaTapada || lineaTapada ? 8 : nominal);
    var despues = moduloCaido ? 0 : (trampaTapada ? 9 : nominal);

    var elF = $('#mFlujo'), elA = $('#mAntes'), elD = $('#mDespues'), elR = $('#mResultado');
    var btn = $('#btnMuestreo');
    if (btn) { btn.disabled = true; btn.textContent = 'Observando...'; }
    if (elA) elA.textContent = antes + ' mL/min';

    var t = 0, v = antes;
    var timer = setInterval(function () {
      t += 0.1;
      v = v + (despues - v) * 0.22;
      if (elF) elF.textContent = Math.round(v);
      if (t > 2.4) {
        clearInterval(timer);
        if (elD) elD.textContent = despues + ' mL/min';
        var sigue = despues < umbral;
        if (elR) {
          elR.className = 'prueba-res ' + (sigue || lineaTapada ? 'mal' : 'bien');
          if (moduloCaido) {
            elR.className = 'prueba-res mal';
            elR.innerHTML = '<b>La bomba no responde.</b> No mueve gas ni con la linea puesta ni sin ella: ' +
              'cero en los dos casos. Eso no es un tapon, porque un tapon deja pasar algo o cambia al quitar ' +
              'la linea. El que no arranca es el modulo.';
          } else if (sigue) {
            elR.innerHTML = '<b>El aviso sigue apareciendo.</b> Sin la linea conectada la bomba tampoco ' +
              'consigue aspirar, asi que el tapon esta en la <b>trampa de agua</b>. Hay que vaciarla o ' +
              'cambiarla.';
          } else if (lineaTapada) {
            elR.innerHTML = '<b>El aviso desaparece.</b> Sin la linea la bomba vuelve a mover gas, asi que ' +
              'la trampa esta bien y el tapon esta en la <b>linea de muestreo</b>. Hay que cambiarla.';
          } else {
            elR.innerHTML = '<b>No hay oclusion.</b> La bomba mueve el caudal nominal con la linea puesta y ' +
              'sin ella. Si las lecturas siguen mal, el problema no es un tapon.';
          }
        }
        anotar('Prueba de la linea de muestreo: ' + (moduloCaido ? 'la bomba no responde, no hay tapon'
               : (sigue ? 'la trampa esta ocluida'
               : (lineaTapada ? 'la linea esta ocluida' : 'sin oclusion'))),
               (moduloCaido || sigue || lineaTapada) ? 'bien' : 'neutro');
        if (btn) { btn.disabled = false; btn.textContent = 'Repetir la prueba'; }
        avisarTutorial('prueba:muestreo');
      }
    }, 100);
  }

  function correrPruebaFuga() {
    var p = S.perfil, M = SIM.modelo;
    var objetivo = SIM.pv('pruebas.presionPruebaFuga', p);
    var limite = SIM.pv('pruebas.fugaAceptable', p);
    var compliancia = 4;              /* [P] dentro del rango 1-10 mL/cmH2O de M2 */
    var FLUJO_MAX = 10000;            /* [P] mL/min disponibles para la prueba */

    /* La prueba exige cerrar la valvula APL: con la APL abierta el gas
       se va a la evacuacion y el circuito no llega a los 30 cmH2O, por
       mucho que este estanco. Es la causa numero uno de pruebas de fuga
       fallidas que no son fugas. */
    var aplAbierta = S.estado.circuito.aplCmH2O < SIM.pv('apl.cierreFuga', p);
    var q30 = S.estado.circuito.fugaQ30 + (aplAbierta ? 25000 : 0);

    var presion = 0, aporte = 0, t = 0;
    var elP = $('#pPresion'), elF = $('#pFlujo'), elR = $('#pResultado');
    var btn = $('#btnCorrer');
    if (btn) { btn.disabled = true; btn.textContent = 'Midiendo...'; }

    var timer = setInterval(function () {
      t += 0.1;
      aporte = presion < objetivo - 0.2 ? FLUJO_MAX : Math.min(FLUJO_MAX, M.flujoFuga(q30, objetivo));
      presion = M.pasoPruebaFuga(presion, q30, aporte, compliancia, 0.1);
      if (presion > objetivo) presion = objetivo;

      if (elP) elP.textContent = presion.toFixed(1).replace('.', ',');
      if (elF) elF.textContent = presion >= objetivo - 0.3 ? Math.round(aporte) + ' mL/min' : '--';

      if (t > 3.2) {
        clearInterval(timer);
        var medida = Math.round(M.flujoFuga(q30, objetivo));
        var alcanza = presion >= objetivo - 0.5;
        var aprueba = alcanza && medida <= limite;
        if (elR) {
          elR.className = 'prueba-res ' + (aprueba ? 'bien' : 'mal');
          if (!alcanza && aplAbierta) {
            elR.innerHTML = '<b>No se alcanza la presion de prueba, y esta vez no es el circuito.</b> La ' +
              'valvula APL esta en ' + Math.round(S.estado.circuito.aplCmH2O) + ' cmH2O: con ella abierta el ' +
              'gas sale a la evacuacion y el circuito nunca llega a ' + objetivo + ' cmH2O, aunque este ' +
              'perfectamente estanco. Cierra la APL y repite la prueba. Mientras no lo hagas, el resultado ' +
              'no significa nada.';
          } else if (!alcanza) {
            elR.innerHTML = '<b>No se alcanza la presion de prueba.</b> El circuito no sostiene ' + objetivo +
              ' cmH2O ni con ' + (FLUJO_MAX / 1000) + ' L/min. Es una fuga gruesa: busca una desconexion o un ' +
              'sello completamente fuera de sitio antes de volver a probar.';
          } else {
            elR.innerHTML = aprueba
              ? '<b>Prueba aprobada.</b> Fuga medida ' + medida + ' mL/min, por debajo del limite de ' +
                limite + ' mL/min del perfil.'
              : '<b>Prueba no aprobada.</b> Fuga medida ' + medida + ' mL/min, muy por encima del limite de ' +
                limite + ' mL/min. Hay que localizar el componente antes de repetirla.';
          }
        }
        anotar('Prueba de fugas: ' + (alcanza ? medida + ' mL/min'
                 : (aplAbierta ? 'no sostiene la presion, la APL esta abierta' : 'no sostiene la presion')) +
               ' (' + (aprueba ? 'aprobada' : 'no aprobada') + ')', aprueba ? 'bien' : 'mal');
        if (btn) { btn.disabled = false; btn.textContent = 'Repetir la prueba'; }
        avisarTutorial('prueba:corrida');
      }
    }, 100);
  }

  /* ---------------------------------------------------------------- */
  /* Perfil y supuestos (modal global)                                 */
  /* ---------------------------------------------------------------- */
  function mostrarPerfil() {
    var p = SIM.PERFIL_BASE, filas = '';
    Object.keys(p).forEach(function (grupo) {
      var g = p[grupo];
      if (typeof g !== 'object' || g === null || grupo === 'alarmas') return;
      var sub = Object.keys(g).filter(function (k) { return g[k] && g[k].valor !== undefined; });
      if (!sub.length) return;
      filas += '<tr class="grupo"><td colspan="4">' + grupo + '</td></tr>';
      sub.forEach(function (k) {
        var r = g[k];
        filas += '<tr><td>' + k + '</td><td class="v">' +
                 (Array.isArray(r.valor) ? r.valor.join(' a ') : r.valor) + ' ' + (r.unidad || '') +
                 '</td><td><span class="ev ev-' + r.ev + '">[' + r.ev + ']</span></td>' +
                 '<td><code>' + r.cita + '</code></td></tr>';
      });
    });
    abrirModalSuelto(
      '<h3 class="modal-tit">Perfil base v1</h3>' +
      '<p class="c3-p">' + p.nota + ' Los umbrales no son constantes universales: cambian entre maquinas y ' +
        'aqui son parametros editables del perfil.</p>' +
      '<div class="tabla-env"><table class="tabla-perfil"><thead><tr><th>Parametro</th><th>Valor</th>' +
      '<th>Ev.</th><th>Cita</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
      '<p class="c3-nota">[M] consta en un manual | [I] inferencia | [P] propuesta sin validar | ' +
        '[V] consta pero es ambiguo</p>'
    );
  }

  function mostrarSupuestos() {
    abrirModalSuelto(
      '<h3 class="modal-tit">Supuestos de diseno [P]</h3>' +
      '<p class="c3-p">Estos valores y formas no constan en los manuales. Hay que validarlos con el director ' +
        'antes de presentarlos como dato.</p>' +
      '<ol class="lista-sup">' +
        '<li><b>Modelo de la fuga.</b> Q_fuga(P) = Q30 x (P/30)^n con n = 0,65; el exponente teorico esta entre ' +
          '0,5 y 1. Compliancia de la prueba 4 mL/cmH2O, dentro del rango 1-10 de M2 p.169 [177].</li>' +
        '<li><b>Caida de la presion pico con la fuga.</b> La determina el volumen que se queda en el sistema. ' +
          'La funcion exacta no consta.</li>' +
        '<li><b>Llenado del fuelle.</b> Balance de volumen del circuito; capacidad 1200 mL y constante de 4 s.</li>' +
        '<li><b>Tamano de la fuga del escenario 1:</b> 6000 mL/min a 30 cmH2O con gas fresco de 2 L/min.</li>' +
        '<li><b>El EtCO2 baja ante una fuga</b> por dilucion y perdida de muestra, segun la tabla de la ' +
          'seccion 6, en lugar de subir por hipoventilacion. El proyecto excluye la fisiologia completa.</li>' +
        '<li><b>Espacio muerto Vd/Vt = 0,33</b> para convertir ventilacion minuto en alveolar.</li>' +
        '<li><b>Compliancia pulmonar de 25 mL/cmH2O</b> para estimar la presion pico.</li>' +
        '<li><b>Curva de agotamiento del absorbente:</b> sigmoidea con inflexion al 85 % del avance. ' +
          'La Fig. 4 de M9 es ilustrativa y no esta basada en datos.</li>' +
        '<li><b>Prioridades elegidas entre fuentes que discrepan:</b> FiO2 baja (alta; M6 la pone baja), ' +
          'linea ocluida (media) y presion baja de via aerea (alta; M4 la pone media).</li>' +
        '<li><b>Limite bajo de presion Pmin = 8 cmH2O.</b> M4 7-11 usa Ppico &lt; Pmin+4 pero Pmin es ajustable.</li>' +
        '<li><b>Tecnologia del vaporizador:</b> mecanico de insercion, la de M1, M3 y M4.</li>' +
        '<li><b>Ventilacion manual:</b> se supone 400 mL a la misma frecuencia.</li>' +
        '<li><b>Puntaje y orden recomendado de las acciones.</b></li>' +
      '</ol>' +
      '<p class="c3-nota">La lista completa, con su justificacion, esta en el archivo SUPUESTOS.md.</p>'
    );
  }

  function abrirModalSuelto(html) {
    var m = document.getElementById('modalGlobal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'modalGlobal';
      m.className = 'modal';
      m.innerHTML = '<div class="modal-caja ancho"><button class="cerrar" aria-label="Cerrar">&times;</button>' +
                    '<div class="cuerpo"></div></div>';
      document.body.appendChild(m);
      m.querySelector('.cerrar').addEventListener('click', function () { m.classList.add('oculto'); });
      m.addEventListener('click', function (ev) { if (ev.target === m) m.classList.add('oculto'); });
      m.addEventListener('click', delegarCapas);
    }
    m.querySelector('.cuerpo').innerHTML = html;
    m.classList.remove('oculto');
  }

  /* ---------------------------------------------------------------- */
  /* Refresco por fotograma                                            */
  /* ---------------------------------------------------------------- */
  function refrescar(calc, alarmas, dt) {
    var esc = S.escenario;
    if (!esc || !S.refs.banda) return;

    /* --- Alarmas: maximo 6 en capa 1 --- */
    var html = alarmas.capa1.map(function (a) {
      return '<button class="alarma pri-' + a.prioridad + '" data-por-que="alarma:' + a.id + '">' +
               '<span class="pri">' + a.prioridad + '</span><span class="txt">' + a.texto + '</span>' +
             '</button>';
    }).join('');
    if (!alarmas.capa1.length) html = '<div class="sin-alarmas">Sin alarmas activas</div>';
    if (alarmas.ocultas > 0) html += '<span class="ocultas">+' + alarmas.ocultas + ' mas</span>';
    if (S.tSim < S.audioPausadoHasta) {
      html += '<span class="audio-pausado">audio en pausa ' + Math.ceil(S.audioPausadoHasta - S.tSim) + ' s</span>';
    }
    if (S.refs.banda.innerHTML !== html) {
      S.refs.banda.innerHTML = html;
      if (SIM.tutorial) SIM.tutorial.reaplicarFoco();
    }

    /* --- Variables: maximo 5 --- */
    var listaVars = (S.variante && S.variante.variablesCapa1) || esc.variablesCapa1 || [];
    var vars = listaVars.slice(0, 5).map(function (id) {
      var v = VARIABLES[id];
      if (!v) return '';
      var estado = v.estado ? v.estado(calc, S.estado) : 'neutro';
      return '<div class="variable est-' + estado + '">' +
               '<span class="v-et">' + v.et + '</span>' +
               '<span class="v-val">' + v.val(calc, S.estado) + '<small>' + (v.uni || '') + '</small></span>' +
               '<button class="v-por-que" data-por-que="var:' + id + '" title="Por que">?</button>' +
             '</div>';
    }).join('');
    if (S.refs.variables.innerHTML !== vars) {
      S.refs.variables.innerHTML = vars;
      if (SIM.tutorial) SIM.tutorial.reaplicarFoco();
    }

    /* --- Curvas compactas --- */
    SIM.monitor.dibujarPar(S.refs.cvPaw, S.refs.cvCapno, S.estado.historia, calc, S.perfil);
    if (S.refs.vPaw) S.refs.vPaw.textContent = n0(calc.ventilacion.ppico);
    if (S.refs.vCapno) S.refs.vCapno.textContent = calc.monitor.valido ? n0(calc.monitor.etco2) : '--';

    /* --- Maquina: zona sospechosa y descartadas --- */
    SIM.maquinaVista.marcar(S.refs.svgVista, S.zonaSospechosa, S.zonasDescartadas);
    SIM.maquinaVista.actualizar(S.refs.svgVista, S.estado, calc, alarmas);

    /* --- Recorrido del gas, si esta abierto --- */
    refrescarRecorrido(S.estado, calc, S.perfil, dt || 0.016);

    /* --- Reloj --- */
    if (S.refs.reloj) S.refs.reloj.textContent = reloj(S.tSim);

    /* --- Verificacion --- */
    if (!S.resuelto && esc.verificar) {
      var r = esc.verificar(S.estado, calc, S.perfil);
      if (r.ok) {
        S.resuelto = true;
        anotar('Escenario resuelto.', 'bien');
        avisarTutorial('resuelto');
        if (!(SIM.tutorial && SIM.tutorial.activo())) mostrarResumen(r);
      }
    }
  }

  function mostrarResumen(verif) {
    var aciertos = 0, parciales = 0, errores = 0;
    S.registro.forEach(function (r) {
      if (r.clase === 'bien') aciertos++;
      else if (r.clase === 'parcial') parciales++;
      else if (r.clase === 'mal') errores++;
    });
    abrirModal(
      '<h3 class="modal-tit ok">Escenario resuelto</h3>' +
      '<p class="capa2"><b>Verificacion:</b> ' + verif.texto + '</p>' +
      '<div class="resumen-cifras">' +
        '<div class="bien"><b>' + aciertos + '</b><span>aciertos</span></div>' +
        '<div class="parcial"><b>' + parciales + '</b><span>parciales</span></div>' +
        '<div class="mal"><b>' + errores + '</b><span>no indicados</span></div>' +
        '<div><b>' + reloj(S.tSim) + '</b><span>tiempo</span></div>' +
      '</div>' +
      '<h4 class="c3-sub">Lo que practicaste</h4>' +
      '<p class="c3-p">' + S.escenario.ideaPrincipal + '</p>' +
      '<ol class="pasos-resumen">' +
        '<li>Proteger al paciente primero: pasar a ventilacion manual.</li>' +
        '<li>Leer la alarma y su prioridad.</li>' +
        '<li>Contrastar con otras variables antes de actuar.</li>' +
        '<li>Descartar causas simples antes de las costosas.</li>' +
        '<li>Corregir y verificar con una prueba.</li>' +
        '<li>Escalar a servicio las fallas de hardware.</li>' +
      '</ol>' +
      '<p class="c3-nota">Logica comun que ensenan los manuales [I]. Verificacion: <code>' +
        verif.cita + '</code></p>' +
      '<button class="btn-pri" id="btnFin">Volver al inicio</button>'
    );
    var b = document.getElementById('btnFin');
    if (b) b.addEventListener('click', function () { if (S.alSalir) S.alSalir(); });
  }

  return {
    S: S,
    VARIABLES: VARIABLES,
    renderInicio: renderInicio,
    renderListaEscenarios: renderListaEscenarios,
    renderMaquina: renderMaquina,
    renderSimulacion: renderSimulacion,
    refrescar: refrescar,
    sincronizarControles: sincronizarControles,
    anotar: anotar,
    cerrarModal: cerrarModal,
    mostrarResumen: mostrarResumen,
    abrirRecorrido: abrirRecorrido,
    cerrarRecorrido: cerrarRecorrido,
    refrescarRecorrido: refrescarRecorrido
  };
})();
