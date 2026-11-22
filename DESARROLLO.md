# Bitacora de desarrollo

Que se construyo en cada ensayo, que fallo y por que se corrigio. Lo mas reciente va primero.

## Ensayo 4 - la estetica


**La paleta, rehecha sobre fuentes y no sobre gusto.** El aspecto de plantilla venia de dos cosas: el
negro azulado y un acento saturado repartido por botones, chips y bordes. Se corrigieron las dos.

El fondo es ahora **grafito neutro**, con saturacion de ~4% y sin tinte apreciable. El primer
intento fue un grafito calido, de tierra, y fue una sobrecorreccion: de las dos causas del aspecto
de plantilla, la que pesaba era el acento saturado, no que el gris fuera frio. Calentar el gris
corrigio lo que no estaba roto y agrego un tinte sepia que envejece la vista. El gris casi neutro es
tambien el de las carcasas y las interfaces del equipo clinico. Y la interfaz **no tiene color de acento**: lo
interactivo se marca con contraste y peso tipografico. La regla de la paleta es que el color solo
aparece cuando significa algo, y siempre con respaldo:

- **Alarmas: rojo, amarillo y cian**, segun IEC 60601-1-8, que exige rojo para prioridad alta y
  amarillo para media; el cian para la baja es lo que usan los monitores de la practica (indicador
  cian para nivel bajo, fondo cian para alarmas tecnicas). Antes el amarillo era un ambar apagado y
  la prioridad baja un oliva inventado.
- **Gases:** su codigo de identificacion. El aire se llevo hacia el ambar y el N2O hacia un azul
  medio para no confundirse con el amarillo y el cian de las alarmas, que ahora tienen significado
  propio.
- **Curvas: capnografia en blanco y presion de via aerea en gris azulado**, que es la convencion que
  describe la Anesthesia Patient Safety Foundation: no hay estandar acordado, pero si el CO2 es
  siempre blanco y cada parametro mantiene su color, la lectura es inequivoca. De paso, el verde
  deja de usarse en las curvas y queda libre para significar oxigeno en todo el simulador.
- **Agentes:** su codigo de identificacion por agente, que ya estaba.

Todas las combinaciones de texto y fondo se midieron contra el criterio AA de la WCAG. Las doce
pasan.

**Referencia del campo.** El Virtual Anesthesia Machine de la Universidad de Florida, que es el
simulador de referencia en esta materia, usa el mismo enfoque de "realidad transparente": partculas
codificadas por color para el gas invisible, verde para O2 y azul para N2O, y en su version para
instructores, catorce fallas mas una falla aleatoria. Coincide con lo que veniamos haciendo, incluido
el sorteo de variantes, y confirma que el codigo de color de gases no es universal: esa version
soporta seis codigos distintos segun el pais.

**El inicio, en una sola pantalla.** A la izquierda, "Que te gustaria hacer" y los tres modos; a la
derecha, la maquina. Antes eran dos pasos —una portada y luego los modos— y el segundo no aportaba
nada: dos clics para llegar a lo mismo.

Los tres modos dejaron de ser tarjetas. Las tres cajas iguales con su numero en un circulo son el
patron de maqueta mas reconocible que hay, y por ahi se colaba el aire de plantilla. Ahora son una
lista: un filete arriba, cada modo separado por una linea fina, con su titulo, una frase y una
etiqueta pequena a la derecha. Al pasar por encima se ilumina un filo de color a la izquierda y la
flecha avanza. Menos cajas, menos bordes redondeados, mas jerarquia tipografica.

**El cuerpo de la maquina, gris claro.** Tomando como referencia la arquitectura de los equipos
actuales: carcasa clara, columna de cajones, encimera, zocalo oscuro y ruedas. Se anadio el **brazo
articulado** que sostiene el monitor y una **pantalla propia en el cabezal** con VT, FR y PEEP en
vivo, que son los dos rasgos que mas identifican a una maquina moderna. El hueco del segundo
vaporizador se convirtio en esa pantalla.

De la fotografia de referencia se tomo solo la arquitectura, que es comun a todos los fabricantes y
no es de nadie. No se copiaron proporciones, molduras, colores corporativos ni marcas.

**El paciente: via aerea y pulmones.** Donde habia un circulo rojo con una raya ahora esta la via
aerea saliendo de la pieza en Y, la traquea, la carina y los dos pulmones, que se expanden con cada
insuflacion. Es la forma convencional de representar al paciente en un esquema de circuito, y tiene
una ventaja sobre dibujar a una persona: se entiende igual de bien, no distrae y no cae en el valle
inquietante. Se probo primero con una figura humana con mascarilla y el resultado era desagradable.

**Vinetas en las tarjetas de escenario.** Cada falla tiene ahora una miniatura que muestra el dano:
la manguera suelta con el gas escapando, el fuelle que no llega al tope, el capnograma plano con la
trampa llena, el vaporizador con la ventana vacia, el manometro en cero y la cal virada con el CO2
volviendo. Lo que esta mal se ve, y se marca en rojo.

**La paleta vieja seguia escrita a mano en el CSS.** Cambiar el `:root` no basto: quedaban unos
doscientos colores puestos directamente en las reglas, del cian `#4cc9f0` y el verde `#3ddc84`
originales. Por eso seguian apareciendo acentos de neon en los chips de accion, en el desplegable de
variante, en los hover y en la banda de las curvas. Se sustituyeron todos por las variables de la
paleta, dejando fuera el dibujo de la maquina y del circuito, que no se toca. Las particulas de gas
del circuito pasaron a los mismos valores que las etiquetas: si la bolita y la leyenda no son del
mismo color, el codigo de identificacion no ensena nada.

**Una escala tipografica, en vez de veintitres tamanos.** Habia 23 tamanos de letra y 12 radios de
esquina distintos, puestos uno a uno. Eso es lo que hace que una interfaz se vea improvisada aunque
cada pantalla por separado se vea bien. Ahora hay seis tamanos (10, 11, 13, 15, 18 y 26 px) y dos
radios (3 y 5 px). El radio pequeno no es capricho: el equipo clinico es cuadrado, y la esquina muy
redondeada pertenece a la estetica de las plantillas web.

**La lectura numerica, como en un monitor.** La cifra a 26 px y la unidad pequena al lado, con
digitos de ancho fijo para que el numero no se mueva de sitio al cambiar de valor. Los estados
escritos con palabras ("llega al tope") se quedan en tamano de titulo, porque a 26 px no caben y
ademas no se leen de un golpe como se lee un numero. La unidad no va en versalitas: cmH2O y mmHg
llevan mayusculas y minusculas que significan cosas distintas.

**Menos filetes.** Habia 31 recuadros con borde. Los paneles de un equipo no se separan con lineas
sino con niveles de superficie, asi que dieciseis de ellos pasaron a distinguirse solo por el fondo,
y el realce al pasar por encima se hace con un filete interior en vez de con el borde. Las zonas de
dibujo (curvas y esquema) usan el fondo mas profundo, para que se lean como pantallas.

**Los mandos, dibujados y no heredados.** El `<input type=range>` nativo lo dibuja cada sistema a
su manera: en Windows queda una barra fina con un cuadrito, que no se parece a ningun mando de una
maquina de anestesia, y ademas el simulador no se veia igual en dos computadores distintos. Ahora se
dibujan desde el CSS: una guia hundida y una perilla redonda y clara, con el **color de
identificacion del gas que regula** en el anillo, el mismo de la particula en el circuito y de la
etiqueta en la leyenda. La perilla del vaporizador lleva el color del agente; la de la APL, que no
regula un gas, va neutra.

