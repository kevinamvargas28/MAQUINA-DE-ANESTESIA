/* =====================================================================
   pantalla.js — en que tamano de pantalla estamos, y con que reglas.
   ---------------------------------------------------------------------
   No se pregunta que aparato es. Preguntar "eres un telefono" es
   fragil: una tableta responde cosas raras, un telefono en modo
   escritorio miente, y cada ano salen aparatos que no estan en la
   lista. Ademas dejaria fuera el caso de un portatil con la ventana a
   media pantalla, que tiene el mismo problema y no es un telefono.

   Se mide el ancho disponible, que es lo unico que de verdad importa y
   no se queda obsoleto. Tres tramos:

     telefono   menos de 700 px   una columna y el escenario por secciones
     tableta    700 a 1080 px     una columna holgada
     pc         1080 px o mas     dos columnas, la disposicion de siempre

   Encima de eso el usuario puede forzar un modo. El automatico acierta
   casi siempre, pero no en una tableta a medio camino, ni en un
   telefono en horizontal donde si cabe la vista completa, ni cuando se
   quiere ensenar la version de telefono desde un computador. Lo que
   elija se recuerda.

   El resto de la aplicacion no consulta anchos: lee las clases que esto
   pone en <html>, asi el modo forzado y el automatico se comportan
   igual. Un @media solo no serviria, porque un boton no puede
   contradecir a un @media.
   ===================================================================== */
window.SIM = window.SIM || {};

SIM.pantalla = (function () {
  'use strict';

  var CLAVE = 'simAnestesia.modo';
  var CORTE_TEL = 700;
  var CORTE_TAB = 1080;
  var MODOS = ['telefono', 'tableta', 'pc'];

  var forzado = null;
  var oyentes = [];
  var ultimo = null;

  /* En file:// algunos navegadores lanzan al tocar localStorage, asi que
     todo acceso va protegido: sin memoria, el simulador sigue andando. */
  function leerGuardado() {
    try {
      var v = window.localStorage.getItem(CLAVE);
      return MODOS.indexOf(v) >= 0 ? v : null;
    } catch (e) { return null; }
  }

  function guardar(v) {
    try {
      if (v) { window.localStorage.setItem(CLAVE, v); }
      else { window.localStorage.removeItem(CLAVE); }
    } catch (e) { /* sin memoria, pero funciona igual */ }
  }

  function porAncho() {
    var w = window.innerWidth || document.documentElement.clientWidth || 1200;
    if (w < CORTE_TEL) { return 'telefono'; }
    if (w < CORTE_TAB) { return 'tableta'; }
    return 'pc';
  }

  function actual() { return forzado || porAncho(); }
  function automatico() { return !forzado; }

  function aplicar() {
    var m = actual();
    var r = document.documentElement;
    if (!r) { return m; }
    r.classList.toggle('es-telefono', m === 'telefono');
    r.classList.toggle('es-tableta', m === 'tableta');
    r.classList.toggle('es-pc', m === 'pc');
    r.setAttribute('data-modo', m);
    r.setAttribute('data-modo-forzado', forzado ? 'si' : 'no');
    if (m !== ultimo) {
      ultimo = m;
      for (var i = 0; i < oyentes.length; i++) { oyentes[i](m); }
    }
    return m;
  }

  function forzar(m) {
    forzado = (MODOS.indexOf(m) >= 0) ? m : null;
    guardar(forzado);
    return aplicar();
  }

  /* Gira entre: automatico -> pc -> telefono -> automatico. */
  function siguiente() {
    if (!forzado) { return forzar('pc'); }
    if (forzado === 'pc') { return forzar('telefono'); }
    return forzar(null);
  }

  function etiqueta() {
    if (!forzado) {
      return 'Vista automatica (' + (actual() === 'telefono' ? 'telefono'
            : actual() === 'tableta' ? 'tableta' : 'computador') + ')';
    }
    return forzado === 'telefono' ? 'Vista de telefono (fijada)' : 'Vista de computador (fijada)';
  }

  function alCambiar(fn) { if (typeof fn === 'function') { oyentes.push(fn); } }

  function iniciar() {
    forzado = leerGuardado();
    aplicar();
    var t = null;
    function reaccionar() {
      if (t) { clearTimeout(t); }
      t = setTimeout(aplicar, 120);   /* el redimensionado dispara muchas veces */
    }
    window.addEventListener('resize', reaccionar);
    window.addEventListener('orientationchange', reaccionar);
  }

  iniciar();

  return {
    actual: actual,
    automatico: automatico,
    esTelefono: function () { return actual() === 'telefono'; },
    forzar: forzar,
    siguiente: siguiente,
    etiqueta: etiqueta,
    alCambiar: alCambiar,
    aplicar: aplicar
  };
})();
