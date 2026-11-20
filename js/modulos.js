/* =====================================================================
   modulos.js  -  Contenido de los ocho modulos de la maquina
   ---------------------------------------------------------------------
   Sirve al modo "Conocer la maquina": para cada zona de la vista frontal,
   que es, que hace, en que se nota cuando falla y de donde sale cada dato.
   Mismo esquema de tres capas: lo esencial a la vista, el por que en la
   capa 2 y la cita en la capa 3.
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.modulos = (function () {
  'use strict';

  var M = {

    /* ------------------------------------------------------------ */
    monitor: {
      nombre: 'Monitor y alarmas',
      queEs: 'La pantalla donde la maquina muestra lo que mide y avisa cuando algo sale del rango.',
      queHace: 'Presenta las curvas de presion de via aerea y de CO2, los valores numericos y las alarmas. ' +
               'Cada alarma tiene una prioridad que define su color y su sonido.',
      variables: ['ppico', 'etco2', 'fio2'],
      capa2: 'La prioridad no es un adorno: ordena la atencion. Una alarma de prioridad alta avisa de algo que ' +
             'amenaza la vida y por eso parpadea rapido en rojo; una media parpadea lento en amarillo y una baja ' +
             'se queda fija. Pausar el audio no corrige nada: la alarma vuelve si la condicion sigue presente.',
      fallos: [
        'Las lecturas desaparecen pero presion, volumen y concertina siguen normales: el tapon esta en la linea de muestreo.',
        'Una alarma aparece con los manometros normales: sospecha del sensor o del interruptor, no del gas.',
        'La FiO2 sigue y el CO2 no: son dos caminos distintos, y eso ya localiza la falla.',
        'La pausa de audio dura 120 s y despues la alarma vuelve a sonar.',
        'Si varias alarmas suenan a la vez, la de prioridad mas alta es la que marca el primer paso.'
      ],
      efectos: [
        'El modulo de CO2 y agente aspira una muestra por una linea delgada que pasa por una trampa de agua.',
        'La celula de O2 esta en la rama inspiratoria: no usa esa linea, y por eso puede seguir midiendo cuando el modulo ya no.',
        'Si la bomba no mueve gas, el modulo se queda ciego aunque el paciente este perfectamente ventilado.',
        'El ventilador y el modulo miden el mismo circuito en puntos distintos: pueden discrepar sin que ninguno falle.',
        'Una lectura ausente no es lo mismo que una lectura baja. Contrasta antes de actuar sobre el paciente.'
      ],
      rangos: [
        { q: 'Via aerea ocluida', v: 'bomba por debajo de 20 mL/min durante mas de 1 s', ev: 'M', c: 'M3 D-9 [259]' },
        { q: 'Flujo de muestra bajo', v: 'por debajo del 80 % del nominal durante 20 s', ev: 'M', c: 'M4 7-10 [140]' },
        { q: 'Caudal nominal de la bomba de muestreo', v: '200 mL/min', ev: 'P', c: 'Supuesto de diseno: M4 da el porcentaje pero no la cifra' },
        { q: 'Celula de O2 con aire ambiente', v: 'debe leer 21 %', ev: 'M', c: 'M3 7.5, 7-5 [103]; M3 D-7 [257]' },
        { q: 'Celula de O2 defectuosa', v: 'lectura por debajo del 5 %', ev: 'M', c: 'M3 D-7 [257]; M4 7-11 [141]' },
        { q: 'Presion ciclica que degrada la exactitud', v: 'por encima de 10 kPa', ev: 'M', c: 'M3 8-6, 9-7' },
        { q: 'Cero del modulo de CO2 y agente', v: 'solo servicio de fabrica', ev: 'M', c: 'M1 4.3.7 a 4.3.10' },
        { q: 'Pausa de audio de las alarmas', v: '120 s', ev: 'M', c: 'M4 7-2 [132]; M6 p.52' }
      ],
      citas: [
        { t: 'Rojo con parpadeo rapido (alta), amarillo lento (media), amarillo fijo (baja)', c: 'M3 11-1, 11-2 [141-142]' },
        { t: 'Pausa de audio de 120 s', c: 'M4 7-2 [132]; M6 p.52' },
        { t: 'Limites de fabrica: EtCO2 alto 50 y bajo 15 mmHg, FiCO2 alto 4 mmHg', c: 'M3 F-1 [269]' }
      ],
      escenarios: ['monitoreo']
    },

    /* ------------------------------------------------------------ */
    suministro: {
      nombre: 'Suministro de gases',
      queEs: 'Todo lo que trae el gas hasta la maquina: la tuberia de la pared, los cilindros de respaldo, ' +
             'los reguladores y el dispositivo que protege de una mezcla sin oxigeno.',
      queHace: 'Entrega O2, aire y N2O a una presion estable para que los flujometros puedan dosificar. ' +
               'Si la presion de O2 cae, corta el N2O.',
      variables: ['presion_o2', 'presion_cilindro', 'flujo_o2', 'n2o'],
      capa2: 'Un flujometro no es una bomba: solo deja pasar gas que ya viene a presion. Por eso, cuando la ' +
             'presion de entrada cae, el caudal real queda por debajo del que marca la perilla aunque no la toques. ' +
             'El corte de N2O existe porque una mezcla con poco O2 es mas peligrosa que quedarse sin anestesico.',
      fallos: [
        'Presion de tuberia por debajo del umbral: alarma de prioridad alta y corte del N2O.',
        'El cilindro de respaldo se agota: estima cuanto queda antes de confiarte.',
        'Alarma sin caida real de presion: revisa el interruptor de presion.'
      ],
      /* Que ocurre al abrir el cilindro de respaldo */
      efectos: [
        'La presion efectiva pasa a venir del regulador del cilindro en lugar de la tuberia.',
        'La reserva empieza a consumirse: el manometro del cilindro baja mientras este abierto.',
        'La duracion restante se estima con t(min) = presion(psi) x 0,28 / flujo(L/min) para un cilindro E.',
        'Al bajar el flujo de gas fresco, la reserva dura mas: es la razon practica para trabajar con flujo bajo.',
        'Cuando vuelve la tuberia hay que cerrarlo. Si queda abierto, se vacia sin que nadie lo note y la reserva ya no esta cuando hace falta.'
      ],
      rangos: [
        { q: 'Cilindro lleno', v: '6,9 a 15 MPa', ev: 'M', c: 'M1 2-5 [21]' },
        { q: 'Duracion de un cilindro E', v: 't(min) = presion(psi) x 0,28 / flujo(L/min)', ev: 'M', c: 'M10 diap. 2-3' },
        { q: 'Duracion de un cilindro D', v: 'mismo calculo con factor 0,16', ev: 'M', c: 'M10 diap. 2-3' },
        { q: 'Caida que delata una fuga', v: 'mas de 5000 kPa con la valvula cerrada', ev: 'M', c: 'M1 3-3 [39]; M3 6-5 [87]' },
        { q: 'Presion de tuberia nominal', v: '340 kPa, rango 280 a 600 kPa', ev: 'M', c: 'M6 p.84; M3 B-4 [226]' }
      ],
      citas: [
        { t: 'Presion de entrada de tuberia 280-600 kPa', c: 'M3 B-4 [226]; M4 11-6 [212]' },
        { t: 'Presion de suministro de linea 340 kPa', c: 'M6 p.84' },
        { t: 'Alarma de fallo de suministro de O2, prioridad alta', c: 'M1 5-5 [125]; M3 D-6 [256]' },
        { t: 'Limite 250 kPa; al detenerse el O2 tambien se detiene el N2O', c: 'M2 p.130 [138]' },
        { t: 'Corte bajo 172 kPa y reposicion sobre 227 kPa (histeresis)', c: 'M6 p.17 [V]' },
        { t: 'Cilindros llenos 6,9-15 MPa', c: 'M1 2-5 [21]' },
        { t: 'Duracion: t(min) = psi x 0,28 / flujo para un cilindro E', c: 'M10 diap. 2-3' },
        { t: 'O2 nunca menor al 25 % de la mezcla con N2O', c: 'M1 3-5 [41]; M3 B-5 [227]' }
      ],
      escenarios: ['perdida_o2']
    },

    /* ------------------------------------------------------------ */
    flujometros: {
      nombre: 'Flujometros y mezclador',
      /* Rangos de referencia: solo lo que se puede respaldar con una cita.
         Lo que no consta en los manuales va marcado [I] o [P]. */
      rangos: [
        { q: 'Consumo de O2 del paciente', v: '3,5 mL/min/kg; en un adulto de 70 kg son unos 0,25 L/min',
          ev: 'M', c: 'M7 3.1 (p.30-31)' },
        { q: 'Anestesia de flujo bajo', v: 'gas fresco de 1 L/min', ev: 'M', c: 'M7 4.1.1 (p.54-55)' },
        { q: 'Anestesia de flujo minimo', v: 'gas fresco de 0,5 L/min', ev: 'I',
          c: 'Terminologia propia de M7; la cifra exacta no se localizo en una pagina concreta' },
        { q: 'Sin reinhalacion', v: 'hace falta FGF mayor o igual que el volumen minuto; con los valores de fabrica son 6 L/min',
          ev: 'M', c: 'M9 Fig. 1 (p.44): fR = 1 - FGF/MV' },
        { q: 'O2 minimo en la mezcla con N2O', v: 'nunca por debajo del 25 %', ev: 'M',
          c: 'M1 3-5 [41]; M3 B-5 [227]. M3 6-8 [90] dice 21 %: discrepancia [V]' },
        { q: 'Alarma de FiO2 inspirada', v: 'fijarla en 28 % para prevenir hipoxia', ev: 'M', c: 'M7 3.6 (p.48)' },
        { q: 'Presion de entrada que necesitan', v: '280 a 600 kPa', ev: 'M', c: 'M3 B-4 [226]; M4 11-6 [212]' },
        { q: 'Tiempo que tarda en cambiar la mezcla del circuito', v: 'T = VS / (VD - VU): con gas fresco bajo, los cambios son lentos',
          ev: 'M', c: 'M7 5.3 (p.83)' }
      ],
      /* Que cambia al mover una perilla */
      efectos: [
        'El gas fresco total: es la suma de los tres caudales.',
        'La FiO2 entregada: FiO2 = [(0,21 x aire) + O2] / (aire + O2 + N2O).',
        'La reinhalacion: si el gas fresco es menor que el volumen minuto, la diferencia es gas que vuelve al paciente.',
        'La velocidad con que el circuito cambia de composicion: con flujo bajo, lenta.',
        'El consumo del cilindro, si esta abierto.'
      ],
      queEs: 'Los tres tubos con bobina donde se fija cuantos litros por minuto de cada gas entran al circuito.',
      queHace: 'De la suma de los tres sale el gas fresco (FGF) y de su proporcion sale la FiO2. ' +
               'El FGF decide cuanto gas se reinhala y cuanto se renueva.',
      variables: ['fio2', 'flujo_o2', 'mv'],
      capa2: 'La FiO2 de la mezcla se calcula con los caudales: FiO2 = [(0,21 x aire) + O2] / (aire + O2 + N2O). ' +
             'El aire ya trae 21 % de oxigeno, asi que diluye menos que el N2O. ' +
             'El gas fresco tambien gobierna la reinhalacion: si el FGF es menor que el volumen minuto, ' +
             'la diferencia es gas que vuelve al paciente.',
      fallos: [
        'La bobina no alcanza el caudal fijado: falta presion de entrada, no es el flujometro.',
        'Con gas fresco muy bajo, cualquier fuga se nota mucho mas.',
        'Si el N2O no sube aunque abras la perilla, mira la proteccion de O2.'
      ],
      citas: [
        { t: 'FiO2 = [(0,21 x aire) + O2] / (aire + O2) x 100', c: 'M8 3.2' },
        { t: 'Reinhalacion: fR = 1 - FGF/MV cuando FGF < MV', c: 'M9 Fig. 1 (p.44)' },
        { t: 'Volumen reinhalado = MV - FGF', c: 'M8 2.2' },
        { t: 'Consumo de O2 del paciente: 3,5 mL/min/kg', c: 'M7 3.1 (p.30-31)' },
        { t: 'Alarma de FiO2 inspirada fijada en 28 % para prevenir hipoxia', c: 'M7 3.6 (p.48)' }
      ],
      escenarios: ['perdida_o2']
    },

    /* ------------------------------------------------------------ */
    vaporizador: {
      nombre: 'Vaporizador',
      queEs: 'El dispositivo que anade el agente anestesico al gas fresco, montado sobre un colector de insercion.',
      queHace: 'Divide el gas fresco: una parte pasa por la camara donde se evapora el agente y el resto sigue ' +
               'de largo. La proporcion la fija el dial.',
      variables: [],
      capa2: 'La concentracion que sale no depende solo del dial. El gas portador influye: con O2 al 100 % la ' +
             'concentracion entregada sube hasta un 10 % relativo, y con una mezcla rica en N2O baja en la misma ' +
             'proporcion. La temperatura tambien cuenta, y el equilibrio termico tarda unos 15 minutos por cada ' +
             'grado fuera del rango de trabajo.',
      fallos: [
        'La concentracion medida no coincide con el dial: fuga del montaje o contrapresion.',
        'En la prueba de contrapresion el flujo no debe caer mas de 1 L/min desde 6 L/min.',
        'Vaporizador mal asentado en el colector: fuga de gas fresco antes del circuito.'
      ],
      citas: [
        { t: 'Prueba de contrapresion: 6 L/min, caida maxima de 1 L/min', c: 'M1 3-5, 3-6 [41-42]; M3 6-8 [90]' },
        { t: 'Efecto del gas portador: hasta 10 % relativo, maximo 0,4 vol.%', c: 'M11 3.3 [PDF 16]' },
        { t: 'Equilibrio termico: 15 min por grado fuera de 10-40 C', c: 'M11 3.1 [PDF 14]' },
        { t: 'Contrapresion maxima admisible 150 mbar', c: 'M11 3.5 [PDF 18]' },
        { t: 'Concentracion en presion parcial = vol.% x presion / 1013', c: 'M11 3.4 [PDF 17]' }
      ],
      escenarios: ['vaporizador']
    },

    /* ------------------------------------------------------------ */
    ventilador: {
      nombre: 'Ventilador y fuelle',
      queEs: 'La concertina dentro de su camara transparente y el sistema que la mueve.',
      queHace: 'Comprime el fuelle con un gas motriz a presion para producir la inspiracion. ' +
               'El recorrido de la concertina es el indicador visual del volumen que entra y sale.',
      variables: ['ppico', 'vti_vte', 'concertina'],
      capa2: 'El fuelle no genera gas: solo entrega el que el circuito tiene. Si lo que entra de gas fresco no ' +
             'alcanza a cubrir lo que sale por una fuga mas lo que consume el paciente, la concertina deja de ' +
             'llegar al tope y el volumen entregado baja. Y si falta el gas motriz, el fuelle no se mueve aunque ' +
             'la electronica funcione perfectamente.',
      fallos: [
        'El fuelle no se mueve en absoluto: revisa la presion del gas motriz.',
        'La concertina no llega al tope pero si se mueve: fuga, o gas fresco insuficiente.',
        'Volumen espirado menor que el inspirado durante 30 s: alarma de fuga.',
        'Alarma que vuelve tras reiniciar, con el gas motriz y los ajustes descartados: es de hardware.'
      ],
      efectos: [
        'El gas motriz es el empuje: sin el, la concertina no se mueve aunque el equipo este encendido.',
        'El gas fresco es el volumen: si falta, la concertina no llega al tope aunque haya empuje.',
        'Son dos fallos distintos que se parecen mucho, y se separan mirando la presion del gas motriz.',
        'En ventilacion manual el empuje lo pones tu con la bolsa: no hace falta gas motriz.',
        'El conmutador bolsa/ventilador mal leido produce el mismo sintoma sin que nada este averiado.'
      ],
      rangos: [
        { q: 'Presion de gas motriz entregada', v: '280 a 600 kPa', ev: 'M', c: 'M3 B-8 [230]' },
        { q: 'Disparo del interruptor de presion', v: 'cerca de 0,14 MPa, dentro de 0,05 a 0,2 MPa', ev: 'M', c: 'M1 5-21 [141]' },
        { q: 'Valores de fabrica del ventilador', v: 'VT 500 mL, f 12/min, I:E 1:2, limite 30 cmH2O', ev: 'M', c: 'M3 F-4 [272]' },
        { q: 'Apnea', v: 'Paw < PEEP+3 y VTe < 10 mL; pasa a prioridad alta a los 2 min', ev: 'M', c: 'M3 D-2 [252]; M4 7-6 [136]' },
        { q: 'Presion sostenida', v: 'alarma a los 15 s, prioridad alta', ev: 'M', c: 'M1, M3 y M4 coinciden' }
      ],
      citas: [
        { t: 'Valores de fabrica: VT 500 mL, f 12/min, I:E 1:2, Plimite 30 cmH2O', c: 'M3 F-4 [272]' },
        { t: 'Gas motriz 280-600 kPa', c: 'M3 B-8 [230]' },
        { t: 'La concertina ascendente no llega al tope, sobre todo con gas fresco < 1 L/min', c: 'M2 p.169 [177]' },
        { t: 'Alarma de presion sostenida a los 15 s, prioridad alta', c: 'M1, M3 y M4 coinciden' },
        { t: 'Apnea: Paw < PEEP+3 y VTe < 10 mL; prioridad alta pasados 2 min', c: 'M3 D-2 [252]; M4 7-6 [136]' }
      ],
      escenarios: ['ventilador', 'fuga']
    },

    /* ------------------------------------------------------------ */
    absorbedor: {
      nombre: 'Absorbedor de CO2',
      queEs: 'El recipiente con cal sodada por donde pasa el gas espirado antes de volver al paciente.',
      queHace: 'Retiene el CO2 mediante una reaccion quimica. Eso es lo que permite reinhalar el gas y trabajar ' +
               'con flujos bajos sin acumular CO2.',
      variables: ['etco2', 'mv'],
      capa2: 'Mientras el absorbente retiene, el CO2 inspirado es cero y el trazo de capnografia baja hasta la ' +
             'linea de base. Cuando se agota, el CO2 espirado vuelve al paciente: el trazo ya no llega a cero y ' +
             'el CO2 espirado se suma, FETCO2 = FiCO2 + VCO2/MV. El cambio de color de la cal es una ayuda, ' +
             'no un criterio: puede revertir en reposo. El criterio es la FiCO2 medida.',
      fallos: [
        'La linea de base de la capnografia no vuelve a cero: el absorbente ya no retiene.',
        'FiCO2 por encima del limite: alarma y cambio del absorbente.',
        'Canister mal instalado o con sellos danados: ademas provoca una fuga importante.'
      ],
      citas: [
        { t: 'Capacidad in vitro: 80-125 min por cada 100 g hasta FiCO2 0,5 %', c: 'M9 Tabla II (p.45)' },
        { t: 'Criterio de cambio: FiCO2 de 0,5 % (3-4 mmHg)', c: 'M9 p.43 y p.48' },
        { t: 'FETCO2 = FiCO2 + VCO2/MV', c: 'M9 p.46' },
        { t: 'Sin absorbedor: FGF 0,5 -> 17 %; 2 -> 4,4 %; 3 -> 1,3 %; 6 -> 0', c: 'M9 p.44-45' },
        { t: 'Alarma de FiCO2 alta en 4 mmHg (limite de fabrica)', c: 'M3 F-1 [269]' },
        { t: 'Canister de unos 2 kg de cal sodada', c: 'M6 5.6 (p.19)' },
        { t: 'Canister mal instalado o sellos danados como causa de fuga', c: 'M1 5-42 [162]; M4 7-19 [149]' }
      ],
      escenarios: ['absorbedor', 'fuga']
    },

    /* ------------------------------------------------------------ */
    circuito: {
      nombre: 'Circuito respiratorio',
      queEs: 'Las dos valvulas unidireccionales, las mangueras corrugadas, la pieza en Y, la bolsa reservorio ' +
             'y la valvula APL.',
      queHace: 'Conduce el gas fresco hasta el paciente y devuelve el espirado por un camino distinto. ' +
               'Las valvulas son las que obligan al gas a circular siempre en el mismo sentido.',
      variables: ['ppico', 'vti_vte', 'mv', 'etco2', 'concertina'],
      capa2: 'El circuito funciona porque esta cerrado: cada inspiracion lo presuriza y ese gas llega al pulmon. ' +
             'Con un orificio, parte del gas sale por ahi: la presion pico no sube hasta lo esperado y el volumen ' +
             'que vuelve es menor que el que salio. Cuanta mas presion, mas flujo se escapa, asi que una fuga se ' +
             'hace mas evidente justo cuando mas falta hace el gas.',
      fallos: [
        'Presion pico por debajo del minimo durante 20 s.',
        'Volumen espirado menor que la mitad del inspirado durante 30 s.',
        'Sellos que fallan con mas frecuencia: brazo de la bolsa, copa de agua, adaptador, fuelle, ' +
        'tapa de valvula, sensor de O2 y base del canister.'
      ],
      citas: [
        { t: 'Sellos y piezas que fallan con mas frecuencia', c: 'M1 5-43 [163]' },
        { t: 'Alarma de fuga: VTesp < mitad de VTinsp durante 30 s, prioridad media', c: 'M4 7-7 [137]' },
        { t: 'Alarma de presion pico baja: Ppico < Pmin+4 cmH2O durante 20 s', c: 'M4 7-11 [141]' },
        { t: 'Prueba de fugas: presurizar a 30 cmH2O; falla si supera 150 mL/min', c: 'M2 p.88 [96]' },
        { t: 'Compliancia esperada del sistema: 1-10 mL/cmH2O', c: 'M2 p.169 [177]' },
        { t: 'Con ventilacion normal la fuga real es ~10 % de la medida en la prueba', c: 'M2 p.169 [177]' },
        { t: 'Aprobacion: sistema respiratorio <= 350 mL/min a 30 cmH2O', c: 'M12 p.1-2' }
      ],
      escenarios: ['fuga']
    },

    /* ------------------------------------------------------------ */
    evacuacion: {
      nombre: 'Evacuacion (AGSS)',
      queEs: 'El sistema que recoge el gas que sobra del circuito y lo saca del quirofano.',
      queHace: 'Recibe lo que descarga la valvula APL o la camara del fuelle y lo conduce al exterior, ' +
               'para que el personal no respire el anestesico.',
      variables: [],
      capa2: 'La evacuacion tiene que dejar salir el gas sin tirar del circuito. Si se obstruye, la presion no ' +
             'baja entre respiraciones y aparece una alarma de presion sostenida. Si en cambio aspira demasiado, ' +
             'puede vaciar el circuito. Es un subsistema discreto hasta que falla.',
      fallos: [
        'Obstruccion: la presion de via aerea no baja y suena la alarma de presion sostenida.',
        'Aspiracion excesiva: el circuito pierde volumen sin que haya una fuga visible.'
      ],
      citas: [
        { t: 'Alarma de presion sostenida a los 15 s, prioridad alta', c: 'M1 5-5 [125]; M3 D-1 [251]; M4 7-11 [141]' }
      ],
      escenarios: []
    }
  };

  function porId(id) { return M[id] || null; }

  return { M: M, porId: porId };
})();
