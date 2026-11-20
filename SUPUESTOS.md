# Supuestos de diseno [P] del Ensayo 3

Lista de lo que **no consta en los manuales** y que, por tanto, se eligio para que el simulador
funcione. Hay que validarlo con el director antes de presentarlo como dato en el documento final
(seccion 12 del documento de contexto: "que no afirmar").

La misma lista esta disponible dentro del simulador, en el boton
*"Supuestos de diseno sin validar"* de la pantalla de inicio.

---

## 1. Modelo de la fuga

**Supuesto.** `Q_fuga(P) = Q30 x (P/30)^n` con **n = 0,65**, y
`dP/dt = (FGF - Q_fuga)/C` con **C = 4 mL/cmH2O** en la prueba.

**Base.** El documento propone ese modelo en la seccion 5.1 con n entre 0,5 (orificio) y 1
(laminar). La compliancia esta dentro del rango 1-10 mL/cmH2O que da M2 p.169 [177].

**Qué validar.** El exponente y la compliancia. Cambian cuanto cae la presion por una fuga
de un tamano dado.

---

## 2. Relacion entre la fuga y la presion pico

**Supuesto.** La presion pico la determina el volumen que se queda en el sistema:
`Ppico = PEEP + VTe / 25 mL/cmH2O`. El gas que escapa no presuriza el circuito.

**Base.** Ninguna. El documento dice expresamente que no consta "la funcion exacta de cuanto cae
la presion segun el tamano de la fuga".

**Qué validar.** La compliancia total de 25 mL/cmH2O y la proporcionalidad directa.

---

## 3. Llenado del fuelle (balance de volumen del circuito)

**Supuesto.** `balance = FGF - fuga - consumo del paciente`. Si el balance es negativo, la
concertina pierde llenado a razon de `balance/1200 mL` por minuto; si es positivo, recupera el
tope con una constante de tiempo de 4 s.

**Base.** El sintoma si consta: M2 p.169 [177] dice que la concertina ascendente no llega al tope,
**sobre todo con gas fresco menor a 1 L/min**, y M7 4.1.1 (p.54-55) indica subir el gas fresco
mientras se busca la fuga. La magnitud y la velocidad son propias.

**Qué validar.** La capacidad de 1200 mL y la constante de 4 s.

---

## 4. Tamano de la fuga del escenario 1

**Supuesto.** 6000 mL/min a 30 cmH2O, con gas fresco de partida de 2 L/min.

**Base.** La causa si consta: un canister mal instalado o con sellos danados produce una fuga
importante (M1 5-42 [162]; M4 7-19 [149]). El valor numerico se eligio para que el cuadro
clinico sea el que describen los manuales: presion baja de via aerea, VTe menor a la mitad de
VTi y la concertina sin llegar al tope, pero **sin** llegar a apnea.

**Qué validar.** Si ese tamano es representativo de un sello mal asentado.

---

## 5. Comportamiento del EtCO2 ante una fuga

**Supuesto.** El EtCO2 se calcula con la ventilacion ajustada y despues se escala por la
fraccion de volumen que realmente vuelve, de modo que **baja** ante una fuga.

**Base.** La tabla de la seccion 6 del documento dice "EtCO2 baja o ausente". Por hipoventilacion
pura el CO2 subiria, pero el proyecto excluye la simulacion fisiologica completa (seccion 11).

**Qué validar.** Que el comportamiento esperado por el docente sea el descenso, y no la subida
por hipoventilacion.

---

## 6. Espacio muerto Vd/Vt = 0,33

**Supuesto.** El EtCO2 se calcula con ventilacion alveolar: `MV x (1 - 0,33)`.

**Base.** M9 p.46 da `FETCO2 = FiCO2 + VCO2/MV` sin esa correccion. Sin ella, con los valores de
fabrica (VT 500, f 12, VCO2 0,16) el EtCO2 de partida queda fuera del rango fisiologico.