**Lo que no cambio:** modelos, perfil, alarmas, escenarios, variantes, sorteo, tutoriales, pruebas y
textos. La suite completa se volvio a pasar sobre esta carpeta con el mismo resultado.

---

# Simulador de maquina de anestesia - ENSAYO 3

Simulador web 2D de una maquina de anestesia generica, de arquitectura estandar y sin marca,
para que estudiantes de Ingenieria Biomedica practiquen el **diagnostico de fallas desde la
ingenieria clinica**.

Construido sobre el documento *Contexto tecnico y conceptual del proyecto (version 2)*.
No es un simulador clinico: no ensena a anestesiar, sino a entender la maquina, diagnosticarla
y corregirla.

**Se abre con doble clic en `index.html`.** No necesita servidor, instalacion ni internet.

---

## Escenario 2: falla del ventilador

Jugable de punta a punta, con su entrenamiento guiado de 13 pasos.

**El caso.** La presion del gas motriz cayo a 120 kPa, muy por debajo del rango entregado de 280 a
600 kPa (M3 B-8 [230]) y por debajo del punto de disparo del interruptor (M1 5-21 [141]): la alarma
es real, no de un sensor que miente. La concertina deja de moverse, el monitoreo sigue encendido y
aparecen cinco alarmas: ventilador sin gas motriz (alta), presion baja de via aerea (alta), apnea
(alta a los 2 min), EtCO2 baja (media) e imposible mover la concertina (baja).

**La idea que ensena.** El fuelle necesita dos cosas distintas que se confunden con facilidad:
**empuje**, que es el gas motriz, y **volumen**, que es el gas fresco. Sin empuje no se mueve; sin
volumen no llega al tope. Los sintomas se parecen y la correccion es distinta, y se separan mirando
la presion del gas motriz. Por eso el escenario incluye la accion de subir el gas fresco o pulsar
la purga de O2, que es lo que indica M4 7-12 [142] para la concertina plegada: aqui esta marcada
como parcialmente util, porque llena el fuelle de gas y aun asi seguira sin moverse.

**Diez acciones**, con su proposito visible antes de pulsarlas y su "cuando si" en la
retroalimentacion: pasar a manual, leer la alarma, verificar el gas motriz, probar el interruptor
de presion, revisar modo y conmutador, subir el gas fresco, restablecer el gas motriz, volver a
mecanica y comprobar, reiniciar el equipo y escalar a servicio.

**Dos detalles de diseno.** Restablecer el gas motriz sin haberlo verificado antes se marca como
incorrecto: corregir a ciegas es cambiar cosas y esperar. Y el escenario no se da por resuelto
mientras la maquina siga en ventilacion manual: hay que devolverla a mecanica y ver la concertina
moverse, que es la verificacion que piden M1 4.2.1 y M3 6.8.1.

---

## Escenario 3: falla del monitoreo de gases

Jugable de punta a punta, con **tres variantes** sorteadas al entrar y **una guia propia para cada
una**: el mismo modulo falla de tres maneras distintas, y cada una se diagnostica diferente.

**Variante 1, la trampa de agua llena.** Es la mas simple y la que usa el entrenamiento guiado. La bomba del modulo pasa de 200 a 8 mL/min, por debajo de
los 20 mL/min que M3 D-9 [259] define como via aerea ocluida, y el modulo deja de dar CO2 y agente.
Cuatro alarmas: via aerea ocluida (alta), linea de muestreo obstruida (media), compruebe la salida
del gas de muestra (media) y flujo de muestra bajo (baja).

**La idea que ensena, y es la mas importante de las tres.** Un monitor que no mide no es un
paciente que empeora. Mientras la capnografia desaparece, la presion pico sigue en 23 cmH2O, el
volumen espirado en 500 mL, la concertina al 100 % y la FiO2 midiendo al 61 %. Ese contraste esta
puesto a proposito en el panel de variables: la FiO2 sigue porque la celula de O2 esta en la rama
inspiratoria y no usa la linea de muestreo. Son dos caminos distintos, y eso solo ya localiza la falla.

Por eso el escenario incluye la accion **"subir la ventilacion porque el EtCO2 esta bajo"**, marcada
como incorrecta: hiperventila a un paciente que estaba perfecto guiandose por un numero que la
maquina no esta midiendo. El EtCO2 no esta bajo, esta ausente, que es otra cosa.

**La prueba discriminante.** Es la mas elegante del proyecto y sale de M3 8-6 [114]: la maquina solo
sabe que la bomba no mueve gas, no donde esta el tapon, y por eso propone dos hipotesis a la vez.
Desconectando la linea de la trampa, la bomba aspira solo a traves de la trampa: si el aviso sigue,
lo tapado es la trampa; si desaparece, es la linea. Un gesto y dos hipotesis resueltas. Esta
implementada como prueba realizable, igual que la de fugas.

**Oclusion parcial.** El modelo tambien representa la trampa con gotas: el caudal baja al 55 % del
nominal y salta solo la alarma de prioridad baja, antes de que las lecturas desaparezcan.

### Variante 2: la celula de O2 descalibrada

Los flujometros marcan 0,5 L/min de O2 y 2,5 de aire, que es una mezcla correcta al 34 % de O2.
Pero la celula lee 24,6 % y salta la alarma de FiO2 baja, de prioridad alta. Todo lo demas esta
bien: el caudal de muestra en sus 200 mL/min, el EtCO2 presente, la capnografia dibujando. Es el
espejo exacto de la variante 1, y por eso vale tenerlas juntas: alli el monitor no media y el
paciente estaba bien; aqui el monitor mide mal y la mezcla esta bien. En las dos, actuar sobre el
paciente por lo que dice la pantalla es el error.

El camino es comprobar la celula con aire ambiente y luego calibrarla. En ese orden, y el simulador
lo exige: calibrar sin haber comprobado primero se marca como incorrecto, porque calibrar es
reescribir la referencia del sensor y no se reescribe una referencia sin saber cuanto se desvia.
Expuesta al aire, una celula sana lee 21 % con una tolerancia de +-3 % (M3 D-6 [256]); esta lee
15 %, que confirma la desviacion y permite calibrar con fundamento.

### Variante 3: el modulo de gases no arranca

Dos alarmas y ningun numero: fallo de inicio o comunicacion (alta) y monitorizacion de gas no
disponible (media). El caudal de muestra es 0, no 8. Y la celula de O2 sigue midiendo 61 %, porque
es un sensor aparte que no depende del modulo.

La prueba de la trampa es la que cierra el diagnostico, y aqui da un resultado que no da en ninguna
otra variante: **cero con la linea puesta y cero sin ella**. Un tapon deja pasar algo, o cambia al
quitar la linea; una bomba que no responde no cambia. El camino es reiniciar el modulo primero y,
si no arranca, escalar a servicio tecnico. Escalar sin haber intentado el reinicio se marca como
incorrecto. Esta es la unica situacion de todo el simulador en la que escalar a servicio es la
respuesta correcta y no una excusa para no diagnosticar.

### Por que se hicieron las variantes

