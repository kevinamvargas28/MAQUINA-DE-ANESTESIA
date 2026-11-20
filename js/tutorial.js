/* =====================================================================
   tutorial.js  -  Modo entrenamiento guiado
   ---------------------------------------------------------------------
   Dos modos de uso del simulador:
     - Entrenamiento: una tarjeta va diciendo paso a paso que hacer y por
       que. Resalta el elemento que toca usar y solo avanza cuando el
       estudiante lo hace. Primero se aprende a usar el software y la
       logica de diagnostico.
     - Practica libre: nadie guia. El mismo escenario, sin ayudas.

   Un guion es una lista de pasos:
     texto    lo que se explica, en lenguaje llano
     resalta  selector CSS, o 'zona:<id>' para una zona de la maquina
     espera   evento que debe ocurrir para avanzar; si falta, basta pulsar
              "Siguiente"
     pista    linea corta con la accion concreta a realizar
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.tutorial = (function () {
  'use strict';

  /* ---------------------------------------------------------------- */
  /* GUIONES                                                           */
  /* ---------------------------------------------------------------- */
  var GUIONES = {

    /* ===== Recorrido guiado del circuito de gases ===== */
    recorrido: [
      { texto: 'Este diagrama no dibuja como es la maquina por fuera, sino por donde pasa el gas por dentro. ' +
               'Vamos a seguir el camino completo, desde la pared del quirofano hasta el paciente y de vuelta. ' +
               'Puedes mover esta tarjeta arrastrandola.' },
      { texto: 'Empieza aqui. El gas llega por la tuberia del quirofano a unos 340 kPa. Los cilindros de ' +
               'respaldo cuelgan de la maquina por si la tuberia falla, pero no se usan mientras haya tuberia: ' +
               'por eso su rama esta apagada.',
        resalta: '#blq-tubO2' },
      { texto: 'El regulador reduce la presion del cilindro, que llega a 13.800 kPa, hasta la misma que entrega ' +
               'la tuberia. Asi la maquina recibe siempre la misma presion venga de donde venga el gas. ' +
               'Las dos ramas se juntan en el punto grueso.',
        resalta: '#blq-regCilO2' },
      { texto: 'La proteccion de O2 es el dispositivo que vigila la presion de oxigeno. Si cae, corta el N2O. ' +
               'No es un lujo: una mezcla sin oxigeno es mas peligrosa que quedarse sin anestesico.',
        resalta: '#blq-protecO2' },
      { texto: 'Este es el corte que ejecuta esa orden. Cuando se cierra, la rama del N2O se apaga entera y lo ' +
               'ves al instante: las bolitas dejan de moverse por ahi.',
        resalta: '#blq-corteN2O' },
      { texto: 'Los flujometros dosifican. Cada uno deja pasar los litros por minuto que marca su perilla, ' +
               'siempre que le llegue presion suficiente. Si falta presion, el caudal real queda por debajo ' +
               'del que marcaste sin que tu toques nada.',
        resalta: '#blq-fmO2' },
      { texto: 'Aqui se juntan los tres caudales y nace el gas fresco. De la proporcion entre ellos sale la ' +
               'FiO2, que es lo que de verdad respira el paciente. Fijate en que el bloque te da las dos cifras.',
        resalta: '#blq-colector' },
      { texto: 'El vaporizador anade el agente anestesico. Divide el gas fresco: una parte pasa por la camara ' +
               'donde se evapora el agente y el resto sigue de largo. La proporcion la fija el dial.',
        resalta: '#blq-vapor' },
      { texto: 'La salida comun de gases es la frontera. Hasta aqui todo era gas fresco preparandose; a partir ' +
               'de aqui empieza el circuito del paciente. Un fallo antes o despues de este punto se busca en ' +
               'sitios distintos.',
        resalta: '#blq-cgo' },
      { texto: 'La valvula inspiratoria solo deja pasar en un sentido. Es lo que obliga al gas a circular ' +
               'siempre en el mismo sentido: sin ella, el gas espirado volveria por donde vino.',
        resalta: '#blq-valvInsp' },
      { texto: 'El gas llega al paciente por la pieza en Y. Ahi se juntan la rama que entra y la que sale, ' +
               'y por eso una desconexion en ese punto es tan facil y tan grave.',
        resalta: '#blq-paciente' },
      { texto: 'La valvula espiratoria cierra el otro extremo del sentido unico. El gas espirado no puede ' +
               'volver por la rama inspiratoria: tiene que dar la vuelta completa.',
        resalta: '#blq-valvEsp' },
      { texto: 'Y aqui esta la clave de todo el circuito circular: el absorbedor retira el CO2 del gas ' +
               'espirado. Eso es lo que permite reinhalar el gas en vez de tirarlo, y trabajar con flujos ' +
               'bajos. Cuando se agota, el CO2 vuelve al paciente.',
        resalta: '#blq-absorb' },
      { texto: 'El gas limpio llega al fuelle, que es lo que lo empuja de vuelta al paciente en la siguiente ' +
               'inspiracion. En ventilacion manual ese trabajo lo hace la bolsa, apretada a mano.',
        resalta: '#blq-fuelle' },
      { texto: 'Lo que sobra sale por la valvula APL hacia la evacuacion, para que el anestesico no se quede ' +
               'en el quirofano. Es el unico punto por donde el gas abandona el sistema de forma prevista.',
        resalta: '#blq-agss' },
      { texto: 'Ese es el recorrido completo. Dos ideas para quedarse: el gas da una vuelta cerrada y vuelve, ' +
               'por eso hace falta quitarle el CO2; y las valvulas son las que imponen el sentido. Ahora pulsa ' +
               'cualquier bloque para consultarlo por tu cuenta.',
        fin: true }
    ],

    /* ===== Escenario 1: incluye el aprendizaje de la interfaz ===== */
    fuga: [
      { texto: 'Bienvenido al entrenamiento. Vas a diagnosticar una falla real de una maquina de anestesia, ' +
               'paso a paso. Yo te voy diciendo que hacer y por que. Cuando termines, podras repetirlo en ' +
               'practica libre, sin ayudas.' },

      { texto: 'A la izquierda esta la maquina completa. Es tu mapa: cada parte que ves es un subsistema real. ' +
               'Pasa el cursor por encima y se iluminan. Durante el diagnostico te sirve para saber en que ' +
               'parte de la maquina estas trabajando.',
        resalta: '#colIzq' },

      { texto: 'Arriba a la derecha estan las alarmas. El color es lo importante: rojo con parpadeo rapido es ' +
               'prioridad alta, amarillo lento es media y amarillo fijo es baja. La de prioridad mas alta te ' +
               'marca el primer paso.',
        resalta: '#bandaAlarmas' },

      { texto: 'Debajo, las variables. Un solo valor por concepto, nada de catalogos. La barra de la izquierda ' +
               'te dice si esta bien (verde), si hay que vigilarla (amarillo) o si esta fuera de rango (rojo).',
        resalta: '#variables' },

      { texto: 'Estas son las curvas. Son pequenas a proposito: la banda sombreada es el rango normal, asi que ' +
               'de un vistazo ves si el nivel cayo o subio, sin tener que leer numeros.',
        resalta: '#curvasMini' },

      { texto: 'Debajo de la maquina tienes los flujometros: O2, aire y N2O. Mueve el de O2 y fijate en que ' +
               'no cambia una sola cosa, sino cuatro a la vez: el gas fresco total, la FiO2 que recibe el ' +
               'paciente, cuanto gas se reinhala y, si el cilindro esta abierto, lo rapido que se consume.',
        resalta: '#controles',
        espera: 'control:o2',
        pista: 'Arrastra el control de O2.' },

      { texto: 'Rangos que te sirven de referencia: un adulto de 70 kg consume unos 0,25 L/min de oxigeno, ' +
               'anestesia de flujo bajo son 1 L/min de gas fresco, y para que no haya nada de reinhalacion ' +
               'haria falta tanto gas fresco como volumen minuto, unos 6 L/min. Con N2O, el O2 nunca debe ' +
               'bajar del 25 % de la mezcla. Tienes la lista completa con sus citas en "Rangos de referencia".',
        resalta: '[data-fuente="rangos:flujometros"]' },

      { texto: 'Ahora lo mas util del simulador. Cada bloque tiene dos botones: "Por que" explica el principio ' +
               'fisico en dos lineas, y "Fuente" te dice de que manual y de que pagina sale el dato. ' +
               'Pulsa "Por que" para verlo.',
        resalta: '.btn-capa2',
        espera: 'capa2',
        pista: 'Pulsa el boton "Por que".' },

      { texto: 'Esa es la capa 2: el por que. Ahora pulsa "Fuente" y veras la capa 3, con las citas de los ' +
               'manuales y, muy importante, lo que no consta en ellos y es un supuesto de diseno.',
        resalta: '.btn-capa3',
        espera: 'capa3',
        pista: 'Pulsa el boton "Fuente".' },

      { texto: 'Ya sabes moverte. Vamos al caso. Hay una fuga en el circuito respiratorio. La regla de oro de ' +
               'todos los manuales: antes de diagnosticar, protege al paciente. Pasa a ventilacion manual.',
        resalta: '[data-accion="ventilar_manual"]',
        espera: 'accion:ventilar_manual',
        pista: 'Pulsa "Pasar a ventilacion manual".' },

      { texto: 'Bien. Ahora observa antes de tocar nada. La senal que delata una fuga es la diferencia entre lo ' +
               'que entra y lo que vuelve. Compara el volumen inspirado con el espirado.',
        resalta: '[data-accion="comparar_volumenes"]',
        espera: 'accion:comparar_volumenes',
        pista: 'Pulsa "Comparar volumen inspirado y espirado".' },

      { texto: 'Fijate: entra mucho mas de lo que vuelve, la presion pico no sube y la concertina no llega al ' +
               'tope. Ya sabes que hay fuga. Ahora hay que encontrar donde. Inspecciona el circuito por tramos: ' +
               'los manuales listan los sellos que fallan con mas frecuencia.',
        resalta: '[data-accion="inspeccionar_tramos"]',
        espera: 'accion:inspeccionar_tramos',
        pista: 'Pulsa "Inspeccionar el circuito por tramos".' },

      { texto: 'Localizado. Pero una sospecha no es un diagnostico: hay que convertirla en un numero. ' +
               'Haz la prueba de fugas. Presuriza el circuito a 30 cmH2O y mide el flujo que hace falta para ' +
               'mantenerlo: ese flujo es la fuga.',
        resalta: '[data-accion="prueba_fugas"]',
        espera: 'prueba:corrida',
        pista: 'Pulsa "Hacer la prueba de fugas" y luego "Presurizar y medir".' },

      { texto: 'Ahi tienes el numero, muy por encima del limite del perfil. Con el componente identificado y la ' +
               'medida hecha, ya puedes corregir. Reasienta el sello.',
        resalta: '[data-accion="reasentar_sello"]',
        espera: 'accion:reasentar_sello',
        pista: 'Pulsa "Reasentar o cambiar el sello identificado".' },

      { texto: 'Ultimo paso, y el que mas se olvida: verificar. Repite la prueba de fugas y comprueba que ahora ' +
               'aprueba. Una correccion sin verificacion no esta terminada.',
        resalta: '[data-accion="prueba_fugas"]',
        espera: 'prueba:corrida',
        pista: 'Vuelve a hacer la prueba de fugas.' },

      { texto: 'Eso es todo. El orden que acabas de seguir sirve para cualquier falla: proteger, leer la alarma, ' +
               'contrastar con otras variables, descartar lo simple antes de lo costoso, corregir y verificar. ' +
               'Ahora prueba el mismo escenario en practica libre, sin guia.',
        fin: true }
    ],

    /* ===== Escenario 2: falla del ventilador ===== */
    ventilador: [
      { texto: 'Tercer entrenamiento. La maquina dejo de ventilar: la concertina no se mueve. ' +
               'Este caso ensena a separar dos cosas que se parecen mucho y se arreglan de forma distinta. ' +
               'Recuerda que puedes mover esta tarjeta arrastrandola.' },

      { texto: 'Antes de pensar nada, protege al paciente. Es el primer paso en los cuatro manuales, sin ' +
               'excepcion. En ventilacion manual el gas lo empujas tu con la bolsa, asi que funciona aunque el ' +
               'ventilador este muerto.',
        resalta: '[data-accion="ventilar_manual"]',
        espera: 'accion:ventilar_manual',
        pista: 'Pulsa "Pasar a ventilacion manual".' },

      { texto: 'Con el paciente a salvo ya puedes diagnosticar con calma. Lee la alarma: el mensaje no es un ' +
               'adorno, distingue entre fallo de gas motriz, de valvula, de comunicacion y de hardware, y cada ' +
               'uno lleva a un sitio distinto.',
        resalta: '[data-accion="leer_alarma"]',
        espera: 'accion:leer_alarma',
        pista: 'Pulsa "Leer el mensaje de alarma y su prioridad".' },

      { texto: 'Aqui esta la idea del escenario. El ventilador no genera gas: comprime la concertina con un ' +
               'gas a presion, el gas motriz, y ese empuje es el que produce la inspiracion. Si falta el ' +
               'empuje, el fuelle no se mueve por mucho que la pantalla siga encendida y la electronica este ' +
               'perfecta.',
        resalta: 'zona:ventilador' },

      { texto: 'Compruebalo tu mismo. Mira la presion del gas motriz y comparala con lo que debe entregar.',
        resalta: '[data-accion="verificar_gas_motriz"]',
        espera: 'accion:verificar_gas_motriz',
        pista: 'Pulsa "Verificar la presion del gas motriz".' },

      { texto: 'Ahi lo tienes: 120 kPa cuando el rango entregado debe ser de 280 a 600 kPa. La alarma ' +
               'coincide con la realidad, asi que la perdida es de verdad. Fijate en que eso acaba de ' +
               'descartar el circuito y el absorbedor de un solo vistazo.',
        resalta: '#variables' },

      { texto: 'Falta la otra hipotesis. Una alarma puede sonar porque el gas falta de verdad o porque el ' +
               'sensor miente. La prueba que las separa es poner el interruptor de presion en cortocircuito: ' +
               'si la alarma desaparece, el defectuoso es el interruptor. Pruebala.',
        resalta: '[data-accion="probar_interruptor"]',
        espera: 'accion:probar_interruptor',
        pista: 'Pulsa "Probar el interruptor de presion del gas motriz".' },

      { texto: 'No desaparece, porque el manometro ya habia dicho la verdad. Pero quedate con la prueba: ' +
               'el dia que la alarma suene con la presion normal, o no suene con la presion baja, el ' +
               'sospechoso sera el interruptor y no el gas.' },

      { texto: 'Antes de tocar hardware, descarta lo que no es averia sino ajuste: el conmutador ' +
               'bolsa/ventilador que la maquina no lee, el equipo que quedo en el modo equivocado tras el ' +
               'chequeo, un parametro imposible o el sello del fuelle mal puesto. Son causas reales y no ' +
               'cuestan nada de comprobar.',
        resalta: '[data-accion="revisar_modo"]',
        espera: 'accion:revisar_modo',
        pista: 'Pulsa "Revisar modo, parametros, conmutador y sello del fuelle".' },

      { texto: 'Ya sabes que es y que no es. Corrige: restablece el suministro de gas motriz.',
        resalta: '[data-accion="restablecer_gas_motriz"]',
        espera: 'accion:restablecer_gas_motriz',
        pista: 'Pulsa "Restablecer el suministro de gas motriz".' },

      { texto: 'La presion vuelve al rango, pero la maquina sigue en manual: todavia no has comprobado nada. ' +
               'Devuelvela a ventilacion mecanica y mira la concertina.',
        resalta: '[data-accion="volver_mecanica"]',
        espera: 'accion:volver_mecanica',
        pista: 'Pulsa "Volver a ventilacion mecanica y comprobar".' },

      { texto: 'La concertina se mueve otra vez y el volumen medido coincide con el ajustado. Eso es la ' +
               'verificacion, y es lo que cierra el caso: una correccion sin comprobar no esta terminada.',
        resalta: '#curvasMini' },

      { texto: 'Dos ideas para llevarte. La primera: el fuelle necesita empuje (gas motriz) y volumen (gas ' +
               'fresco), y la falta de cada uno se parece mucho pero se arregla distinto; los separas mirando ' +
               'la presion del gas motriz. La segunda: escalar a servicio es correcto cuando la falla esta ' +
               'dentro del equipo, un codigo de hardware, una valvula de PEEP o una alarma que vuelve tras ' +
               'reiniciar, pero no antes de descartar el gas motriz y los ajustes.',
        fin: true }
    ],

    /* ===== Escenario 3: falla del monitoreo de gases ===== */
    'monitoreo:trampa': [
      { texto: 'Cuarto entrenamiento, y el mas traicionero de los tres que llevas. La capnografia ' +
               'desaparecio. Antes de hacer nada, quiero que te fijes en una cosa: el paciente puede estar ' +
               'perfectamente bien.' },

      { texto: 'Mira las variables. El EtCO2 no da lectura, pero la presion pico, el volumen espirado y la ' +
               'FiO2 estan normales. Eso no es casualidad: son senales que viajan por caminos distintos.',
        resalta: '#variables' },

      { texto: 'Aqui esta el truco del escenario. El modulo de gases no huele el circuito: aspira una muestra ' +
               'continua por una linea muy delgada que pasa por una trampa de agua. Si algo tapa ese camino, ' +
               'el modulo se queda ciego aunque el paciente respire perfectamente. La celula de O2, en cambio, ' +
               'esta en la rama inspiratoria y no usa esa linea: por eso sigue midiendo.',
        resalta: 'zona:monitor' },

      { texto: 'Asi que el primer paso no es tocar al paciente, es contrastar. Comprueba que presion, volumen ' +
               'y bolsa dicen que la ventilacion esta ocurriendo.',
        resalta: '[data-accion="contrastar_senales"]',
        espera: 'accion:contrastar_senales',
        pista: 'Pulsa "Contrastar con presion, volumen y bolsa".' },

      { texto: 'Confirmado: el paciente esta bien y lo que fallo es el monitor. Y fijate en la maquina, ' +
               'acabas de descartar el circuito, el ventilador y el absorbedor de un solo vistazo. Una ' +
               'observacion bien hecha vale mas que tres pruebas.',
        resalta: '#colIzq' },

      { texto: 'Ahora busca el tapon, empezando por lo mas tonto y mas frecuente: una linea pisada por una ' +
               'rueda, atrapada bajo el paciente o acodada en una curva cerrada.',
        resalta: '[data-accion="revisar_linea_acodada"]',
        espera: 'accion:revisar_linea_acodada',
        pista: 'Pulsa "Revisar si la linea de muestreo esta acodada".' },

      { texto: 'La linea esta libre, asi que el tapon esta mas adelante. Pero la maquina no te lo va a decir: ' +
               'ella solo sabe que la bomba no mueve gas, no donde esta el tapon. Por eso te da dos avisos a ' +
               'la vez, linea obstruida y compruebe la salida de la muestra.',
        resalta: '#bandaAlarmas' },

      { texto: 'Y aqui viene la prueba mas elegante de todo el proyecto. Desconecta la linea de la trampa: la ' +
               'bomba pasa a aspirar solo a traves de la trampa. Si el aviso sigue, lo tapado es la trampa; si ' +
               'desaparece, es la linea. Un gesto y dos hipotesis resueltas.',
        resalta: '[data-accion="prueba_muestreo"]',
        espera: 'prueba:muestreo',
        pista: 'Pulsa "Desconectar la linea de la trampa y observar" y luego el boton de la prueba.' },

      { texto: 'El aviso sigue apareciendo: el tapon es la trampa de agua, que se lleno con el agua que ' +
               'condensa del gas espirado. Ya sabes exactamente que cambiar y por que.' },

      { texto: 'Corrige: vacia o cambia la trampa.',
        resalta: '[data-accion="vaciar_trampa"]',
        espera: 'accion:vaciar_trampa',
        pista: 'Pulsa "Vaciar o cambiar la trampa de agua".' },

      { texto: 'El caudal de muestra vuelve al nominal, la capnografia reaparece y las alarmas se cancelan. ' +
               'Eso es la verificacion: lecturas coherentes con las demas variables.',
        resalta: '#curvasMini' },

      { texto: 'Lo que tienes que llevarte de este escenario es una sola frase: un monitor que no mide no es ' +
               'un paciente que empeora. Si hubieras subido la ventilacion porque el EtCO2 estaba bajo, ' +
               'habrias hiperventilado a alguien que estaba perfecto, guiandote por un numero que la maquina ' +
               'no estaba midiendo. Contrastar primero no es una formalidad: es lo que evita ese error.' },

      { texto: 'Una cosa mas, y es la razon por la que conviene repetir este escenario. Este modulo falla de ' +
               'tres maneras, y al entrar se sortea una: esta, una celula de O2 descalibrada y un fallo del ' +
               'propio modulo. Las tres empiezan pareciendose y se diagnostican distinto, asi que la proxima ' +
               'vez no des por hecho que es la trampa. Puedes cambiar de variante sin salir, en el selector ' +
               'de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    /* ----------------------------------------------------------------- */
    /* Variante 2: la celula de O2 descalibrada                          */
    /* ----------------------------------------------------------------- */
    'monitoreo:celula': [
      { texto: 'Te toco la variante de la celula de O2. Salto la alarma de FiO2 baja, que es de prioridad ' +
               'alta y de las que no se ignoran: una mezcla hipoxica es de las pocas cosas que danan a un ' +
               'paciente en minutos. Asi que la tomamos en serio, pero la comprobamos antes de actuar.' },

      { texto: 'Primero la cuenta mas simple de toda la anestesia. Mira los flujometros: 0,5 L/min de O2 y ' +
               '2,5 de aire. El aire ya trae 21 % de oxigeno, asi que el total de O2 es 0,5 mas el 21 % de ' +
               '2,5, sobre 3 L/min de mezcla. Eso da 34 %. La mezcla que estas entregando es correcta.',
        resalta: 'zona:flujometros' },

      { texto: 'Y sin embargo la pantalla marca 25 %. Las dos cosas no pueden ser verdad a la vez: o los ' +
               'flujometros mienten o la celula miente. Ahi esta todo el escenario.',
        resalta: '#variables' },

      { texto: 'Contrasta primero, igual que en cualquier otra falla de monitoreo. El EtCO2 esta presente, la ' +
               'capnografia dibuja y el caudal de muestra esta en sus 200 mL/min: el modulo de gases funciona ' +
               'perfectamente. Lo que sea, es solo de la celula.',
        resalta: '[data-accion="contrastar_senales"]',
        espera: 'accion:contrastar_senales',
        pista: 'Pulsa "Contrastar con presion, volumen y bolsa".' },

      { texto: 'Fijate en lo que acabas de separar. El modulo de gases aspira una muestra por una linea ' +
               'delgada; la celula de O2 es otra cosa, un sensor propio en la rama inspiratoria. Son dos ' +
               'sistemas de medida independientes, y aqui uno dice la verdad y el otro no.',
        resalta: 'zona:monitor' },

      { texto: 'Ahora la prueba que decide. Saca la celula a aire ambiente: el aire tiene 20,9 % de oxigeno ' +
               'en cualquier parte del mundo, asi que es un patron gratuito y siempre disponible. Una celula ' +
               'sana debe leer 21 %, con una tolerancia de mas o menos 3 %.',
        resalta: '[data-accion="comprobar_celula_o2"]',
        espera: 'accion:comprobar_celula_o2',
        pista: 'Pulsa "Comprobar la celula de O2 con aire ambiente".' },

      { texto: 'Lee 15 %. Fuera de tolerancia, y desviada hacia abajo justo como la lectura del circuito. Ya ' +
               'no es una sospecha: la celula esta descalibrada y la alarma de FiO2 baja es falsa. El paciente ' +
               'esta recibiendo su 34 %.' },

      { texto: 'Y ahora si puedes calibrar, que es ajustar la referencia del sensor sabiendo cuanto se ' +
               'desvia. Hazlo en este orden siempre: comprobar y despues calibrar. Calibrar a ciegas es ' +
               'reescribir la referencia sin saber desde donde, y puedes dejar el sensor peor de lo que ' +
               'estaba.',
        resalta: '[data-accion="calibrar_modulo"]',
        espera: 'accion:calibrar_modulo',
        pista: 'Pulsa "Calibrar la celula con aire ambiente".' },

      { texto: 'La lectura sube a 34 % y la alarma se cancela. Esa coincidencia entre lo que calculaste con ' +
               'los flujometros y lo que ahora marca la pantalla es la verificacion: no cambiaste la mezcla, ' +
               'cambiaste el instrumento que la mide.',
        resalta: '#variables' },

      { texto: 'Una advertencia importante, porque el ejercicio puede dejar una idea peligrosa. La mayoria ' +
               'de las alarmas de FiO2 baja son reales: una tuberia equivocada, un mezclador averiado, un ' +
               'flujometro mal puesto. Que esta fuera falsa no te autoriza a desconfiar de la siguiente. Lo ' +
               'que te autoriza a descartarla es la comprobacion que acabas de hacer, y nada mas.' },

      { texto: 'La frase para llevarte: la celula de O2 es el unico testigo de que el paciente recibe ' +
               'oxigeno, y un testigo sin calibrar no sirve ni para acusar ni para absolver. Por eso los ' +
               'manuales piden calibrarla a diario, no cuando ya esta dando problemas.' },

      { texto: 'Este modulo tiene tres variantes y al entrar se sortea una, asi que la proxima vez puede ' +
               'tocarte la trampa de agua llena o un fallo del modulo completo. Tambien puedes elegirla a ' +
               'mano en el selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    /* ----------------------------------------------------------------- */
    /* Variante 3: el modulo de gases no arranca                         */
    /* ----------------------------------------------------------------- */
    'monitoreo:modulo': [
      { texto: 'Te toco la variante mas franca de las tres, y aun asi tiene su trampa. El modulo de gases no ' +
               'arranco: dio fallo de inicio o comunicacion.' },

      { texto: 'Mira primero las alarmas. Dos avisos y los dos dicen lo mismo con palabras distintas: fallo ' +
               'de inicio del modulo, y monitorizacion de gas no disponible. Esa segunda frase es honesta y ' +
               'conviene leerla literalmente: la maquina no te esta diciendo que el paciente este mal, te ' +
               'esta diciendo que dejo de poder mirar.',
        resalta: '#bandaAlarmas' },

      { texto: 'Ahora las variables, y aqui esta lo interesante. No hay EtCO2, no hay agente, no hay caudal ' +
               'de muestra: cero. Pero la FiO2 sigue marcando. La celula de O2 es un sensor aparte en la rama ' +
               'inspiratoria y no depende del modulo, asi que sobrevive cuando el modulo se cae.',
        resalta: '#variables' },

      { texto: 'Contrasta antes de tocar nada, como siempre. Presion pico, volumen espirado y la concertina ' +
               'moviendose: la ventilacion esta ocurriendo y el paciente esta bien.',
        resalta: '[data-accion="contrastar_senales"]',
        espera: 'accion:contrastar_senales',
        pista: 'Pulsa "Contrastar con presion, volumen y bolsa".' },

      { texto: 'Hasta aqui esto se parece muchisimo a la variante de la trampa de agua llena: en las dos ' +
               'desaparece la capnografia y en las dos el paciente esta perfecto. Y el tratamiento es ' +
               'completamente distinto, asi que hay que distinguirlas, no adivinar.' },

      { texto: 'La prueba que las separa es la misma de siempre. Desconecta la linea de la trampa y observa ' +
               'el caudal de muestra con la linea puesta y sin ella.',
        resalta: '[data-accion="prueba_muestreo"]',
        espera: 'prueba:muestreo',
        pista: 'Pulsa "Desconectar la linea de la trampa y observar" y luego el boton de la prueba.' },

      { texto: 'Cero y cero. Y eso es concluyente: un tapon siempre deja pasar algo, o cambia al quitar la ' +
               'linea, porque la bomba sigue aspirando por otro camino. Una bomba que no responde no cambia ' +
               'con nada de lo que hagas fuera. No tienes una oclusion, tienes un modulo que no funciona.' },

      { texto: 'Intenta lo que resuelve la mayoria de los fallos de comunicacion y cuesta segundos: ' +
               'reconectar el modulo en su bahia, o reiniciar la maquina si esta lo permite. Un contacto ' +
               'sucio o un modulo mal asentado se ven igual que una averia grave.',
        resalta: '[data-accion="reiniciar_modulo"]',
        espera: 'accion:reiniciar_modulo',
        pista: 'Pulsa "Reconectar el modulo o reiniciar la maquina".' },

      { texto: 'No arranco. Ahora, y solo ahora, escalar a servicio tecnico es la respuesta correcta: hay un ' +
               'fallo de hardware que no se arregla desde el teclado y el modulo hay que sustituirlo. Este es ' +
               'el unico caso de todo el simulador donde escalar es diagnostico y no rendicion.',
        resalta: '[data-accion="escalar_servicio_mon"]',
        espera: 'accion:escalar_servicio_mon',
        pista: 'Pulsa "Escalar a servicio: sustituir el modulo".' },

      { texto: 'El modulo sustituido arranca, el caudal de muestra vuelve a 200 mL/min y la capnografia ' +
               'reaparece. Pero fijate en el orden que seguiste, que es lo que importa: contrastar, probar, ' +
               'intentar lo reversible y solo entonces escalar. Escalar primero habria funcionado igual y no ' +
               'habrias aprendido nada, y en una maquina real habria costado un modulo y medio dia.',
        resalta: '#curvasMini' },

      { texto: 'Y lo que de verdad hay que llevarse: mientras el modulo esta caido te quedas sin capnografia, ' +
               'que es tu aviso mas rapido de desconexion y de intubacion esofagica. No es una molestia, es ' +
               'una perdida de vigilancia, y hay que decirlo en voz alta al equipo y vigilar mas de cerca el ' +
               'volumen espirado y la presion mientras se resuelve.' },

      { texto: 'Este modulo tiene tres variantes y al entrar se sortea una, asi que la proxima vez puede ' +
               'tocarte la trampa de agua llena o una celula de O2 descalibrada. Tambien puedes elegirla a ' +
               'mano en el selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    /* ===== Escenario 5 ===== */
    /* ================================================================= */
    /* ESCENARIO 4: VAPORIZADOR                                          */
    /* ================================================================= */
    'vaporizador:vacio': [
      { texto: 'Quinto entrenamiento, y el modulo mas silencioso de la maquina. Suena una alarma de ' +
               'prioridad alta: no hay agente anestesico medido. El paciente esta siendo ventilado ' +
               'correctamente, con oxigeno y volumenes normales, pero sin anestesico inhalado.' },

      { texto: 'Antes de tocar nada, una idea que vale para las tres fallas de este modulo. El vaporizador ' +
               'es un aparato puramente mecanico: no mide nada y no sabe nada. No sabe cuanto agente le ' +
               'queda, no sabe cuanto esta entregando y no sabe si esta bien enganchado. El dial no es una ' +
               'medida, es una orden.',
        resalta: 'zona:vaporizador' },

      { texto: 'Lo que si mide es el analizador de gas, que esta al otro extremo del circuito. Asi que el ' +
               'primer paso es comparar las dos cosas: lo que pediste en el dial y lo que el analizador ' +
               'encuentra en el gas.',
        resalta: '[data-accion="contrastar_dial_agente"]',
        espera: 'accion:contrastar_dial_agente',
        pista: 'Pulsa "Contrastar el dial con el analizador de agente".' },

      { texto: 'Dial en 2 %, analizador en cero. Y fijate en lo que acabas de descartar de paso: la ' +
               'ventilacion funciona, los volumenes son correctos y el oxigeno llega. El problema esta ' +
               'entre el dial y el gas, y eso es el vaporizador.',
        resalta: '#variables' },

      { texto: 'Ahora empieza por lo mas tonto, que es casi siempre lo que pasa. Mira la ventana del ' +
               'vaporizador.',
        resalta: '[data-accion="revisar_nivel_vaporizador"]',
        espera: 'accion:revisar_nivel_vaporizador',
        pista: 'Pulsa "Mirar el nivel de la ventana del vaporizador".' },

      { texto: 'Vacio. Y aqui esta la leccion incomoda del escenario: ninguna alarma te dijo que el ' +
               'vaporizador se estaba quedando sin agente, porque no hay ningun sensor que lo sepa. La ' +
               'maquina no puede avisarte de esto. La unica forma de enterarte es mirar la ventana, y por ' +
               'eso el chequeo previo al uso lo pide antes de cada caso.' },

      { texto: 'Rellenalo con su sistema de llenado. El codificado por agente, el que fisicamente no deja ' +
               'meter el frasco equivocado: llenar un vaporizador con el agente de otro cambia la potencia ' +
               'de lo que entregas sin que el dial lo refleje.',
        resalta: '[data-accion="llenar_vaporizador"]',
        espera: 'accion:llenar_vaporizador',
        pista: 'Pulsa "Rellenar el vaporizador con su sistema de llenado".' },

      { texto: 'El analizador sube hasta coincidir con el dial. Y fijate en cual es la verificacion de ' +
               'verdad: no es ver la ventana llena, es ver la cifra medida en el gas subir hasta lo que ' +
               'pediste. La ventana te dice que hay liquido; solo el analizador te dice que llega al paciente.',
        resalta: '#variables' },

      { texto: 'Un aviso practico que no esta en la pantalla. Un vaporizador recien rellenado o recien ' +
               'movido de sitio tarda en estabilizarse, porque la vaporizacion enfria el liquido y el ' +
               'aparato compensa por temperatura. El manual del vaporizador habla de unos 15 minutos por ' +
               'cada grado que este fuera de su rango de trabajo.' },

      { texto: 'Y la otra cara de la moneda, que es la que te va a tentar en las otras variantes: no ' +
               'subas el dial porque el analizador marque bajo. Si el deposito esta vacio, subir el dial de ' +
               'un deposito vacio no entrega nada, y cuando lo rellenes el paciente recibira el doble de lo ' +
               'que querias. Primero se averigua por que no coincide; despues, si hace falta, se ajusta.',
        resalta: '[data-accion="subir_dial"]' },

      { texto: 'Este modulo falla de tres maneras y al entrar se sortea una: esta, un vaporizador mal ' +
               'bloqueado en su colector y una obstruccion en su salida. En las tres el dial sigue marcando ' +
               'lo mismo mientras lo entregado cambia, y se distinguen con pruebas distintas. Puedes ' +
               'elegirlas a mano en el selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    'vaporizador:asiento': [
      { texto: 'Te toco la variante mas discreta de las tres. No hay alarma de prioridad alta, solo un ' +
               'aviso de que la concentracion de agente no coincide con la fijada. Y es verdad: el dial ' +
               'marca 2 % y el analizador encuentra 0,9 %.' },

      { texto: 'Menos de la mitad. No es cero, que seria un vaporizador vacio o sin paso de gas: es una ' +
               'fraccion. Algo esta llegando, pero por el camino se pierde buena parte. Guarda ese dato, ' +
               'porque es el que va a dirigir toda la busqueda.',
        resalta: '#variables' },

      { texto: 'Empieza como siempre, contrastando lo que pediste con lo que se mide. Es el unico paso que ' +
               'sirve en las tres variantes.',
        resalta: '[data-accion="contrastar_dial_agente"]',
        espera: 'accion:contrastar_dial_agente',
        pista: 'Pulsa "Contrastar el dial con el analizador de agente".' },

      { texto: 'Confirmado, y con la ventilacion y el suministro descartados. Ahora lo barato primero: ' +
               'mira la ventana del vaporizador para quitarte de encima la causa mas frecuente.',
        resalta: '[data-accion="revisar_nivel_vaporizador"]',
        espera: 'accion:revisar_nivel_vaporizador',
        pista: 'Pulsa "Mirar el nivel de la ventana del vaporizador".' },

      { texto: 'Nivel normal, asi que no es el deposito. Ese resultado te lo marque como parcial, no como ' +
               'error: comprobarlo costo dos segundos y te quito una hipotesis. Buscar bien es ir cerrando ' +
               'puertas, no acertar a la primera.' },

      { texto: 'Siguiente candidato, y es el que da nombre a esta variante: el enganche en el colector. Un ' +
               'vaporizador de insercion se apoya sobre dos puertos y se fija con una palanca. Si la ' +
               'palanca no llega al final, el aparato se queda apoyado pero no sellado.',
        resalta: '[data-accion="comprobar_asiento"]',
        espera: 'accion:comprobar_asiento',
        pista: 'Pulsa "Comprobar que el vaporizador esta asentado y bloqueado".' },

      { texto: 'La palanca no habia llegado al tope. Pero no te fies de la vista: un vaporizador apoyado y ' +
               'uno sellado se ven casi iguales, y mas de uno ha dado por bueno un enganche que fugaba. ' +
               'Hay que medirlo.' },

      { texto: 'Y aqui viene la prueba bonita de este escenario. Haz la prueba de fuga dos veces: una con ' +
               'el dial cerrado y otra con el dial abierto.',
        resalta: '[data-accion="prueba_fuga_dial"]',
        espera: 'prueba:fugaDial',
        pista: 'Pulsa "Prueba de fuga con el dial cerrado y con el dial abierto" y luego el boton de medir.' },

      { texto: 'Mira el razonamiento, que es lo que importa. Con el dial en cero el gas no entra en el ' +
               'vaporizador: sus propias valvulas de puerto cierran el paso, y el circuito aguanta. Al abrir ' +
               'el dial se abre ese camino, y con el camino se abre la fuga. Lo unico que cambio entre las ' +
               'dos medidas fue el dial, asi que la fuga esta en el vaporizador o en su colector. Por eso el ' +
               'chequeo previo al uso se repite con cada vaporizador encendido: con todos cerrados, esta ' +
               'fuga es invisible.',
        resalta: '#bandaAlarmas' },

      { texto: 'Corrige: retiralo, vuelve a asentarlo y bloquea la palanca hasta el final del recorrido.',
        resalta: '[data-accion="reasentar_vaporizador"]',
        espera: 'accion:reasentar_vaporizador',
        pista: 'Pulsa "Reasentar y bloquear el vaporizador en el colector".' },

      { texto: 'El analizador sube hasta el dial y la fuga desaparece. Y ya que estas, entiende por que ' +
               'bajaba la concentracion: el gas fresco se escapaba con su agente antes de llegar al ' +
               'circuito, asi que al paciente llegaba menos mezcla y con ella menos anestesico. La misma ' +
               'averia te quitaba volumen y te quitaba profundidad anestesica a la vez.' },

      { texto: 'Repite siempre la prueba despues de corregir. Una correccion sin verificacion no es una ' +
               'correccion: es una suposicion con buena intencion.' },

      { texto: 'Las otras dos variantes de este modulo son un vaporizador vacio, donde el analizador marca ' +
               'cero y ninguna alarma te avisa del nivel, y una obstruccion en la salida, donde lo que cae ' +
               'no es el agente sino el caudal. Al entrar se sortea una, y tambien puedes elegirla en el ' +
               'selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    'vaporizador:contrapresion': [
      { texto: 'Te toco la variante que no se parece a las otras dos. Aqui el agente esta bien: el ' +
               'analizador coincide con el dial. Lo que esta mal es el volumen, y la concertina se esta ' +
               'quedando corta poco a poco.' },

      { texto: 'Mira los flujometros antes de nada. Fijaste 2 L/min en total, tecnica de bajo flujo, y los ' +
               'flotadores estan muy por debajo de eso. Eso no es una lectura rara: es gas que pediste y no ' +
               'esta pasando.',
        resalta: 'zona:flujometros' },

      { texto: 'Y como el paciente consume oxigeno todo el tiempo, si al circuito le entra menos gas del ' +
               'que se gasta, el fuelle se va quedando sin reserva. Por eso baja el volumen espirado: no ' +
               'hay fuga, hay escasez.',
        resalta: '#variables' },

      { texto: 'Primero sostener, despues diagnosticar. Igual que en la falla del ventilador pasabas a ' +
               'ventilacion manual antes de investigar, aqui subes el gas fresco para que la concertina ' +
               'vuelva a llenarse. El manual lo dice asi: ante una concertina que no se mueve, revisar el ' +
               'gas impulsor, subir el gas fresco o pulsar la purga de O2.',
        resalta: '[data-accion="subir_gas_fresco"]',
        espera: 'accion:subir_gas_fresco',
        pista: 'Pulsa "Subir el gas fresco para sostener la ventilacion".' },

      { texto: 'La concertina se rellena y los volumenes vuelven. Que quede claro lo que acabas de hacer: ' +
               'no has arreglado nada, has comprado tiempo. Lo que se perdia se sigue perdiendo, solo que ' +
               'ahora entra mas de lo que se pierde. Si te quedas aqui, el problema sigue entero.' },

      { texto: 'Ahora diagnostica. Contrasta el dial con el analizador, igual que en las otras variantes.',
        resalta: '[data-accion="contrastar_dial_agente"]',
        espera: 'accion:contrastar_dial_agente',
        pista: 'Pulsa "Contrastar el dial con el analizador de agente".' },

      { texto: 'Y aqui el resultado es el contrario del que esperabas: el agente coincide con el dial. Eso ' +
               'parece descartar el vaporizador, pero mira mejor. La concentracion es una proporcion, no una ' +
               'cantidad: el vaporizador puede estar entregando un 2 % perfecto de muy poco gas. Lo que ' +
               'falla no es la mezcla, es el caudal.' },

      { texto: 'Y hay una pista que lo senala directamente: el caudal cae al abrir el dial. Si el dial no ' +
               'tuviera nada que ver, cerrarlo no cambiaria nada. La prueba de contrapresion mide ' +
               'exactamente eso.',
        resalta: '[data-accion="prueba_contrapresion"]',
        espera: 'prueba:contrapresion',
        pista: 'Pulsa "Prueba de contrapresion: 6 L/min y abrir el dial" y luego el boton de medir.' },

      { texto: 'Caida de 1,8 L/min cuando el limite del manual es 1. Hay una resistencia dentro del ' +
               'vaporizador o en su salida, y eso explica todo lo que viste: el gas que pediste choca con ' +
               'un obstaculo, el flotador baja y al circuito le llega una fraccion. Esta prueba es parte del ' +
               'chequeo previo al uso, y por eso esta falla es de las que se cazan antes de conectar al ' +
               'paciente, no en medio del caso.',
        resalta: '#variables' },

      { texto: 'Esto no se repara en quirofano. El vaporizador se retira de servicio y se monta otro, y ' +
               'mientras no haya sustituto la anestesia se mantiene por via intravenosa.',
        resalta: '[data-accion="escalar_servicio_vap"]',
        espera: 'accion:escalar_servicio_vap',
        pista: 'Pulsa "Retirar el vaporizador de servicio y escalar a tecnico".' },

      { texto: 'El caudal vuelve a coincidir con lo fijado y la concertina se mantiene llena. Y fijate en ' +
               'el orden que seguiste, que es lo que de verdad hay que llevarse: sostener primero, ' +
               'diagnosticar despues y escalar solo cuando una prueba demuestra que el componente esta ' +
               'averiado por dentro. Escalar al principio habria funcionado igual y no habrias aprendido ' +
               'nada; en un quirofano de verdad habria parado el caso sin motivo.' },

      { texto: 'Las otras dos variantes de este modulo si bajan el agente: un vaporizador vacio, donde el ' +
               'analizador marca cero, y uno mal bloqueado en su colector, donde entrega menos de la mitad ' +
               'y la fuga solo aparece con el dial abierto. Al entrar se sortea una, y tambien puedes ' +
               'elegirla en el selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    /* ================================================================= */
    /* ESCENARIO 6: REINHALACION DE CO2                                  */
    /* ================================================================= */
    'absorbedor:agotado': [
      { texto: 'Ultimo entrenamiento, y el que cierra el conjunto. El EtCO2 subio por encima de su limite y ' +
               'suena la alarma. La tentacion es tratarlo como un problema del paciente, pero mira primero ' +
               'el capnograma.' },

      { texto: 'Fijate en la linea base, que es el detalle que lo cambia todo. No toca el suelo: empieza ' +
               'por encima de cero. Eso significa que el gas que el paciente inspira ya trae CO2 antes de ' +
               'entrar, y el gas que entra lo prepara la maquina.',
        resalta: '#curvasMini' },

      { texto: 'Esa distincion es la mas importante del escenario. Un EtCO2 alto con la linea base en cero ' +
               'puede ser hipoventilacion, fiebre, mil cosas del paciente. Un EtCO2 alto con la linea base ' +
               'levantada no admite discusion: hay CO2 inspirado, y eso es del circuito. Confirmalo.',
        resalta: '[data-accion="leer_linea_base"]',
        espera: 'accion:leer_linea_base',
        pista: 'Pulsa "Leer la linea base del capnograma".' },

      { texto: 'Veinticuatro mmHg de CO2 inspirado, cuando el limite de fabrica esta en cuatro. El paciente ' +
               'esta respirando su propio aire espirado. Antes de buscar la causa, protegelo: sube el gas ' +
               'fresco.',
        resalta: '[data-accion="subir_gas_fresco_abs"]',
        espera: 'accion:subir_gas_fresco_abs',
        pista: 'Pulsa "Subir el gas fresco para diluir el CO2 que vuelve".' },

      { texto: 'El CO2 inspirado se desploma, y conviene entender por que, porque es la formula que gobierna ' +
               'todo este escenario: la fraccion que se reinhala es uno menos el gas fresco dividido por el ' +
               'volumen minuto. Mas gas fresco entrando, menos gas viejo volviendo. Es dilucion pura.',
        resalta: '#variables' },

      { texto: 'Que quede claro lo que acabas de hacer, porque es la misma leccion de la falla del ' +
               'vaporizador: no arreglaste nada. Estas tapando el problema con gas fresco, que cuesta agente ' +
               'y cuesta dinero, y en cuanto vuelvas a flujos bajos el CO2 reaparece. Has comprado tiempo ' +
               'para diagnosticar con calma. Usalo.' },

      { texto: 'Ahora el diagnostico, y empieza por lo que cuesta dos segundos: mira el color de la cal.',
        resalta: '[data-accion="revisar_color"]',
        espera: 'accion:revisar_color',
        pista: 'Pulsa "Mirar el color de la cal en el canister".' },

      { texto: 'Violeta en casi todo el canister. El indicador viro y coincide con lo que mide el ' +
               'capnograma: las dos cosas dicen lo mismo, y cuando el color y la medida coinciden el ' +
               'diagnostico esta hecho sin herramientas.',
        resalta: 'zona:absorbedor' },

      { texto: 'Cambia el canister.',
        resalta: '[data-accion="cambiar_canister"]',
        espera: 'accion:cambiar_canister',
        pista: 'Pulsa "Cambiar el canister de cal sodada".' },

      { texto: 'Mira el capnograma otra vez: la linea base volvio a tocar el suelo. Esa es la verificacion, y ' +
               'no el color de la cal nueva. Fijate en el detalle, porque en una de las otras variantes de ' +
               'este modulo la cal ya se veia blanca desde el principio y estaba completamente gastada.',
        resalta: '#curvasMini' },

      { texto: 'Dos cosas para llevarte. La primera: el criterio para cambiar el absorbente no es el color, ' +
               'es el CO2 inspirado, y los manuales lo ponen entre 0,5 % y 5 mmHg segun la fuente. La ' +
               'segunda: la vida util que dan las tablas, entre 80 y 125 minutos por cada 100 gramos, es de ' +
               'laboratorio, con una ventilacion concreta. En tu paciente depende del flujo que uses, de su ' +
               'produccion de CO2 y del tipo de cal. Sirve para planificar, no para confiarse.' },

      { texto: 'Este modulo tiene tres variantes y al entrar se sortea una. Las otras dos son mas duras que ' +
               'esta: en una la cal esta igual de gastada pero se ve blanca, y en la otra la cal esta ' +
               'perfecta y el CO2 vuelve por otro camino. Puedes elegirlas en el selector de la barra de ' +
               'arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    'absorbedor:color': [
      { texto: 'Te toco la variante que ensena a no fiarse de lo facil. El cuadro es el mismo: EtCO2 por ' +
               'encima del limite y la linea base del capnograma levantada. Hay CO2 inspirado.' },

      { texto: 'Confirmalo formalmente, que es el primer paso de las tres variantes.',
        resalta: '[data-accion="leer_linea_base"]',
        espera: 'accion:leer_linea_base',
        pista: 'Pulsa "Leer la linea base del capnograma".' },

      { texto: 'Veinticuatro mmHg, seis veces el limite. Protege al paciente antes de investigar: sube el ' +
               'gas fresco para diluir lo que vuelve.',
        resalta: '[data-accion="subir_gas_fresco_abs"]',
        espera: 'accion:subir_gas_fresco_abs',
        pista: 'Pulsa "Subir el gas fresco para diluir el CO2 que vuelve".' },

      { texto: 'Bien, el CO2 inspirado baja. Ahora al diagnostico: mira el color de la cal.',
        resalta: '[data-accion="revisar_color"]',
        espera: 'accion:revisar_color',
        pista: 'Pulsa "Mirar el color de la cal en el canister".' },

      { texto: 'Blanca. Y aqui es donde se pierde mucha gente, porque la conclusion natural es "la cal esta ' +
               'bien, el problema debe ser otro". Fijate en que ese razonamiento tiene un agujero: el color ' +
               'es un colorante que vira con el pH, no un medidor de capacidad. Te dice algo cuando esta ' +
               'violeta, pero no te asegura nada cuando esta blanco.',
        resalta: 'zona:absorbedor' },

      { texto: 'Y hay una razon concreta por la que puede mentir, que es justo lo que paso aqui: el viraje ' +
               'es reversible. Una cal que ha estado en reposo, por ejemplo un fin de semana, recupera el ' +
               'color blanco aunque siga agotada. Vuelve a tener el aspecto de nueva y no retiene nada.' },

      { texto: 'Entonces necesitas un dato que el color no te pueda falsear, y lo tienes a mano, literalmente: ' +
               'pon la mano sobre el canister.',
        resalta: '[data-accion="palpar_canister"]',
        espera: 'accion:palpar_canister',
        pista: 'Pulsa "Palpar el canister: temperatura de la reaccion".' },

      { texto: 'Frio. Y eso es concluyente, porque la reaccion de la cal sodada con el CO2 desprende calor: ' +
               'una cal que esta absorbiendo se calienta, siempre. Un canister frio con el paciente ventilando ' +
               'significa que ahi dentro no esta pasando nada, por mas blanca que se vea la cal. Ningun ' +
               'sensor de la maquina mide esto; lo mide tu mano.',
        resalta: '#variables' },

      { texto: 'Cambia el canister, ahora si con fundamento.',
        resalta: '[data-accion="cambiar_canister"]',
        espera: 'accion:cambiar_canister',
        pista: 'Pulsa "Cambiar el canister de cal sodada".' },

      { texto: 'La linea base vuelve al suelo. Y mira la paradoja que deja esta variante: la cal se veia ' +
               'blanca antes del cambio y se ve blanca despues. Si el color hubiera sido tu criterio, no ' +
               'habrias cambiado nada y tampoco habrias podido verificar que lo arreglaste.',
        resalta: '#curvasMini' },

      { texto: 'Esa es la razon de fondo por la que los manuales no usan el color como criterio de cambio, ' +
               'sino el CO2 inspirado. El color es gratis y por eso se mira primero; pero cuando dice lo que ' +
               'te conviene oir, es cuando menos hay que creerle.' },

      { texto: 'Las otras dos variantes son la cal agotada con el color virado, que es el caso de libro, y ' +
               'una en la que la cal esta perfecta y el CO2 vuelve por otro camino. Al entrar se sortea una, ' +
               'y puedes elegirla en el selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    'absorbedor:valvula': [
      { texto: 'Te toco la variante que rompe el reflejo del escenario, y conviene avisarte de entrada: aqui ' +
               'el absorbedor no tiene nada que ver. El cuadro, en cambio, es el mismo de siempre.' },

      { texto: 'Linea base levantada y EtCO2 alto. Confirmalo igual que en las otras dos.',
        resalta: '[data-accion="leer_linea_base"]',
        espera: 'accion:leer_linea_base',
        pista: 'Pulsa "Leer la linea base del capnograma".' },

      { texto: 'Catorce mmHg de CO2 inspirado, con el limite en cuatro. Protege primero: sube el gas fresco.',
        resalta: '[data-accion="subir_gas_fresco_abs"]',
        espera: 'accion:subir_gas_fresco_abs',
        pista: 'Pulsa "Subir el gas fresco para diluir el CO2 que vuelve".' },

      { texto: 'Baja, como en las otras variantes, y por la misma razon: el gas fresco diluye lo que vuelve ' +
               'sea cual sea el motivo por el que vuelve. Eso es lo que hace de esta una buena medida ' +
               'inmediata, pero tambien significa que no te dice nada sobre la causa. Toca diagnosticar.' },

      { texto: 'Mira el color de la cal.',
        resalta: '[data-accion="revisar_color"]',
        espera: 'accion:revisar_color',
        pista: 'Pulsa "Mirar el color de la cal en el canister".' },

      { texto: 'Blanca. Y ya sabes que eso no demuestra nada por si solo, asi que no te quedes ahi: palpa el ' +
               'canister.',
        resalta: '[data-accion="palpar_canister"]',
        espera: 'accion:palpar_canister',
        pista: 'Pulsa "Palpar el canister: temperatura de la reaccion".' },

      { texto: 'Templado. Para la variante del color este dato cerraba el caso; aqui lo abre. Un canister ' +
               'templado significa que la cal esta reaccionando, es decir que esta absorbiendo CO2 ahora ' +
               'mismo. Entonces tienes dos hechos que parecen incompatibles: el absorbedor funciona y hay ' +
               'CO2 inspirado.',
        resalta: '#variables' },

      { texto: 'La contradiccion se resuelve con una pregunta distinta. Hasta ahora preguntabas si la cal ' +
               'retiene el CO2. Prueba a preguntar si todo el CO2 pasa por la cal. En un circuito circular, ' +
               'quien obliga al gas a dar la vuelta en un solo sentido no es la cal: son las valvulas ' +
               'unidireccionales.',
        resalta: '#blq-valvInsp' },

      { texto: 'Observa los discos de las valvulas.',
        resalta: '[data-accion="revisar_valvulas"]',
        espera: 'accion:revisar_valvulas',
        pista: 'Pulsa "Observar los discos de las valvulas unidireccionales".' },

      { texto: 'El disco no asienta. Queda un paso abierto por el que el gas espirado se vuelve por donde ' +
               'vino, sin llegar al absorbedor. La cal esta perfecta y no se entera: el CO2 ni la toca. Sin ' +
               'valvulas que lo guien, un circuito circular deja de ser circular.' },

      { texto: 'Fijate en lo que te habrias ahorrado con dos observaciones de diez segundos. Sin palpar el ' +
               'canister, el camino natural era cambiar la cal: habrias gastado un canister, perdido unos ' +
               'minutos con el paciente reinhalando y seguido exactamente igual de mal, porque el problema ' +
               'no estaba ahi.' },

      { texto: 'Corrige: un disco deformado se sustituye, no se recoloca a mano en medio de un caso. ' +
               'Mientras llega el repuesto, el gas fresco alto sostiene la situacion.',
        resalta: '[data-accion="escalar_valvula"]',
        espera: 'accion:escalar_valvula',
        pista: 'Pulsa "Escalar a servicio: sustituir la valvula".' },

      { texto: 'El CO2 inspirado desaparece y la cal sigue siendo la misma del principio. Ahi tienes la ' +
               'prueba de que nunca fue el absorbedor. La frase para llevarte de todo este modulo: la linea ' +
               'base levantada dice que el paciente reinhala, no dice por que. El absorbente es el sospechoso ' +
               'mas frecuente, no el unico.',
        resalta: '#curvasMini',
        fin: true }
    ],

    'perdida_o2:tuberia': [
      { texto: 'Segundo entrenamiento. Esta vez la maquina perdio el suministro de oxigeno. Ya conoces la ' +
               'interfaz, asi que vamos directo al diagnostico.' },

      { texto: 'Mira primero la alarma de prioridad alta y despues la maquina: la toma de O2 de la pared esta ' +
               'apagada y el flujometro de O2 no sostiene el caudal, aunque no hayas tocado la perilla.',
        resalta: 'zona:suministro' },

      { texto: 'Fijate tambien en el N2O: aparece como cortado. No es una averia, es una proteccion. ' +
               'Pulsa esa alarma para leer por que.',
        resalta: '#bandaAlarmas',
        espera: 'capa2',
        pista: 'Pulsa una alarma de la banda para ver su "por que".' },

      { texto: 'Primero confirma que la alarma coincide con la realidad. Si el mensaje apareciera con los ' +
               'manometros normales, el sospechoso seria el interruptor de presion y no el gas.',
        resalta: '[data-accion="confirmar_manometros"]',
        espera: 'accion:confirmar_manometros',
        pista: 'Pulsa "Confirmar los manometros de tuberia y de cilindro".' },

      { texto: 'La presion esta realmente en cero. El paciente esta siendo ventilado con aire ambiente: FiO2 del ' +
               '21 %. Abre el cilindro de reserva de O2.',
        resalta: '[data-accion="abrir_cilindro"]',
        espera: 'accion:abrir_cilindro',
        pista: 'Pulsa "Abrir el cilindro de reserva de O2".' },

      { texto: 'Mira lo que acaba de pasar en la maquina. El cilindro se ilumino y su manometro empieza a ' +
               'bajar: la presion ya no viene de la tuberia sino del regulador del cilindro. La FiO2 se ' +
               'recupera y el N2O se repone, porque la proteccion solo cortaba por falta de presion de O2.',
        resalta: 'zona:suministro' },

      { texto: 'Tres cosas que tienes que saber del cilindro. Es una reserva finita y se consume mientras este ' +
               'abierto. Su duracion se estima con t(min) = presion en psi x 0,28 / flujo, para un cilindro E; ' +
               'bajar el gas fresco la alarga. Y lo que mas se olvida: cuando vuelva la tuberia hay que ' +
               'cerrarlo, porque si queda abierto se vacia sin que nadie lo note y la reserva ya no esta ' +
               'cuando de verdad hace falta.',
        resalta: '[data-fuente="rangos:flujometros"]' },

      { texto: 'Mientras llega la solucion de fondo, protege al paciente: ventila manualmente con O2.',
        resalta: '[data-accion="ventilar_manual_o2"]',
        espera: 'accion:ventilar_manual_o2',
        pista: 'Pulsa "Ventilar manualmente con O2".' },

      { texto: 'Ahora la correccion de fondo. El cilindro solo gana tiempo: hay que recuperar la tuberia. ' +
               'Revisa y restablece la conexion.',
        resalta: '[data-accion="restablecer_tuberia"]',
        espera: 'accion:restablecer_tuberia',
        pista: 'Pulsa "Revisar y restablecer la conexion de la tuberia".' },

      { texto: 'Resuelto, pero falta un detalle: el cilindro sigue abierto. Cierralo ahora que la tuberia ' +
               'funciona, o seguira vaciandose. Tres ideas para llevarte: una alarma de suministro se ' +
               'confirma siempre contra los manometros; una mezcla sin oxigeno es mas peligrosa que quedarse ' +
               'sin anestesico, que es por lo que la maquina corta el N2O sola; y una reserva solo sirve si ' +
               'esta llena cuando la necesitas.',
        resalta: '#btnCilO2' },

      { texto: 'Esa ultima idea es justo la segunda variante de este modulo: la misma perdida de tuberia, pero ' +
               'con el cilindro de respaldo en reserva. Y hay una tercera, que es la mas interesante: la ' +
               'alarma suena con los manometros normales. Al entrar se sortea una de las tres, y tambien ' +
               'puedes elegirla en el selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    /* ----------------------------------------------------------------- */
    /* Variante 2: la tuberia se pierde y el respaldo esta en reserva     */
    /* ----------------------------------------------------------------- */
    'perdida_o2:cilindro': [
      { texto: 'Te toco la variante incomoda de este modulo. La tuberia de O2 esta en cero, igual que en el ' +
               'caso simple, pero el respaldo no te va a salvar: el cilindro esta en reserva.' },

      { texto: 'Empieza igual que siempre, confirmando que la alarma coincide con la realidad. Los manometros ' +
               'son los que mandan.',
        resalta: '[data-accion="confirmar_manometros"]',
        espera: 'accion:confirmar_manometros',
        pista: 'Pulsa "Confirmar los manometros de tuberia y de cilindro".' },

      { texto: 'Dos datos, y los dos malos: la tuberia esta en cero y el manometro del cilindro marca muy por ' +
               'debajo de lo que deberia marcar un cilindro lleno. La maquina ya avisa de presion baja en el ' +
               'cilindro, que es una alarma que mucha gente ha visto en el chequeo de la manana y ha dejado ' +
               'para despues.',
        resalta: '#variables' },

      { texto: 'Abrelo de todas formas. Poco oxigeno es infinitamente mejor que ninguno, y el paciente esta ' +
               'respirando aire ambiente al 21 % mientras decides.',
        resalta: '[data-accion="abrir_cilindro"]',
        espera: 'accion:abrir_cilindro',
        pista: 'Pulsa "Abrir el cilindro de reserva de O2".' },

      { texto: 'Ahora mira la autonomia, que es el dato que cambia todo. Con el caudal que estas usando, ese ' +
               'cilindro da unos veinte minutos. No es un respaldo: es un cronometro. Y ese numero se calcula, ' +
               'no se adivina: presion en psi por 0,28 dividido por el flujo, para un cilindro E.',
        resalta: '#variables' },

      { texto: 'Lo primero que puedes hacer con ese numero es alargarlo. Baja el gas fresco al minimo que ' +
               'puedas permitirte: la autonomia es inversamente proporcional al flujo, asi que pasar de 2 a ' +
               '1 L/min duplica el tiempo que tienes. Mueve la perilla de O2 y mira como cambia.',
        resalta: '#controles',
        espera: 'control:o2',
        pista: 'Mueve la perilla de O2 en el panel de controles.' },

      { texto: 'Mientras tengas ese cronometro corriendo, protege al paciente y ventila manualmente.',
        resalta: '[data-accion="ventilar_manual_o2"]',
        espera: 'accion:ventilar_manual_o2',
        pista: 'Pulsa "Ventilar manualmente con O2".' },

      { texto: 'Y ahora resuelve de verdad. En el caso simple la tuberia era importante; aqui es urgente, ' +
               'porque el respaldo tiene fecha de caducidad y ya empezo a contar.',
        resalta: '[data-accion="restablecer_tuberia"]',
        espera: 'accion:restablecer_tuberia',
        pista: 'Pulsa "Revisar y restablecer la conexion de la tuberia".' },

      { texto: 'La tuberia vuelve y el paciente esta a salvo. Pero fijate en que la alarma del cilindro sigue ' +
               'sonando, y debe seguir: ese cilindro hay que cambiarlo antes del proximo caso. Ahora mismo ' +
               'esta maquina no tiene respaldo, y la siguiente persona que la use no lo sabe.' },

      { texto: 'La leccion de esta variante no es tecnica, es de habito. El respaldo no se comprueba cuando ' +
               'falla la tuberia: se comprueba en el chequeo previo, todos los dias, cuando no pasa nada. Un ' +
               'cilindro medio vacio es un problema invisible hasta el momento exacto en el que no puedes ' +
               'permitirtelo.' },

      { texto: 'Las otras dos variantes son la perdida de tuberia con el respaldo lleno, que es el caso ' +
               'simple, y una alarma que suena con los manometros normales. Al entrar se sortea una, y puedes ' +
               'elegirla en el selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ],

    /* ----------------------------------------------------------------- */
    /* Variante 3: la alarma miente                                       */
    /* ----------------------------------------------------------------- */
    'perdida_o2:interruptor': [
      { texto: 'Te toco la variante que ensena a desconfiar, y hay que tomarla en serio: la alarma que suena ' +
               'es de fallo de suministro de oxigeno, prioridad alta. De las que no se ignoran nunca.' },

      { texto: 'Pero mira la maquina antes de reaccionar, y mirala con calma. El manometro de la tuberia ' +
               'marca presion normal. El flujometro de O2 sostiene el caudal que fijaste. Y el N2O sigue ' +
               'pasando: nadie lo corto.',
        resalta: 'zona:suministro' },

      { texto: 'Ese tercer dato es el mas fino de todo el escenario, asi que vale la pena entenderlo. El corte ' +
               'de N2O no lo decide la pantalla: lo decide la presion real del oxigeno, por via neumatica. Si ' +
               'de verdad hubiera caido la presion, el N2O estaria cortado si o si, sin que ningun sensor ' +
               'tuviera que opinar. Sigue pasando, asi que la presion esta ahi.',
        resalta: '#variables' },

      { texto: 'Aun asi, confirma formalmente lo que estas viendo. Es el mismo primer paso de las tres ' +
               'variantes y aqui da el resultado contrario al habitual.',
        resalta: '[data-accion="confirmar_manometros"]',
        espera: 'accion:confirmar_manometros',
        pista: 'Pulsa "Confirmar los manometros de tuberia y de cilindro".' },

      { texto: 'Contradiccion confirmada: la alarma dice que falta oxigeno y todo lo demas dice que no. ' +
               'Cuando el instrumento y la realidad no coinciden, uno de los dos miente, y hay que averiguar ' +
               'cual antes de actuar sobre el paciente.' },

      { texto: 'Prueba el interruptor de presion. Se cortocircuita, y eso fuerza a la electronica a ver ' +
               'presion correcta: si la alarma desaparece con el puente puesto, el que estaba disparando sin ' +
               'motivo es el interruptor.',
        resalta: '[data-accion="revisar_interruptor"]',
        espera: 'accion:revisar_interruptor',
        pista: 'Pulsa "Probar el interruptor de presion de O2".' },

      { texto: 'La alarma se fue y la presion de la tuberia no se movio en ningun momento. Ya tienes el ' +
               'culpable, y fijate en que lo tienes con una prueba y no con una sospecha: el interruptor ' +
               'dispara estando la presion correcta.' },

      { texto: 'Corrige lo que se puede corregir: el interruptor se sustituye, no se ajusta en quirofano.',
        resalta: '[data-accion="sustituir_interruptor"]',
        espera: 'accion:sustituir_interruptor',
        pista: 'Pulsa "Escalar a servicio: sustituir el interruptor de presion".' },

      { texto: 'Ahora mira lo que te acabas de ahorrar. Si hubieras tratado esto como una perdida real, ' +
               'habrias abierto el cilindro gastando reserva, habrias pasado a ventilacion manual sin ' +
               'necesidad y habrias desconectado una tuberia que estaba perfecta, con la posibilidad de ' +
               'romper algo que funcionaba. Todo eso lo evito un manometro mirado a tiempo.',
        resalta: '#registro' },

      { texto: 'Y ahora la advertencia, porque este ejercicio puede dejar una idea peligrosa. La mayoria de ' +
               'las alarmas de suministro de O2 son reales, y una mezcla hipoxica mata en minutos. Que esta ' +
               'fuera falsa no te autoriza a desconfiar de la siguiente. Lo que te autoriza a descartarla es ' +
               'la comprobacion que acabas de hacer, y nada mas: manometros, caudal, N2O y la prueba del ' +
               'interruptor.' },

      { texto: 'Una maquina con una alarma que no significa nada es peor que una maquina sin alarma, porque ' +
               'ensena a ignorarla. Esa es la razon de fondo por la que el interruptor se cambia hoy y no la ' +
               'semana que viene.' },

      { texto: 'Las otras dos variantes de este modulo si son perdidas reales: una con el cilindro de respaldo ' +
               'lleno y otra con el cilindro en reserva. Al entrar se sortea una, y puedes elegirla en el ' +
               'selector de la barra de arriba.',
        resalta: '#selVariante',
        fin: true }
    ]
  };

  /* ---------------------------------------------------------------- */
  /* Motor                                                             */
  /* ---------------------------------------------------------------- */
  var est = {
    activo: false, guion: null, i: 0, caja: null, foco: null, alSalir: null,
    avanzando: false,    /* evita que un control continuo dispare varios avances */
    movido: false,       /* el usuario ya coloco la tarjeta a mano: no se recoloca sola */
    temporizador: null
  };

  /* La clave de un guion puede ser 'monitoreo:celula'. Si una variante no
     tiene guion propio no se cae al del escenario, porque narraria otra
     falla: simplemente no hay guia para esa variante. */
  function hay(escenarioId) { return !!GUIONES[escenarioId]; }

  /* Para la lista de escenarios: hay guia si la tiene el escenario o
     alguna de sus variantes. */
  function hayParaEscenario(esc) {
    if (!esc) return false;
    if (GUIONES[esc.id]) return true;
    return (esc.variantes || []).some(function (v) { return !!GUIONES[esc.id + ':' + v.id]; });
  }

  function guionActual() { return est.id || null; }

  function iniciar(escenarioId, alSalir) {
    var g = GUIONES[escenarioId];
    if (!g) return false;
    est.activo = true;
    est.guion = g;
    est.id = escenarioId;
    est.i = 0;
    est.alSalir = alSalir || null;
    est.avanzando = false;
    est.movido = false;
    crearCaja();
    pintar();
    return true;
  }

  function terminar() {
    est.activo = false;
    est.avanzando = false;
    if (est.temporizador) { clearTimeout(est.temporizador); est.temporizador = null; }
    quitarFoco();
    if (est.caja && est.caja.parentNode) est.caja.parentNode.removeChild(est.caja);
    est.caja = null;
    document.body.classList.remove('con-tut');
    if (est.alSalir) est.alSalir();
  }

  function crearCaja() {
    if (est.caja) return;
    var c = document.createElement('div');
    c.className = 'tut';
    c.innerHTML =
      '<div class="tut-cab">' +
        '<span class="tut-asa" title="Arrastra para mover esta tarjeta">' +
          '<span></span><span></span><span></span></span>' +
        '<span class="tut-chapa">Entrenamiento</span>' +
        '<span class="tut-paso" id="tutPaso"></span>' +
        '<button class="tut-salir" id="tutSalir">Salir de la guia</button>' +
      '</div>' +
      '<p class="tut-txt" id="tutTxt"></p>' +
      '<p class="tut-pista oculto" id="tutPista"></p>' +
      '<div class="tut-pie">' +
        '<div class="tut-puntos" id="tutPuntos"></div>' +
        '<div class="tut-botones">' +
          '<button class="btn-sec peq" id="tutAntes">Anterior</button>' +
          '<button class="btn-pri peq" id="tutSig">Siguiente</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(c);
    document.body.classList.add('con-tut');
    est.caja = c;

    hacerArrastrable(c);
    c.querySelector('#tutSalir').addEventListener('click', terminar);
    c.querySelector('#tutAntes').addEventListener('click', function () {
      if (est.i > 0) { est.i--; pintar(); }
    });
    c.querySelector('#tutSig').addEventListener('click', function () {
      avanzar(true);
    });
  }

  /* ---------------------------------------------------------------- */
  /* La tarjeta se puede mover con el raton: manten pulsado y arrastra. */
  /* Hace falta porque el paso de los flujometros resalta un control    */
  /* que puede quedar justo debajo de ella.                             */
  /* ---------------------------------------------------------------- */
  function colocar(x, y) {
    var c = est.caja;
    if (!c) return;
    var w = c.offsetWidth || 410, h = c.offsetHeight || 200;
    var maxX = (window.innerWidth || 1200) - w - 8;
    var maxY = (window.innerHeight || 800) - h - 8;
    x = Math.max(8, Math.min(maxX, x));
    y = Math.max(8, Math.min(maxY, y));
    c.style.left = x + 'px';
    c.style.top = y + 'px';
    c.style.right = 'auto';
    c.style.bottom = 'auto';
  }

  function hacerArrastrable(c) {
    var arrastrando = false, dx = 0, dy = 0;

    function inicio(ev) {
      if (ev.target && ev.target.closest && ev.target.closest('button')) return;
      var r = c.getBoundingClientRect();
      arrastrando = true;
      est.movido = true;
      dx = ev.clientX - r.left;
      dy = ev.clientY - r.top;
      c.classList.add('arrastrando');
      document.addEventListener('mousemove', mover);
      document.addEventListener('mouseup', fin);
      if (ev.preventDefault) ev.preventDefault();
    }
    function mover(ev) { if (arrastrando) colocar(ev.clientX - dx, ev.clientY - dy); }
    function fin() {
      arrastrando = false;
      c.classList.remove('arrastrando');
      document.removeEventListener('mousemove', mover);
      document.removeEventListener('mouseup', fin);
    }
    c.addEventListener('mousedown', inicio);
  }

  /* Si el elemento resaltado queda debajo de la tarjeta, la tarjeta se
     aparta sola. Deja de hacerlo en cuanto el usuario la mueve a mano. */
  function apartarseDe(el) {
    if (est.movido || !est.caja || !el || !el.getBoundingClientRect) return;
    var c = est.caja;
    var f = el.getBoundingClientRect();
    if (!f.width && !f.height) return;
    var w = c.offsetWidth || 410, h = c.offsetHeight || 200;
    var W = window.innerWidth || 1200, H = window.innerHeight || 800;
    var candidatos = [
      [18, H - h - 18],          // abajo izquierda (por defecto)
      [W - w - 18, H - h - 18],  // abajo derecha
      [W - w - 18, 18],          // arriba derecha
      [18, 18]                   // arriba izquierda
    ];
    for (var i = 0; i < candidatos.length; i++) {
      var x = candidatos[i][0], y = candidatos[i][1];
      var choca = !(f.right < x - 10 || f.left > x + w + 10 ||
                    f.bottom < y - 10 || f.top > y + h + 10);
      if (!choca) { colocar(x, y); return; }
    }
    colocar(candidatos[1][0], candidatos[1][1]);
  }

  function avanzar(forzado) {
    var p = est.guion[est.i];
    if (!p) return;
    if (p.fin) { terminar(); return; }
    if (p.espera && !forzado) { /* llega por notificar */ }
    if (est.i < est.guion.length - 1) { est.i++; pintar(); }
    else terminar();
  }

  function pintar() {
    if (!est.activo || !est.caja) return;
    var p = est.guion[est.i];
    var c = est.caja;

    c.querySelector('#tutPaso').textContent = 'Paso ' + (est.i + 1) + ' de ' + est.guion.length;
    c.querySelector('#tutTxt').textContent = p.texto;

    var pista = c.querySelector('#tutPista');
    if (p.pista) { pista.textContent = p.pista; pista.classList.remove('oculto'); }
    else pista.classList.add('oculto');

    var puntos = '';
    for (var k = 0; k < est.guion.length; k++) {
      puntos += '<span class="pt' + (k === est.i ? ' act' : (k < est.i ? ' hecho' : '')) + '"></span>';
    }
    c.querySelector('#tutPuntos').innerHTML = puntos;

    c.querySelector('#tutAntes').disabled = est.i === 0;
    var sig = c.querySelector('#tutSig');
    if (p.fin) { sig.textContent = 'Terminar'; sig.disabled = false; }
    else if (p.espera) { sig.textContent = 'Esperando que lo hagas'; sig.disabled = true; }
    else { sig.textContent = 'Siguiente'; sig.disabled = false; }

    c.classList.toggle('es-fin', !!p.fin);
    est.avanzando = false;
    ponerFoco(p.resalta);
  }

  /* ---------------------------------------------------------------- */
  /* Resaltado del elemento al que hay que atender                     */
  /* ---------------------------------------------------------------- */
  function quitarFoco() {
    if (est.foco) {
      try { est.foco.classList.remove('tut-foco'); } catch (e) {}
      est.foco = null;
    }
  }

  function ponerFoco(sel) {
    quitarFoco();
    if (!sel) return;
    var el = null;
    if (sel.indexOf('zona:') === 0) {
      el = document.querySelector('.zona-m[data-zona="' + sel.slice(5) + '"]');
    } else {
      el = document.querySelector(sel);
    }
    if (!el) return;
    el.classList.add('tut-foco');
    est.foco = el;
    if (el.scrollIntoView) {
      try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }
    apartarseDe(el);
  }

  /* Vuelve a aplicar el foco tras un repintado del DOM */
  function reaplicarFoco() {
    if (!est.activo) return;
    var p = est.guion[est.i];
    if (!p || !p.resalta) return;
    if (est.foco && document.body.contains(est.foco)) return;
    ponerFoco(p.resalta);
  }

  /* ---------------------------------------------------------------- */
  /* Eventos que llegan de la interfaz                                 */
  /* ---------------------------------------------------------------- */
  function notificar(evento) {
    if (!est.activo || est.avanzando) return;
    var p = est.guion[est.i];
    if (!p || !p.espera) return;
    if (p.espera !== evento) return;
    /* Un control deslizante emite un evento por cada pixel que se mueve.
       Sin esta guarda, mover una perilla saltaba varios pasos de golpe. */
    est.avanzando = true;
    if (est.temporizador) clearTimeout(est.temporizador);
    est.temporizador = setTimeout(function () {
      est.temporizador = null;
      if (est.activo && est.avanzando) avanzar(true);
    }, 900);
  }

  return {
    GUIONES: GUIONES,
    hay: hay,
    hayParaEscenario: hayParaEscenario,
    iniciar: iniciar,
    terminar: terminar,
    notificar: notificar,
    guionActual: guionActual,
    reaplicarFoco: reaplicarFoco,
    activo: function () { return est.activo; }
  };
})();
