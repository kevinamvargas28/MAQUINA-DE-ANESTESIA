# Simulador de máquina de anestesia

Simulador 2D de una máquina de anestesia para formación en identificación y resolución de fallas.
Trabajo de grado en Ingeniería Biomédica.

**[Abrir el simulador](https://USUARIO.github.io/simulador-anestesia/)**
*(reemplazar `USUARIO` por el usuario de GitHub una vez publicado)*

---

## Qué es

Una máquina de anestesia completa, dibujada y animada en el navegador, sobre la que se pueden
practicar seis fallas distintas. No reproduce el software de ningún fabricante ni representa un
modelo comercial concreto: es una máquina genérica construida a partir de la documentación técnica
de varios equipos.

No necesita instalación, servidor ni conexión. Son HTML, CSS y JavaScript sin dependencias: basta
con abrir `index.html`.

## Cómo se usa

Tres modos desde la pantalla de inicio:

- **Entrenamiento guiado**: una guía paso a paso explica qué mirar, en qué orden y por qué. Hay un
  guion propio para cada falla y cada variante, quince en total.
- **Práctica libre**: la misma falla sin guía, para diagnosticar por cuenta propia.
- **Explorar la máquina**: recorrer los módulos y el circuito de gases sin ninguna falla activa.

## Las seis fallas

| # | Falla | Variantes |
|---|---|---|
| 1 | Fuga o desconexión del circuito respiratorio | 1 |
| 2 | Falla del ventilador | 1 |
| 3 | Falla del monitoreo de gases | 3 |
| 4 | Falla del vaporizador | 3 |
| 5 | Pérdida del suministro de oxígeno | 3 |
| 6 | Reinhalación de CO2 | 3 |

Las fallas con variantes presentan el mismo síntoma por causas distintas, y la variante se sortea al
entrar: el ejercicio no es recordar un procedimiento, es distinguir entre cuadros que se parecen.

## Cómo está construido

Cada dato que el simulador muestra lleva una etiqueta de evidencia, y se puede consultar desde la
propia interfaz:

- **[M]** dato de manual, con su cita y página
- **[I]** inferencia razonada a partir de los manuales
- **[P]** supuesto de diseño del simulador, sin respaldo documental
- **[V]** presente en las fuentes pero ambiguo

Nada que no esté en los manuales se presenta como si lo estuviera. Los supuestos [P] están
recogidos uno a uno en [SUPUESTOS.md](SUPUESTOS.md), con la razón por la que se eligió cada valor.

La información se organiza en tres capas: qué está pasando, por qué ocurre y de dónde sale el dato.

## Documentación

- [SUPUESTOS.md](SUPUESTOS.md) — todos los supuestos de diseño y lo que hay que validar
- [DESARROLLO.md](DESARROLLO.md) — bitácora de los ensayos: qué se construyó en cada uno, qué falló
  y por qué se corrigió

## Estructura

```
index.html          punto de entrada
css/estilos.css     interfaz y dibujo de los componentes
js/perfil.js        parámetros y umbrales, con su cita
js/modelo.js        fórmulas físicas
js/maquina.js       estado y simulación
js/alarmas.js       condiciones de alarma y prioridades
js/escenarios.js    las seis fallas, sus variantes y sus acciones
js/maquinaVista.js  vista completa de la máquina
js/esquema.js       circuito interno de gases
js/monitor.js       curvas de presión y capnografía
js/tutorial.js      guiones del entrenamiento guiado
js/ui.js            interfaz
js/app.js           arranque y bucles
```

## Aviso

Material de formación. No sustituye el entrenamiento con equipo real ni la lectura del manual del
fabricante, y no debe usarse como referencia para decisiones clínicas.