En la primera version del escenario 3 habia cinco acciones que no eran correctas en ningun caso:
comprobar la celula, calibrarla, reiniciar el modulo, escalar a servicio y subir la ventilacion.
Estaban como distractores, pero un distractor que nunca es la respuesta correcta en ninguna
situacion deja de ensenar: el estudiante aprende a descartarlo por costumbre y no por razonamiento.
Con las tres variantes, cada una de esas acciones es la respuesta correcta en al menos un caso, y
el estudiante tiene que mirar los datos para saber en cual. Es lo que pide la seccion 5.3 del
documento: cada falla se presenta primero con su caso mas simple y luego con variantes.

La excepcion deliberada es **subir la ventilacion**, que sigue siendo incorrecta en las tres. Esa
no es un distractor de relleno, es el error clinico que el escenario entero existe para prevenir.
Lo que cambio es que ahora deja consecuencia: la frecuencia sube de 12 a 16, y el escenario no se
da por resuelto hasta devolverla a su sitio con la accion **"devolver la ventilacion a sus
parametros"**. Antes se podia pulsar, leer el regano y seguir como si nada.

**Diez acciones** en total, con su proposito y su "cuando si": contrastar senales, revisar la linea
acodada, la prueba de la trampa, vaciarla, comprobar la celula con aire ambiente, calibrarla, subir
la ventilacion, devolverla a sus parametros, reiniciar el modulo y escalar a servicio.

| Accion | Trampa llena | Celula descalibrada | Modulo caido |
|---|---|---|---|
| Comprobar la celula con aire | parcial | **correcta** | parcial |
| Calibrar la celula | parcial | **correcta** (tras comprobar) | parcial |
| Reiniciar el modulo | parcial | parcial | **correcta** |
| Escalar a servicio | incorrecta | incorrecta | **correcta** (tras reiniciar) |
| Subir la ventilacion | incorrecta | incorrecta | incorrecta |
| Devolver la ventilacion | **correcta** si se subio | **correcta** si se subio | **correcta** si se subio |

### Como se elige la variante

Al entrar se **sortea**, en entrenamiento y en practica libre por igual, y el sorteo nunca repite la
variante de la vez anterior. La razon es la que hacia floja la primera version: si el escenario
abre siempre en el mismo caso, a la segunda vuelta el estudiante no diagnostica, recuerda. Entrando
a ciegas tiene que volver a mirar los datos cada vez, que es justamente la destreza que se entrena.

Ademas, la barra superior lleva un **selector desplegable con las tres variantes**, asi que se
puede cambiar de falla sin salir del escenario. Cambiar de variante reabre el escenario desde cero
con la misma modalidad: es otra falla, no otro ajuste de la misma, asi que el registro, las zonas
descartadas y las acciones hechas empiezan limpios.

Cada variante tiene su propio entrenamiento guiado, porque narrar la trampa de agua mientras el
modulo esta caido no explicaria nada: 13 pasos la trampa, 12 la celula y 12 el modulo. Los tres
cierran avisando que existen las otras dos y que la proxima vez puede tocar cualquiera.

La guia de la celula incluye un paso que no es tecnico sino de criterio: advierte que la mayoria de
las alarmas de FiO2 baja **si son reales** (una tuberia equivocada, un mezclador averiado) y que
descartar esta no autoriza a desconfiar de la siguiente. Lo que la descarta es la comprobacion con
aire ambiente, no la costumbre. Y la del modulo cierra recordando que mientras el modulo esta caido
se pierde la capnografia, que es el aviso mas rapido de desconexion y de intubacion esofagica: no
es una molestia, es una perdida de vigilancia que hay que decir en voz alta al equipo.

---

## Escenario 4: falla del vaporizador

Jugable de punta a punta, con **tres variantes** sorteadas al entrar y guia propia para cada una
(11, 13 y 12 pasos). Nacio ya con variantes, aplicando lo aprendido en el escenario 3: ninguna
accion existe solo para rellenar la lista.

**La idea que ensena, y es la de las tres variantes.** El dial es una orden, no una medida. Un
vaporizador de insercion es un aparato puramente mecanico: divide el gas fresco en una corriente
que pasa por la camara con el liquido y otra que la esquiva, y el dial solo decide esa proporcion.
No sabe cuanto agente le queda, ni cuanto entrega, ni si esta bien enganchado en el colector. Lo
unico que dice que el paciente recibe agente es el analizador de gas, que esta al otro extremo del
circuito. En las tres fallas el dial sigue marcando lo mismo mientras lo entregado cambia.

### Variante 1: vaporizador sin agente

El dial marca 2 %, el analizador no encuentra nada y salta la alarma de prioridad alta. Es la mas
simple y la que ensena lo mas incomodo: **ninguna alarma avisa de que el vaporizador se esta
quedando vacio**, porque no hay sensor de nivel. La maquina no puede saberlo. La unica forma de
enterarse es mirar la ventana, y por eso el chequeo previo al uso lo pide antes de cada caso. La
verificacion tampoco es ver la ventana llena: es ver la cifra del analizador subir hasta el dial.

### Variante 2: vaporizador mal bloqueado en el colector

Entrega 0,9 % con el dial en 2 %: menos de la mitad, pero no cero. Esa fraccion es la pista. La
palanca de bloqueo no llego al final del recorrido, el vaporizador quedo apoyado pero no sellado, y
el gas fresco se escapa con su agente antes de llegar al circuito. La misma averia quita
concentracion y quita volumen, asi que aparece tambien un VTe por debajo del VTi.

**La prueba discriminante es la mas elegante de este escenario.** La prueba de fuga, dos veces: con
el dial cerrado el circuito aguanta, con el dial abierto aparece una fuga grande. Con el dial en
cero el gas no entra en el vaporizador porque sus valvulas de puerto cierran el paso; al abrirlo se
abre ese camino, y con el camino se abre la fuga. Lo unico que cambio entre las dos medidas fue el
dial. Por eso el chequeo previo al uso se repite con cada vaporizador encendido (M1 3-5, 3-6
[41-42]; M3 6-8 [90]): con todos cerrados, esta fuga es invisible.

### Variante 3: obstruccion en la salida del vaporizador

La unica de las tres en la que el agente **si** coincide con el dial, y por eso la mas instructiva.
Lo que falla es el caudal: con 2 L/min fijados en tecnica de bajo flujo, al abrir el dial el
flotador cae 1,8 L/min y al circuito solo llegan 0,2 L/min. Como el paciente consume oxigeno todo
el tiempo, el fuelle pierde unos 50 mL por minuto y se va quedando corto; el escenario arranca con
la concertina ya al 82 % y bajando, igual que el de fuga arranca con la fuga establecida.

El razonamiento que ensena es el que cuesta mas: **la concentracion es una proporcion, no una
cantidad**. El vaporizador puede estar entregando un 2 % perfecto de muy poco gas. Que el
analizador coincida con el dial no descarta el vaporizador.

Y el orden importa: primero sostener, subiendo el gas fresco, que es lo que el manual indica ante
una concertina que no se rellena (M4 7-12 [142]); despues diagnosticar con la prueba de
contrapresion del chequeo previo al uso, que no admite una caida mayor de 1 L/min con 6 L/min
fijados (M1 3-5 [41]); y escalar solo al final, porque una obstruccion interna no se repara en
quirofano. Subir el gas fresco sostiene la ventilacion pero no corrige nada: es tiempo comprado.

### La trampa, y por que tiene consecuencia