**Resultado.** El valor de partida del simulador es ~28 mmHg. Con VT 500 y f 12 en un adulto de
70 kg eso corresponde a una ventilacion algo alta, lo cual es coherente.

**Qué validar.** El valor de 0,33 y si el EtCO2 de partida debe ser ese.

---

## 7. Curva de agotamiento del absorbente

**Supuesto.** Sigmoidea, casi plana hasta el 85 % del avance y luego con subida rapida.

**Base.** M9 Tabla II p.45 da la capacidad (80-125 min por cada 100 g hasta FiCO2 0,5 %), pero la
**forma** no consta: la Fig. 4 de M9 es ilustrativa y, segun el propio articulo, no esta basada
en datos.

**Qué validar.** La forma y el punto de inflexion. Afecta al escenario 6 del Ensayo 3.

---

## 8. Interpolacion de FiCO2 sin absorbedor

**Supuesto.** Interpolacion lineal entre los cuatro puntos de M9 p.44-45
(FGF 0,5 -> 17 %; 2 -> 4,4 %; 3 -> 1,3 %; 6 -> 0) y escalado por MV y VCO2 respecto del ensayo
de referencia (MV 5 L/min, VCO2 0,160 L/min).

**Qué validar.** Que el escalado lineal sea aceptable fuera de las condiciones del ensayo.

---

## 9. Prioridades de alarma elegidas entre fuentes que discrepan

| Alarma | Elegido | Discrepancia |
|---|---|---|
| FiO2 baja | **alta** | alta en M3 D-1 [251] y M4 7-9 [139]; **baja** en M6 p.54 |
| Linea de muestreo ocluida | **media** | alta en M3 D-9 [259]; media en M4 7-12 |
| Presion baja de via aerea | **alta** | alta en M3 D-1 [251]; media en M4 7-11 [141] |

**Qué validar.** Las tres. No son datos de una maquina: son una eleccion del perfil.

---

## 10. Limite bajo de presion (Pmin) = 8 cmH2O

**Supuesto.** La alarma de presion baja dispara con `Ppico < Pmin + 4`.

**Base.** M4 7-11 [141] usa `Ppico < Pmin + 4 cmH2O` pero Pmin es un limite ajustable por el
usuario, no una constante. M8 3.5 recomienda ajustar ese limite precisamente para detectar
fugas y desconexiones.

**Qué validar.** El valor de 8 cmH2O como punto de partida del perfil.

---

## 11. Tecnologia del vaporizador

**Supuesto.** Mecanico de insercion sobre colector tipo Selectatec.

**Base.** Es la tecnologia de M1, M3 y M4. M2 usa un cassette electronico. El documento no fija
cual representar.

**Qué validar.** Si se representa una sola tecnologia o las dos.

---

## 12. Discrepancias de los manuales que quedan sin resolver [V]

- **Minimo de O2 en la mezcla con N2O.** M3 da 25 % en B-5 [227] y 21 % en 6-8 [90].
  El simulador usa 25 %.
- **Corte de O2 de M6 p.17.** Corta bajo 172 kPa y repone sobre 227 kPa, pero el manual no
  precisa a que gases corta. El simulador lo aplica al N2O.
- **Umbral de fuga aceptable.** 150 mL/min en M2 y M3; 350 mL/min a 30 cmH2O para el sistema
  respiratorio y 50 mL/min para la maquina sin circuito en M12. El simulador usa 150 mL/min
  como limite del perfil.

---

## 13. Dibujo de la maquina (Ensayo 2)

**Supuesto.** La vista frontal es una maquina generica dibujada para este proyecto: carro con
cajones, monitor sobre brazo, cabezal con tres flujometros y dos puestos de vaporizador, sistema
respiratorio colgado a la izquierda, cilindros de respaldo detras y evacuacion abajo.

**Base.** Es la arquitectura funcional de la seccion 3 del documento, colocada donde esta en una
maquina de quirofano. Ninguna cota, proporcion ni disposicion sale de un plano de fabricante.

