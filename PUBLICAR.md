# Como publicar una version nueva

El simulador vive en `https://kevinamvargas28.github.io/MAQUINA-DE-ANESTESIA/`, servido por GitHub
Pages desde la rama `main` del repositorio `kevinamvargas28/MAQUINA-DE-ANESTESIA`.

Son tres pasos y tardan menos de cinco minutos.

---

## 1. Cambiar el numero de version

En `index.html`, cerca del principio:

```js
var VERSION = '2026-11-22';
```

Poner la fecha de hoy. **Es lo unico que hay que editar a mano.**

Para que sirve: el navegador guarda cada archivo por separado y los reutiliza sin volver a
pedirlos. Si no cambia la version, puede quedarse con el `estilos.css` viejo y entonces la pagina
publicada se ve igual que antes aunque el archivo nuevo ya este en el servidor. Peor todavia: puede
mezclar un archivo nuevo con uno viejo, y entonces no se ve vieja, se rompe. Cambiar la fecha
convierte cada archivo en una direccion distinta y obliga al navegador a traerlos todos de nuevo.

## 2. Subir los archivos

GitHub tiene un problema conocido con el arrastre de **carpetas**: a veces las ignora en silencio,
el commit se crea igual y uno cree que subio todo cuando solo subieron los archivos sueltos. Para
no depender de eso, se sube **dentro** de cada carpeta, donde ya no hay carpetas que arrastrar.

Los tres enlaces abren el cargador apuntando al sitio correcto:

| Que subir | Enlace |
|---|---|
| Archivos sueltos (`index.html`, los `.md`) | https://github.com/kevinamvargas28/MAQUINA-DE-ANESTESIA/upload/main |
| La hoja de estilos | https://github.com/kevinamvargas28/MAQUINA-DE-ANESTESIA/upload/main/css |
| Los doce archivos de JavaScript | https://github.com/kevinamvargas28/MAQUINA-DE-ANESTESIA/upload/main/js |

En cada uno: arrastrar los archivos, escribir un mensaje de commit y pulsar **Commit changes**.
Dentro de `css` y de `js` se puede usar Ctrl+A sin riesgo, porque ahi solo hay archivos.

Subir un archivo con el mismo nombre reemplaza al que estaba. No hay que borrar nada antes.

Si solo cambiaron dos o tres archivos, basta con subir esos y el `index.html` con la version nueva.

## 3. Comprobar

Esperar un minuto a que GitHub Pages reconstruya y abrir el enlace con **Ctrl + Shift + R**.

El simulador se defiende solo: al arrancar comprueba que todos sus modulos traigan las funciones que
la interfaz necesita. Si algo no cuadra, en vez de quedarse en una pantalla muerta muestra un aviso
que dice que falta y que hacer. Asi que:

- **Se ve la portada con la maquina** → quedo bien.
- **Sale "El simulador se cargo incompleto"** → falto subir algun archivo. El aviso dice cual.
  Volver al paso 2 y revisar sobre todo que `css` y `js` hayan subido completas.

---

## Si algun dia se quiere evitar el paso manual

Con **GitHub Desktop** (gratuito) el repositorio queda como una carpeta mas del computador:
se copian encima los archivos nuevos, se escribe el mensaje y se pulsa *Commit* y *Push*. No hay
arrastre ni posibilidad de dejar una carpeta por fuera, y queda historial completo de cada cambio.
Es media hora de instalacion y aprendizaje, una sola vez.

Mientras tanto, los tres enlaces de arriba funcionan y son suficientes.