**Subir el dial porque el agente medido esta bajo** es incorrecta en las tres variantes, y es la
reaccion mas natural del mundo. Si el deposito esta vacio, subir el dial de un deposito vacio no
entrega nada; si la fuga esta en el colector, manda mas agente a la fuga; si hay una obstruccion,
empeora la caida de caudal. Lo peligroso viene despues: al corregir la causa real con el dial en
4 %, el paciente recibe el doble de lo que se queria. El dial se queda en 4 % y el escenario no se
da por resuelto hasta devolverlo a su valor con **"devolver el dial a su valor inicial"**. Es el
mismo patron que "subir la ventilacion" en el escenario 3.

### Once acciones, ninguna de adorno

| Accion | Sin agente | Mal bloqueado | Obstruccion |
|---|---|---|---|
| Contrastar el dial con el analizador | **correcta** | **correcta** | **correcta** |
| Mirar el nivel de la ventana | **correcta** | parcial | parcial |
| Rellenar el vaporizador | **correcta** (tras mirar) | incorrecta | incorrecta |
| Comprobar el asiento y el bloqueo | parcial | **correcta** | parcial |
| Prueba de fuga con el dial abierto | parcial | **correcta** | parcial |
| Reasentar y bloquear | incorrecta | **correcta** (tras comprobar) | incorrecta |
| Prueba de contrapresion | parcial | parcial | **correcta** |
| Retirar de servicio y escalar | incorrecta | incorrecta | **correcta** (tras la prueba) |
| Subir el gas fresco | parcial | parcial | **correcta** |
| Subir el dial | incorrecta | incorrecta | incorrecta |
| Devolver el dial | **correcta** si se movio | **correcta** si se movio | **correcta** si se movio |

Rellenar un vaporizador que ya tiene agente se marca como **incorrecta**, no como parcial: un
vaporizador sobrellenado puede dejar pasar liquido a la corriente de gas y entregar una dosis muy
por encima de la fijada.

### Lo que el modelo corrigio del diseno

La primera version de la tercera variante daba por hecho que un gas fresco bajo subiria el CO2
inspirado. El modelo lo desmintio: con el absorbedor sano, el CO2 que vuelve se retira igual, y la
reinhalacion no sube el FiCO2. Es correcto, y es exactamente lo que M9 describe. La variante se
rehizo alrededor del sintoma real, que es la caida del caudal y el fuelle que se queda corto, y se
dejo el FiCO2 para el escenario 6, donde el absorbedor si esta agotado.

---

## Escenario 5: perdida del suministro de oxigeno

Reconvertido a **tres variantes** sorteadas al entrar, con guia propia para cada una (11, 11 y 12
pasos). El motivo fue el mismo del escenario 3: tres acciones no servian para nada. Revisar el
interruptor de presion nunca era correcta, subir el N2O era una trampa sin consecuencia real y
silenciar la alarma tenia el efecto literalmente vacio.

**La idea que ensena.** Una alarma de suministro se confirma siempre contra los manometros, porque
la alarma es una opinion de un sensor y el manometro es una medida. De ahi salen las tres variantes:
la alarma dice la verdad y el respaldo sirve, la alarma dice la verdad y el respaldo no alcanza, o
la alarma miente.

### Variante 1: la tuberia perdio la presion

El caso que ya existia. Manometro de tuberia en cero, FiO2 al 21 %, el N2O cortado por la proteccion
y el cilindro lleno. Camino: confirmar manometros, abrir el cilindro, ventilar manualmente y
restablecer la tuberia.

### Variante 2: la tuberia se pierde y el cilindro esta en reserva

El mismo cuadro, pero el manometro del cilindro marca 1200 kPa, por debajo del umbral de 2633 kPa
con que M4 7-11 [141] avisa de presion baja. Abrirlo sigue siendo lo correcto, porque poco oxigeno
es mejor que ninguno, pero el panel muestra la **autonomia calculada con la formula de M10**: unos
veinte minutos al caudal en uso. El respaldo deja de ser una solucion y se convierte en un
cronometro, y eso cambia las prioridades: bajar el gas fresco alarga el tiempo disponible, porque la
autonomia es inversamente proporcional al flujo, y la tuberia pasa de importante a urgente.

Al resolver, la alarma de presion baja del cilindro **sigue sonando, y debe seguir**: ese cilindro
hay que cambiarlo antes del proximo caso. La leccion no es tecnica sino de habito — el respaldo se
comprueba en el chequeo previo, cuando no pasa nada, no el dia que falla la tuberia.

### Variante 3: la alarma miente

La alarma de fallo de suministro de O2 suena con prioridad alta, pero el manometro marca presion
normal, el flujometro sostiene el caudal y **el N2O sigue pasando**. Ese tercer dato es el mas fino
del escenario: el corte de N2O no lo decide la pantalla sino la presion real del oxigeno, por via
neumatica. Si de verdad hubiera caido la presion, el N2O estaria cortado sin que ningun sensor
tuviera que opinar.

La prueba que lo resuelve es la que estaba documentada y sin usar: se cortocircuita el interruptor
de presion, y si la alarma desaparece, el que disparaba sin motivo es el interruptor (M1 5-4 [124]).
Despues se sustituye, porque no se ajusta en quirofano.

La guia de esta variante termina con la misma advertencia que la de la celula de O2 en el escenario
3: la mayoria de las alarmas de suministro **si son reales**, y una mezcla hipoxica mata en minutos.
Que esta fuera falsa no autoriza a desconfiar de la siguiente; lo que la descarta es la
comprobacion, no la costumbre. Y una maquina con una alarma que no significa nada es peor que una
maquina sin alarma, porque ensena a ignorarla.

### Las tres acciones que no servian

| Accion | Antes | Ahora |
|---|---|---|
| Probar el interruptor de presion | parcial siempre, nunca correcta | **correcta** en la variante 3, tras confirmar los manometros |
| Subir el N2O para compensar | incorrecta, sin consecuencia | incorrecta en las tres, deja el N2O en 3 L/min y el escenario **no se resuelve** hasta devolverlo con la perilla |
| Silenciar la alarma | incorrecta, con el efecto vacio | pausa el audio 120 s de verdad, y es **correcta despues** de proteger al paciente, incorrecta antes |

La de silenciar es la mas interesante de las tres, porque no se arreglo haciendola correcta o
quitandola, sino **reconociendo que lo que decide no es la accion sino el momento**. Pausar el audio
es una funcion de la maquina documentada en M4 7-2 [132], con sus 120 s y su vuelta automatica. Usada
despues de abrir el cilindro o de pasar a manual, es lo correcto: permite hablar con el equipo y deja
de tapar la siguiente alarma. Usada antes, es dejar de oir un problema sin resolver. Ahora el
simulador distingue las dos cosas, y la explicacion lo dice con esas palabras.

Tambien se anadio **sustituir el interruptor de presion**, correcta solo en la variante 3 y solo
despues de la prueba, para que la variante tenga correccion de fondo y no solo diagnostico.

**Por que el N2O no tiene boton de deshacer.** En los escenarios 3 y 4 las trampas (subir la
ventilacion, subir el dial) llevan su accion de deshacer, porque ni la frecuencia ni el dial tienen
control propio en el panel. El N2O si lo tiene: es una de las tres perillas de flujometro que el
estudiante usa todo el tiempo. Anadir un boton para bajar lo que una perilla ya baja seria la clase
de adorno que este escenario acaba de quitarse.

---

## Escenario 6: reinhalacion de CO2