**Que validar.** Si la disposicion es reconocible para un estudiante que haya visto la maquina del
laboratorio, y si falta alguna parte que convenga representar.

**Nota del Ensayo 3.** El dibujo se rehizo con mucho mas detalle (degradados cilindricos y
metalicos, reflejos, manometros con aguja y escala, dial graduado, concertina en acordeon,
abrazadera y purga del canister, volantes de cilindro, linea de muestreo con trampa de agua,
ruedas con horquilla). Ese detalle es verosimilitud visual, no documentacion tecnica: ninguna cota,
proporcion, graduacion ni disposicion sale de un plano de fabricante. No se uso ninguna fotografia
de ningun equipo.

---

## 13 bis. Rangos de referencia de los flujometros

**Supuesto.** La ficha "Rangos de referencia" reune valores de los manuales, pero uno de ellos no se
pudo anclar a una pagina: el gas fresco de **0,5 L/min para anestesia de flujo minimo**. La
expresion "flujo minimo" es terminologia propia de M7 y da nombre al libro, pero la cifra exacta no
se localizo en una pagina concreta, por lo que esta marcada [I] y no [M].

**Que validar.** Localizar la pagina de M7 que fija esa cifra, o retirarla.

**Lo que si esta anclado:** consumo de O2 de 3,5 mL/min/kg (M7 3.1, p.30-31), flujo bajo de 1 L/min
(M7 4.1.1, p.54-55), fR = 1 - FGF/MV (M9 Fig. 1, p.44), O2 no menor al 25 % con N2O (M1 3-5 [41];
M3 B-5 [227]), alarma de FiO2 en 28 % (M7 3.6, p.48), presion de entrada 280-600 kPa (M3 B-4 [226];
M4 11-6 [212]) y T = VS/(VD-VU) (M7 5.3, p.83).

**Aviso que se mantiene:** M10, de donde sale la formula de duracion del cilindro que usa el
tutorial del escenario 5, es material docente y debe respaldarse con una fuente mas formal.

---

## 14. Otros supuestos menores

- **Consumo de gas motriz cuando es O2** y velocidad con que cae la FiO2 al perder el suministro.
- **Ventilacion manual:** se supone que alguien aprieta la bolsa a la misma frecuencia con un
  volumen de 400 mL.
- **PEEP de partida de 3 cmH2O** (M3 F-4 [272] no fija un valor de fabrica para PEEP).
- **Paciente de referencia de 70 kg** y volumen del sistema de 6 L.
- **Caudal disponible para la prueba de fugas: 10 L/min.** Por encima de esa fuga, el circuito no
  sostiene la presion de prueba y el simulador lo informa como fuga gruesa.
- **Puntaje y orden recomendado de las acciones.** El orden de diagnostico combina pasos de los
  manuales con una secuencia logica propuesta, tal como advierte la seccion 4 del documento.
- **Guiones del modo entrenamiento.** El orden de los pasos y la redaccion son propios. Siguen la
  secuencia que los manuales ensenan (proteger, leer la alarma, contrastar, descartar lo simple,
  corregir, verificar), pero ningun manual la escribe asi.
- **Zonas que se descartan durante el diagnostico.** Que la inspeccion por tramos descarte circuito
  y ventilador, o que confirmar los manometros descarte flujometros y monitor, es una decision
  didactica para que el estudiante vea como se cierra el cerco.
- **Rango normal de las curvas.** La banda verde de la presion de via aerea va del limite bajo del
  perfil mas 4 cmH2O hasta el limite de presion (12 a 30 cmH2O); la de capnografia usa los limites
  de alarma de fabrica de M3 F-1 [269] (15 a 50 mmHg). Son limites de alarma, no rangos
  fisiologicos de referencia.

---

## Fuentes que necesitan respaldo antes del documento final

Segun la seccion 2 del documento de contexto:

