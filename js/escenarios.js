/* =====================================================================
   escenarios.js  -  Los seis escenarios de falla (seccion 4)
   ---------------------------------------------------------------------
   ENSAYO 1 implementa completos:
     1. Fuga o desconexion en el circuito respiratorio
     5. Perdida del suministro de oxigeno
   Los otros cuatro quedan declarados con su ficha para los ensayos
   siguientes, de modo que se vea el plan completo.

   Estructura de cada escenario (seccion 5.3, tres capas):
     capa1: sintoma, variables (max 5), acciones elegibles
     capa2: el principio fisico, en dos o tres lineas
     capa3: de que manual sale cada dato
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.escenarios = (function () {
  'use strict';

  /* ---------------------------------------------------------------- */
  /* ESCENARIO 1 - FUGA O DESCONEXION                                  */
  /* ---------------------------------------------------------------- */
  var fuga = {
    id: 'fuga',
    numero: 1,
    titulo: 'Fuga o desconexion en el circuito respiratorio',
    disponible: true,
    /* zonas de la vista frontal implicadas: el estudiante tiene que
       averiguar en cual esta el problema, no se le marca de entrada */
    zonaFalla: 'absorbedor',
    zonasCandidatas: ['circuito', 'ventilador', 'absorbedor'],
    ideaPrincipal: 'El gas que se pierde no llega al paciente: bajan la presion y el volumen espirado.',

    sintoma: 'La concertina ya no sube hasta el tope de la camara y la bolsa se vacia. ' +
             'El volumen espirado es menor que el inspirado.',

    variablesCapa1: ['ppico', 'vti_vte', 'mv', 'etco2', 'concertina'],

    variantes: [
      {
        id: 'sello',
        nombre: 'Sello del absorbedor fuera de sitio',
        resumen: 'Fuga real en ventilacion mecanica: el sello del canister quedo mal asentado.',
        sintoma: 'La concertina ya no sube hasta el tope de la camara y la bolsa se vacia. ' +
                 'El volumen espirado es menor que el inspirado.',
        variablesCapa1: ['ppico', 'vti_vte', 'mv', 'etco2', 'concertina'],
        aplicar: function (est) {
          est.circuito.fugaQ30 = 6000;
          est.circuito.modo = 'mecanica';
          est.circuito.aplCmH2O = SIM.pv('apl.nominal');
          est.circuito._causa = 'sello del canister del absorbedor mal asentado';
        },
        verificar: function (est, calc, perfil) {
          return {
            ok: est.circuito.fugaQ30 <= SIM.pv('pruebas.fugaAceptable', perfil) * 2 &&
                calc.ventilacion.vte > calc.ventilacion.vti * 0.9,
            texto: 'Con el sello en su sitio la fuga baja del limite, la concertina vuelve al tope y el ' +
                   'volumen espirado iguala al inspirado.',
            cita: 'M1 5-42 [162]; M4 7-19 [149]'
          };
        }
      },
      {
        id: 'apl',
        nombre: 'Valvula APL abierta',
        resumen: 'Parece una fuga y no lo es: el gas se va por la APL a la evacuacion.',
        sintoma: 'Estas ventilando a mano durante la induccion y la bolsa no se llena. Aprietas y el ' +
                 'paciente apenas recibe volumen: la presion no sube de unos pocos cmH2O. El circuito se ' +
                 'conecto y se reviso hace diez minutos.',
        variablesCapa1: ['ppico', 'vti_vte', 'apl', 'mv', 'concertina'],
        /* No hay fuga: el circuito esta estanco y la APL abierta del
           todo. El gas fresco se va a la evacuacion en lugar de llenar
           la bolsa, y al apretar, el gas sale por el camino libre. */
        aplicar: function (est) {
          est.circuito.fugaQ30 = 0;
          est.circuito.modo = 'manual';
          est.circuito.aplCmH2O = SIM.pv('apl.minima');
          est.circuito._causa = 'la valvula APL quedo abierta del todo';
        },
        verificar: function (est, calc, perfil) {
          return {
            ok: est.circuito.aplCmH2O >= SIM.pv('apl.umbralSello', perfil) &&
                est.circuito.aplCmH2O < SIM.pv('apl.maxima', perfil) * 0.7 &&
                calc.ventilacion.ppico > 10,
            texto: 'Con la APL en una posicion de trabajo la bolsa se llena, la presion sube al apretar y el ' +
                   'paciente recibe su volumen. No habia nada roto: habia un mando mal puesto.',
            cita: 'M2 p.88 [96]; M12 p.1-2'
          };
        }
      }
    ],

    capa2: 'El circuito es un sistema cerrado que se presuriza con cada inspiracion. ' +
           'Si hay un orificio, parte del gas sale por ahi en lugar de entrar al paciente: ' +
           'la presion pico no sube hasta lo esperado y el volumen que vuelve es menor que el que salio. ' +
           'Cuanto mayor es la presion, mayor es el flujo que escapa.',

    capa3: {
      resumen: 'Causas y umbrales tomados de M1, M2, M3, M4 y M12.',
      citas: [
        { t: 'Sellos y piezas del circuito que fallan con mas frecuencia', c: 'M1 5-43 [163]' },
        { t: 'Canister mal instalado o con sellos danados', c: 'M1 5-42 [162]; M4 7-19 [149]' },
        { t: 'Alarma "Fuga en circuito": VTesp < mitad de VTinsp durante 30 s, prioridad media', c: 'M4 7-7 [137]' },
        { t: 'Alarma "Patient Circuit Leak", prioridad media', c: 'M3 D-6 [256]' },
        { t: 'Alarma "Ppico baja": Ppico < Pmin+4 cmH2O durante 20 s', c: 'M4 7-11 [141]' },
        { t: 'Prueba de fugas: presurizar a 30 cmH2O; falla si supera 150 mL/min (AUTO)', c: 'M2 p.88 [96]' },
        { t: 'Compliancia esperada del sistema: 1-10 mL/cmH2O', c: 'M2 p.169 [177]' },
        { t: 'Con ventilacion normal la fuga real es ~10 % de la medida en la prueba', c: 'M2 p.169 [177]' },
        { t: 'Aprobacion: maquina <=50 mL/min y sistema respiratorio <=350 mL/min a 30 cmH2O', c: 'M12 p.1-2' },
        { t: 'Sintoma: la concertina ascendente no llega al tope, sobre todo con gas fresco <1 L/min', c: 'M2 p.169 [177]' }
      ],
      diferencias: 'M3 y M4 detectan la fuga por volumenes (VTe frente a VTi); M2 la detecta por presion pico ' +
                   'y por la concertina; M1 la detecta en la prueba de servicio. Los umbrales numericos son distintos: ' +
                   '150 mL/min a 3 kPa en M3, 350 mL/min a 30 cmH2O en M12.',
      noConsta: 'No consta la funcion exacta de cuanto cae la presion segun el tamano de la fuga, ' +
                'ni cuanto baja el EtCO2, ni la relacion entre el tamano del orificio y el volumen perdido. ' +
                'El simulador usa Q_fuga(P) = Q30 x (P/30)^0,65 como supuesto de diseno [P].'
    },

    /* Estado inicial de la falla.
       El sello del canister quedo fuera de sitio: M1 5-42 [162] y
       M4 7-19 [149] lo senalan como causa de una fuga importante.
       Se parte de anestesia de flujo bajo (2 L/min) porque el sintoma de
       la concertina es mas claro con gas fresco bajo (M2 p.169 [177]). */
    aplicar: function (est, varianteId) {
      est.circuito.fugaQ30 = 0;
      est.circuito.desconectado = false;
      est.circuito.sellosRevisados = false;
      est.circuito.flushActivo = false;
      est.flujometros.o2 = 1.0;
      est.flujometros.aire = 1.0;
      est.flujometros.n2o = 0;
      est._aplRevisada = false;
      est._variante = varianteId || 'sello';
      var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
      if (v) v.aplicar(est);
    },

    /* Acciones elegibles de la capa 1 */
    acciones: [
      {
        id: 'ventilar_manual',
        etiqueta: 'Pasar a ventilacion manual',
        proposito: 'Protege al paciente antes de diagnosticar nada.',
        tipo: 'proteccion',
        ordenRecomendado: 1,
        correcta: function (est) { return est._variante === 'apl' ? 'parcial' : true; },
        efecto: function (est) { est.circuito.modo = 'manual'; },
        explicacion: 'Correcto como primer paso. Todos los manuales indican proteger al paciente antes de diagnosticar. ' +
                     'Ademas, al ocluir la pieza en Y se puede ver si la presion se sostiene.',
        cita: 'M1 5-4 [124]; M3 D-5 [255]; M4 7-13 [143]'
      },
      {
        id: 'comparar_volumenes',
        etiqueta: 'Comparar volumen inspirado y espirado',
        proposito: 'Confirma que de verdad hay una fuga y de que tamano.',
        tipo: 'observacion',
        ordenRecomendado: 2,
        correcta: true,
        efecto: function (est, ctx) { ctx.revelar('vti_vte'); },
        explicacion: 'Correcto. La relacion VTesp/VTinsp es la senal que usa la maquina para declarar la fuga.',
        cita: 'M4 7-7 [137]'
      },
      {
        id: 'inspeccionar_tramos',
        etiqueta: 'Inspeccionar el circuito por tramos',
        proposito: 'Localiza el componente. Sin esto no sabes que corregir.',
        tipo: 'observacion',
        ordenRecomendado: 3,
        correcta: function (est) { return est._variante === 'apl' ? 'parcial' : true; },
        efecto: function (est, ctx) {
          est.circuito.sellosRevisados = true;
          ctx.revelar('causa');
          ctx.descartar(['circuito', 'ventilador']);
          ctx.sospechar('absorbedor');
        },
        explicacion: 'Correcto. Los manuales listan los sellos que fallan con mas frecuencia: brazo de la bolsa, ' +
                     'copa de agua, adaptador, fuelle, tapa de valvula, sensor de O2 y la base del canister. ' +
                     'En este caso el sello del canister no quedo asentado.',
        cita: 'M1 5-43 [163]; M1 5-42 [162]; M4 7-19 [149]'
      },
      {
        id: 'prueba_fugas',
        etiqueta: 'Hacer la prueba de fugas del circuito',
        proposito: 'Convierte la sospecha en un numero comparable con el limite.',
        tipo: 'prueba',
        ordenRecomendado: 4,
        correcta: true,
        efecto: function (est, ctx) { ctx.abrirPrueba('fuga'); },
        explicacion: 'Correcto. La prueba presuriza el circuito a 30 cmH2O y mide el flujo necesario para mantenerlo. ' +
                     'Es lo que convierte una sospecha en un numero.',
        cita: 'M2 p.88 [96]; M3 6.8; M4 Menu Comprobacion 5-6 a 5-11; M12 p.1-2'
      },
      {
        id: 'reasentar_sello',
        etiqueta: 'Reasentar o cambiar el sello identificado',
        proposito: 'Corrige la causa, una vez localizada.',
        tipo: 'correccion',
        ordenRecomendado: 5,
        correcta: function (est) {
          if (est._variante !== 'sello') return false;
          return est.circuito.sellosRevisados;
        },
        efecto: function (est) {
          if (est.circuito.sellosRevisados) { est.circuito.fugaQ30 = 18; }
        },
        explicacion: 'Correcto si antes se identifico el componente. Corregir sin localizar la fuga es cambiar piezas a ciegas.',
        explicacionSiIncorrecta: 'Todavia no sabes que sello cambiar. Inspecciona el circuito por tramos antes de corregir.',
        cita: 'M1 5-43 [163]'
      },
      {
        id: 'revisar_apl',
        etiqueta: 'Mirar en que posicion esta la valvula APL',
        proposito: 'Descartar que el gas se este yendo por donde debe irse lo que sobra.',
        tipo: 'observacion',
        ordenRecomendado: 2,
        correcta: function (est) { return est._variante === 'apl' ? true : 'parcial'; },
        efecto: function (est, ctx) { est._aplRevisada = true; ctx.revelar(['apl']); },
        explicacion: 'Ahi esta: la APL esta abierta del todo. Y entonces esto no es una fuga, es el ' +
                     'circuito haciendo exactamente lo que le pediste. La APL existe para dejar salir lo ' +
                     'que sobra hacia la evacuacion; abierta del todo, lo que sobra es todo. El gas fresco ' +
                     'se va en lugar de llenar la bolsa, y al apretar, el gas prefiere el camino libre ' +
                     'antes que los pulmones del paciente.',
        explicacionSiIncorrecta: 'La APL esta en una posicion de trabajo normal, asi que no es la causa. ' +
                                 'Mirarla cuesta un segundo y descarta la explicacion mas tonta y mas ' +
                                 'frecuente de "no consigo presion", asi que no la des por descartada sin ' +
                                 'mirar. Ademas, en ventilacion mecanica la APL ni siquiera esta en el ' +
                                 'circuito: el selector de bolsa la deja fuera del paso.',
        cuando: 'Siempre que ventilando a mano no consigas presion ni llenar la bolsa, y antes de buscar ' +
                'una fuga por los tramos.',
        cita: 'M2 p.88 [96]; M12 p.1-2 (la prueba de fuga exige cerrar la APL)'
      },
      {
        id: 'cerrar_apl',
        etiqueta: 'Llevar la APL a una posicion de trabajo',
        proposito: 'Devolver al circuito el techo de presion que necesita.',
        tipo: 'correccion',
        ordenRecomendado: 3,
        correcta: function (est) {
          if (est._variante !== 'apl') return false;
          return est._aplRevisada ? true : 'parcial';
        },
        efecto: function (est) { est.circuito.aplCmH2O = SIM.pv('apl.nominal'); },
        explicacion: 'La bolsa se llena y la presion sube al apretar. Fijate en lo que acabas de aprender ' +
                     'sobre este mando: no es un interruptor de abierto y cerrado, es un techo de presion. ' +
                     'En 20 cmH2O el circuito se presuriza hasta ahi y lo que sobra se va; cerrada del todo ' +
                     'no hay techo y la presion se acumula hasta hacer dano. La APL mal puesta hace dano en ' +
                     'las dos direcciones, y ninguna alarma te avisa de su posicion porque no tiene sensor.',
        explicacionSiIncorrecta: 'La APL ya estaba bien puesta, asi que moverla no corrige nada y puede ' +
                                 'crear un problema: si la dejas cerrada del todo, el gas entra y no tiene ' +
                                 'por donde salir.',
        cuando: 'Cuando compruebas que esta abierta y estas ventilando a mano.',
        cita: 'M12 p.1-2'
      },
      {
        id: 'pulsar_flush',
        etiqueta: 'Pulsar la purga de O2 para rellenar el circuito',
        proposito: 'Medida inmediata: meter volumen de golpe.',
        tipo: 'correccion',
        ordenRecomendado: 2,
        correcta: function (est) { return est._variante === 'sello' ? true : false; },
        efecto: function (est) {
          if (est._variante === 'sello') est.circuito.llenado = 1;
        },
        explicacion: 'Correcto como medida inmediata, y es la que el manual indica ante una concertina que ' +
                     'no llega al tope: revisar el gas impulsor, subir el gas fresco o pulsar la purga de ' +
                     'O2. Entrega unos 50 L/min directos a la salida comun y rellena el circuito en ' +
                     'segundos. Pero ten presente lo que acabas de hacer: ese oxigeno entra aguas arriba ' +
                     'del vaporizador, asi que no lleva agente y diluye el que habia. Un flush sostenido ' +
                     'puede dejar al paciente superficial, y esa es una de las causas conocidas de ' +
                     'despertar intraoperatorio. Rellena, diagnostica y vuelve al gas fresco normal.',
        explicacionSiIncorrecta: 'Con la APL abierta la purga no sirve de nada: estas metiendo 50 L/min por ' +
                                 'un circuito que tiene la salida abierta de par en par, asi que el gas va ' +
                                 'directo a la evacuacion sin llenar la bolsa. Y si la APL hubiera estado ' +
                                 'cerrada, el resultado habria sido el contrario y peor: 50 L/min sin ' +
                                 'escape posible son una subida de presion brusca y riesgo de barotrauma. ' +
                                 'La purga nunca se pulsa sin saber como esta la APL.',
        cuando: 'Cuando el circuito ha perdido volumen y necesitas rellenarlo ya, con la APL en una ' +
                'posicion de trabajo.',
        cita: 'M4 7-12 [142]'
      },
      {
        id: 'subir_gas_fresco',
        etiqueta: 'Subir el flujo de gas fresco a 4 L/min',
        proposito: 'Compensa el gas que se pierde mientras buscas la fuga.',
        tipo: 'observacion',
        ordenRecomendado: 0,
        correcta: 'parcial',
        efecto: function (est) { est.flujometros.o2 = 2; est.flujometros.aire = 2; },
        explicacion: 'Sirve para esto: el fuelle solo entrega el gas que el circuito tiene, y con una fuga ' +
                     'sale mas gas del que entra, asi que la concertina deja de llenarse y el volumen cae. ' +
                     'Subiendo el gas fresco vuelve a entrar mas de lo que se escapa, el fuelle se llena otra vez ' +
                     'y el paciente recupera volumen. Fijate en que las alarmas se calman. ' +
                     'Pero la fuga sigue ahi: en cuanto bajes el flujo, vuelve. Enmascarar no es corregir.',
        cuando: 'Como medida temporal mientras localizas la fuga, y para llenar el sistema y poder buscar por ' +
                'donde escapa el gas. Nunca como solucion: gasta mas gas y agente, y deja el fallo sin reparar.',
        cita: 'M7 4.1.1 (p.54-55)'
      },
      {
        id: 'llamar_servicio',
        etiqueta: 'Escalar a servicio tecnico',
        proposito: 'Deriva la falla a quien puede abrir el equipo.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: false,
        efecto: function () {},
        explicacionSiIncorrecta: 'Todavia no. Escalar antes de descartar lo simple cuesta dinero y deja la ' +
                                 'maquina parada sin motivo. Una fuga por un sello mal asentado se corrige en el sitio, ' +
                                 'y los manuales listan precisamente esos sellos como primera sospecha.',
        cuando: 'Cuando la falla esta dentro del equipo y no se corrige en el sitio: un regulador, un interruptor ' +
                'de presion, un sensor de flujo, una electrovalvula o una tarjeta. Lo reconoces porque la prueba ' +
                'sigue fallando despues de haber descartado conexiones, sellos y consumibles, porque el valor se ' +
                'sale del rango de calibracion, o porque el propio manual marca ese ajuste como intervencion de ' +
                'servicio. Tambien si hace falta abrir el equipo o romper un precinto.',
        cita: 'M1 5-43 [163]; M1 5-21 [141]'
      }
    ],

    /* Verificacion final (seccion 4.1), por variante */
    verificar: function (est, calc, perfil) {
      var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
      if (v) return v.verificar(est, calc, perfil);
      var limite = SIM.pv('pruebas.fugaAceptable', perfil);
      return {
        ok: est.circuito.fugaQ30 <= limite && !est.circuito.desconectado,
        texto: 'Nueva prueba de fugas con resultado aprobado (<= ' + limite + ' mL/min), ' +
               'la concertina llega al tope y desaparecen las alarmas.',
        cita: 'M2 p.88 [96]; M1 3-8 [44]'
      };
    }
  };

  /* ---------------------------------------------------------------- */
  /* ESCENARIO 5 - PERDIDA DEL SUMINISTRO DE OXIGENO                   */
  /* ---------------------------------------------------------------- */
  var perdidaO2 = {
    id: 'perdida_o2',
    numero: 5,
    titulo: 'Perdida del suministro de oxigeno',
    disponible: true,
    zonaFalla: 'suministro',
    zonasCandidatas: ['suministro', 'flujometros', 'monitor'],
    ideaPrincipal: 'Sin O2 a presion suficiente se corta el N2O para evitar una mezcla hipoxica.',

    sintoma: 'Suena la alarma de fallo de suministro de O2, de prioridad alta.',

    variablesCapa1: ['presion_o2', 'presion_cilindro', 'flujo_o2', 'fio2', 'n2o'],

    variantes: [
      {
        id: 'tuberia',
        nombre: 'Tuberia de O2 sin presion',
        resumen: 'La alarma dice la verdad: el manometro de la tuberia esta en cero y el cilindro esta lleno.',
        sintoma: 'Suena una alarma de prioridad alta. El manometro de la tuberia de O2 esta por debajo de lo ' +
                 'normal y el flujometro de O2 no sostiene el caudal fijado. El N2O se corto solo.',
        variablesCapa1: ['presion_o2', 'presion_cilindro', 'flujo_o2', 'fio2', 'n2o'],
        aplicar: function (est) {
          est.suministro.tuberia.o2 = 0;
        },
        verificar: function (est, calc, perfil) {
          var alarma = SIM.pv('suministro.alarmaO2Baja', perfil);
          return {
            ok: calc.suministro.presionEfectiva.o2 >= alarma &&
                calc.monitor.fio2 !== null &&
                calc.monitor.fio2 >= SIM.pv('monitoreo.fiO2AlarmaBaja', perfil),
            texto: 'Presion normal en los manometros (>= ' + alarma + ' kPa), FiO2 dentro del limite y alarma ' +
                   'cancelada. M3 6.6 describe ademas la prueba de corte de O2.',
            cita: 'M3 6-8 [90]'
          };
        }
      },
      {
        id: 'cilindro',
        nombre: 'Tuberia perdida y cilindro casi vacio',
        resumen: 'El respaldo existe pero esta en reserva: abrirlo no resuelve, solo pone un reloj en marcha.',
        sintoma: 'Suena una alarma de prioridad alta y el manometro de la tuberia de O2 esta en cero. El ' +
                 'manometro del cilindro de respaldo esta muy por debajo de lo que deberia marcar un cilindro ' +
                 'lleno.',
        variablesCapa1: ['presion_o2', 'presion_cilindro', 'autonomia_cilindro', 'flujo_o2', 'fio2'],
        aplicar: function (est, perfil) {
          est.suministro.tuberia.o2 = 0;
          /* Cilindro en reserva: por debajo del umbral de 2633 kPa que
             M4 7-11 [141] usa para avisar de presion baja de cilindro. */
          est.suministro.cilindro.o2 = 1200;
        },
        verificar: function (est, calc, perfil) {
          var alarma = SIM.pv('suministro.alarmaO2Baja', perfil);
          return {
            ok: est._o2Restablecido && calc.suministro.presionEfectiva.o2 >= alarma &&
                calc.monitor.fio2 !== null &&
                calc.monitor.fio2 >= SIM.pv('monitoreo.fiO2AlarmaBaja', perfil),
            texto: 'La tuberia vuelve a dar presion nominal, que es lo unico que resuelve esta variante: el ' +
                   'cilindro en reserva solo daba minutos. La alarma de presion baja del cilindro sigue ' +
                   'sonando, y debe seguir: ese cilindro hay que cambiarlo antes del proximo caso, porque ' +
                   'ahora mismo la maquina no tiene respaldo real.',
            cita: 'M10 diap. 2-3; M3 D-6 [256]'
          };
        }
      },
      {
        id: 'interruptor',
        nombre: 'Alarma falsa: interruptor de presion averiado',
        resumen: 'La alarma suena con los manometros normales, el caudal entero y el N2O sin cortar.',
        sintoma: 'Suena la alarma de fallo de suministro de O2, de prioridad alta. Pero el manometro de la ' +
                 'tuberia marca presion normal, el flujometro de O2 sostiene el caudal fijado y el N2O sigue ' +
                 'pasando, sin que nada lo haya cortado.',
        variablesCapa1: ['presion_o2', 'flujo_o2', 'n2o', 'fio2', 'presion_cilindro'],
        aplicar: function (est) {
          est.suministro.interruptorAveriado = true;
        },
        verificar: function (est, calc, perfil) {
          return {
            ok: !est.suministro.interruptorAveriado,
            texto: 'Con el interruptor sustituido la alarma desaparece y la presion sigue donde siempre estuvo. ' +
                   'La verificacion de esta variante es doble: la alarma se va y los manometros no cambian, ' +
                   'porque nunca hubo nada que corregir en el suministro.',
            cita: 'M1 5-4 [124]; M1 5-21 [141]'
          };
        }
      }
    ],

    capa2: 'El flujometro necesita una presion de entrada estable para entregar el caudal que marca. ' +
           'Si la presion de O2 cae, el dispositivo de proteccion corta el N2O para que la mezcla no quede sin oxigeno. ' +
           'El cilindro de respaldo existe justamente para sostener el suministro mientras se restablece la tuberia.',

    capa3: {
      resumen: 'Umbrales de alarma y de corte tomados de M1, M2, M3, M4, M6 y M10.',
      citas: [
        { t: 'Presion de entrada de tuberia: 280-600 kPa', c: 'M3 B-4 [226]; M4 11-6 [212]' },
        { t: 'Presion de suministro de linea: 340 kPa', c: 'M6 p.84' },
        { t: 'Alarma "O2 Supply Failure", prioridad alta', c: 'M1 5-5 [125]; M3 D-6 [256]' },
        { t: 'Limite de alarma 250 kPa; si se detiene el flujo de O2, el N2O tambien', c: 'M2 p.130 [138]' },
        { t: 'Presion baja de suministro de O2: tuberia <252 kPa y cilindro <2633 kPa durante 1 s', c: 'M4 7-11 [141]' },
        { t: 'Corte bajo 172 kPa (25 psig) y reposicion sobre 227 kPa (33 psig): histeresis', c: 'M6 p.17 [V]' },
        { t: 'Concentracion de O2 no menor al 25 % en la mezcla con N2O', c: 'M1 3-5 [41]; M3 B-5 [227]' },
        { t: 'Cilindros llenos: 6,9-15 MPa', c: 'M1 2-5 [21]' },
        { t: 'Duracion del cilindro: t(min) = psi x factor / flujo; 0,28 (E) y 0,16 (D)', c: 'M10 diap. 2-3' },
        { t: 'Alarma de FiO2 inspirada fijada en 28 % para prevenir hipoxia', c: 'M7 3.6 (p.48)' },
        { t: 'Con aire conectado, ventilar manualmente mientras se restablece el O2', c: 'M3 D-6 [256]' }
      ],
      diferencias: 'Los umbrales de alarma cambian entre maquinas: 220 kPa en M3, 250 kPa en M2 y M6, ' +
                   '252 kPa mas condicion de cilindro en M4, y en M1 un ajuste de servicio de 150-250 kPa. ' +
                   'La prioridad de "FiO2 baja" es alta en M3 y M4 pero baja en M6 (p.54). ' +
                   'M3 da 25 % (B-5) y 21 % (6-8) como minimo de O2: discrepancia a verificar.',
      noConsta: 'No consta cuanto consume de gas motriz el ventilador cuando usa O2, ni con que velocidad cae la FiO2 ' +
                'al perder el suministro. Ambos son supuestos de diseno [P].'
    },

    /* La manguera de la tuberia de O2 quedo desconectada: la presion cae a
       cero. Habia N2O en uso, asi que se vera actuar la proteccion. El gas
       motriz es aire en este perfil, por lo que el ventilador sigue
       funcionando: el paciente queda ventilado con aire ambiente. */
    aplicar: function (est, varianteId) {
      est.suministro.cilindroAbierto.o2 = false;
      est.suministro.interruptorAveriado = false;
      est.flujometros.o2 = 2.0;
      est.flujometros.aire = 2.0;
      est.flujometros.n2o = 1.0;
      est._n2oNominal = 1.0;
      est.ventilador.gasMotrizKPa = 400;
      est._o2Restablecido = false;
      est._manometrosVistos = false;
      est._medidaInmediata = false;
      est._interruptorProbado = false;
      est._variante = varianteId || 'tuberia';
      var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
      if (v) v.aplicar(est);
    },

    acciones: [
      {
        id: 'confirmar_manometros',
        etiqueta: 'Confirmar los manometros de tuberia y de cilindro',
        proposito: 'Comprueba que la alarma coincide con la realidad.',
        tipo: 'observacion',
        ordenRecomendado: 1,
        correcta: true,
        efecto: function (est, ctx) {
          est._manometrosVistos = true;
          ctx.revelar('manometros');
          if (est._variante === 'interruptor') ctx.sospechar('monitor');
          else { ctx.descartar(['flujometros', 'monitor']); ctx.sospechar('suministro'); }
        },
        explicacion: 'Correcto, y es el paso que decide en las tres variantes de este modulo. La alarma dice ' +
                     'que falta oxigeno; el manometro dice si eso es verdad. Si la presion esta de verdad baja, ' +
                     'el problema es el gas. Si esta normal con la alarma sonando, el problema es quien mide.',
        cita: 'M1 5-4, 5-21 [124, 141]'
      },
      {
        id: 'abrir_cilindro',
        etiqueta: 'Abrir el cilindro de reserva de O2',
        proposito: 'Gana tiempo con la reserva mientras resuelves la causa.',
        tipo: 'correccion',
        ordenRecomendado: 2,
        correcta: function (est) { return est._variante === 'interruptor' ? 'parcial' : true; },
        efecto: function (est) { est.suministro.cilindroAbierto.o2 = true; est._medidaInmediata = true; },
        explicacion: 'Correcto, y es lo primero que protege al paciente: el cilindro sostiene el suministro ' +
                     'mientras resuelves la causa. Ahora mira cuanto dura, porque el respaldo no es una ' +
                     'solucion sino un reloj: t(min) = presion(psi) x 0,28 / flujo(L/min) para un cilindro E. ' +
                     'Si el cilindro esta en reserva, ese reloj es de minutos y la tuberia sigue siendo ' +
                     'urgente.',
        explicacionSiIncorrecta: 'No hace dano, pero aqui no hacia falta: la tuberia esta dando presion normal ' +
                                 'y el cilindro solo gasta reserva que puede necesitarse mas tarde. Abrir el ' +
                                 'respaldo ante una alarma de suministro es prudente, y por eso esto no cuenta ' +
                                 'como error, pero el diagnostico sigue pendiente.',
        cuando: 'Cuando el manometro confirma que la presion de la tuberia esta de verdad baja.',
        cita: 'M2 p.177 [185]; M10 diap. 2-3'
      },
      {
        id: 'ventilar_manual_o2',
        etiqueta: 'Ventilar manualmente con O2',
        proposito: 'Protege al paciente mientras se restablece el suministro.',
        tipo: 'proteccion',
        ordenRecomendado: 3,
        correcta: function (est) { return est._variante === 'interruptor' ? 'parcial' : true; },
        efecto: function (est) { est.circuito.modo = 'manual'; est._medidaInmediata = true; },
        explicacion: 'Correcto. Con aire conectado se ventila manualmente mientras se restablece el O2: asi ' +
                     'dejas de gastar gas motriz y controlas con la mano lo que el paciente recibe.',
        explicacionSiIncorrecta: 'Pasar a manual nunca es un error grave y aqui tampoco, pero no era necesario: ' +
                                 'el suministro esta intacto y la ventilacion mecanica funciona. Lo que falla es ' +
                                 'la alarma, no el gas.',
        cuando: 'Cuando el suministro de O2 esta realmente comprometido.',
        cita: 'M3 D-6 [256]'
      },
      {
        id: 'restablecer_tuberia',
        etiqueta: 'Revisar y restablecer la conexion de la tuberia',
        proposito: 'Corrige la causa de fondo.',
        tipo: 'correccion',
        ordenRecomendado: 4,
        correcta: function (est) { return est._variante === 'interruptor' ? false : true; },
        efecto: function (est) {
          if (est._variante !== 'interruptor') {
            est.suministro.tuberia.o2 = SIM.pv('suministro.presionNominalTuberia');
            est._o2Restablecido = true;
          }
        },
        explicacion: 'Correcto, y es la correccion de fondo: comprobar la conexion de la tuberia y que el ' +
                     'suministro vuelva a la presion nominal. El cilindro te dio tiempo; esto resuelve.',
        explicacionSiIncorrecta: 'La tuberia esta dando presion normal, asi que aqui no hay nada que ' +
                                 'restablecer. Desconectar y reconectar una tuberia que funciona es la clase de ' +
                                 'gesto que crea una averia nueva mientras buscabas una que no estaba ahi.',
        cuando: 'Cuando el manometro confirma la perdida de presion de la tuberia.',
        cita: 'M3 D-6 [256]; M4 7-11 [141]'
      },
      {
        id: 'revisar_interruptor',
        etiqueta: 'Probar el interruptor de presion de O2',
        proposito: 'Averiguar si lo averiado es el sensor y no el gas.',
        tipo: 'prueba',
        ordenRecomendado: 2,
        correcta: function (est) {
          if (est._variante !== 'interruptor') return 'parcial';
          return est._manometrosVistos ? true : 'parcial';
        },
        efecto: function (est, ctx) {
          est._interruptorProbado = true;
          ctx.revelar('interruptor');
          if (est._variante === 'interruptor') ctx.sospechar('monitor');
        },
        explicacion: 'Correcto, y esta es la prueba que resuelve el caso. El interruptor se cortocircuita: si ' +
                     'la alarma desaparece al hacerlo, el que estaba disparando sin motivo es el interruptor, ' +
                     'porque con el puente la electronica ve presion correcta de forma forzada. La alarma se ' +
                     'fue, y la presion de la tuberia no se movio en ningun momento. El sensor miente.',
        explicacionSiIncorrecta: 'Aqui la presion esta de verdad baja y el interruptor esta haciendo bien su ' +
                                 'trabajo: avisar. La prueba no sobra, porque confirma que la alarma es real, ' +
                                 'pero no es donde esta el problema.',
        cuando: 'Cuando la alarma de suministro aparece con los manometros normales, o cuando no aparece a pesar ' +
                'de que la presion esta baja. Ahi el sospechoso es el sensor, no el gas.',
        cita: 'M1 5-4 [124]; M1 5-21 [141]'
      },
      {
        id: 'sustituir_interruptor',
        etiqueta: 'Escalar a servicio: sustituir el interruptor de presion',
        proposito: 'Cambiar el componente que dispara sin motivo.',
        tipo: 'correccion',
        ordenRecomendado: 3,
        correcta: function (est) {
          if (est._variante !== 'interruptor') return false;
          return est._interruptorProbado ? true : 'parcial';
        },
        efecto: function (est) {
          if (est._variante === 'interruptor' && est._interruptorProbado) {
            est.suministro.interruptorAveriado = false;
          }
        },
        explicacion: 'Correcto. Un interruptor de presion que dispara con presion normal no se ajusta en ' +
                     'quirofano: se sustituye, y hasta entonces la maquina queda con una alarma que no ' +
                     'significa nada, que es casi peor que no tener alarma. Fijate en lo que acabas de evitar: ' +
                     'si hubieras tratado esto como una perdida real de O2, habrias abierto el cilindro, ' +
                     'pasado a manual y desconectado una tuberia que estaba perfecta.',
        explicacionSiIncorrecta: 'Aqui la presion esta de verdad baja: el interruptor avisa de algo que esta ' +
                                 'pasando. Sustituirlo seria quitar el testigo en lugar de resolver el ' +
                                 'problema, y dejarias al paciente sin oxigeno y sin alarma.',
        cuando: 'Cuando una prueba demuestra que el interruptor dispara estando la presion correcta.',
        cita: 'M1 5-4 [124]'
      },
      {
        id: 'subir_n2o',
        etiqueta: 'Subir el flujo de N2O para compensar el caudal',
        proposito: 'Repone el caudal total con otro gas.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: false,
        efecto: function (est) { est.flujometros.n2o = Math.min(6, est.flujometros.n2o + 2); },
        explicacionSiIncorrecta: 'Peligroso y ademas inutil, y es la trampa de este escenario. El dispositivo de ' +
                                 'proteccion ya corto el N2O precisamente para que no se entregue una mezcla sin ' +
                                 'oxigeno, asi que subirlo no repone ningun caudal. Y cuando el O2 vuelva, el ' +
                                 'corte se levanta y ese N2O de mas si empieza a pasar: habras montado una ' +
                                 'mezcla hipoxica para el momento en que todo lo demas funcione. El flujometro ' +
                                 'queda en ' + 3 + ' L/min y el escenario no se dara por resuelto hasta que lo ' +
                                 'devuelvas a su valor con la perilla de N2O.',
        cuando: 'Nunca ante una alarma de suministro de O2. Ajustar el N2O es otra cosa, y se hace sobre un ' +
                'suministro de oxigeno que se sabe sano.',
        cita: 'M2 p.130 [138]; M1 3-5 [41]'
      },
      {
        id: 'silenciar',
        etiqueta: 'Pausar el audio de la alarma',
        proposito: 'Callar el pitido 120 s para poder trabajar y hablar con el equipo.',
        tipo: 'observacion',
        ordenRecomendado: 4,
        /* Pausar el audio es una funcion de la maquina, no un error: lo que
           decide si esta bien usada es el momento. Despues de proteger al
           paciente, es correcta. Antes, es dejar de oir un problema. */
        correcta: function (est) {
          return (est._medidaInmediata || est._interruptorProbado) ? true : false;
        },
        efecto: function (est, ctx) { if (ctx.pausarAudio) ctx.pausarAudio(); },
        explicacion: 'Correcto, y en el momento adecuado. Ya protegiste al paciente, asi que ahora el pitido ' +
                     'solo estorba: impide hablar con el equipo y tapa la siguiente alarma, que puede ser mas ' +
                     'importante que esta. La pausa dura 120 s y despues vuelve sola, que es exactamente lo que ' +
                     'quieres: silencio para trabajar, no silencio para olvidar.',
        explicacionSiIncorrecta: 'Todavia no. El audio se pausa cuando ya has hecho algo por el paciente, no ' +
                                 'antes: silenciar es lo primero que se hace cuando se quiere dejar de oir un ' +
                                 'problema, y la pausa de 120 s te devuelve la alarma justo cuando ya te habias ' +
                                 'distraido. Protege primero, calla despues.',
        cuando: 'Cuando ya tomaste la medida inmediata y necesitas silencio para resolver la causa y coordinar ' +
                'con el equipo.',
        cita: 'M4 7-2 [132]; M2 p.130 [138]'
      }
    ],

    verificar: function (est, calc, perfil) {
      var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
      var base = v ? v.verificar(est, calc, perfil) : { ok: false, texto: '', cita: '' };
      if (base.ok && Math.abs(est.flujometros.n2o - (est._n2oNominal || 0)) > 0.05) {
        return {
          ok: false,
          texto: 'La causa esta corregida, pero el N2O quedo en ' +
                 est.flujometros.n2o.toFixed(1).replace('.', ',') + ' L/min en lugar de ' +
                 (est._n2oNominal || 0).toFixed(1).replace('.', ',') + '. Con el O2 restablecido, el corte se ' +
                 'levanta y ese N2O de mas empieza a pasar.',
          cita: 'M1 3-5 [41]; M3 B-5 [227]'
        };
      }
      return base;
    }
  };

  /* ---------------------------------------------------------------- */
  /* ESCENARIO 2 - FALLA DEL VENTILADOR                                */
  /* ---------------------------------------------------------------- */
  var ventilador = {
    id: 'ventilador',
    numero: 2,
    titulo: 'Falla del ventilador',
    disponible: true,
    zonaFalla: 'ventilador',
    zonasCandidatas: ['ventilador', 'circuito', 'suministro'],
    ideaPrincipal: 'Sin gas motriz no hay inspiracion mecanica, aunque la electronica funcione. ' +
                   'Lo primero siempre es pasar a ventilacion manual.',

    sintoma: 'La concertina dejo de moverse y la maquina no entrega la ventilacion programada. ' +
             'Suena una alarma de prioridad alta. El monitoreo sigue encendido.',

    variablesCapa1: ['gas_motriz', 'concertina', 'ppico', 'vti_vte', 'etco2'],

    capa2: 'El ventilador no genera gas: comprime la concertina con un gas motriz a presion, y ese empuje ' +
           'es el que produce la inspiracion. Si el gas motriz falta o llega con poca presion, el fuelle no ' +
           'se mueve por mucho que la electronica este perfecta y la pantalla siga encendida. Por eso la ' +
           'accion inmediata que indican todos los manuales es la misma: pasar a ventilacion manual, donde ' +
           'quien empuja el gas eres tu con la bolsa y no hace falta gas motriz.',

    capa3: {
      resumen: 'Causas, alarmas y umbrales tomados de M1, M2, M3 y M4.',
      citas: [
        { t: 'Falta o baja presion de gas motriz', c: 'M1 5-4 [124]; M3 D-6 [256]; M2 p.177 [185]; M4 7-13 [143]' },
        { t: 'Fallo de valvulas (inspiratoria, PEEP, seguridad PEEP) o de sensores', c: 'M1 5-5 [125]; M3 D-6 [256]' },
        { t: 'Fallo de comunicacion entre el modulo del ventilador y el sistema', c: 'M1 5-4 [124]; M3 D-5 [255]; M2 p.178 [186]' },
        { t: 'Fallo de hardware de las tarjetas', c: 'M1 5-4 [124]; M3 D-5 [255]' },
        { t: 'Sobretemperatura o fallo de los ventiladores de refrigeracion', c: 'M4 7-7 [137]' },
        { t: 'Conmutador bolsa/ventilador que no se lee', c: 'M4 7-19 [149]' },
        { t: 'Filtro obstruido en el circuito neumatico de la valvula espiratoria', c: 'M1 5-21 [141]' },
        { t: 'Alarma "Ventilador sin gas motriz", prioridad alta: usar bolsa manual y restablecer', c: 'M4 7-13 [143]' },
        { t: 'Alarma "Device Fault, Ventilate Manually", prioridad alta', c: 'M1 5-4 [124]; M3 D-5 [255]' },
        { t: 'Alarma "Imposible mover la concertina", prioridad baja: revisar el gas impulsor, subir el gas fresco o pulsar la purga de O2', c: 'M4 7-12 [142]' },
        { t: 'Presion de gas motriz entregada: 280 a 600 kPa', c: 'M3 B-8 [230]' },
        { t: 'El interruptor de presion del gas motriz se ajusta para disparar cerca de 0,14 MPa, dentro de 0,05 a 0,2 MPa', c: 'M1 5-21 [141]' },
        { t: 'Si la alarma desaparece al poner el interruptor en cortocircuito, el interruptor esta defectuoso', c: 'M1 5-4 [124]' },
        { t: 'En servicio se usa la herramienta "Valves-test" para aislar sensores y valvulas', c: 'M1 5-59 a 5-66' }
      ],
      diferencias: 'Los nombres de las alarmas, el numero de codigos de error y la herramienta de servicio ' +
                   'cambian con cada fabricante. M2 ademas distingue gas motriz primario y secundario, y avisa ' +
                   'cuando se pasa al de respaldo; las otras maquinas no tienen esa distincion. ' +
                   'M3 separa "For Monitoring Only" (media) de "Mechanical Ventilation Failure" (alta) para ' +
                   'situaciones que en otras maquinas comparten un solo mensaje.',
      noConsta: 'No consta cuanto tarda el fuelle en responder a una falla parcial, ni que volumen entrega ' +
                'la maquina con una valvula parcialmente atascada. El simulador representa la perdida completa ' +
                'de gas motriz, que si esta documentada, y no los estados intermedios [P].'
    },

    /* La presion del gas motriz cayo a 120 kPa, muy por debajo del minimo
       de 280 kPa (M3 B-8 [230]) y por debajo del punto de disparo del
       interruptor (M1 5-21 [141]): la alarma es real, no del sensor. */
    aplicar: function (est) {
      est.ventilador.gasMotrizKPa = 120;
      est.ventilador.encendido = true;
      est.circuito.modo = 'mecanica';
      est.flujometros.o2 = 1.0;
      est.flujometros.aire = 1.0;
      est.flujometros.n2o = 0;
      est._gasMotrizRevisado = false;
      est._modoRevisado = false;
    },

    acciones: [
      {
        id: 'ventilar_manual',
        etiqueta: 'Pasar a ventilacion manual',
        proposito: 'Lo primero. El paciente no puede esperar al diagnostico.',
        tipo: 'proteccion',
        ordenRecomendado: 1,
        correcta: true,
        efecto: function (est) { est.circuito.modo = 'manual'; },
        explicacion: 'Correcto, y es el primer paso en los cuatro manuales. En ventilacion manual el gas lo ' +
                     'empujas tu con la bolsa, asi que no hace falta gas motriz ni el modulo del ventilador. ' +
                     'El paciente queda ventilado mientras diagnosticas con calma.',
        cita: 'M1 5-4 [124]; M3 D-5 [255]; M4 7-13 [143]; M2 p.178 [186]'
      },
      {
        id: 'leer_alarma',
        etiqueta: 'Leer el mensaje de alarma y su prioridad',
        proposito: 'La prioridad te dice por donde empezar.',
        tipo: 'observacion',
        ordenRecomendado: 2,
        correcta: true,
        efecto: function (est, ctx) { ctx.revelar('alarma'); },
        explicacion: 'Correcto. El mensaje distingue entre un fallo de gas motriz, uno de valvula, uno de ' +
                     'comunicacion y uno de hardware, y cada uno lleva a un sitio distinto. La prioridad alta ' +
                     'significa que la ventilacion mecanica no esta ocurriendo, no que el equipo este roto.',
        cita: 'M3 D-5 [255], D-6 [256]; M4 7-13 [143]'
      },
      {
        id: 'verificar_gas_motriz',
        etiqueta: 'Verificar la presion del gas motriz',
        proposito: 'Confirma si el empuje existe de verdad.',
        tipo: 'observacion',
        ordenRecomendado: 3,
        correcta: true,
        efecto: function (est, ctx) {
          est._gasMotrizRevisado = true;
          ctx.revelar('gasMotriz');
          ctx.descartar(['circuito', 'absorbedor']);
          ctx.sospechar('ventilador');
        },
        explicacion: 'Correcto. La presion esta en 120 kPa y el rango entregado debe ser de 280 a 600 kPa. ' +
                     'La alarma coincide con la realidad: la perdida es real, no un sensor que miente. ' +
                     'Eso descarta de golpe el circuito y el absorbedor.',
        cita: 'M3 B-8 [230]; M1 5-4 [124]'
      },
      {
        id: 'probar_interruptor',
        etiqueta: 'Probar el interruptor de presion del gas motriz',
        proposito: 'Distingue un fallo real de un sensor que miente.',
        tipo: 'prueba',
        ordenRecomendado: 4,
        correcta: 'parcial',
        efecto: function (est, ctx) { ctx.revelar('interruptor'); },
        explicacion: 'Es la prueba que separa las dos hipotesis: M1 indica poner el interruptor en ' +
                     'cortocircuito y ver si la alarma desaparece. Aqui no desaparece, porque el manometro ya ' +
                     'habia confirmado que la presion esta baja de verdad. Util para cerrar el caso, pero no ' +
                     'era necesaria.',
        cuando: 'Cuando la alarma y el manometro no coinciden: la alarma suena con presion normal, o no suena ' +
                'con presion baja. Ahi el sospechoso es el interruptor, que se ajusta para disparar cerca de ' +
                '0,14 MPa dentro de 0,05 a 0,2 MPa.',
        cita: 'M1 5-4 [124]; M1 5-21 [141]'
      },
      {
        id: 'revisar_modo',
        etiqueta: 'Revisar modo, parametros, conmutador y sello del fuelle',
        proposito: 'Descarta lo que no es averia sino ajuste.',
        tipo: 'observacion',
        ordenRecomendado: 5,
        correcta: true,
        efecto: function (est, ctx) { est._modoRevisado = true; ctx.revelar('modo'); },
        explicacion: 'Correcto, y se olvida con frecuencia. Antes de culpar al hardware hay que descartar lo ' +
                     'que no es averia: un conmutador bolsa/ventilador que la maquina no lee, el equipo que ' +
                     'quedo en el modo equivocado tras el chequeo, un parametro imposible o el sello del fuelle ' +
                     'mal puesto. Aqui el modo y el conmutador estan bien.',
        cita: 'M4 7-19 [149]; M2 p.177 [185]'
      },
      {
        id: 'subir_gas_fresco_vent',
        etiqueta: 'Subir el gas fresco o pulsar la purga de O2',
        proposito: 'Rellena la concertina si lo que falta es volumen.',
        tipo: 'observacion',
        ordenRecomendado: 0,
        correcta: 'parcial',
        efecto: function (est) { est.flujometros.o2 = 2; est.flujometros.aire = 2; },
        explicacion: 'Es exactamente lo que indica M4 para la alarma de concertina plegada: revisar el gas ' +
                     'impulsor, aumentar el gas fresco o pulsar la purga de O2. Sirve cuando la concertina no ' +
                     'sube porque le falta volumen. Aqui no sube porque le falta empuje, que es otra cosa: ' +
                     'puedes llenar el fuelle de gas y seguira sin moverse.',
        cuando: 'Cuando la concertina no alcanza el tope pero el gas motriz esta bien. Entonces el problema ' +
                'es de volumen en el circuito, no de empuje.',
        cita: 'M4 7-12 [142]'
      },
      {
        id: 'restablecer_gas_motriz',
        etiqueta: 'Restablecer el suministro de gas motriz',
        proposito: 'Corrige la causa.',
        tipo: 'correccion',
        ordenRecomendado: 6,
        correcta: function (est) { return est._gasMotrizRevisado; },
        efecto: function (est) {
          if (est._gasMotrizRevisado) est.ventilador.gasMotrizKPa = 400;
        },
        explicacion: 'Correcto. Con el gas motriz de vuelta dentro de 280 a 600 kPa, el fuelle puede volver a ' +
                     'moverse. Todavia falta devolver la maquina a ventilacion mecanica y comprobar que ' +
                     'efectivamente se mueve.',
        explicacionSiIncorrecta: 'Todavia no sabes si el gas motriz es el problema. Verifica primero su ' +
                                 'presion en el manometro: corregir a ciegas es cambiar cosas y esperar.',
        cita: 'M1 5-4 [124]; M3 B-8 [230]'
      },
      {
        id: 'volver_mecanica',
        etiqueta: 'Volver a ventilacion mecanica y comprobar',
        proposito: 'Sin esto la correccion no esta verificada.',
        tipo: 'correccion',
        ordenRecomendado: 7,
        correcta: true,
        efecto: function (est) { est.circuito.modo = 'mecanica'; },
        explicacion: 'Correcto. Una correccion sin verificacion no esta terminada: hay que ver la concertina ' +
                     'moverse otra vez y el volumen medido coincidir con el ajustado. M1 y M3 incluyen la ' +
                     'verificacion del modo mecanico en su chequeo previo al uso.',
        cita: 'M1 4.2.1; M3 6.8.1'
      },
      {
        id: 'reiniciar_equipo',
        etiqueta: 'Reiniciar el equipo',
        proposito: 'Recupera fallos de software o de comunicacion.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: 'parcial',
        efecto: function () {},
        explicacion: 'Es un paso real del procedimiento, pero va despues de descartar el gas motriz y los ' +
                     'ajustes. Un reinicio recupera un fallo de software o de comunicacion entre el modulo del ' +
                     'ventilador y el sistema; no devuelve una presion que fisicamente no esta llegando.',
        cuando: 'Cuando la alarma es de comunicacion, de reinicio anormal de software o de fallo del ' +
                'dispositivo, y el gas motriz y los ajustes ya estan descartados. Si la alarma se cancela al ' +
                'reiniciar, se puede reanudar la ventilacion; si vuelve, toca escalar.',
        cita: 'M3 D-5 [255]; M3 D-7 [257]; M2 p.178 [186]'
      },
      {
        id: 'escalar_servicio_vent',
        etiqueta: 'Escalar a servicio tecnico',
        proposito: 'Deriva la falla a quien puede abrir el equipo.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: false,
        efecto: function () {},
        explicacionSiIncorrecta: 'Todavia no. Aqui la causa esta fuera del equipo y se corrige en el sitio: ' +
                                 'el gas motriz no esta llegando con presion suficiente. Escalar antes de ' +
                                 'comprobarlo deja la maquina parada sin motivo.',
        cuando: 'Cuando la falla esta dentro del equipo: un codigo de error de hardware de las tarjetas, un ' +
                'fallo de valvula inspiratoria o de PEEP, una sobretemperatura, o una alarma que vuelve despues ' +
                'de reiniciar con el gas motriz y los ajustes ya descartados. En servicio se aisla con la ' +
                'herramienta "Valves-test" y se reemplaza la tarjeta o la valvula.',
        cita: 'M1 5-4 [124]; M1 5-59 a 5-66; M4 7-7 [137]'
      }
    ],

    verificar: function (est, calc) {
      return {
        ok: calc.ventilacion.gasMotrizOk && est.circuito.modo === 'mecanica' &&
            calc.ventilacion.vte > calc.ventilacion.vti * 0.9,
        texto: 'El fuelle vuelve a moverse, el volumen medido coincide con el ajustado y las alarmas se ' +
               'cancelan. M1 4.2.1 y M3 6.8.1 incluyen la verificacion del modo mecanico en el chequeo ' +
               'previo al uso.',
        cita: 'M1 4.2.1; M3 6.8.1'
      };
    }
  };

  /* ---------------------------------------------------------------- */
  /* ESCENARIO 3 - FALLA DEL MONITOREO DE GASES                        */
  /* ---------------------------------------------------------------- */
  var monitoreo = {
    id: 'monitoreo',
    numero: 3,
    titulo: 'Falla del monitoreo de gases',
    disponible: true,
    zonaFalla: 'monitor',
    zonasCandidatas: ['monitor', 'circuito', 'ventilador', 'absorbedor'],
    ideaPrincipal: 'El monitor puede fallar con el paciente perfectamente bien. Antes de actuar sobre el ' +
                   'paciente, contrasta la lectura con las demas senales.',

    sintoma: 'La capnografia desaparecio y el modulo dejo de dar CO2 y agente. La presion, el volumen y la ' +
             'concertina siguen normales, y la FiO2 se sigue midiendo.',

    variablesCapa1: ['etco2', 'flujo_muestra', 'fio2', 'ppico', 'vti_vte'],

    capa2: 'El modulo de gases no huele el circuito: aspira una muestra continua por una linea muy delgada ' +
           'que pasa por una trampa de agua, y mide lo que esa bomba consigue traerle. Si la linea se acoda, ' +
           'se moja o la trampa se llena, la bomba deja de mover gas y el modulo se queda ciego, aunque el ' +
           'paciente este perfectamente ventilado. Por eso las lecturas pueden desaparecer sin que al ' +
           'paciente le pase nada, y por eso lo primero no es tocar al paciente sino contrastar: la presion, ' +
           'el volumen, la concertina y la FiO2 siguen hablando. La celula de O2 esta en la rama ' +
           'inspiratoria y no en la linea de muestreo, y por eso sigue midiendo cuando el modulo ya no.',

    capa3: {
      resumen: 'Causas, alarmas y umbrales tomados de M1, M3 y M4. M2 usa monitor externo y no describe sus fallas.',
      citas: [
        { t: 'Linea de muestreo acodada u obstruida; trampa llena, parcialmente bloqueada o con gotas', c: 'M3 8-6 [114], 9-7 [131]; M4 7-11 y 7-12' },
        { t: 'Trampa de agua no conectada o de tipo incorrecto', c: 'M3 D-10 [260]; M4 7-6 [136]' },
        { t: 'Salida del gas de muestra bloqueada', c: 'M4 7-7 [137]' },
        { t: 'Falta de calibracion o de cero', c: 'M3 D-7, D-10; M4 7-6' },
        { t: 'Celula de O2 desconectada, agotada o con lectura menor al 5 %', c: 'M3 D-7 [257]; M4 7-11 [141]' },
        { t: 'Falla del modulo o de la comunicacion', c: 'M3 D-9 [259]; M4 7-9 y 7-10' },
        { t: 'La exactitud se degrada por fuga del gas de muestra, golpes o presion ciclica mayor a 10 kPa', c: 'M3 8-6, 9-7' },
        { t: 'Alarma "AG Airway Occluded", prioridad alta: bomba por debajo de 20 mL/min mas de 1 s', c: 'M3 D-9 [259]' },
        { t: 'Alarma "Linea de muestreo obstruida / Cambie D-Fend", prioridad media: trampa llena o gotas', c: 'M4 7-12, 7-11' },
        { t: 'Alarma "Compruebe la salida del gas de muestra", prioridad media', c: 'M4 7-7 [137]' },
        { t: 'Alarma "Flujo de muestra de gas bajo", prioridad baja: por debajo del 80 % del nominal durante 20 s', c: 'M4 7-10 [140]' },
        { t: 'Prueba que separa trampa de linea: desconectar la linea de la trampa y mirar si sigue el aviso', c: 'M3 8-6 [114]' },
        { t: 'Si persiste tras cambiar linea y trampa, la oclusion puede ser interna: servicio', c: 'M3 9-7 [131]' },
        { t: 'Comprobar la celula de O2 con aire ambiente: debe leer 21 %', c: 'M3 D-7 [257]; M3 7.5, 7-5 [103]' },
        { t: 'El cero del modulo de CO2 y agente es solo de servicio de fabrica', c: 'M1 4.3.7 a 4.3.10, 4-36 a 4-41' },
        { t: 'El ventilador y el modulo de gases miden presiones y flujos distintos del mismo circuito', c: 'M4 7-5 [135]' }
      ],
      diferencias: 'M2 usa un monitor externo y no describe sus fallas, mientras M1, M3 y M4 llevan modulo ' +
                   'integrado. La misma causa recibe prioridades distintas segun la maquina: la linea ' +
                   'obstruida es alta en M3 (D-9) y media en M4 (7-12). Ademas M4 7-5 [135] advierte de algo ' +
                   'que confunde mucho: el ventilador y el modulo de gases miden el mismo circuito en puntos ' +
                   'distintos, asi que pueden discrepar sin que ninguno este averiado.',
      noConsta: 'No consta como cambian las lecturas con una oclusion parcial, ni los tiempos de respuesta ' +
                'del sensor, ni los rangos de fabrica por modulo mas alla de los de M3 F-1 a F-3 [269-271]. ' +
                'El caudal nominal de la bomba de muestreo, 200 mL/min, es un supuesto de diseno [P]: M4 ' +
                'habla de un porcentaje del nominal pero no da la cifra.'
    },

    /* Tres fallos distintos dentro del mismo modulo. La seccion 5.3 del
       documento lo contempla: cada falla se presenta primero con su caso
       mas simple y luego con variantes. Cada variante hace correctas
       acciones distintas, de modo que ninguna queda de adorno. */
    variantes: [
      {
        id: 'trampa',
        nombre: 'Trampa de agua llena',
        resumen: 'La capnografia desaparece, pero la ventilacion esta perfecta. El caso mas simple y el ' +
                 'mas frecuente. Es el del entrenamiento guiado.',
        sintoma: 'La capnografia desaparecio y el modulo dejo de dar CO2 y agente. La presion, el volumen y ' +
                 'la concertina siguen normales, y la FiO2 se sigue midiendo.',
        variablesCapa1: ['etco2', 'flujo_muestra', 'fio2', 'ppico', 'vti_vte'],
        aplicar: function (est) {
          est.monitoreo.trampaAgua = 'llena';
          est.flujometros.o2 = 1.0;
          est.flujometros.aire = 1.0;
        },
        verificar: function (est, calc) {
          return {
            ok: calc.monitor.valido &&
                calc.monitor.flujoMuestra >= calc.monitor.flujoMuestraNominal * 0.8 &&
                calc.monitor.etco2 > SIM.pv('absorbedor.alarmaEtCO2Baja'),
            texto: 'Las lecturas vuelven y son coherentes con las demas variables, el caudal de muestra esta ' +
                   'en el nominal y las alarmas se cancelan.',
            cita: 'M3 6.9.2 y 6.9.8'
          };
        }
      },
      {
        id: 'celula',
        nombre: 'Celula de O2 descalibrada',
        resumen: 'La maquina avisa de FiO2 baja, pero la mezcla que estas entregando es correcta. ' +
                 'El CO2 y el agente se miden bien.',
        sintoma: 'Salta la alarma de FiO2 baja. Pero los flujometros marcan 0,5 L/min de O2 y 2,5 de aire, ' +
                 'que son un 34 % de oxigeno, y el CO2 y el agente se siguen midiendo con normalidad.',
        variablesCapa1: ['fio2', 'flujo_o2', 'etco2', 'flujo_muestra', 'ppico'],
        aplicar: function (est) {
          est.monitoreo.celulaO2 = 'descalibrada';
          est.flujometros.o2 = 0.5;
          est.flujometros.aire = 2.5;
        },
        verificar: function (est, calc) {
          return {
            ok: est.monitoreo.celulaO2 === 'ok' && calc.monitor.fio2 !== null &&
                calc.monitor.fio2 >= SIM.pv('monitoreo.fiO2AlarmaBaja'),
            texto: 'La celula vuelve a leer lo que de verdad hay en la rama inspiratoria y marca 21 % con ' +
                   'aire ambiente. La alarma se cancela sin haber tocado la mezcla.',
            cita: 'M3 7.5, 7-5 [103]; M3 D-7 [257]'
          };
        }
      },
      {
        id: 'modulo',
        nombre: 'Fallo del modulo de gases',
        resumen: 'El modulo no responde y no es un tapon: la bomba ni siquiera arranca. ' +
                 'Aqui si hay que escalar.',
        sintoma: 'El modulo de gases no da CO2 ni agente y avisa de fallo de inicio o de comunicacion. ' +
                 'La ventilacion y la FiO2 siguen normales.',
        variablesCapa1: ['etco2', 'flujo_muestra', 'fio2', 'ppico', 'vti_vte'],
        aplicar: function (est) {
          est.monitoreo.moduloGases = 'fallo';
          est.flujometros.o2 = 1.0;
          est.flujometros.aire = 1.0;
        },
        verificar: function (est, calc) {
          return {
            ok: est.monitoreo.moduloGases === 'ok' && calc.monitor.valido,
            texto: 'Con el modulo sustituido vuelven las lecturas de CO2 y agente, coherentes con el resto. ' +
                   'M3 6.9.2 y 6.9.8 prueban las alarmas de O2 y del modulo.',
            cita: 'M3 D-9 [259]; M4 7-9, 7-10'
          };
        }
      }
    ],

    aplicar: function (est, varianteId) {
      est.monitoreo.trampaAgua = 'ok';
      est.monitoreo.lineaMuestreoOcluida = false;
      est.monitoreo.celulaO2 = 'ok';
      est.monitoreo.moduloGases = 'ok';
      est.flujometros.n2o = 0;
      est._contrastado = false;
      est._localizado = false;
      est._celulaComprobada = false;
      est._reinicioProbado = false;
      est._variante = varianteId || 'trampa';
      var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
      if (v) v.aplicar(est);
    },

    acciones: [
      {
        id: 'contrastar_senales',
        etiqueta: 'Contrastar con presion, volumen y bolsa',
        proposito: 'Saber si el problema es del paciente o del monitor.',
        tipo: 'observacion',
        ordenRecomendado: 1,
        correcta: true,
        efecto: function (est, ctx) {
          est._contrastado = true;
          ctx.revelar('contraste');
          ctx.descartar(['circuito', 'ventilador', 'absorbedor']);
          ctx.sospechar('monitor');
        },
        explicacion: 'Correcto, y es el primer paso del procedimiento. La presion pico, el volumen espirado ' +
                     'y la concertina estan normales, y la FiO2 se sigue midiendo porque la celula de O2 esta ' +
                     'en la rama inspiratoria y no en la linea de muestreo. El paciente esta bien: lo que ' +
                     'fallo es el modulo. Eso descarta el circuito, el ventilador y el absorbedor de un golpe.',
        cita: 'M4 7-5 [135]'
      },
      {
        id: 'revisar_linea_acodada',
        etiqueta: 'Revisar si la linea de muestreo esta acodada',
        proposito: 'La causa mas simple y la mas frecuente.',
        tipo: 'observacion',
        ordenRecomendado: 2,
        correcta: true,
        efecto: function (est, ctx) { ctx.revelar('linea'); },
        explicacion: 'Correcto. Antes de cualquier prueba hay que mirar lo obvio: una linea pisada por una ' +
                     'rueda, atrapada bajo el paciente o acodada en una curva cerrada. Aqui la linea esta ' +
                     'libre, asi que el tapon esta en otro sitio.',
        cita: 'M3 8-6 [114]; M4 7-12'
      },
      {
        id: 'prueba_muestreo',
        etiqueta: 'Desconectar la linea de la trampa y observar',
        proposito: 'Separa si el tapon esta en la trampa o en la linea.',
        tipo: 'prueba',
        ordenRecomendado: 3,
        correcta: true,
        efecto: function (est, ctx) { est._localizado = true; ctx.abrirPrueba('muestreo'); },
        explicacion: 'Correcto. La maquina solo sabe que la bomba no mueve gas, pero no donde esta el tapon. ' +
                     'Desconectando la linea de la trampa, la bomba aspira solo a traves de la trampa: si el ' +
                     'aviso sigue, el tapon es la trampa; si desaparece, es la linea. Un gesto y dos ' +
                     'hipotesis resueltas. Y si la bomba no responde en ninguno de los dos casos, entonces no ' +
                     'hay tapon y el problema es el modulo.',
        cita: 'M3 8-6 [114]'
      },
      {
        id: 'vaciar_trampa',
        etiqueta: 'Vaciar o cambiar la trampa de agua',
        proposito: 'Corrige la causa, una vez localizada.',
        tipo: 'correccion',
        ordenRecomendado: 4,
        correcta: function (est) { return est._localizado; },
        efecto: function (est) {
          if (est._localizado) est.monitoreo.trampaAgua = 'ok';
        },
        explicacion: 'Correcto. La trampa recoge el agua que condensa el gas espirado y, cuando se llena, ' +
                     'tapa el paso. Vaciarla o cambiarla devuelve el caudal de muestra y con el las lecturas.',
        explicacionSiIncorrecta: 'Todavia no sabes si el tapon esta en la trampa o en la linea. Haz primero ' +
                                 'la prueba que las separa: cambiar consumibles a ciegas es caro y no ensena nada.',
        cita: 'M3 8-6 [114]; M4 7-12'
      },
      {
        id: 'comprobar_celula_o2',
        etiqueta: 'Comprobar la celula de O2 con aire ambiente',
        proposito: 'Verifica el otro sensor, el que no usa la linea.',
        tipo: 'prueba',
        ordenRecomendado: 0,
        correcta: function (est) { return est._variante === 'celula' ? true : 'parcial'; },
        efecto: function (est, ctx) {
          est._celulaComprobada = true;
          ctx.revelar('celula');
          if (est._variante === 'celula') { ctx.descartar(['circuito', 'ventilador']); ctx.sospechar('monitor'); }
        },
        explicacion: 'Correcto. Con aire ambiente la celula debe marcar 21 %, y ese patron lo tienes siempre ' +
                     'a mano. Aqui marca 15 %: la celula esta descalibrada y por eso avisaba de FiO2 baja con ' +
                     'una mezcla que era correcta. Fijate en que el CO2 y el agente seguian bien, porque la ' +
                     'celula esta en la rama inspiratoria y el modulo aspira por la linea de muestreo: son ' +
                     'dos caminos distintos.',
        explicacionSiIncorrecta: 'Es una prueba correcta y util, pero no para este caso: la FiO2 se esta ' +
                     'midiendo bien, asi que la celula no es el problema. Fijate en por que: la celula esta ' +
                     'en la rama inspiratoria y el modulo de CO2 y agente aspira por la linea de muestreo. ' +
                     'Son dos caminos distintos, y por eso uno puede fallar sin el otro.',
        cuando: 'Cuando la lectura que falla es la de O2: celula desconectada, agotada o leyendo por debajo ' +
                'del 5 %. Con aire ambiente debe marcar 21 %; si no, se calibra o se cambia.',
        cita: 'M3 D-7 [257]; M3 7.5, 7-5 [103]; M4 7-11 [141]'
      },
      {
        id: 'calibrar_modulo',
        etiqueta: 'Calibrar la celula con aire ambiente',
        proposito: 'Corrige lecturas presentes pero inexactas.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: function (est) {
          if (est._variante !== 'celula') return 'parcial';
          return est._celulaComprobada ? true : false;
        },
        efecto: function (est) {
          if (est._variante === 'celula' && est._celulaComprobada && est.monitoreo.celulaO2 === 'descalibrada') {
            est.monitoreo.celulaO2 = 'ok';
          }
        },
        explicacion: 'Correcto. La celula se calibra con el patron que siempre tienes delante, el aire ' +
                     'ambiente al 21 %, y vuelve a leer lo que de verdad hay en la rama inspiratoria. ' +
                     'La alarma se cancela sin haber tocado la mezcla del paciente.',
        explicacionSiIncorrecta: 'Calibrar no destapa nada. Sirve cuando las lecturas estan ahi pero son ' +
                     'inexactas o el cero fallo, no cuando la bomba no consigue aspirar ni cuando el modulo ' +
                     'no responde. Ademas, en el modulo de CO2 y agente el cero es solo de servicio de ' +
                     'fabrica: no es algo que se haga a pie de quirofano.',
        cuando: 'Cuando hay lecturas pero no cuadran, cuando el cero fallo o cuando la maquina pide ' +
                'recalibrar. Para la celula de O2 se puede hacer en el sitio con aire ambiente; para CO2 y ' +
                'agente, solo servicio de fabrica.',
        cita: 'M1 4.3.7 a 4.3.10, 4-36 a 4-41; M3 D-10 [260]'
      },
      {
        id: 'subir_ventilacion',
        etiqueta: 'Subir la ventilacion porque el EtCO2 esta bajo',
        proposito: 'Actua sobre el paciente segun la lectura.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: false,
        efecto: function (est) { est.ventilador.frecuencia = Math.min(20, est.ventilador.frecuencia + 4); },
        explicacionSiIncorrecta: 'Esta es la trampa del escenario, y la que mas dano hace en la practica. ' +
                                 'Acabas de hiperventilar a un paciente que estaba perfectamente ventilado, ' +
                                 'guiandote por un numero que la maquina no esta midiendo. El EtCO2 no esta ' +
                                 'bajo: esta ausente, que es otra cosa. Mira la presion, el volumen y la ' +
                                 'concertina antes de tocar nada.',
        cuando: 'Cuando el EtCO2 esta realmente bajo y las demas senales lo confirman: volumen minuto alto, ' +
                'curvas coherentes y modulo midiendo con normalidad. Un valor aislado nunca justifica cambiar ' +
                'la ventilacion.',
        cita: 'M4 7-5 [135]'
      },
      {
        id: 'restaurar_ventilacion',
        etiqueta: 'Devolver la ventilacion a sus parametros',
        proposito: 'Deshace un cambio que no hacia falta.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: function (est) {
          return est.ventilador.frecuencia !== SIM.pv('ventilacion.frecuencia') ? true : 'parcial';
        },
        efecto: function (est) {
          est.ventilador.frecuencia = SIM.pv('ventilacion.frecuencia');
          est.ventilador.volumenTidal = SIM.pv('ventilacion.volumenTidal');
        },
        explicacion: 'Correcto. Habias cambiado la ventilacion guiandote por una lectura que no existia, y ' +
                     'eso deja al paciente hiperventilado aunque la causa original ya este resuelta. ' +
                     'Una intervencion innecesaria no se queda en nada: hay que deshacerla.',
        explicacionSiIncorrecta: 'No hacia falta: los parametros ya estan en los valores de fabrica y no los ' +
                     'habias tocado.',
        cuando: 'Siempre que hayas cambiado la ventilacion por una lectura que luego resulto ser falsa.',
        cita: 'M3 F-4 [272]'
      },
      {
        id: 'reiniciar_modulo',
        etiqueta: 'Reconectar el modulo o reiniciar la maquina',
        proposito: 'Recupera fallos de comunicacion del modulo.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: function (est) { return est._variante === 'modulo' ? true : 'parcial'; },
        efecto: function (est, ctx) {
          est._reinicioProbado = true;
          if (est._variante === 'modulo') { ctx.descartar(['circuito', 'ventilador']); ctx.sospechar('monitor'); }
        },
        explicacion: 'Correcto como paso previo, y es obligatorio antes de escalar: un reinicio recupera un ' +
                     'fallo de comunicacion o un modulo mal asentado, y eso se descarta en un minuto. ' +
                     'Aqui no vuelve, asi que el fallo es de hardware. M3 sugiere ademas probar el modulo en ' +
                     'otra maquina para saber si el defectuoso es el modulo o la maquina.',
        explicacionSiIncorrecta: 'Es un paso real, pero va al final y para otra causa. Un reinicio recupera ' +
                     'un fallo de comunicacion o un modulo mal asentado; no vacia una trampa llena ni ' +
                     'calibra una celula.',
        cuando: 'Cuando la alarma es de inicializacion, de calibracion fallida o de comunicacion detenida, y ' +
                'ya descartaste la linea y la trampa. M3 sugiere ademas probar el modulo en otra maquina para ' +
                'saber si el defectuoso es el modulo o la maquina.',
        cita: 'M3 D-9 [259]'
      },
      {
        id: 'escalar_servicio_mon',
        etiqueta: 'Escalar a servicio: sustituir el modulo',
        proposito: 'Deriva la falla a quien puede abrir el equipo.',
        tipo: 'correccion',
        ordenRecomendado: 0,
        correcta: function (est) {
          return est._variante === 'modulo' && est._reinicioProbado;
        },
        efecto: function (est) {
          if (est._variante === 'modulo' && est._reinicioProbado) est.monitoreo.moduloGases = 'ok';
        },
        explicacion: 'Correcto, y este es el caso en el que escalar es la respuesta y no una excusa. ' +
                     'La bomba no responde ni con la linea puesta ni sin ella, asi que no hay tapon; ' +
                     'el reinicio no lo recupero, asi que no es comunicacion. Es hardware del modulo, y eso ' +
                     'se sustituye en servicio.',
        explicacionSiIncorrecta: 'Todavia no. Una trampa llena, una linea obstruida o una celula ' +
                                 'descalibrada se resuelven en el sitio en un minuto, y son con diferencia ' +
                                 'las causas mas frecuentes. Y si sospechas del modulo, antes hay que probar ' +
                                 'a reconectarlo o reiniciar: puede ser solo comunicacion.',
        cuando: 'Cuando la oclusion persiste despues de cambiar la linea y la trampa, porque entonces es ' +
                'interna; cuando hay fallo de hardware del modulo; cuando un valor sale del rango de medicion ' +
                '(overrange); o cuando hace falta el cero de fabrica del modulo de CO2 y agente.',
        cita: 'M3 9-7 [131]; M3 D-10 [260]; M4 7-9, 7-10'
      }
    ],

    verificar: function (est, calc, perfil) {
      var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
      var r = v ? v.verificar(est, calc, perfil)
                : { ok: false, texto: '', cita: '' };
      /* Una ventilacion cambiada sin motivo tambien hay que deshacerla. */
      if (r.ok && est.ventilador.frecuencia !== SIM.pv('ventilacion.frecuencia', perfil)) {
        return { ok: false, texto: r.texto, cita: r.cita };
      }
      return r;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Escenarios declarados para los ensayos siguientes                 */
  /* ---------------------------------------------------------------- */
  var pendientes = [
    /* =================================================================
       ESCENARIO 4: FALLA DEL VAPORIZADOR
       Tres variantes del mismo modulo, sorteadas al entrar:
         vacio         - el vaporizador se quedo sin agente liquido
         asiento       - esta mal bloqueado en el colector y fuga al abrirlo
         contrapresion - una obstruccion en su salida hace caer el caudal
       ================================================================= */
    {
      id: 'vaporizador',
      numero: 4,
      titulo: 'Falla del vaporizador',
      disponible: true,
      zonaFalla: 'vaporizador',
      zonasCandidatas: ['vaporizador', 'flujometros', 'absorbedor', 'circuito'],
      ideaPrincipal: 'El dial es una orden, no una medida. Lo unico que dice que el paciente recibe ' +
                     'agente es el analizador de gas.',

      sintoma: 'El analizador de agente no coincide con lo que marca el dial del vaporizador.',
      variablesCapa1: ['agente', 'nivel_vaporizador', 'fgf_entregado', 'vti_vte', 'fio2'],

      variantes: [
        {
          id: 'vacio',
          nombre: 'Vaporizador sin agente',
          resumen: 'El dial marca 2 % y el analizador no encuentra agente. La mampara esta vacia.',
          sintoma: 'Alarma de prioridad alta: no hay agente anestesico medido. El dial del vaporizador ' +
                   'marca 2 %, la ventilacion es normal y el paciente esta siendo ventilado sin anestesico ' +
                   'inhalado desde hace un rato.',
          variablesCapa1: ['agente', 'nivel_vaporizador', 'fgf_entregado', 'etco2', 'fio2'],
          aplicar: function (est) { est.vaporizador.nivelLiquidoPct = 0; },
          verificar: function (est, calc, perfil) {
            return {
              ok: est.vaporizador.nivelLiquidoPct > 0 &&
                  calc.vaporizador.desviacionPct <= SIM.pv('monitoreo.agenteDesviacionPct', perfil),
              texto: 'El vaporizador vuelve a tener agente, el analizador sube hasta coincidir con el dial ' +
                     'y las alarmas se cancelan. La verificacion no es el nivel de la ventana: es la cifra ' +
                     'del analizador.',
              cita: 'M11 3.3 [PDF 16]'
            };
          }
        },
        {
          id: 'asiento',
          nombre: 'Vaporizador mal bloqueado',
          resumen: 'Entrega menos de la mitad de lo fijado, y la fuga solo aparece con el dial abierto.',
          sintoma: 'El analizador marca 0,9 % con el dial en 2 %. La ventilacion se mantiene, pero el ' +
                   'volumen espirado quedo algo por debajo del inspirado y el vaporizador tiene agente de ' +
                   'sobra en la ventana.',
          variablesCapa1: ['agente', 'nivel_vaporizador', 'vti_vte', 'fio2', 'etco2'],
          aplicar: function (est) { est.vaporizador.bloqueado = false; },
          verificar: function (est, calc, perfil) {
            return {
              ok: est.vaporizador.bloqueado && calc.vaporizador.fugaColector === 0 &&
                  calc.vaporizador.desviacionPct <= SIM.pv('monitoreo.agenteDesviacionPct', perfil),
              texto: 'Con el vaporizador asentado y bloqueado, la prueba de fuga con el dial abierto vuelve ' +
                     'a dar un valor aceptable y el analizador coincide con el dial.',
              cita: 'M1 3-5, 3-6 [41-42]; M3 6-8 [90]'
            };
          }
        },
        {
          id: 'contrapresion',
          nombre: 'Obstruccion en la salida',
          resumen: 'Al abrir el dial cae el caudal que llega al circuito y la concertina se vacia.',
          sintoma: 'La concertina se esta quedando corta y el volumen espirado baja poco a poco, con el ' +
                   'ventilador funcionando y sin fuga en el circuito. Los flotadores de los flujometros ' +
                   'estan por debajo de lo que marcaste. El analizador de agente, en cambio, coincide con ' +
                   'el dial.',
          variablesCapa1: ['fgf_entregado', 'concertina', 'vti_vte', 'ppico', 'agente'],
          /* Tecnica de bajo flujo, 2 L/min: una caida de 1,8 L/min deja al
             circuito con 0,2 L/min, menos de lo que consume el paciente, y
             la concertina no alcanza a rellenarse. Es la situacion que
             M4 7-12 [142] resuelve subiendo el gas fresco. */
          aplicar: function (est) {
            est.vaporizador.restriccionSalida = true;
            est.flujometros.o2 = 0.6;
            est.flujometros.aire = 1.4;
            /* La falla no acaba de empezar: con 0,2 L/min llegando al
               circuito, el fuelle pierde unos 50 mL por minuto, asi que a
               los pocos minutos ya esta por debajo del tope. El escenario
               arranca en ese punto, igual que el de fuga arranca con la
               fuga ya establecida. */
            est.circuito.llenado = 0.82;
          },
          verificar: function (est, calc, perfil) {
            return {
              ok: !est.vaporizador.restriccionSalida && calc.vaporizador.caidaFgf === 0 &&
                  (calc.gasFresco.fgfFijado - calc.gasFresco.fgf) <=
                   SIM.pv('vaporizador.caidaMaximaContrapresion', perfil) &&
                  calc.ventilacion.vte > calc.ventilacion.vti * 0.9,
              texto: 'Con el vaporizador fuera de servicio el caudal vuelve a coincidir con lo fijado, la ' +
                     'concertina se rellena y el volumen espirado iguala al ajustado. La prueba de ' +
                     'contrapresion queda dentro del limite de 1 L/min.',
              cita: 'M1 3-5 [41]; M3 6-8 [90]'
            };
          }
        }
      ],

      capa2: 'Un vaporizador de insercion no mide nada ni avisa de nada: no sabe cuanto agente le queda, ni ' +
             'cuanto esta entregando, ni si esta bien enganchado en el colector. Es un dispositivo mecanico ' +
             'que divide el gas fresco en dos corrientes, una que pasa por la camara con el liquido y otra ' +
             'que la esquiva, y el dial solo decide esa proporcion. Por eso el dial es una orden y no una ' +
             'medida, y por eso la unica forma de saber que el paciente recibe agente es el analizador de ' +
             'gas. Las tres fallas de este modulo tienen eso en comun: el dial sigue marcando lo mismo ' +
             'mientras lo entregado cambia.',

      capa3: {
        resumen: 'Las pruebas y los limites salen de M1, M3 y M11. Las magnitudes de las fallas son supuestos.',
        citas: [
          { t: 'Prueba de contrapresion: con 6 L/min fijados, al encender el vaporizador el caudal no debe caer mas de 1 L/min', c: 'M1 3-5, 3-6 [41-42]; M3 6-8 [90]' },
          { t: 'Contrapresion maxima admisible en la salida del vaporizador: 150 mbar', c: 'M11 3.5 [PDF 18]' },
          { t: 'Desviacion de la salida por el gas portador: 10 % relativo, maximo 0,4 vol.%', c: 'M11 3.3 [PDF 16]' },
          { t: 'Tras un cambio de temperatura, el vaporizador necesita unos 15 min por grado para equilibrarse', c: 'M11 3.1 [PDF 14]' },
          { t: 'El chequeo previo al uso incluye comprobar el vaporizador antes de cada caso', c: 'M1 4.2.1; M3 6.8.1; M12 p.1-2' },
          { t: 'Reinhalacion segun el gas fresco: fR = 1 - FGF/MV', c: 'M9 Fig. 1 (p.44)' },
          { t: 'CO2 inspirado alto con gas fresco insuficiente', c: 'M9 p.44-45' }
        ],
        diferencias: 'La tecnologia cambia mucho entre maquinas y eso cambia las fallas posibles. M1, M3 y ' +
                     'M4 usan vaporizadores mecanicos de insercion, que son los que este escenario ' +
                     'representa. M2 usa un cassette electronico con medida interna: ahi la maquina si sabe ' +
                     'cuanto entrega y cuanto queda, y una parte de estas fallas simplemente no existe o se ' +
                     'presenta como un codigo de error. Los nombres de los colectores y el sistema de ' +
                     'bloqueo tambien son propios de cada fabricante.',
        noConsta: 'No consta en los manuales cuanto fuga un vaporizador mal bloqueado, ni cuanto cae la ' +
                  'concentracion entregada por esa fuga, ni el caudal que pierde una obstruccion concreta de ' +
                  'la salida. El simulador usa magnitudes elegidas para que las pruebas documentadas den un ' +
                  'resultado inequivoco, y estan declaradas como supuestos [P] en SUPUESTOS.md. Tampoco se ' +
                  'representa el efecto de bombeo ni el llenado con el agente equivocado.'
      },

      aplicar: function (est, varianteId) {
        est.vaporizador.instalado = true;
        est.vaporizador.bloqueado = true;
        est.vaporizador.restriccionSalida = false;
        est.vaporizador.nivelLiquidoPct = 78;
        est.vaporizador.dial = 2.0;
        est.vaporizador.dialNominal = 2.0;
        est.flujometros.o2 = 1.0;
        est.flujometros.aire = 3.0;
        est.flujometros.n2o = 0;
        est._contrastadoVap = false;
        est._nivelRevisado = false;
        est._asientoRevisado = false;
        est._fugaDialHecha = false;
        est._contrapresionHecha = false;
        est._variante = varianteId || 'vacio';
        var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
        if (v) v.aplicar(est);
      },

      acciones: [
        {
          id: 'contrastar_dial_agente',
          etiqueta: 'Contrastar el dial con el analizador de agente',
          proposito: 'Separar lo que pediste de lo que el paciente recibe.',
          tipo: 'observar', ordenRecomendado: 1, correcta: true,
          efecto: function (est, ctx) {
            est._contrastadoVap = true;
            ctx.revelar(['agente', 'nivel_vaporizador', 'fgf_entregado']);
            ctx.descartar(['ventilador', 'suministro']);
            ctx.sospechar('vaporizador');
          },
          explicacion: 'Es el primer paso de las tres variantes y el unico que sirve siempre. El dial marca ' +
                       'lo que ordenaste; el analizador, lo que hay en el gas. Si no coinciden, el problema ' +
                       'esta entre los dos, y eso es el vaporizador y su colector. Tambien acabas de ' +
                       'descartar el ventilador y el suministro sin tocarlos: la ventilacion funciona.',
          cuando: 'Siempre que una alarma hable del agente anestesico, antes de mover el dial.',
          cita: 'M11 3.3 [PDF 16]'
        },
        {
          id: 'revisar_nivel_vaporizador',
          etiqueta: 'Mirar el nivel de la ventana del vaporizador',
          proposito: 'Descartar lo mas simple: que no quede agente liquido.',
          tipo: 'observar', ordenRecomendado: 2,
          correcta: function (est) { return est._variante === 'vacio' ? true : 'parcial'; },
          efecto: function (est, ctx) { est._nivelRevisado = true; ctx.revelar(['nivel_vaporizador']); },
          explicacion: 'La ventana esta vacia. Ahi tienes la causa, y fijate en algo importante: ninguna ' +
                       'alarma te lo dijo. El vaporizador mecanico no tiene sensor de nivel, asi que la ' +
                       'maquina no puede avisar de esto. La unica forma de saberlo es mirar.',
          explicacionSiIncorrecta: 'La ventana tiene agente de sobra, asi que la causa no es el nivel. No ' +
                                   'has perdido el tiempo: mirar el nivel cuesta dos segundos y descarta la ' +
                                   'causa mas frecuente de todas. Sigue buscando, pero ya con una hipotesis ' +
                                   'menos.',
          cuando: 'Ante cualquier sospecha sobre el agente, y de rutina antes de cada caso.',
          cita: 'M1 4.2.1; M3 6.8.1'
        },
        {
          id: 'llenar_vaporizador',
          etiqueta: 'Rellenar el vaporizador con su sistema de llenado',
          proposito: 'Reponer el agente liquido.',
          tipo: 'corregir', ordenRecomendado: 3,
          correcta: function (est) {
            return est._variante === 'vacio' ? (est._nivelRevisado ? true : 'parcial') : false;
          },
          efecto: function (est) {
            if (est.vaporizador.nivelLiquidoPct <= 0) est.vaporizador.nivelLiquidoPct = 85;
          },
          explicacion: 'Rellenado y con el sistema de llenado codificado, que es el que impide meter el ' +
                       'agente equivocado. El analizador sube hasta coincidir con el dial, y esa coincidencia ' +
                       'es la verificacion de verdad: no el nivel de la ventana, sino la cifra medida en el gas.',
          explicacionSiIncorrecta: 'El vaporizador tiene agente, asi que rellenarlo no corrige nada y puede ' +
                                   'crear un problema nuevo: un vaporizador sobrellenado puede dejar pasar ' +
                                   'liquido a la corriente de gas y entregar una dosis muy por encima de la ' +
                                   'fijada. Nunca se rellena sin haber mirado el nivel.',
          cuando: 'Cuando la ventana esta por debajo de la marca de reserva o vacia.',
          cita: 'M1 4.2.1; M11 3.1 [PDF 14]'
        },
        {
          id: 'comprobar_asiento',
          etiqueta: 'Comprobar que el vaporizador esta asentado y bloqueado',
          proposito: 'Ver si esta bien enganchado en el colector.',
          tipo: 'observar', ordenRecomendado: 2,
          correcta: function (est) { return est._variante === 'asiento' ? true : 'parcial'; },
          efecto: function (est, ctx) { est._asientoRevisado = true; ctx.sospechar('vaporizador'); },
          explicacion: 'La palanca de bloqueo no llego al final y el vaporizador esta apoyado pero no ' +
                       'sellado. A la vista es casi imposible distinguirlo de uno bien puesto, y por eso no ' +
                       'basta con mirar: hay que confirmarlo con la prueba de fuga con el dial abierto.',
          explicacionSiIncorrecta: 'Esta asentado y bloqueado correctamente, asi que la fuga del colector ' +
                                   'queda descartada. Es una comprobacion que siempre vale la pena porque ' +
                                   'cuesta un gesto, pero aqui la causa es otra.',
          cuando: 'Siempre que la concentracion entregada sea menor que la fijada, y tras cambiar un vaporizador.',
          cita: 'M1 3-5, 3-6 [41-42]'
        },
        {
          id: 'prueba_fuga_dial',
          etiqueta: 'Prueba de fuga con el dial cerrado y con el dial abierto',
          proposito: 'Averiguar si la fuga nace en el vaporizador.',
          tipo: 'prueba', ordenRecomendado: 3,
          correcta: function (est) { return est._variante === 'asiento' ? true : 'parcial'; },
          efecto: function (est, ctx) { est._fugaDialHecha = true; ctx.abrirPrueba('fugaDial'); },
          explicacion: 'Esta es la prueba que decide. Con el dial cerrado el circuito aguanta; con el dial ' +
                       'abierto aparece una fuga grande. Esa diferencia solo puede venir del propio ' +
                       'vaporizador o de su colector, porque es el unico camino que se abre al girar el dial. ' +
                       'Por eso el chequeo previo al uso se repite con cada vaporizador encendido: con todos ' +
                       'cerrados, esta fuga no se ve.',
          explicacionSiIncorrecta: 'La prueba sale igual con el dial cerrado y con el dial abierto, asi que ' +
                                   'no hay fuga en el colector. Sirvio para descartar, aunque no era la ' +
                                   'causa de esta falla.',
          cuando: 'Cuando el agente entregado es menor que el fijado y el nivel es normal.',
          cita: 'M1 3-5, 3-6 [41-42]; M3 6-8 [90]; M12 p.1-2'
        },
        {
          id: 'reasentar_vaporizador',
          etiqueta: 'Reasentar y bloquear el vaporizador en el colector',
          proposito: 'Cerrar la fuga del colector.',
          tipo: 'corregir', ordenRecomendado: 4,
          correcta: function (est) {
            if (est._variante !== 'asiento') return false;
            return (est._asientoRevisado || est._fugaDialHecha) ? true : 'parcial';
          },
          efecto: function (est) { est.vaporizador.bloqueado = true; },
          explicacion: 'Retirado, vuelto a asentar y bloqueado hasta el final del recorrido de la palanca. ' +
                       'El analizador sube hasta el dial y la fuga desaparece. Repite la prueba con el dial ' +
                       'abierto para confirmarlo, porque una correccion sin verificacion no es una correccion.',
          explicacionSiIncorrecta: 'El vaporizador ya estaba bien bloqueado, asi que esto no cambia nada. ' +
                                   'Reasentar a ciegas, sin haber comprobado el asiento ni hecho la prueba, ' +
                                   'es una de esas acciones que a veces aciertan por casualidad y dejan al ' +
                                   'usuario sin saber que pasaba.',
          cuando: 'Cuando la fuga aparece solo con el dial abierto.',
          cita: 'M1 3-5 [41]'
        },
        {
          id: 'prueba_contrapresion',
          etiqueta: 'Prueba de contrapresion: 6 L/min y abrir el dial',
          proposito: 'Medir cuanto cae el caudal al encender el vaporizador.',
          tipo: 'prueba', ordenRecomendado: 3,
          correcta: function (est) { return est._variante === 'contrapresion' ? true : 'parcial'; },
          efecto: function (est, ctx) { est._contrapresionHecha = true; ctx.abrirPrueba('contrapresion'); },
          explicacion: 'Es la prueba del chequeo previo al uso y aqui es la que da el diagnostico. Se fijan ' +
                       '6 L/min, se abre el dial y se mira el flotador: el manual no admite una caida mayor ' +
                       'de 1 L/min. Una caida grande significa que el gas encuentra una resistencia dentro ' +
                       'del vaporizador o en su salida, y eso explica a la vez el caudal bajo y el CO2 ' +
                       'inspirado alto, porque con poco gas fresco el paciente reinhala su propio aire.',
          explicacionSiIncorrecta: 'La caida esta dentro del limite de 1 L/min, asi que la salida del ' +
                                   'vaporizador esta libre. La prueba descarta la obstruccion, que era una ' +
                                   'hipotesis razonable, pero la causa es otra.',
          cuando: 'Cuando el caudal entregado no coincide con el fijado, o el CO2 inspirado sube sin motivo claro.',
          cita: 'M1 3-5, 3-6 [41-42]; M3 6-8 [90]'
        },
        {
          id: 'escalar_servicio_vap',
          etiqueta: 'Retirar el vaporizador de servicio y escalar a tecnico',
          proposito: 'Sacar de uso un componente que no se repara en quirofano.',
          tipo: 'corregir', ordenRecomendado: 5,
          correcta: function (est) {
            if (est._variante !== 'contrapresion') return false;
            return est._contrapresionHecha ? true : 'parcial';
          },
          efecto: function (est) {
            if (est._variante === 'contrapresion') {
              est.vaporizador.restriccionSalida = false;
              est.vaporizador.bloqueado = true;
            }
          },
          explicacion: 'Correcto, y es el unico caso de este modulo en el que escalar es la respuesta. Una ' +
                       'obstruccion interna no se corrige reasentando ni rellenando: el vaporizador se ' +
                       'retira, se monta otro y el caudal vuelve a coincidir con lo fijado. Mientras no haya ' +
                       'sustituto, la anestesia se mantiene por via intravenosa, no subiendo el dial de un ' +
                       'vaporizador averiado.',
          explicacionSiIncorrecta: 'Esta falla se corrige en el quirofano y en un gesto, asi que escalar ' +
                                   'significa dejar el caso detenido por algo que podias resolver. Escalar ' +
                                   'es correcto cuando una prueba ha demostrado que el componente esta ' +
                                   'averiado por dentro, no cuando todavia no sabes que pasa.',
          cuando: 'Cuando una prueba demuestra una averia interna del vaporizador.',
          cita: 'M1 3-5 [41]'
        },
        {
          id: 'subir_gas_fresco',
          etiqueta: 'Subir el gas fresco para sostener la ventilacion',
          proposito: 'Ganar tiempo: rellenar la concertina mientras se diagnostica.',
          tipo: 'ajustar', ordenRecomendado: 2,
          correcta: function (est) { return est._variante === 'contrapresion' ? true : 'parcial'; },
          efecto: function (est) {
            est.flujometros.o2 = Math.min(6, est.flujometros.o2 + 1.4);
            est.flujometros.aire = Math.min(6, est.flujometros.aire + 2.6);
          },
          explicacion: 'Correcto, y es la medida que pide el manual ante una concertina que no se rellena: ' +
                       'revisar el gas impulsor, subir el gas fresco o pulsar la purga de O2. Mas gas fresco ' +
                       'compensa lo que se pierde por el camino y la concertina vuelve a llenarse, asi que la ' +
                       'ventilacion se sostiene mientras averiguas que pasa. Ojo: esto no arregla nada, solo ' +
                       'te compra tiempo. La obstruccion sigue ahi.',
          explicacionSiIncorrecta: 'No hace dano y en el fondo ayuda un poco, porque con mas gas fresco se ' +
                                   'pierde proporcionalmente menos por la fuga. Pero no es la causa ni la ' +
                                   'corrige: aqui el circuito recibe el gas que pediste y la concertina esta ' +
                                   'llena. Subir el gas fresco es la medida para una concertina que no se ' +
                                   'rellena, no para un agente que no coincide con el dial.',
          cuando: 'Cuando la concertina no alcanza a rellenarse, como medida inmediata antes del diagnostico.',
          cita: 'M4 7-12 [142]'
        },
        {
          id: 'subir_dial',
          etiqueta: 'Subir el dial porque el agente medido esta bajo',
          proposito: 'Compensar la lectura baja subiendo la concentracion fijada.',
          tipo: 'ajustar', ordenRecomendado: 9, correcta: false,
          efecto: function (est) { est.vaporizador.dial = 4.0; },
          explicacion: 'Subido a 4 %.',
          explicacionSiIncorrecta: 'Esta es la trampa del escenario, y es la reaccion mas natural del mundo. ' +
                                   'Si el vaporizador esta vacio, subir el dial de un deposito vacio no ' +
                                   'entrega nada; si la fuga esta en el colector, subir el dial manda mas ' +
                                   'agente a la fuga; y si hay una obstruccion, empeora la caida de caudal. ' +
                                   'Lo peligroso viene despues: cuando corrijas la causa real con el dial en ' +
                                   '4 %, el paciente recibira el doble de lo que necesitas. El dial queda en ' +
                                   '4 % y el escenario no se dara por resuelto hasta que lo devuelvas a su ' +
                                   'valor.',
          cuando: 'Nunca como respuesta a una discrepancia sin diagnosticar. Ajustar la profundidad anestesica ' +
                  'es otra cosa, y se hace sobre un vaporizador que se sabe sano.',
          cita: 'M11 3.3 [PDF 16]'
        },
        {
          id: 'restaurar_dial',
          etiqueta: 'Devolver el dial a su valor inicial',
          proposito: 'Deshacer el ajuste hecho a ciegas.',
          tipo: 'ajustar', ordenRecomendado: 10,
          correcta: function (est) {
            return Math.abs(est.vaporizador.dial - est.vaporizador.dialNominal) > 0.01 ? true : 'parcial';
          },
          efecto: function (est) { est.vaporizador.dial = est.vaporizador.dialNominal; },
          explicacion: 'Bien. El dial vuelve a 2 %, que es la dosis que decidiste para este paciente. Una ' +
                       'maquina reparada con un ajuste de mas no esta reparada: esta esperando a sobredosificar ' +
                       'en cuanto todo lo demas funcione.',
          explicacionSiIncorrecta: 'El dial ya esta en su valor inicial, asi que no habia nada que deshacer.',
          cuando: 'Siempre que hayas movido el dial sin un motivo clinico.',
          cita: 'M11 3.3 [PDF 16]'
        }
      ],

      verificar: function (est, calc, perfil) {
        var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
        var base = v ? v.verificar(est, calc, perfil) : { ok: false, texto: '', cita: '' };
        if (base.ok && Math.abs(est.vaporizador.dial - est.vaporizador.dialNominal) > 0.01) {
          return {
            ok: false,
            texto: 'La causa esta corregida, pero el dial sigue en ' +
                   est.vaporizador.dial.toFixed(1).replace('.', ',') + ' % en lugar de ' +
                   est.vaporizador.dialNominal.toFixed(1).replace('.', ',') + ' %.',
            cita: base.cita
          };
        }
        return base;
      }
    },

    /* =================================================================
       ESCENARIO 6: ABSORBEDOR DE CO2
       Tres variantes que comparten el mismo sintoma, CO2 inspirado donde
       no deberia haberlo, y se diagnostican de forma distinta:
         agotado   - la cal esta gastada y el color lo dice
         color     - la cal esta gastada y el color miente
         valvula   - la cal esta bien y lo que no cierra es una valvula
       ================================================================= */
    {
      id: 'absorbedor',
      numero: 6,
      titulo: 'Reinhalacion de CO2',
      disponible: true,
      zonaFalla: 'absorbedor',
      zonasCandidatas: ['absorbedor', 'circuito', 'monitor', 'ventilador'],
      ideaPrincipal: 'En un circuito circular la linea base del capnograma debe tocar el suelo. Si no lo ' +
                     'toca, el paciente esta reinhalando su CO2, y eso tiene tres causas distintas.',

      sintoma: 'La linea base del capnograma no vuelve a cero: hay CO2 en el gas inspirado.',
      variablesCapa1: ['fico2', 'etco2', 'color_absorbente', 'temp_canister', 'fgf_entregado'],

      variantes: [
        {
          id: 'agotado',
          nombre: 'Cal agotada, y el color lo dice',
          resumen: 'CO2 inspirado, cal violeta y canister frio. El caso de libro.',
          sintoma: 'La linea base del capnograma no vuelve a cero y el EtCO2 subio por encima de su limite. ' +
                   'Se esta trabajando con 2 L/min de gas fresco.',
          variablesCapa1: ['fico2', 'etco2', 'color_absorbente', 'temp_canister', 'fgf_entregado'],
          /* Avance por encima de 1: la cal ya no retiene nada, y por eso el
             canister esta frio. Es lo que hace coherente el cuadro completo. */
          aplicar: function (est) {
            est.circuito.absorbedorAvance = 1.05;
            est.circuito.colorVirado = 0.95;
          },
          verificar: function (est, calc, perfil) {
            var umbral = SIM.pv('absorbedor.alarmaFiCO2Alta', perfil);
            return {
              ok: est.circuito.absorbedorAvance < 0.5 && calc.monitor.fico2 <= umbral,
              texto: 'Con cal nueva la linea base del capnograma vuelve a tocar el suelo y el CO2 inspirado ' +
                     'cae por debajo de los ' + umbral + ' mmHg del limite. Esa linea base es la ' +
                     'verificacion: el color de la cal nueva no demuestra nada por si solo.',
              cita: 'M9 p.43 y p.48; M3 F-1 [269]'
            };
          }
        },
        {
          id: 'color',
          nombre: 'Cal agotada, y el color miente',
          resumen: 'El mismo CO2 inspirado, pero la cal se ve blanca. El canister frio es lo que la delata.',
          sintoma: 'La linea base del capnograma no vuelve a cero y el EtCO2 sube despacio, pero la cal del ' +
                   'absorbedor se ve blanca, como recien cambiada. El canister se cambio hace dias y la ' +
                   'maquina estuvo sin usarse el fin de semana.',
          variablesCapa1: ['fico2', 'color_absorbente', 'temp_canister', 'etco2', 'fgf_entregado'],
          aplicar: function (est) {
            est.circuito.absorbedorAvance = 1.05;
            est.circuito.colorEnganoso = true;
            est.circuito.colorVirado = 0.08;
          },
          verificar: function (est, calc, perfil) {
            var umbral = SIM.pv('absorbedor.alarmaFiCO2Alta', perfil);
            return {
              ok: est.circuito.absorbedorAvance < 0.5 && calc.monitor.fico2 <= umbral,
              texto: 'Con cal nueva de verdad, el CO2 inspirado cae por debajo de los ' + umbral + ' mmHg y la ' +
                     'linea base vuelve al suelo. El color seguia siendo blanco antes y despues del cambio: ' +
                     'por eso no servia para decidir.',
              cita: 'M9 p.43 y p.48'
            };
          }
        },
        {
          id: 'valvula',
          nombre: 'Valvula unidireccional que no cierra',
          resumen: 'CO2 inspirado con cal nueva y canister templado: el absorbedor esta bien y no es el culpable.',
          sintoma: 'La linea base del capnograma no vuelve a cero, pero la cal se ve blanca y el absorbedor ' +
                   'se cambio esta manana. El EtCO2 sube y las presiones del circuito son normales.',
          variablesCapa1: ['fico2', 'color_absorbente', 'temp_canister', 'etco2', 'vti_vte'],
          aplicar: function (est) {
            est.circuito.absorbedorAvance = 0.10;
            est.circuito.colorVirado = 0.09;
            est.circuito.valvulaIncompetente = true;
          },
          verificar: function (est, calc, perfil) {
            var umbral = SIM.pv('absorbedor.alarmaFiCO2Alta', perfil);
            return {
              ok: !est.circuito.valvulaIncompetente && calc.monitor.fico2 <= umbral,
              texto: 'Con la valvula sustituida el CO2 inspirado desaparece y la cal sigue siendo la misma, ' +
                     'que es la prueba de que nunca fue el absorbedor. Cambiar el canister aqui habria ' +
                     'gastado un canister y dejado el problema intacto.',
              cita: 'M9 p.43; M12 p.1-2'
            };
          }
        }
      ],

      capa2: 'Un circuito circular funciona porque el gas da siempre la misma vuelta: el paciente espira, el ' +
             'CO2 pasa por la cal sodada que lo retiene, y lo que vuelve al paciente ya no tiene CO2. Dos ' +
             'piezas garantizan eso: la cal, que lo absorbe, y las valvulas unidireccionales, que obligan al ' +
             'gas a pasar por ella en lugar de volverse por donde vino. Si falla cualquiera de las dos, el ' +
             'paciente reinhala su propio CO2, y el sintoma es el mismo: la linea base del capnograma deja de ' +
             'tocar el suelo. El gas fresco es la tercera pieza, porque lo que entra nuevo diluye lo que ' +
             'vuelve: con poco gas fresco se reinhala mas, y por eso estas fallas aparecen antes en tecnica ' +
             'de bajo flujo.',

      capa3: {
        resumen: 'Criterios, umbrales y la relacion con el gas fresco salen de M9, M3, M6 y M8.',
        citas: [
          { t: 'Fraccion reinhalada en funcion del gas fresco: fR = 1 - FGF/MV', c: 'M9 Fig. 1 (p.44)' },
          { t: 'CO2 inspirado frente al gas fresco sin absorbente efectivo', c: 'M9 p.44-45' },
          { t: 'Criterio de cambio del absorbente: CO2 inspirado por encima de 0,5 % (3-4 mmHg)', c: 'M9 p.43 y p.48' },
          { t: 'Otro criterio en uso: 5 mmHg de CO2 inspirado', c: 'M8 3.1.3' },
          { t: 'Limite de fabrica de la alarma de CO2 inspirado: 4 mmHg', c: 'M3 F-1 [269]' },
          { t: 'Limite de fabrica de EtCO2 alto: 50 mmHg', c: 'M3 F-1 [269]' },
          { t: 'EtCO2 = FiCO2 + VCO2/MV', c: 'M9 p.46' },
          { t: 'Vida util del absorbente: 80-125 min por 100 g in vitro, con MV 5 L/min y VCO2 0,160 L/min', c: 'M9 Tabla II (p.45)' },
          { t: 'Carga de un canister: unos 2 kg de cal sodada', c: 'M6 5.6 p.19' },
          { t: 'Produccion de CO2 del adulto anestesiado: 0,13-0,16 L/min', c: 'M9 p.44' }
        ],
        diferencias: 'El criterio de cambio no es unico: M9 usa 0,5 % de CO2 inspirado y M8 usa 5 mmHg, que ' +
                     'son valores parecidos pero no identicos. La vida util de la Tabla II de M9 es in vitro y ' +
                     'con una ventilacion concreta, asi que en la practica depende del paciente, del flujo y ' +
                     'del tipo de absorbente. Los indicadores de color tambien cambian: el viraje y su ' +
                     'reversibilidad dependen del colorante que use cada fabricante.',
        noConsta: 'No consta en las fuentes citadas cuanto CO2 devuelve una valvula unidireccional ' +
                  'incompetente, ni a que temperatura llega un canister en reaccion, ni en cuanto tiempo ' +
                  'revierte el color de una cal en reposo. Las tres cosas estan declaradas como supuestos [P] ' +
                  'en SUPUESTOS.md. Tampoco se representa la degradacion del agente por la cal desecada ni la ' +
                  'produccion de monoxido de carbono, que son fenomenos reales y documentados en la ' +
                  'literatura pero no en los manuales de este trabajo.'
      },

      aplicar: function (est, varianteId) {
        est.circuito.absorbedorInstalado = true;
        est.circuito.colorEnganoso = false;
        est.circuito.valvulaIncompetente = false;
        est.circuito.fugaQ30 = 0;
        est.circuito.modo = 'mecanica';
        est.flujometros.o2 = 1.0;
        est.flujometros.aire = 1.0;
        est.flujometros.n2o = 0;
        est._fgfNominal = 2.0;
        est._lineaBaseLeida = false;
        est._colorRevisado = false;
        est._canisterPalpado = false;
        est._valvulasRevisadas = false;
        est._variante = varianteId || 'agotado';
        var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
        if (v) v.aplicar(est);
      },

      acciones: [
        {
          id: 'leer_linea_base',
          etiqueta: 'Leer la linea base del capnograma',
          proposito: 'Confirmar que hay CO2 inspirado y no solo EtCO2 alto.',
          tipo: 'observar', ordenRecomendado: 1, correcta: true,
          efecto: function (est, ctx) {
            est._lineaBaseLeida = true;
            ctx.revelar(['fico2', 'color_absorbente', 'temp_canister']);
            ctx.descartar(['suministro', 'ventilador']);
            ctx.sospechar('absorbedor');
          },
          explicacion: 'Correcto, y es el paso que define el problema. Un EtCO2 alto por si solo puede ser ' +
                       'hipoventilacion, fiebre o mil cosas del paciente. Lo que no admite discusion es una ' +
                       'linea base que no toca el suelo: eso solo puede significar que el gas que entra ya ' +
                       'trae CO2, y el gas que entra lo prepara la maquina. Acabas de pasar de un problema ' +
                       'del paciente a un problema del circuito.',
          cuando: 'Siempre que el EtCO2 suba, antes de cambiar la ventilacion.',
          cita: 'M9 p.43 y p.46; M3 F-1 [269]'
        },
        {
          id: 'subir_gas_fresco_abs',
          etiqueta: 'Subir el gas fresco para diluir el CO2 que vuelve',
          proposito: 'Medida inmediata: proteger al paciente mientras se diagnostica.',
          tipo: 'ajustar', ordenRecomendado: 2, correcta: true,
          efecto: function (est) { est.flujometros.o2 = 2.0; est.flujometros.aire = 2.0; },
          explicacion: 'Correcto, y funciona en las tres causas posibles, que es justo lo que se necesita de ' +
                       'una medida inmediata: sirve antes de saber que pasa. La reinhalacion depende del gas ' +
                       'fresco, fR = 1 - FGF/MV, asi que subirlo diluye lo que vuelve y el CO2 inspirado baja ' +
                       'de inmediato. Lo que no hace es arreglar nada: estas tapando el problema con gas, y ' +
                       'eso cuesta agente y cuesta dinero. Ahora diagnostica.',
          cuando: 'En cuanto confirmes CO2 inspirado, antes incluso de saber la causa.',
          cita: 'M9 Fig. 1 (p.44); M9 p.44-45'
        },
        {
          id: 'revisar_color',
          etiqueta: 'Mirar el color de la cal en el canister',
          proposito: 'Lo mas rapido: ver si el indicador ya viro.',
          tipo: 'observar', ordenRecomendado: 3,
          correcta: function (est) { return est._variante === 'agotado' ? true : 'parcial'; },
          efecto: function (est, ctx) { est._colorRevisado = true; ctx.revelar(['color_absorbente']); },
          explicacion: 'La cal esta violeta en casi todo el canister: viro, y coincide con el CO2 inspirado ' +
                       'que estas midiendo. Cuando el color y el capnograma dicen lo mismo, el diagnostico ' +
                       'esta hecho en dos segundos y sin herramientas.',
          explicacionSiIncorrecta: 'La cal se ve blanca, y aqui esta la leccion mas importante de este ' +
                                   'escenario: eso no demuestra que la cal sirva. El color es una ayuda, no ' +
                                   'un criterio. Los manuales no cambian el absorbente por el color: lo ' +
                                   'cambian por el CO2 inspirado. Mirar no sobra, pero no te puedes quedar aqui.',
          cuando: 'Siempre, porque cuesta dos segundos. Nunca como unico criterio.',
          cita: 'M9 p.43 y p.48'
        },
        {
          id: 'palpar_canister',
          etiqueta: 'Palpar el canister: temperatura de la reaccion',
          proposito: 'Distinguir una cal que trabaja de una cal que ya no reacciona.',
          tipo: 'observar', ordenRecomendado: 4,
          correcta: function (est) { return est._variante === 'agotado' ? 'parcial' : true; },
          efecto: function (est, ctx) { est._canisterPalpado = true; ctx.revelar(['temp_canister']); },
          explicacion: 'Este es el gesto que resuelve la ambiguedad del color, y no cuesta nada: la mano ' +
                       'encima del canister. La cal sodada se calienta mientras absorbe, porque la reaccion ' +
                       'con el CO2 desprende calor. Un canister templado con el paciente ventilando significa ' +
                       'que ahi dentro esta pasando algo; uno frio, que no. Es informacion que el color no ' +
                       'puede darte y que ningun sensor de la maquina mide.',
          explicacionSiIncorrecta: 'Esta frio, lo cual confirma lo que el color ya te habia dicho. No sobra, ' +
                                   'pero aqui no hacia falta: cuando el color y el capnograma coinciden, ya ' +
                                   'tienes el diagnostico.',
          cuando: 'Cuando hay CO2 inspirado y la cal se ve blanca. Ahi el color no decide y la temperatura si.',
          cita: 'Fundamento quimico de la reaccion. Temperaturas concretas: supuesto [P]'
        },
        {
          id: 'cambiar_canister',
          etiqueta: 'Cambiar el canister de cal sodada',
          proposito: 'Reponer el absorbente gastado.',
          tipo: 'corregir', ordenRecomendado: 5,
          correcta: function (est) {
            if (est._variante === 'valvula') return false;
            if (est._variante === 'agotado') return est._colorRevisado ? true : 'parcial';
            return est._canisterPalpado ? true : 'parcial';
          },
          efecto: function (est) {
            if (est._variante !== 'valvula') {
              est.circuito.absorbedorAvance = 0.05;
              est.circuito.colorEnganoso = false;
              est.circuito.colorVirado = 0.045;
            }
          },
          explicacion: 'Cal nueva, y el CO2 inspirado desaparece. Fijate en cual es la verificacion: no es ' +
                       'que la cal se vea blanca, porque en una de estas variantes ya se veia blanca antes. ' +
                       'Es que la linea base del capnograma vuelve a tocar el suelo.',
          explicacionSiIncorrecta: 'Aqui la cal esta nueva y funcionando: el canister esta templado, que es ' +
                                   'la prueba de que sigue reaccionando. Cambiarlo gasta un canister, cuesta ' +
                                   'tiempo con el paciente reinhalando y deja el problema intacto, porque el ' +
                                   'CO2 vuelve sin pasar por la cal. El absorbente no es el culpable de todo ' +
                                   'CO2 inspirado: es solo el sospechoso mas frecuente.',
          cuando: 'Cuando el CO2 inspirado pasa del umbral y el canister esta frio, con o sin color virado.',
          cita: 'M9 p.43 y p.48; M8 3.1.3'
        },
        {
          id: 'revisar_valvulas',
          etiqueta: 'Observar los discos de las valvulas unidireccionales',
          proposito: 'Ver si el gas puede volverse por donde vino.',
          tipo: 'observar', ordenRecomendado: 5,
          correcta: function (est) { return est._variante === 'valvula' ? true : 'parcial'; },
          efecto: function (est, ctx) {
            est._valvulasRevisadas = true;
            if (est._variante === 'valvula') ctx.sospechar('circuito');
          },
          explicacion: 'El disco de la valvula no se asienta: queda un paso abierto por el que el gas ' +
                       'espirado vuelve al paciente sin haber pasado por la cal. Eso explica todo lo que ' +
                       'estas viendo, incluido lo que te desconcertaba: hay CO2 inspirado con un absorbedor ' +
                       'perfectamente sano, porque el CO2 no llega a tocarlo. Las valvulas son las que ' +
                       'obligan al gas a dar la vuelta en un solo sentido, y sin ellas el circuito circular ' +
                       'deja de ser circular.',
          explicacionSiIncorrecta: 'Los discos asientan bien y el gas da la vuelta como debe. Era una ' +
                                   'hipotesis razonable y descartarla tiene valor, pero en esta falla el ' +
                                   'problema esta en la cal, no en el camino.',
          cuando: 'Cuando hay CO2 inspirado con la cal nueva y el canister templado.',
          cita: 'M12 p.1-2; M9 p.43'
        },
        {
          id: 'escalar_valvula',
          etiqueta: 'Escalar a servicio: sustituir la valvula',
          proposito: 'Cambiar una pieza que no se arregla en quirofano.',
          tipo: 'corregir', ordenRecomendado: 6,
          correcta: function (est) {
            if (est._variante !== 'valvula') return false;
            return est._valvulasRevisadas ? true : 'parcial';
          },
          efecto: function (est) {
            if (est._variante === 'valvula' && est._valvulasRevisadas) {
              est.circuito.valvulaIncompetente = false;
            }
          },
          explicacion: 'Correcto. Un disco deformado o mal asentado se sustituye, no se recoloca a mano en ' +
                       'medio de un caso. Con la valvula nueva el CO2 inspirado desaparece y la cal sigue ' +
                       'siendo la misma del principio: ahi tienes la prueba de que nunca fue el absorbedor. ' +
                       'Mientras llega el repuesto, el gas fresco alto sostiene la situacion.',
          explicacionSiIncorrecta: 'Las valvulas estan bien. Escalar aqui es mandar a revisar una pieza sana ' +
                                   'mientras el paciente sigue reinhalando CO2 por una causa que podias ' +
                                   'resolver tu en un minuto cambiando el canister.',
          cuando: 'Cuando una observacion demuestra que el disco no asienta.',
          cita: 'M12 p.1-2'
        },
        {
          id: 'bajar_gas_fresco',
          etiqueta: 'Bajar el gas fresco para ahorrar agente',
          proposito: 'Volver a flujos bajos para gastar menos.',
          tipo: 'ajustar', ordenRecomendado: 9, correcta: false,
          efecto: function (est) { est.flujometros.o2 = 0.5; est.flujometros.aire = 0.5; },
          explicacion: 'Gas fresco bajado a 1 L/min.',
          explicacionSiIncorrecta: 'Esta es la trampa del escenario, y es tentadora porque la economia de ' +
                                   'gas es un buen reflejo: en condiciones normales, bajar el flujo ahorra ' +
                                   'agente y dinero sin perjudicar a nadie. Pero el bajo flujo se apoya en ' +
                                   'que el absorbedor funciona. La reinhalacion es fR = 1 - FGF/MV, asi que ' +
                                   'al bajar el gas fresco con CO2 volviendo, lo que sube es el CO2 ' +
                                   'inspirado: acabas de hacer exactamente lo contrario de lo que el paciente ' +
                                   'necesita. El escenario no se dara por resuelto con el gas fresco por ' +
                                   'debajo del inicial; subelo con las perillas de O2 y aire.',
          cuando: 'Cuando el absorbedor funciona y el capnograma tiene la linea base en cero. Nunca antes.',
          cita: 'M9 Fig. 1 (p.44); M9 p.44-45'
        }
      ],

      verificar: function (est, calc, perfil) {
        var v = this.variantes.filter(function (x) { return x.id === est._variante; })[0];
        var base = v ? v.verificar(est, calc, perfil) : { ok: false, texto: '', cita: '' };
        var fgf = est.flujometros.o2 + est.flujometros.aire + est.flujometros.n2o;
        if (base.ok && fgf < (est._fgfNominal || 1.0) - 0.05) {
          return {
            ok: false,
            texto: 'La causa esta corregida, pero el gas fresco quedo en ' + fgf.toFixed(1).replace('.', ',') +
                   ' L/min, por debajo del inicial. Con la reinhalacion ya resuelta no es peligroso, pero ' +
                   'dejaste el circuito con menos margen del que tenia al empezar.',
            cita: 'M9 Fig. 1 (p.44)'
          };
        }
        return base;
      }
    }
  ];

  var lista = [fuga, ventilador, monitoreo, perdidaO2].concat(pendientes);
  lista.sort(function (a, b) { return a.numero - b.numero; });

  function porId(id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  return { lista: lista, porId: porId };
})();