El que cierra el conjunto, y el unico cuyo titulo cambio respecto a la ficha original. Estaba
declarado como "agotamiento del absorbedor", pero al construirlo con variantes quedo claro que el
agotamiento es **una** de las causas y no el fenomeno: el fenomeno es que el paciente reinhala su
CO2. Tres variantes sorteadas al entrar, con guia propia (12, 12 y 13 pasos).

**La idea que ensena.** En un circuito circular la linea base del capnograma debe tocar el suelo. Un
EtCO2 alto con la linea base en cero puede ser hipoventilacion, fiebre o mil cosas del paciente; un
EtCO2 alto con la linea base levantada no admite discusion: el gas que entra ya trae CO2, y el gas
que entra lo prepara la maquina. Esa distincion convierte un problema del paciente en un problema
del circuito, y es el primer paso de las tres variantes.

Dos piezas garantizan que el CO2 no vuelva: la cal, que lo retiene, y las valvulas unidireccionales,
que obligan al gas a pasar por ella. El gas fresco es la tercera, porque lo que entra nuevo diluye
lo que vuelve: fR = 1 - FGF/MV (M9 Fig. 1).

### Variante 1: cal agotada, y el color lo dice

CO2 inspirado de 24 mmHg con el limite de fabrica en 4 (M3 F-1 [269]), EtCO2 de 52, cal violeta y
canister frio. Todo coincide y el diagnostico se cierra sin herramientas.

### Variante 2: cal agotada, y el color miente

El mismo cuadro, pero **la cal se ve blanca**. El viraje del indicador es reversible: una cal que ha
estado en reposo, por ejemplo un fin de semana, recupera el color blanco aunque siga agotada. Es
donde se pierde el razonamiento facil, porque la conclusion natural — "la cal esta bien, sera otra
cosa" — tiene un agujero: el color es un colorante que vira con el pH, no un medidor de capacidad.
Dice algo cuando esta violeta y no asegura nada cuando esta blanco.

**El dato que no se puede falsear es la temperatura.** La reaccion de la cal sodada con el CO2 es
exotermica, asi que una cal que absorbe se calienta, siempre. Un canister frio con el paciente
ventilando significa que ahi dentro no esta pasando nada. Ningun sensor de la maquina mide eso: lo
mide la mano. Y la paradoja que deja la variante es util — la cal se ve blanca antes y despues del
cambio, asi que si el color hubiera sido el criterio, no se habria cambiado nada y tampoco se habria
podido verificar la correccion.

### Variante 3: valvula unidireccional que no cierra

La que rompe el reflejo: **el absorbedor no tiene nada que ver**. Cal blanca, canister templado — es
decir, reaccionando — y CO2 inspirado de 14 mmHg. Dos hechos que parecen incompatibles: el
absorbedor funciona y hay CO2 inspirado.

La contradiccion se resuelve cambiando la pregunta. Hasta ahi se preguntaba si la cal retiene el
CO2; la pregunta correcta es si todo el CO2 pasa por la cal. El disco de una valvula que no asienta
deja un paso por el que el gas espirado vuelve sin llegar al absorbedor: la cal esta perfecta y no
se entera, porque el CO2 ni la toca. Sin valvulas que lo guien, un circuito circular deja de ser
circular.

Aqui **cambiar el canister se marca como incorrecta**: gasta un canister, cuesta minutos con el
paciente reinhalando y deja el problema intacto.

### La medida inmediata y la trampa, las dos sobre el mismo mando

**Subir el gas fresco** es correcta en las tres variantes, que es exactamente lo que se le pide a una
medida inmediata: sirve antes de saber que pasa. Diluye lo que vuelve y el CO2 inspirado cae de 24 a
unos 5 mmHg. Lo que no hace es arreglar nada — es tapar el problema con gas, que cuesta agente y
dinero, y en cuanto se vuelve a flujos bajos reaparece.

**Bajar el gas fresco para ahorrar agente** es la trampa, y es tentadora porque la economia de gas es
un buen reflejo: en condiciones normales ahorra sin perjudicar a nadie. Pero el bajo flujo se apoya
en que el absorbedor funciona. Con CO2 volviendo, bajar el gas fresco lo sube de 24 a 70 mmHg — el
modelo lo calcula con la formula de M9, no es una advertencia escrita a mano. El escenario no se da
por resuelto con el gas fresco por debajo del inicial, y se deshace con las perillas de O2 y aire,
igual que el N2O del escenario 5.

### Ocho acciones, ninguna de adorno

| Accion | Cal agotada | Color engañoso | Valvula |
|---|---|---|---|
| Leer la linea base del capnograma | **correcta** | **correcta** | **correcta** |
| Subir el gas fresco | **correcta** | **correcta** | **correcta** |
| Mirar el color de la cal | **correcta** | parcial | parcial |
| Palpar el canister | parcial | **correcta** | **correcta** |
| Cambiar el canister | **correcta** | **correcta** | incorrecta |
| Observar los discos de las valvulas | parcial | parcial | **correcta** |
| Escalar: sustituir la valvula | incorrecta | incorrecta | **correcta** (tras observar) |
| Bajar el gas fresco | incorrecta | incorrecta | incorrecta |

### Lo que el modelo corrigio del diseno, otra vez

El primer borrador usaba como trampa "subir la ventilacion porque el EtCO2 esta alto". El modelo lo
desmintio: FiCO2 depende de (1/MV - FGF/MV²), asi que subir la ventilacion **baja** el CO2
inspirado. Hiperventilar ante una reinhalacion es una medida parcial razonable, no un error, y la
accion se elimino en lugar de dejarla como distractor falso. La trampa paso a ser bajar el gas
fresco, que el mismo modelo demuestra que empeora las cosas.

Tambien se recalibro el punto de partida. Con 1 L/min de gas fresco y la cal del todo agotada, la
curva de M9 da un CO2 inspirado de 76 mmHg: es coherente con la fuente, pero es un paciente al borde
del desastre, no un ejercicio de reconocimiento. El escenario arranca con 2 L/min y la cal recien
pasada de su vida util, que da 24 mmHg — seis veces el limite de alarma, inequivoco, y con margen
para razonar.

---

## La valvula APL y la purga de O2

Estaban dibujadas y nombradas desde el Ensayo 2, pero no hacian nada: la APL aparecia en el circuito
de gases con su etiqueta, el flush era un boton verde en la vista de la maquina, y los dos se
mencionaban en los textos de los manuales. Ninguno tenia estado, mando ni efecto. Ahora los dos son
mandos de verdad.

### La APL, un techo de presion graduable

Es un mando continuo entre 1 y 70 cmH2O, con su control en el panel. Lo que hace depende de donde
este:

- **Abierta** (por debajo de 12 cmH2O): el gas fresco se va a la evacuacion en lugar de llenar la
  bolsa, y al apretarla el gas toma el camino libre antes que los pulmones. El volumen entregado cae
  de forma progresiva hasta cero en la apertura total.
- **En posicion de trabajo**: fija el techo de presion del circuito. Lo que pasa de ese valor sale a
  la evacuacion.
- **Cerrada** (por encima del 70 % de la escala): no hay techo. El gas entra y no tiene por donde
  salir, asi que la presion sube respiracion tras respiracion — y no solo el pico, tambien la linea
  de base, que es lo que dispara la alarma de presion sostenida.

**Solo esta en el circuito en ventilacion manual.** En mecanica el selector de bolsa la deja fuera
del paso, y el mando lo dice en lugar de limitarse a no responder, porque eso tambien es una leccion.