- **M10** (Freas, *Oxygen: do you have enough?*) y **M12** (Barletta, hoja docente de medicina
  veterinaria) son material docente y deben respaldarse con una fuente mas formal.
  El simulador los usa para la duracion del cilindro (M10) y los umbrales de aprobacion de la
  prueba de fugas (M12).
- **M11** (Drager Vapor 2000) esta marcado "for internal use only": hay que confirmar con el
  director si puede citarse. El simulador lo usa para el efecto del gas portador en el
  vaporizador (escenario 4, Ensayo 3).

---

## Variantes del escenario 3 (Ensayo 3, ultima ronda)

**Lectura de la celula descalibrada: 24,6 % frente a un 34 % real.** La desviacion concreta es [P].
Los manuales dan la tolerancia de la celula sana expuesta al aire (21 % +- 3 %, M3 D-6 [256]) y el
umbral de la alarma de FiO2 baja, pero no una curva de deriva. El valor se eligio para que cumpla
dos condiciones a la vez: que caiga por debajo del umbral de alarma con una mezcla que un
anestesiologo reconoceria como correcta, y que la lectura al aire ambiente (15 %) quede fuera de la
tolerancia de forma inequivoca. Es un supuesto didactico, no un dato de deriva de sensor.

**Caudal de muestra 0 con el modulo caido, frente a 8 mL/min con un tapon.** [P] en el valor exacto,
[I] en la direccion. Que un modulo que no inicia no mueva gas se sigue de su descripcion funcional;
que un tapon deje un caudal residual medible y no cero es lo que hace posible la prueba
discriminante de M3 8-6 [114]. La cifra de 8 mL/min viene de estar por debajo de los 20 mL/min que
M3 D-9 [259] marca como oclusion, y se mantiene por coherencia con la variante 1.

**El orden comprobar antes de calibrar, exigido por el simulador.** [I]. Los manuales describen el
procedimiento de calibracion al aire ambiente, pero no declaran que comprobar la lectura previa sea
obligatorio. La exigencia es una decision pedagogica: calibrar sin medir la desviacion deja al
estudiante sin la evidencia que justifica la accion. Conviene confirmarla con el director.

**El orden reiniciar antes de escalar.** [I] por la misma razon. Es practica estandar y los manuales
piden el reinicio ante un fallo de comunicacion, pero no lo declaran como requisito previo al aviso
a servicio tecnico.

**Que subir la ventilacion deje consecuencia y bloquee la resolucion.** [P], y es diseno del
simulador, no modelo de la maquina. La frecuencia sube realmente de 12 a 16 y el minuto volumen con
ella, que si es modelo; lo que es decision nuestra es no dar el escenario por resuelto mientras la
frecuencia no vuelva a su valor. Se justifica en que el escenario ensena a no actuar sobre el
paciente por una lectura ausente, y dejar el cambio sin deshacer contradiria la leccion.

**El sorteo de variante al entrar, y que no repita la anterior.** [P], diseno del simulador. Ninguna
fuente dice como presentar los casos; es una decision didactica. Se documenta porque cambia lo que
el ejercicio mide: con variante fija se evalua si el estudiante recuerda el procedimiento, y con
variante sorteada si sabe distinguir entre tres cuadros parecidos. Conviene decidir con el director
cual de las dos cosas se quiere evaluar en la sustentacion, porque para una demostracion en vivo
puede convenir fijar la variante con el selector antes de empezar.

---

## Escenario 4: vaporizador (Ensayo 3)

**Caudal de fuga de un vaporizador mal bloqueado: 2200 mL/min medidos a 30 cmH2O.** [P]. Ningun
manual documenta cuanto fuga un vaporizador apoyado pero no sellado; depende del colector, de las
juntas y de hasta donde llego la palanca. El valor se eligio para que el analizador muestre una
caida inequivoca (0,9 % con el dial en 2 %) sin detener la ventilacion, y para que la prueba de
fuga con el dial abierto supere con claridad el limite de 150 mL/min.

