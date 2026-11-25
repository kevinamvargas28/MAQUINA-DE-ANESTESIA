/* =====================================================================
   app.js  -  Orquestador: pantallas, bucle y modos
   ---------------------------------------------------------------------
   Flujo de una sesion (seccion 6 del documento):
     estado normal -> se activa una falla -> el estudiante observa y
     diagnostica -> elige la accion -> recibe retroalimentacion y resumen

   Dos modos: entrenamiento (con guia paso a paso) y practica libre.
   ===================================================================== */

(function () {
  'use strict';

  var raiz, estado, calc, alarmasEst, alarmasRes;
  var perfil = SIM.PERFIL_BASE;
  var ultimo = 0, corriendo = false;
  var S = SIM.ui.S;

  var acciones = {
    inicio: irAlInicio,
    maquina: irAlaMaquina,
    listaEscenarios: irAlaLista,
    abrirEscenario: abrirEscenario
  };

  function iniciar() {
    raiz = document.getElementById('app');
    S.perfil = perfil;
    S.alSalir = irAlInicio;
    S.alAbrirEscenario = abrirEscenario;
    irAlInicio();
  }

  function limpiar() {
    corriendo = false;
    SIM.ui.cerrarRecorrido();
    if (SIM.tutorial && SIM.tutorial.activo()) SIM.tutorial.terminar();
    var mg = document.getElementById('modalGlobal');
    if (mg) mg.classList.add('oculto');
    S._recorrido = null;
  }

  function irAlInicio() {
    limpiar();
    S.pantalla = 'inicio';
    SIM.ui.renderInicio(raiz, acciones);
  }

  function irAlaLista(modo) {
    limpiar();
    S.pantalla = 'lista';
    SIM.ui.renderListaEscenarios(raiz, modo, acciones);
  }

  /* ---------------------------------------------------------------- */
  /* Explorador de la maquina: corre con la maquina en reposo para que  */
  /* los flujometros, el fuelle y las curvas se muevan de verdad.       */
  /* ---------------------------------------------------------------- */
  function irAlaMaquina() {
    limpiar();
    S.pantalla = 'maquina';
    estado = SIM.maquina.estadoInicial(perfil);
    alarmasEst = SIM.alarmas.crearEstado();
    S.estado = estado;
    S.escenario = null;
    S.tSim = 0;
    SIM.ui.renderMaquina(raiz, acciones);
    ultimo = performance.now();
    corriendo = true;
    requestAnimationFrame(bucleMaquina);
  }

  function bucleMaquina(ahora) {
    if (!corriendo || S.pantalla !== 'maquina') return;
    /* El sello de requestAnimationFrame es el del comienzo del
       fotograma, que puede ser anterior al performance.now() con el que
       se arranco. Sin el maximo, el primer dt sale negativo y el reloj
       arranca marcando 0-1:0-1. */
    var dt = Math.max(0, Math.min(0.1, (ahora - ultimo) / 1000));
    ultimo = ahora;
    estado.t += dt;
    S.tSim = estado.t;
    calc = SIM.maquina.calcular(estado, perfil, dt);
    SIM.maquina.muestrear(estado, calc);
    alarmasRes = SIM.alarmas.evaluar(alarmasEst, calc, estado, perfil, dt);
    SIM.maquinaVista.actualizar(S.refs.svgVista, estado, calc, alarmasRes);
    /* El circuito de gases se refresca aqui tambien: sin esto el diagrama
       quedaba congelado fuera de un escenario. */
    SIM.ui.refrescarRecorrido(estado, calc, perfil, dt);
    requestAnimationFrame(bucleMaquina);
  }

  /* ---------------------------------------------------------------- */
  /* Escenario                                                         */
  /* ---------------------------------------------------------------- */
  var ultimaVariante = {};

  function sortearVariante(esc) {
    var libres = esc.variantes.filter(function (v) { return v.id !== ultimaVariante[esc.id]; });
    if (!libres.length) libres = esc.variantes;
    return libres[Math.floor(Math.random() * libres.length)];
  }

  function abrirEscenario(id, modo, varianteId) {
    var esc = SIM.escenarios.porId(id);
    if (!esc || !esc.disponible) return;
    limpiar();

    /* Un escenario puede tener variantes: distintos fallos del mismo
       modulo, cada uno con su diagnostico. Sin variantes, varianteId
       es nulo y aplicar() lo ignora. Si no se pide una variante
       concreta se sortea, y se evita repetir la de la vez anterior:
       entrar siempre al mismo caso convierte el ejercicio en un
       recorrido memorizado. */
    var variante = null;
    if (esc.variantes && esc.variantes.length) {
      variante = esc.variantes.filter(function (v) { return v.id === varianteId; })[0];
      if (!variante) variante = sortearVariante(esc);
      ultimaVariante[esc.id] = variante.id;
    }
    S.variante = variante;
    var claveGuion = variante ? esc.id + ':' + variante.id : esc.id;

    estado = SIM.maquina.estadoInicial(perfil);
    alarmasEst = SIM.alarmas.crearEstado();

    /* 1. Estado normal: un primer calculo con la maquina sana */
    calc = SIM.maquina.calcular(estado, perfil, 0.05);

    /* 2. Se activa la falla */
    esc.aplicar(estado, variante ? variante.id : null);

    S.pantalla = 'escenario';
    S.modo = modo || 'practica';
    S.escenario = esc;
    S.estado = estado;
    S.registro = [];
    S.accionesHechas = [];
    S.revelados = {};
    S.zonasDescartadas = [];
    S.zonaSospechosa = null;
    S.resuelto = false;
    S.tSim = 0;
    S.audioPausadoHasta = -1;

    SIM.ui.renderSimulacion(raiz, esc, S.modo);
    document.getElementById('btnVolver').addEventListener('click', irAlInicio);
    SIM.ui.sincronizarControles();
    SIM.ui.anotar('Comienza el escenario ' + esc.numero + '.', 'neutro');

    if (S.modo === 'entrenamiento' && SIM.tutorial.hay(claveGuion)) {
      SIM.tutorial.iniciar(claveGuion, function () {
        /* al salir de la guia: si ya estaba resuelto, se muestra el resumen */
        if (S.resuelto && S.escenario && S.escenario.verificar) {
          SIM.ui.mostrarResumen(S.escenario.verificar(S.estado, calc, perfil));
        }
      });
    }

    ultimo = performance.now();
    corriendo = true;
    requestAnimationFrame(bucle);
  }

  function bucle(ahora) {
    if (!corriendo || S.pantalla !== 'escenario') return;
    /* El sello de requestAnimationFrame es el del comienzo del
       fotograma, que puede ser anterior al performance.now() con el que
       se arranco. Sin el maximo, el primer dt sale negativo y el reloj
       arranca marcando 0-1:0-1. */
    var dt = Math.max(0, Math.min(0.1, (ahora - ultimo) / 1000));
    ultimo = ahora;

    estado.t += dt;
    S.tSim = estado.t;

    calc = SIM.maquina.calcular(estado, perfil, dt);
    SIM.maquina.muestrear(estado, calc);
    alarmasRes = SIM.alarmas.evaluar(alarmasEst, calc, estado, perfil, dt);
    SIM.ui.refrescar(calc, alarmasRes, dt);

    requestAnimationFrame(bucle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