### La purga de O2, con sus tres efectos a la vez

Es un pulsador: entrega mientras se mantiene apretado, unos 50 L/min directos a la salida comun. En
el simulador hace las tres cosas que hace en una maquina real, y las tres salen del modelo:

1. **Rellena el circuito** en segundos, que es para lo que se usa (M4 7-12 [142]).
2. **Sube la FiO2** hacia el 100 %, porque es oxigeno puro.
3. **Diluye el agente anestesico** hasta casi cero, porque entra aguas arriba del vaporizador. Es el
   efecto que casi nadie tiene presente y una causa conocida de despertar intraoperatorio.

Y hay una combinacion peligrosa que **no esta escrita en ningun sitio del codigo**: pulsar la purga
con la APL cerrada. Son 50 L/min en un circuito sin escape. El modelo lo resuelve solo — la presion
pico llega a 88 cmH2O y saltan a la vez la alarma de presion alta, la de presion sostenida y la de
agente ausente. El estudiante lo puede descubrir por su cuenta, que es la mejor forma de aprenderlo.

### Donde entran en los escenarios

**El escenario 1 ahora tiene dos variantes**, sorteadas al entrar:

- **Sello del absorbedor fuera de sitio**: la fuga real de siempre, en ventilacion mecanica.
- **Valvula APL abierta**: la misma imagen exacta — la bolsa no se llena, no hay presion, el volumen
  no llega — **sin que haya ninguna fuga**. El circuito esta estanco y la maquina esta sana: lo que
  esta mal es un mando.

La segunda ensena algo que ninguna otra falla del simulador ensena: que un mando mal puesto da la
misma imagen que una averia y se arregla en un segundo, y que conviene mirar los mandos antes de
salir a buscar agujeros. Ademas la APL **no tiene sensor**, asi que no hay ni puede haber una alarma
que diga "APL abierta". Solo se ven las consecuencias.

**La prueba de fuga ahora exige cerrar la APL.** Si esta abierta, el circuito no llega a los 30
cmH2O por mucho que este estanco, y la prueba lo dice con todas las letras en lugar de reportar una
fuga inexistente. Es la causa numero uno de pruebas de fuga fallidas que no son fugas, y antes el
simulador la ignoraba.

**Tres acciones nuevas** en el escenario 1: mirar la posicion de la APL (correcta en la variante
APL), llevarla a una posicion de trabajo (correcta solo tras haberla mirado) y pulsar la purga de O2
(correcta en la variante del sello como medida inmediata, incorrecta en la de la APL, porque con la
valvula abierta esos 50 L/min van derechos a la evacuacion).

### Una accion que sigue sin uso

`llamar_servicio`, en el escenario 1, no es correcta en ninguna de las dos variantes. Es la unica
accion decorativa que queda en todo el simulador. Tiene arreglo natural: una tercera variante con el
fuelle perforado, que es una fuga que no se corrige en quirofano y donde escalar si seria la
respuesta. Queda anotado aqui para decidirlo.

---

## El circuito de gases como banco de pruebas

El circuito de gases dejo de ser una ilustracion que responde a lo que pasa en el escenario y paso a
ser un sitio donde se puede trastear. Se abre con el boton de siempre y ahora trae su propio panel
de mandos a la derecha.

**El ramal de la purga, por fin dibujado.** Sale del suministro de O2 antes de los flujometros, corre
por encima de todo hasta el pulsador y baja directo a la salida comun, esquivando el colector y el
vaporizador. Ese atajo es la explicacion grafica de lo que mas cuesta entender de la purga: no pasa
por el vaporizador, luego no lleva agente. Al pulsarla, las bolitas de ese ramal se ponen en marcha
y el resto del circuito se acelera. Sigue cumpliendose la regla geometrica del esquema: 27 tramos,
todos horizontales o verticales, cero cruces.

**Los mandos del banco.** Flujometros de O2, aire y N2O; dial del vaporizador; valvula APL; purga;
selector de bolsa o ventilador; y un boton para agotar la cal sodada o poner una nueva. Todo actua
sobre la misma maquina que esta simulando, asi que el circuito responde en vivo.

**El selector de agente anestesico**, con los cinco halogenados y su codigo de color
internacional: sevoflurano amarillo, isoflurano morado, desflurano azul, halotano rojo, enflurano
naranja. Al cambiarlo, el vaporizador y el gas que sale de el cambian de color en el dibujo.

Y con el agente llega el dato que de verdad importa y que el dial no dice: **la fraccion de CAM**.
Con el dial en 2 %, el sevoflurano son 1,0 CAM, el isoflurano 1,7 y el halotano 2,8. El mismo numero
en el mismo mando significa tres profundidades distintas, y eso explica por que los vaporizadores
son especificos de agente y por que el llenado esta codificado.

El desflurano tiene su propio aviso, porque es el caso extremo: su presion de vapor es de 669 mmHg a
20 C, mas de cuatro veces la del sevoflurano, asi que hierve casi a temperatura ambiente. Un
vaporizador de derivacion variable como el de esta maquina no puede dosificarlo y entregaria muy por
encima de lo fijado. Si se selecciona, el bloque del vaporizador se marca en rojo y el recuadro
explica por que ese error, en una maquina real, lo impide el sistema de llenado.

**El recuadro "Que puede pasar".** Cada vez que se toca un mando, escribe la consecuencia concreta
de ese cambio: que pasa si se cierra el O2 con N2O abierto, por que subir el aire baja la FiO2, que
significa una APL abierta frente a una cerrada, por que la purga diluye el agente, que le ocurre al
CO2 inspirado cuando la cal se agota y por que subir el gas fresco lo compensa. No son avisos
genericos: el texto depende del valor concreto en el que se deja el mando.

Y un boton para volver al estado normal, porque la gracia de un banco de pruebas es poder romperlo
todo sin miedo.

---

## Un fallo corregido en el motor de alarmas

Las alarmas de prioridad **alta aparecian las ultimas** en la banda. La causa: el comparador de
orden usaba `ORDEN[prioridad] || 3`, y como el indice de "alta" es 0, que en JavaScript es falso,
tomaba 3 y las mandaba al final. Afectaba tambien al testigo de alarma del monitor en la vista
frontal. Corregido: ahora el orden es alta, media, baja, y el testigo toma el color de la mas alta.

---

## El circuito de gases: la maquina por dentro

Antes era una ventana pequena con un diagrama estatico de cajas de texto. Ahora es una
**pantalla completa** en la que se ven los componentes de verdad.

- **Se mueve de verdad.** El diagrama no se animaba fuera de un escenario porque el bucle del
  explorador no lo refrescaba. Corregido: el gas circula en cualquiera de las dos pantallas.
- **Trazado ortogonal, sin diagonales.** Los 24 tramos son horizontales o verticales, con esquinas
  redondeadas, como las tuberias de verdad. Esta comprobado por prueba automatica: ninguna diagonal
  y **ningun cruce**. Donde dos caminos se juntan hay un punto grueso, y es una union real.
- **Seis secciones** enmarcadas y numeradas, en el orden del gas: suministro y reguladores,
  proteccion, flujometros, mezcla y vaporizador, circuito circular, y ventilador con evacuacion.