**Que la concentracion entregada baje en proporcion al gas que se escapa.** [P]. Es la hipotesis
mas simple y da el orden de magnitud correcto, pero la relacion real depende de por donde escape el
gas: una fuga aguas abajo de la camara de vaporizacion no diluye igual que una que cortocircuite la
camara. Conviene revisarlo con el director si se quiere defender la cifra exacta y no solo la
direccion del cambio.

**Que la fuga del colector solo se manifieste con el dial abierto.** [I]. Se sigue de como funciona
un colector de insercion: con el dial en cero las valvulas de puerto del vaporizador cierran el
paso. Lo que si esta documentado es la consecuencia practica, que es la que el escenario ensena:
M1 3-5, 3-6 [41-42] y M3 6-8 [90] exigen hacer las pruebas con el vaporizador en funcionamiento.
La formulacion "repetir la prueba de fuga con cada vaporizador encendido" es practica estandar de
chequeo previo al uso, no una cita literal de los manuales que se listan.

**Caida de caudal por obstruccion de la salida: 1,8 L/min con 6 L/min fijados.** [P]. El limite de
1 L/min si es del manual (M1 3-5 [41]); la magnitud de la falla se eligio para que la prueba falle
sin ambiguedad. No hay en los manuales una curva de caudal frente a resistencia de la salida.

**Umbral de discrepancia del agente: 30 % relativo al dial.** [P]. M11 3.3 [PDF 16] documenta la
desviacion por gas portador (10 % relativo, maximo 0,4 vol.%), que es la unica desviacion normal
descrita, pero ningun manual fija a partir de que diferencia hay que declarar una alarma. El 30 %
deja fuera la desviacion normal y dentro las tres fallas del escenario.

**Umbral de agente ausente: 0,2 vol.%.** [P]. Elegido para distinguir "no hay agente" de "hay poco".

**Que el escenario de obstruccion arranque con la concertina al 82 %.** [P] de presentacion, no de
modelo. Con 0,2 L/min llegando al circuito el fuelle pierde unos 50 mL por minuto, asi que tardaria
varios minutos en quedarse corto. El escenario empieza cuando la falla ya lleva un rato, igual que
el de fuga. El ritmo de perdida si sale del modelo.

**Lo que no se representa.** El efecto de bombeo por contrapresion intermitente, el llenado con el
agente equivocado, dos vaporizadores abiertos a la vez y el vaporizador volcado o sobrellenado.
Son fallas reales y documentadas en la literatura, pero no en los manuales que este trabajo cita, y
el modelo actual no tiene con que sostenerlas sin inventar numeros.

---

## Escenario 5: variantes (Ensayo 3)

**Presion del cilindro en reserva: 1200 kPa.** [P] en el valor, [M] en el criterio. M4 7-11 [141]
fija el umbral de aviso de presion baja de cilindro en 2633 kPa, asi que cualquier valor por debajo
cumple; se eligio 1200 kPa para que la autonomia calculada con la formula de M10 quede alrededor de
veinte minutos al caudal del escenario, que es un tiempo lo bastante corto para cambiar las
prioridades y lo bastante largo para poder razonar.

**La autonomia mostrada en el panel.** [M] en la formula, M10 diap. 2-3: t(min) = presion en psi x
factor / flujo, con 0,28 para el cilindro E. Lo que es supuesto de diseno es presentarla como
variable de capa 1, porque ninguna de las maquinas de los manuales muestra ese calculo en pantalla:
en la practica lo hace el anestesiologo de cabeza. Se incluye porque el simulador es docente y el
calculo es la leccion.

**Que el N2O siga pasando con el interruptor averiado.** [I], y es la clave de la variante. Se
sigue de que el corte por mezcla hipoxica es neumatico y depende de la presion real del O2, mientras
la alarma es electronica y depende del interruptor. Los manuales describen los dos mecanismos por
separado (M2 p.130 [138] para el corte, M1 5-4 [124] para el interruptor) pero no afirman
explicitamente que uno pueda fallar sin el otro. Conviene confirmarlo con el director, porque sobre
esa independencia se apoya todo el razonamiento de la variante.