- **Los 22 nodos son componentes dibujados, no cajas de texto.** Los cilindros tienen cuerpo,
  hombro, volante de apertura y manometro de caratula blanca con aguja; las tomas de pared, su
  conector de color por gas; los reguladores, su campana y su tornillo de ajuste; las valvulas de
  proteccion, su diafragma, vastago y piloto; los flujometros, tubo de vidrio con escala, bobina y
  perilla; el vaporizador, dial graduado y mirilla de nivel; las valvulas unidireccionales, cupula
  de cristal con un disco que levanta al abrir; el absorbedor, bote de cristal con cal granulada,
  abrazadera y purga; el fuelle, campana de cristal con la concertina en acordeon; la bolsa, su
  valvula APL; y el paciente, cabeza, traquea y pulmones que se inflan.
- **Todo se mueve con la simulacion**: las bobinas suben con el caudal, las agujas de los
  manometros giran con la presion, el disco de cada valvula levanta en su fase, la concertina se
  comprime, la bolsa se llena, la cal vira desde arriba y los pulmones se inflan.
- **Valores en vivo bajo cada componente**: presion de cada tuberia y cilindro, caudal de cada
  flujometro, gas fresco y FiO2 del colector, dial del vaporizador, estado de cada valvula, volumen
  y EtCO2 del paciente, capacidad del absorbedor y llenado del fuelle.
- **Particulas de colores por gas** cuya velocidad es el caudal. Si se detienen, por ahi no pasa gas.
  Cierra el N2O y su rama entera se apaga; abre el cilindro de O2 y el flujo cambia de rama antes de
  la proteccion; con una fuga, los tramos inspiratorio y espiratorio se marcan en rojo.
- **Cada bloque es consultable**: pulsa y el panel lateral dice que es, que hace y en que se nota
  cuando falla, con sus botones de "Por que" y "Fuente".
- **Recorrido guiado de 16 pasos** que sigue el camino completo del gas, desde la pared del
  quirofano hasta el paciente y de vuelta, explicando cada etapa. Usa la misma tarjeta arrastrable
  del modo entrenamiento.

---

## Correcciones sobre el primer Ensayo 3

Cinco arreglos a partir de la prueba de uso:

1. **La tarjeta del entrenamiento ya se puede mover.** Manten pulsado el boton izquierdo sobre ella
   y arrastrala donde quieras; tiene un asa visible arriba a la izquierda. Ademas, mientras no la
   muevas a mano, se aparta sola cuando el elemento que resalta queda debajo de ella. Antes tapaba
   los flujometros justo en el paso que pedia moverlos.

2. **Mover una perilla ya no salta varios pasos.** Un control deslizante emite un evento por cada
   pixel que recorre, y cada uno hacia avanzar el tutorial. Ahora el motor bloquea nuevos avances
   mientras uno esta en curso: un paso por accion, aunque muevas la perilla de punta a punta.

3. **Los valores de referencia dejaron de ser invasivos.** La ficha muestra solo el concepto y su
   valor, en dos columnas limpias. Las citas de manual pasaron detras de un boton,
   "De donde sale cada valor".

4. **Cada accion dice para que sirve** en una segunda linea bajo su nombre, antes de pulsarla.
   "Subir el flujo de gas fresco" ya explica que sirve para que el fuelle vuelva a llenarse mientras
   localizas la fuga, y que en cuanto bajes el flujo la fuga vuelve.

5. **Las acciones dicen cuando si corresponden.** La retroalimentacion incluye un bloque
   "Cuando si". El de servicio tecnico explica que se escala cuando la falla esta dentro del equipo
   (regulador, interruptor de presion, sensor de flujo, electrovalvula o tarjeta), cuando la prueba
   sigue fallando despues de descartar conexiones, sellos y consumibles, cuando el valor se sale del
   rango de calibracion o cuando hay que abrir el equipo o romper un precinto.

---

## Que cambio respecto al Ensayo 2

### 1. El dibujo de la maquina se rehizo buscando realismo

Mismo planteamiento, mucho mas detalle. Las superficies cilindricas (cilindros de gas, tubos de
flujometro, concertina, canister, bolsa) llevan degradado oscuro-claro-oscuro, que es lo que da la
sensacion de volumen; el metal lleva degradado vertical con un filo de luz en el borde superior; el
cristal lleva franjas de reflejo en diagonal. Se anadieron:

- manometros con caratula blanca, escala de 270 grados y **aguja que se mueve** con la presion real
- dial del vaporizador **graduado de 0 a 8 vol.%**, con corona moleteada y palanca de bloqueo
- tubos de flujometro con **escala de trazos** y perillas de ajuste bajo cada uno
- concertina en **acordeon** (chevrones que se comprimen), ya no un rectangulo con rayas
- canister con **abrazadera, tuerca y purga**; cal con textura granular
- cilindros con hombro, cuello, **volante de apertura** y yugo de montaje
- mangueras corrugadas con relieve de dos capas y valvulas con flecha de sentido
- **linea de muestreo de gases con trampa de agua**, que se pone roja cuando se ocluye
- monitor con botonera, mando giratorio y cable
- ruedas con horquilla, eje y llanta; sombra en el suelo; tornillos en los paneles
- etiquetas impresas sobre las bandas metalicas, como en un equipo real

Sigue sin marca, sigue animandose y sigue siendo codigo, asi que se puede iterar cuantas veces haga
falta. No se uso ninguna fotografia.

### 2. El tutorial ya explica los flujometros

Dos pasos nuevos en el entrenamiento del escenario 1. El primero pide mover el control de O2 y no
avanza hasta que se hace, explicando que no cambia una sola cosa sino cuatro a la vez: el gas fresco
total, la FiO2, la reinhalacion y el consumo del cilindro si esta abierto. El segundo da los rangos
de referencia.

Ademas hay un boton **"Rangos de referencia"** junto a los controles, disponible en todo momento,
con los valores y su cita: consumo de O2 de 3,5 mL/min/kg (M7 3.1), flujo bajo de 1 L/min
(M7 4.1.1), gas fresco necesario para que no haya reinhalacion (M9 Fig. 1), O2 nunca por debajo del
25 % con N2O (M1 3-5, M3 B-5), alarma de FiO2 en 28 % (M7 3.6) y presion de entrada de 280 a
600 kPa (M3 B-4). Lo que no se pudo localizar en una pagina concreta va marcado [I], no inventado.

### 3. El tutorial ya explica que pasa al abrir el cilindro

Dos pasos nuevos en el entrenamiento del escenario 5, justo despues de abrirlo: de donde viene ahora
la presion, por que se repone el N2O, que la reserva es finita y empieza a consumirse, como estimar
su duracion con t(min) = psi x 0,28 / flujo (M10), y por que bajar el gas fresco la alarga. El paso
final recuerda **cerrarlo cuando vuelve la tuberia**, porque si queda abierto se vacia sin que nadie
lo note.

El modulo "Suministro de gases" del explorador tiene ahora la misma ficha.

---

## Que cambio respecto al Ensayo 1

### 1. La maquina completa es ahora el punto de partida

Se dibujo en SVG una maquina de anestesia generica vista de frente, sin marca: monitor sobre su
brazo, cabezal con flujometros y vaporizador, superficie de trabajo, cajones, sistema respiratorio
colgado a la izquierda con la concertina y el absorbedor, bolsa reservorio, mangueras corrugadas
hasta el paciente, cilindros de respaldo, toma de pared, evacuacion, base y ruedas.

Tiene **ocho zonas sensibles** que se iluminan al pasar el cursor: monitor, suministro de gases,
flujometros, vaporizador, ventilador y fuelle, absorbedor de CO2, circuito respiratorio y
evacuacion.