**La prueba del cortocircuito del interruptor.** [M], M1 5-4 [124]: si la alarma desaparece al poner
el interruptor en cortocircuito, el interruptor esta defectuoso. El simulador la representa como una
accion con su resultado, no como un procedimiento paso a paso, porque es una maniobra de servicio
tecnico y no de uso clinico.

**Que silenciar sea correcto o incorrecto segun el momento.** [P], diseno del simulador. La pausa de
audio de 120 s es de M4 7-2 [132]; lo que es decision nuestra es evaluarla segun si ya se tomo la
medida inmediata. Ningun manual califica el uso de la pausa, y es una regla pedagogica discutible:
hay situaciones reales en las que pausar el audio antes de actuar es lo correcto, por ejemplo para
poder dar una instruccion al equipo. Se eligio la regla estricta porque el error que se quiere
prevenir es el contrario, y porque la explicacion deja la matizacion escrita.

---

## Escenario 6: reinhalacion de CO2 (Ensayo 3)

**Fraccion que devuelve una valvula unidireccional incompetente: 0,55 del maximo sin absorbente.**
[P]. Ninguna de las fuentes citadas cuantifica cuanto CO2 vuelve por un disco que no asienta;
depende de la geometria de la valvula y de cuanto le falte para cerrar. El valor se eligio para que
el CO2 inspirado quede claramente por encima del limite de alarma de 4 mmHg (M3 F-1 [269]) y algo por
debajo del que da la cal agotada, de modo que las tres variantes se parezcan sin ser identicas. La
direccion del fenomeno si es solida: una valvula que no cierra devuelve gas espirado sin pasarlo por
la cal.

**Temperatura del canister: 40 C reaccionando, 23 C inerte.** [P] en los numeros. Que la reaccion de
la cal sodada con el CO2 sea exotermica es quimica del absorbedor y es el fundamento de la
observacion, pero las fuentes citadas no dan una temperatura. Los dos valores se eligieron para que
la diferencia sea perceptible con la mano, que es como se hace en la practica. Si el director quiere
defender cifras, habria que buscar una fuente especifica; la observacion cualitativa (templado
frente a frio) no la necesita.

**Umbral de avance por encima del cual el canister se enfria: 0,95 de la vida util.** [P]. Hace falta
para que el simulador decida cuando la cal deja de reaccionar de forma apreciable. En la realidad el
enfriamiento es gradual.

**Que el color del indicador revierta al blanco con la cal gastada.** [I] en el mecanismo, [P] en la
forma de representarlo. La reversibilidad del viraje es un fenomeno conocido del colorante y es la
razon por la que los manuales no usan el color como criterio de cambio (M9 p.43 y p.48 usan el CO2
inspirado), pero las fuentes citadas no describen el tiempo de reposo necesario ni en que condiciones
ocurre. El simulador lo representa como un estado dado, no como un proceso.

**Punto de partida de las variantes: 2 L/min de gas fresco y avance 1,05.** [P] de presentacion. Las
magnitudes que resultan (24 mmHg de CO2 inspirado, 52 de EtCO2) salen del modelo y de la curva de
M9; lo elegido es donde empieza el ejercicio. Con 1 L/min y la cal del todo agotada la curva da 76
mmHg, que es coherente con la fuente pero describe una situacion mucho mas avanzada.

**Lo que no se representa.** La degradacion del agente anestesico por cal desecada y la produccion
de monoxido de carbono, que son fenomenos reales y bien documentados en la literatura pero no en los
manuales que este trabajo cita. Tampoco el canal preferente (channeling) dentro del canister, que
daria un agotamiento parcial con color irregular, ni la cal mal cargada.