### 2. Nunca se pierde la ubicacion

Al entrar a un modulo, la maquina pasa a una columna estrecha a la izquierda con la zona activa
iluminada y el detalle a la derecha. Un clic en otra zona de esa miniatura lleva directo alli, sin
volver al inicio. **Los escenarios tambien corren con la maquina a la vista**: la zona de la falla
no se marca de entrada, pero a medida que el estudiante inspecciona, las descartadas se apagan y la
sospechosa queda iluminada.

### 3. Modo entrenamiento

Una tarjeta guia va diciendo paso a paso que hacer y por que, resalta el elemento que toca usar y
solo avanza cuando el estudiante lo hace. El primer entrenamiento ensena ademas a usar el propio
simulador: donde estan las alarmas, como se leen las variables y para que sirven los botones
"Por que" y "Fuente". Despues esta la practica libre, con el mismo escenario y sin ayudas.

- Guion del escenario 1: 16 pasos (incluye el aprendizaje de la interfaz y los flujometros)
- Guion del escenario 2: 13 pasos (empuje frente a volumen, y cuando escalar a servicio)
- Guiones del escenario 1, uno por variante: 18 pasos el sello y 12 la valvula APL abierta
- Guiones del escenario 6, uno por variante: 12 pasos la cal agotada, 12 el color enganoso y 13 la
  valvula incompetente
- Guiones del escenario 5, uno por variante: 11 pasos la tuberia, 11 el cilindro en reserva y 12 la
  alarma falsa
- Guiones del escenario 4, uno por variante: 11 pasos el vaporizador vacio, 13 el mal bloqueado y
  12 la obstruccion de la salida
- Guiones del escenario 3, uno por variante: 13 pasos la trampa de agua, 12 la celula de O2 y 12 el
  fallo del modulo. Los tres parten de contrastar antes de actuar; la trampa y el modulo comparten
  la prueba discriminante y llegan a conclusiones opuestas con ella
- Guion del escenario 5: 10 pasos (incluye el cilindro de respaldo)
- Recorrido guiado del circuito de gases: 16 pasos

Se puede salir de la guia en cualquier momento.

### 4. Curvas compactas

La presion de via aerea y la capnografia pasaron de ocupar una franja ancha a dos tarjetas
pequenas una al lado de la otra. Cada una lleva una **banda verde con el rango normal del perfil**,
escala fija y el valor actual en grande, de modo que el cambio de nivel se ve de un golpe sin tener
que leer numeros. La capnografia ademas marca la linea de FiCO2 cuando hay reinhalacion.

### 5. El diagrama de flujo sigue estando

La vista frontal muestra **donde** esta cada parte; el diagrama funcional muestra **por donde pasa
el gas**, con las particulas en movimiento como unico indicador de flujo. Se abre con el boton
"Recorrido del gas".

---

## Estado de los escenarios

| | Estado |
|---|---|
| Escenario 1 - Fuga o desconexion | jugable, con entrenamiento guiado |
| Escenario 5 - Perdida del suministro de O2 | jugable, 3 variantes sorteadas, guia para cada una |
| Escenario 2 - Falla del ventilador | jugable, con entrenamiento guiado |
| Escenario 3 - Falla del monitoreo de gases | jugable, 3 variantes sorteadas, guia para cada una |
| Escenario 4 - Falla del vaporizador | jugable, 3 variantes sorteadas, guia para cada una |
| Escenario 6 - Reinhalacion de CO2 | jugable, 3 variantes sorteadas, guia para cada una |
| Sonido de alarmas | previsto Ensayo 4 |
| Prueba de contrapresion del vaporizador | implementada en el escenario 4 |

---

## Estructura

```
ENSAYO_2/
|-- index.html
|-- css/estilos.css
|-- js/
|   |-- perfil.js         Perfil base (seccion 5.2) y catalogo de fuentes M1-M12
|   |-- modelo.js         Formulas del modelo dinamico (seccion 5.1)
|   |-- maquina.js        Estado de la maquina y calculo por fotograma
|   |-- alarmas.js        Motor de alarmas: condicion, retardo y prioridad
|   |-- escenarios.js     Los seis escenarios con sus tres capas
|   |-- modulos.js        Contenido, efectos y rangos de los ocho modulos
|   |-- maquinaVista.js   Vista frontal realista de la maquina y sus zonas
|   |-- esquema.js        Circuito de gases: componentes, trazado y particulas
|   |-- monitor.js        Curvas compactas con banda de rango normal
|   |-- tutorial.js       Motor y guiones del modo entrenamiento
|   |-- ui.js             Pantallas, tres capas y retroalimentacion
|   `-- app.js            Orquestador, modos y bucle
|-- README.md
`-- SUPUESTOS.md
```

Cada archivo declara la fuente de cada dato con el formato del documento:
`M4 7-11 [141]` = manual M4, pagina impresa 7-11, pagina 141 del PDF.

---

## Etiquetas de evidencia

Se respetan las cuatro etiquetas de la seccion 0 del documento, visibles en la ventana
"Ver el perfil de la maquina":

- **[M]** consta en un manual, con cita
- **[I]** inferencia razonada
- **[P]** propuesta de diseno, aun sin validar
- **[V]** consta pero es ambiguo y hay que verificarlo

Lo que no consta no se invento: esta marcado como supuesto de diseno y listado en `SUPUESTOS.md`.

---

## Verificacion hecha

- Formulas comprobadas contra las fuentes: FiO2 de M8 3.2, reinhalacion de M9 Fig. 1,
  duracion de cilindro de M10, FiCO2 sin absorbedor de M9 p.44-45.
- Los dos escenarios se recorrieron completos en los dos modos.
- Geometria del circuito de gases comprobada por programa: 25 tramos, cero diagonales, cero cruces,
  22 nodos sin solaparse y todos los extremos acabando en un componente o en una union.
- Circuito de gases recorrido en las dos pantallas: 94 particulas visibles en movimiento, los 16
  pasos del recorrido guiado y los componentes consultables.
- Los cuatro guiones de entrenamiento se ejecutaron de principio a fin y los cuatro escenarios
  quedan resueltos: 16 pasos el del escenario 1 (la fuga baja de 6000 a 18 mL/min), 13 el del escenario 2
  (el gas motriz vuelve de 120 a 400 kPa y el VT medido coincide con el ajustado) y 10 el del
  escenario 5, y 12 el del escenario 3 (la trampa se vacia, el caudal vuelve a 200 mL/min y la
  capnografia reaparece).
- Escenarios 2 y 3 comprobados tambien en los casos que debian fallar: vaciar la trampa sin haber
  hecho la prueba no surte efecto, igual que restablecer el gas motriz sin verificarlo.
- Escenario 2 comprobado tambien en los casos que debian fallar: corregir sin verificar no surte
  efecto, y pasar a manual protege al paciente (EtCO2 de 0 a 35 mmHg) sin dar el caso por resuelto.
- Fichas de rangos: 8 valores citados en flujometros y 5 en suministro, con sus etiquetas [M] e [I].
- Explorador de modulos: 8 zonas, 8 fichas, citas y diagrama de flujo.
- Interfaz probada con un DOM simulado: sin errores en consola.

---

## Aviso

Herramienta educativa. No representa un equipo certificado, no sustituye los manuales del
fabricante ni al personal tecnico autorizado, y no es guia clinica ni de mantenimiento real.
