/* =====================================================================
   esquema.js  -  La maquina por dentro: el circuito de gases
   ---------------------------------------------------------------------
   La vista frontal dice DONDE esta cada parte. Esta dice POR DONDE pasa
   el gas, y lo hace dibujando los componentes de verdad: los cilindros
   con su volante y su manometro, los tubos de flujometro con su bobina,
   el vaporizador con su dial, las valvulas con su disco, el absorbedor
   con la cal, la concertina en su campana, la bolsa, el paciente y la
   evacuacion. No son cajas con texto: es la maquina abierta.

   Reglas del trazado:
     - Todo el recorrido es ortogonal, con esquinas redondeadas. Ninguna
       tuberia atraviesa el aire en diagonal.
     - Ningun tramo cruza a otro. Donde dos caminos se juntan hay un
       punto grueso, y es una union real.
     - Las particulas en movimiento son el unico indicador de flujo: si
       se detienen, por ahi no pasa gas. Su velocidad es el caudal.

   Orden funcional (seccion 3 del documento):
     suministro -> reguladores -> proteccion de O2 -> flujometros ->
     colector de mezcla -> vaporizador -> salida comun (CGO) ->
     circuito circular -> paciente -> absorbedor -> fuelle o bolsa ->
     evacuacion
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.esquema = (function () {
  'use strict';

  var COLORES = {
    o2: '#3ddc84', aire: '#ffd166', n2o: '#6cb6ff',
    mezcla: '#9fe8c4', agente: '#ff9f45', espirado: '#b39ddb', residual: '#7c8f9b'
  };

  /* ---------------------------------------------------------------- */
  /* Nodos: posicion, tamano, etiqueta y modulo al que pertenecen      */
  /* ---------------------------------------------------------------- */
  var B = {
    cilO2:     { x: 46,  y: 60,  w: 100, h: 126, t: 'Cilindro O2',      mod: 'suministro' },
    regCilO2:  { x: 176, y: 115, w: 84,  h: 62,  t: 'Regulador',        mod: 'suministro' },
    tubO2:     { x: 46,  y: 246, w: 76,  h: 64,  t: 'Tuberia O2',       mod: 'suministro' },
    tubAire:   { x: 46,  y: 360, w: 76,  h: 64,  t: 'Tuberia Aire',     mod: 'suministro' },
    tubN2O:    { x: 46,  y: 474, w: 76,  h: 64,  t: 'Tuberia N2O',      mod: 'suministro' },
    cilN2O:    { x: 46,  y: 588, w: 100, h: 126, t: 'Cilindro N2O',     mod: 'suministro' },
    regCilN2O: { x: 176, y: 643, w: 84,  h: 62,  t: 'Regulador',        mod: 'suministro' },

    protecO2:  { x: 380, y: 243, w: 120, h: 70,  t: 'Proteccion de O2', mod: 'suministro' },
    corteN2O:  { x: 380, y: 471, w: 120, h: 70,  t: 'Corte de N2O',     mod: 'suministro' },

    fmO2:      { x: 634, y: 330, w: 52,  h: 160, t: 'O2',               mod: 'flujometros' },
    fmAire:    { x: 694, y: 330, w: 52,  h: 160, t: 'Aire',             mod: 'flujometros' },
    fmN2O:     { x: 754, y: 330, w: 52,  h: 160, t: 'N2O',              mod: 'flujometros' },

    colector:  { x: 858, y: 276, w: 134, h: 68,  t: 'Colector de mezcla', mod: 'flujometros', et: 'der' },
    vapor:     { x: 858, y: 386, w: 134, h: 120, t: 'Vaporizador',        mod: 'vaporizador', et: 'der' },
    cgo:       { x: 864, y: 556, w: 122, h: 54,  t: 'Salida comun',       mod: 'vaporizador', et: 'der' },

    valvInsp:  { x: 520, y: 668, w: 84,  h: 64,  t: 'Valvula insp.',    mod: 'circuito' },
    paciente:  { x: 1118, y: 738, w: 134, h: 142, t: 'Paciente',        mod: 'circuito' },
    valvEsp:   { x: 838, y: 858, w: 84,  h: 64,  t: 'Valvula esp.',     mod: 'circuito' },
    absorb:    { x: 248, y: 712, w: 104, h: 126, t: 'Absorbedor',       mod: 'absorbedor' },
    fuelle:    { x: 478, y: 928, w: 124, h: 134, t: 'Fuelle',           mod: 'ventilador' },
    bolsa:     { x: 718, y: 928, w: 124, h: 134, t: 'Bolsa y APL',      mod: 'circuito' },
    agss:      { x: 898, y: 952, w: 114, h: 76,  t: 'Evacuacion',       mod: 'evacuacion' }
  };

  /* ---------------------------------------------------------------- */
  /* Tramos: polilineas ortogonales, en el sentido del flujo           */
  /* ---------------------------------------------------------------- */
  var T = {
    cilO2:    [[146, 146], [330, 146], [330, 278]],
    tubO2:    [[122, 278], [380, 278]],
    feedO2:   [[500, 278], [620, 278], [620, 470], [660, 470], [660, 442]],
    tubAire:  [[122, 392], [600, 392]],
    feedAire: [[600, 392], [600, 500], [720, 500], [720, 442]],
    tubN2O:   [[122, 506], [380, 506]],
    feedN2O:  [[500, 506], [580, 506], [580, 530], [780, 530], [780, 442]],
    cilN2O:   [[146, 674], [330, 674], [330, 506]],

    busO2:    [[660, 334], [660, 310]],
    busAire:  [[720, 334], [720, 310]],
    busN2O:   [[780, 334], [780, 310]],
    aColector:[[660, 310], [858, 310]],

    aVapor:   [[925, 344], [925, 386]],
    aCgo:     [[925, 506], [925, 556]],
    aCircuito:[[925, 610], [925, 660], [420, 660], [420, 700]],

    insp1:    [[300, 700], [520, 700]],
    insp2:    [[604, 700], [1080, 700], [1080, 790]],
    aPaciente:[[1080, 790], [1118, 790]],
    esp1:     [[1080, 790], [1080, 890], [922, 890]],
    esp2:     [[838, 890], [300, 890]],
    retorno1: [[300, 890], [300, 838]],
    retorno2: [[300, 712], [300, 700]],

    aFuelle:  [[660, 890], [660, 915], [540, 915], [540, 928]],
    aBolsa:   [[660, 915], [780, 915], [780, 928]],
    aAgss:    [[842, 990], [898, 990]]
  };

  /* ---------------------------------------------------------------- */
  /* Geometria                                                         */
  /* ---------------------------------------------------------------- */
  function d(pts, r) {
    r = r === undefined ? 11 : r;
    if (pts.length < 2) return '';
    var s = 'M ' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], c = pts[i + 1];
      var d1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var d2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
      var rr = Math.min(r, d1 / 2, d2 / 2);
      var p1 = [b[0] + (a[0] - b[0]) / d1 * rr, b[1] + (a[1] - b[1]) / d1 * rr];
      var p2 = [b[0] + (c[0] - b[0]) / d2 * rr, b[1] + (c[1] - b[1]) / d2 * rr];
      s += ' L ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) +
           ' Q ' + b[0] + ' ' + b[1] + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    var u = pts[pts.length - 1];
    return s + ' L ' + u[0] + ' ' + u[1];
  }

  function largo(pts) {
    var L = 0;
    for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }

  function puntoEn(pts, t) {
    var L = largo(pts), dd = t * L, acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + seg >= dd) {
        var f = seg > 0 ? (dd - acc) / seg : 0;
        return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f,
                pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
      }
      acc += seg;
    }
    return pts[pts.length - 1];
  }

  /* ---------------------------------------------------------------- */
  /* Piezas sueltas reutilizables                                      */
  /* ---------------------------------------------------------------- */
  function manometro(id, cx, cy, r) {
    var ticks = '';
    for (var i = 0; i <= 6; i++) {
      var a = (-135 + i / 6 * 270) * Math.PI / 180 - Math.PI / 2;
      ticks += '<line class="gi-tick" x1="' + (cx + Math.cos(a) * (r - 4)).toFixed(1) +
               '" y1="' + (cy + Math.sin(a) * (r - 4)).toFixed(1) +
               '" x2="' + (cx + Math.cos(a) * (r - 1.5)).toFixed(1) +
               '" y2="' + (cy + Math.sin(a) * (r - 1.5)).toFixed(1) + '"/>';
    }
    return '<circle class="gi-man-aro" cx="' + cx + '" cy="' + cy + '" r="' + (r + 2) + '"/>' +
           '<circle class="gi-man" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' + ticks +
           '<line class="gi-man-aguja" id="' + id + '" x1="' + cx + '" y1="' + cy +
             '" x2="' + cx + '" y2="' + (cy - r + 3) + '"/>' +
           '<circle class="gi-man-centro" cx="' + cx + '" cy="' + cy + '" r="2"/>';
  }

  function escala(x, y0, y1, n) {
    var s = '';
    for (var i = 0; i <= n; i++) {
      var y = y1 - (y1 - y0) * (i / n);
      s += '<line class="gi-tick" x1="' + x + '" y1="' + y.toFixed(1) +
           '" x2="' + (x + (i % 5 === 0 ? 6 : 3)) + '" y2="' + y.toFixed(1) + '"/>';
    }
    return s;
  }

  /* ---------------------------------------------------------------- */
  /* Dibujo de cada componente                                         */
  /* ---------------------------------------------------------------- */
  var DIB = {

    /* --- Cilindro de respaldo: cuerpo, hombro, volante y manometro --- */
    cilindro: function (b, gas, ids) {
      var cx = b.x + 34, top = b.y + 26;
      return '<g>' +
        '<rect class="gi-cil-cuerpo" id="' + ids.cuerpo + '" x="' + (cx - 20) + '" y="' + top +
          '" width="40" height="86" rx="7"/>' +
        '<path class="gi-cil-hombro" d="M ' + (cx - 20) + ' ' + (top + 12) +
          ' C ' + (cx - 18) + ' ' + (top - 6) + ' ' + (cx - 5) + ' ' + (top - 14) + ' ' + cx + ' ' + (top - 14) +
          ' C ' + (cx + 5) + ' ' + (top - 14) + ' ' + (cx + 18) + ' ' + (top - 6) + ' ' + (cx + 20) + ' ' + (top + 12) + ' Z"/>' +
        '<rect class="gi-cil-cuello" x="' + (cx - 5) + '" y="' + (top - 26) + '" width="10" height="14" rx="2"/>' +
        '<circle class="gi-volante" cx="' + cx + '" cy="' + (top - 32) + '" r="9"/>' +
        '<line class="gi-volante-r" x1="' + (cx - 8) + '" y1="' + (top - 32) + '" x2="' + (cx + 8) + '" y2="' + (top - 32) + '"/>' +
        '<line class="gi-volante-r" x1="' + cx + '" y1="' + (top - 40) + '" x2="' + cx + '" y2="' + (top - 24) + '"/>' +
        '<rect class="gi-cil-brillo" x="' + (cx - 15) + '" y="' + (top + 8) + '" width="5" height="72" rx="2.5"/>' +
        '<text class="gi-cil-txt ' + gas + '" x="' + cx + '" y="' + (top + 50) + '">' +
          (gas === 'o2' ? 'O2' : 'N2O') + '</text>' +
        manometro(ids.aguja, b.x + 78, b.y + 62, 16) +
        '<path class="gi-tubo-rig" d="M ' + (cx + 20) + ' ' + (b.y + 62) + ' H ' + (b.x + 60) + '"/>' +
      '</g>';
    },

    /* --- Toma de pared --- */
    toma: function (b, gas) {
      var cx = b.x + 24, cy = b.y + 32;
      return '<g>' +
        '<rect class="gi-pared" x="' + b.x + '" y="' + b.y + '" width="34" height="' + b.h + '" rx="5"/>' +
        '<rect class="gi-pared-luz" x="' + (b.x + 3) + '" y="' + (b.y + 3) + '" width="28" height="2" rx="1"/>' +
        '<circle class="gi-toma-aro ' + gas + '" cx="' + cx + '" cy="' + cy + '" r="11"/>' +
        '<circle class="gi-toma ' + gas + '" cx="' + cx + '" cy="' + cy + '" r="6.5"/>' +
        '<rect class="gi-conector" x="' + (b.x + 34) + '" y="' + (cy - 7) + '" width="16" height="14" rx="3"/>' +
      '</g>';
    },

    /* --- Regulador: cuerpo con campana y tornillo de ajuste --- */
    regulador: function (b) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      return '<g>' +
        '<rect class="gi-cuerpo" x="' + (b.x + 8) + '" y="' + (cy - 14) + '" width="' + (b.w - 16) + '" height="28" rx="5"/>' +
        '<path class="gi-campana" d="M ' + (cx - 20) + ' ' + (cy - 14) +
          ' C ' + (cx - 20) + ' ' + (cy - 34) + ' ' + (cx + 20) + ' ' + (cy - 34) + ' ' + (cx + 20) + ' ' + (cy - 14) + ' Z"/>' +
        '<rect class="gi-tornillo-aj" x="' + (cx - 3) + '" y="' + (cy - 42) + '" width="6" height="10" rx="2"/>' +
        '<line class="gi-sep" x1="' + (cx - 20) + '" y1="' + cy + '" x2="' + (cx + 20) + '" y2="' + cy + '"/>' +
      '</g>';
    },

    /* --- Valvula de proteccion: cuerpo, diafragma y piloto --- */
    proteccion: function (b, idPiloto) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      return '<g>' +
        '<rect class="gi-cuerpo" x="' + (b.x + 10) + '" y="' + (cy - 20) + '" width="' + (b.w - 20) + '" height="40" rx="6"/>' +
        '<path class="gi-diafragma" d="M ' + (cx - 26) + ' ' + (cy - 20) +
          ' C ' + (cx - 26) + ' ' + (cy - 40) + ' ' + (cx + 26) + ' ' + (cy - 40) + ' ' + (cx + 26) + ' ' + (cy - 20) + ' Z"/>' +
        '<line class="gi-vastago" x1="' + cx + '" y1="' + (cy - 30) + '" x2="' + cx + '" y2="' + (cy + 10) + '"/>' +
        '<circle class="gi-piloto" id="' + idPiloto + '" cx="' + cx + '" cy="' + (cy + 10) + '" r="6"/>' +
        '<path class="gi-flecha-int" d="M ' + (cx - 20) + ' ' + (cy + 1) + ' H ' + (cx - 8) +
          ' M ' + (cx - 12) + ' ' + (cy - 3) + ' L ' + (cx - 8) + ' ' + (cy + 1) + ' L ' + (cx - 12) + ' ' + (cy + 5) + '"/>' +
      '</g>';
    },

    /* --- Flujometro: tubo de vidrio con escala, bobina y perilla --- */
    flujometro: function (b, gas, idBob) {
      var cx = b.x + b.w / 2, top = b.y + 4, bot = b.y + 112;
      return '<g>' +
        '<rect class="gi-fm-tubo" x="' + (cx - 13) + '" y="' + top + '" width="26" height="' + (bot - top) + '" rx="13"/>' +
        '<rect class="gi-fm-brillo" x="' + (cx - 9) + '" y="' + (top + 6) + '" width="4" height="' + (bot - top - 14) + '" rx="2"/>' +
        escala(cx + 14, top + 8, bot - 8, 10) +
        '<circle class="gi-bobina ' + gas + '" id="' + idBob + '" cx="' + cx + '" cy="' + (bot - 8) + '" r="7.5"/>' +
        '<circle class="gi-perilla ' + gas + '" cx="' + cx + '" cy="' + (bot + 22) + '" r="11"/>' +
        '<line class="gi-perilla-m" x1="' + cx + '" y1="' + (bot + 13) + '" x2="' + cx + '" y2="' + (bot + 18) + '"/>' +
      '</g>';
    },

    /* --- Colector: barra de mezcla con tres entradas --- */
    colector: function (b) {
      var s = '<g><rect class="gi-cuerpo" x="' + (b.x + 6) + '" y="' + (b.y + 10) + '" width="' + (b.w - 12) +
              '" height="30" rx="6"/>';
      [0.22, 0.5, 0.78].forEach(function (f) {
        var x = b.x + 6 + (b.w - 12) * f;
        s += '<rect class="gi-boca" x="' + (x - 5) + '" y="' + (b.y + 2) + '" width="10" height="10" rx="2"/>';
      });
      s += '<line class="gi-sep" x1="' + (b.x + 14) + '" y1="' + (b.y + 25) + '" x2="' + (b.x + b.w - 14) +
           '" y2="' + (b.y + 25) + '"/>' +
           '<rect class="gi-boca" x="' + (b.x + b.w / 2 - 5) + '" y="' + (b.y + 38) + '" width="10" height="10" rx="2"/></g>';
      return s;
    },

    /* --- Vaporizador: cuerpo, dial graduado y mirilla de nivel --- */
    vaporizador: function (b, idAguja, idNivel) {
      var cx = b.x + b.w / 2, cy = b.y + 44;
      var g = '';
      for (var v = 0; v <= 8; v += 2) {
        var a = (-120 + v / 8 * 240) * Math.PI / 180 - Math.PI / 2;
        g += '<line class="gi-tick-dial" x1="' + (cx + Math.cos(a) * 24).toFixed(1) +
             '" y1="' + (cy + Math.sin(a) * 24).toFixed(1) +
             '" x2="' + (cx + Math.cos(a) * 29).toFixed(1) +
             '" y2="' + (cy + Math.sin(a) * 29).toFixed(1) + '"/>';
      }
      return '<g>' +
        '<rect class="gi-vapor-cuerpo" x="' + (b.x + 6) + '" y="' + (b.y + 4) + '" width="' + (b.w - 12) +
          '" height="' + (b.h - 10) + '" rx="7"/>' +
        '<rect class="gi-luz" x="' + (b.x + 10) + '" y="' + (b.y + 7) + '" width="' + (b.w - 20) + '" height="2" rx="1"/>' +
        g +
        '<circle class="gi-dial" cx="' + cx + '" cy="' + cy + '" r="21"/>' +
        '<line class="gi-dial-aguja" id="' + idAguja + '" x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - 16) + '"/>' +
        '<circle class="gi-dial-centro" cx="' + cx + '" cy="' + cy + '" r="3.5"/>' +
        '<rect class="gi-mirilla" x="' + (b.x + 20) + '" y="' + (b.y + 76) + '" width="' + (b.w - 40) + '" height="16" rx="3"/>' +
        '<rect class="gi-nivel" id="' + idNivel + '" x="' + (b.x + 22) + '" y="' + (b.y + 78) + '" width="40" height="12" rx="2"/>' +
      '</g>';
    },

    /* --- Salida comun: brida de conexion --- */
    cgo: function (b) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      return '<g>' +
        '<rect class="gi-cuerpo" x="' + (b.x + 10) + '" y="' + (cy - 13) + '" width="' + (b.w - 20) + '" height="26" rx="5"/>' +
        '<rect class="gi-brida" x="' + (cx - 16) + '" y="' + (cy - 19) + '" width="32" height="38" rx="4"/>' +
        '<circle class="gi-boca-c" cx="' + cx + '" cy="' + cy + '" r="8"/>' +
      '</g>';
    },

    /* --- Valvula unidireccional: cupula de cristal y disco que levanta --- */
    valvula: function (b, idDisco) {
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      return '<g>' +
        '<rect class="gi-valv-base" x="' + (b.x + 8) + '" y="' + (cy + 6) + '" width="' + (b.w - 16) + '" height="12" rx="4"/>' +
        '<path class="gi-valv-cupula" d="M ' + (cx - 24) + ' ' + (cy + 6) +
          ' C ' + (cx - 24) + ' ' + (cy - 26) + ' ' + (cx + 24) + ' ' + (cy - 26) + ' ' + (cx + 24) + ' ' + (cy + 6) + ' Z"/>' +
        '<ellipse class="gi-valv-disco" id="' + idDisco + '" cx="' + cx + '" cy="' + (cy + 4) + '" rx="15" ry="3.6"/>' +
        '<line class="gi-valv-guia" x1="' + cx + '" y1="' + (cy - 18) + '" x2="' + cx + '" y2="' + (cy + 4) + '"/>' +
      '</g>';
    },

    /* --- Paciente: cabeza, traquea y pulmones --- */
    paciente: function (b, idPulmon) {
      var cx = b.x + 44, cy = b.y + 50;
      return '<g>' +
        '<path class="gi-cabeza" d="M ' + (cx - 26) + ' ' + (cy - 18) +
          ' a 20 20 0 1 1 26 26 l 0 10 l -16 0 l 0 -8 a 20 20 0 0 1 -10 -28 Z"/>' +
        '<path class="gi-traquea" d="M ' + (cx + 8) + ' ' + (cy + 18) + ' V ' + (cy + 30) + '"/>' +
        '<g id="' + idPulmon + '">' +
          '<path class="gi-pulmon" d="M ' + (cx + 4) + ' ' + (cy + 30) +
            ' c -20 2 -28 20 -24 38 c 2 10 14 12 20 4 c 4 -6 6 -18 6 -26 Z"/>' +
          '<path class="gi-pulmon" d="M ' + (cx + 12) + ' ' + (cy + 30) +
            ' c 20 2 28 20 24 38 c -2 10 -14 12 -20 4 c -4 -6 -6 -18 -6 -26 Z"/>' +
        '</g>' +
      '</g>';
    },

    /* --- Absorbedor: bote de cristal con cal, abrazadera y purga --- */
    absorbedor: function (b, idVirado) {
      var cx = b.x + b.w / 2;
      return '<g>' +
        '<rect class="gi-tapa" x="' + (b.x + 4) + '" y="' + b.y + '" width="' + (b.w - 8) + '" height="11" rx="4"/>' +
        '<rect class="gi-canister" x="' + (b.x + 12) + '" y="' + (b.y + 11) + '" width="' + (b.w - 24) +
          '" height="' + (b.h - 30) + '" rx="7"/>' +
        '<rect class="gi-cal" x="' + (b.x + 15) + '" y="' + (b.y + 14) + '" width="' + (b.w - 30) +
          '" height="' + (b.h - 36) + '" rx="5"/>' +
        '<rect class="gi-virado" id="' + idVirado + '" x="' + (b.x + 15) + '" y="' + (b.y + 14) +
          '" width="' + (b.w - 30) + '" height="5" rx="3"/>' +
        '<rect class="gi-grano" x="' + (b.x + 15) + '" y="' + (b.y + 14) + '" width="' + (b.w - 30) +
          '" height="' + (b.h - 36) + '" rx="5"/>' +
        '<rect class="gi-abrazadera" x="' + (b.x + 6) + '" y="' + (b.y + b.h / 2 - 5) + '" width="' + (b.w - 12) + '" height="10" rx="3"/>' +
        '<path class="gi-cristal-br" d="M ' + (b.x + 22) + ' ' + (b.y + 18) + ' l 8 0 l -10 ' + (b.h - 46) +
          ' l -5 -10 Z"/>' +
        '<rect class="gi-purga" x="' + (cx - 8) + '" y="' + (b.y + b.h - 19) + '" width="16" height="10" rx="2"/>' +
      '</g>';
    },

    /* --- Fuelle: campana de cristal con la concertina dentro --- */
    fuelle: function (b, idFuelle, idPliegues) {
      return '<g>' +
        '<rect class="gi-tapa" x="' + (b.x + 4) + '" y="' + b.y + '" width="' + (b.w - 8) + '" height="11" rx="4"/>' +
        '<rect class="gi-campana" x="' + (b.x + 10) + '" y="' + (b.y + 11) + '" width="' + (b.w - 20) +
          '" height="' + (b.h - 32) + '" rx="9"/>' +
        '<rect class="gi-fuelle" id="' + idFuelle + '" x="' + (b.x + 22) + '" y="' + (b.y + 30) +
          '" width="' + (b.w - 44) + '" height="68" rx="4"/>' +
        '<g id="' + idPliegues + '"></g>' +
        '<rect class="gi-tapa" x="' + (b.x + 6) + '" y="' + (b.y + b.h - 24) + '" width="' + (b.w - 12) + '" height="11" rx="4"/>' +
        '<path class="gi-cristal-br" d="M ' + (b.x + 20) + ' ' + (b.y + 18) + ' l 8 0 l -10 ' + (b.h - 52) +
          ' l -5 -10 Z"/>' +
      '</g>';
    },

    /* --- Bolsa reservorio con valvula APL --- */
    bolsa: function (b, idBolsa) {
      var cx = b.x + b.w / 2;
      return '<g>' +
        '<rect class="gi-apl-base" x="' + (cx - 16) + '" y="' + (b.y + 2) + '" width="32" height="14" rx="4"/>' +
        '<circle class="gi-apl" cx="' + cx + '" cy="' + (b.y + 26) + '" r="13"/>' +
        '<line class="gi-apl-m" x1="' + cx + '" y1="' + (b.y + 16) + '" x2="' + cx + '" y2="' + (b.y + 22) + '"/>' +
        '<text class="gi-mini c" x="' + cx + '" y="' + (b.y + 52) + '">APL</text>' +
        '<path class="gi-tubo-rig" d="M ' + cx + ' ' + (b.y + 39) + ' V ' + (b.y + 58) + '"/>' +
        '<ellipse class="gi-bolsa" id="' + idBolsa + '" cx="' + cx + '" cy="' + (b.y + 92) + '" rx="34" ry="32"/>' +
        '<ellipse class="gi-bolsa-br" cx="' + (cx - 11) + '" cy="' + (b.y + 80) + '" rx="8" ry="11"/>' +
        '<path class="gi-tubo-rig" d="M ' + (cx + 34) + ' ' + (b.y + 62) + ' H ' + (b.x + b.w) + '"/>' +
      '</g>';
    },

    /* --- Evacuacion --- */
    agss: function (b) {
      var cx = b.x + b.w / 2;
      return '<g>' +
        '<rect class="gi-cuerpo" x="' + (b.x + 6) + '" y="' + (b.y + 10) + '" width="' + (b.w - 12) +
          '" height="' + (b.h - 28) + '" rx="6"/>' +
        '<circle class="gi-agss-ind" cx="' + (b.x + 22) + '" cy="' + (b.y + 28) + '" r="5"/>' +
        '<path class="gi-rejilla" d="M ' + (b.x + 36) + ' ' + (b.y + 22) + ' H ' + (b.x + b.w - 16) +
          ' M ' + (b.x + 36) + ' ' + (b.y + 30) + ' H ' + (b.x + b.w - 16) +
          ' M ' + (b.x + 36) + ' ' + (b.y + 38) + ' H ' + (b.x + b.w - 16) + '"/>' +
        '<path class="gi-tubo-rig" d="M ' + cx + ' ' + (b.y + b.h - 18) + ' V ' + (b.y + b.h - 6) + '"/>' +
      '</g>';
    }
  };

  /* ---------------------------------------------------------------- */
  /* Composicion de cada nodo                                          */
  /* ---------------------------------------------------------------- */
  function nodo(id, dibujo) {
    var b = B[id];
    return '<g class="blq" id="blq-' + id + '" data-blq="' + id + '" tabindex="0" role="button">' +
      '<rect class="blq-halo" x="' + (b.x - 8) + '" y="' + (b.y - 8) + '" width="' + (b.w + 16) +
        '" height="' + (b.h + 16) + '" rx="12"/>' +
      dibujo +
      (b.et === 'der'
        ? '<text class="blq-t izq" x="' + (b.x + b.w + 22) + '" y="' + (b.y + 30) + '">' + b.t + '</text>' +
          '<text class="blq-v izq" id="val-' + id + '" x="' + (b.x + b.w + 22) + '" y="' + (b.y + 46) + '"></text>'
        : '<text class="blq-t" x="' + (b.x + b.w / 2) + '" y="' + (b.y + b.h + 16) + '">' + b.t + '</text>' +
          '<text class="blq-v" id="val-' + id + '" x="' + (b.x + b.w / 2) + '" y="' + (b.y + b.h + 30) + '"></text>') +
      '<rect class="blq-hit" x="' + (b.x - 8) + '" y="' + (b.y - 8) + '" width="' + (b.w + 16) +
        '" height="' + (b.h + (b.et === 'der' ? 16 : 36)) + '" rx="12"/>' +
      '<title>' + b.t + '</title></g>';
  }

  function linea(id, clase) {
    return '<path class="tramo ' + (clase || '') + '" id="tr-' + id + '" d="' + d(T[id]) + '"/>';
  }
  function union(x, y) { return '<circle class="union" cx="' + x + '" cy="' + y + '" r="5"/>'; }
  function flecha(x, y, dir) {
    var g = { der: '0', izq: '180', abajo: '90', arriba: '-90' }[dir] || '0';
    return '<path class="flecha" d="M -5 -4.5 L 4.5 0 L -5 4.5 Z" transform="translate(' + x + ' ' + y +
           ') rotate(' + g + ')"/>';
  }

  function markup() {
    var lineas =
      linea('cilO2', 'g-o2') + linea('tubO2', 'g-o2') + linea('feedO2', 'g-o2') +
      linea('tubAire', 'g-aire') + linea('feedAire', 'g-aire') +
      linea('tubN2O', 'g-n2o') + linea('feedN2O', 'g-n2o') + linea('cilN2O', 'g-n2o') +
      linea('busO2', 'g-o2') + linea('busAire', 'g-aire') + linea('busN2O', 'g-n2o') +
      linea('aColector', 'g-mezcla') + linea('aVapor', 'g-mezcla') + linea('aCgo', 'g-agente') +
      linea('aCircuito', 'g-agente') +
      linea('insp1', 'g-mezcla') + linea('insp2', 'g-mezcla') + linea('aPaciente', 'g-mezcla') +
      linea('esp1', 'g-esp') + linea('esp2', 'g-esp') +
      linea('retorno1', 'g-esp') + linea('retorno2', 'g-mezcla') +
      linea('aFuelle', 'g-esp') + linea('aBolsa', 'g-esp') + linea('aAgss', 'g-res');

    var nodos =
      nodo('cilO2',     DIB.cilindro(B.cilO2, 'o2', { cuerpo: 'gi-cilO2', aguja: 'gi-agCilO2' })) +
      nodo('regCilO2',  DIB.regulador(B.regCilO2)) +
      nodo('tubO2',     DIB.toma(B.tubO2, 'o2')) +
      nodo('tubAire',   DIB.toma(B.tubAire, 'aire')) +
      nodo('tubN2O',    DIB.toma(B.tubN2O, 'n2o')) +
      nodo('cilN2O',    DIB.cilindro(B.cilN2O, 'n2o', { cuerpo: 'gi-cilN2O', aguja: 'gi-agCilN2O' })) +
      nodo('regCilN2O', DIB.regulador(B.regCilN2O)) +
      nodo('protecO2',  DIB.proteccion(B.protecO2, 'gi-pilotoO2')) +
      nodo('corteN2O',  DIB.proteccion(B.corteN2O, 'gi-pilotoN2O')) +
      nodo('fmO2',      DIB.flujometro(B.fmO2, 'o2', 'gi-bobO2')) +
      nodo('fmAire',    DIB.flujometro(B.fmAire, 'aire', 'gi-bobAire')) +
      nodo('fmN2O',     DIB.flujometro(B.fmN2O, 'n2o', 'gi-bobN2O')) +
      nodo('colector',  DIB.colector(B.colector)) +
      nodo('vapor',     DIB.vaporizador(B.vapor, 'gi-agVapor', 'gi-nivelVapor')) +
      nodo('cgo',       DIB.cgo(B.cgo)) +
      nodo('valvInsp',  DIB.valvula(B.valvInsp, 'gi-discoInsp')) +
      nodo('paciente',  DIB.paciente(B.paciente, 'gi-pulmon')) +
      nodo('valvEsp',   DIB.valvula(B.valvEsp, 'gi-discoEsp')) +
      nodo('absorb',    DIB.absorbedor(B.absorb, 'gi-virado')) +
      nodo('fuelle',    DIB.fuelle(B.fuelle, 'gi-fuelle', 'gi-pliegues')) +
      nodo('bolsa',     DIB.bolsa(B.bolsa, 'gi-bolsa')) +
      nodo('agss',      DIB.agss(B.agss));

    return '' +
'<svg id="svgGases" class="vista-gases" viewBox="0 0 1280 1120" ' +
     'preserveAspectRatio="xMidYMid meet" role="img" ' +
     'aria-label="Circuito de gases de la maquina de anestesia, vista por dentro">' +
  '<defs>' +
    '<linearGradient id="giMetal" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#32485a"/><stop offset="14%" stop-color="#26394a"/>' +
      '<stop offset="100%" stop-color="#16242e"/></linearGradient>' +
    '<linearGradient id="giCilindrico" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#16242e"/><stop offset="28%" stop-color="#3a5368"/>' +
      '<stop offset="55%" stop-color="#2a3d4c"/><stop offset="100%" stop-color="#121d25"/></linearGradient>' +
    '<linearGradient id="giCristal" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="rgba(200,232,246,.05)"/>' +
      '<stop offset="22%" stop-color="rgba(200,232,246,.20)"/>' +
      '<stop offset="60%" stop-color="rgba(200,232,246,.07)"/>' +
      '<stop offset="100%" stop-color="rgba(200,232,246,.03)"/></linearGradient>' +
    '<linearGradient id="giVidrio" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#050a0e"/><stop offset="30%" stop-color="#16242e"/>' +
      '<stop offset="52%" stop-color="#0c151c"/><stop offset="100%" stop-color="#04080b"/></linearGradient>' +
    '<linearGradient id="giCal" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#b9b2ea"/><stop offset="30%" stop-color="#e8e4ff"/>' +
      '<stop offset="70%" stop-color="#cdc6f4"/><stop offset="100%" stop-color="#a9a1dd"/></linearGradient>' +
    '<linearGradient id="giFuelle" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="rgba(140,118,186,.30)"/>' +
      '<stop offset="30%" stop-color="rgba(201,183,236,.46)"/>' +
      '<stop offset="100%" stop-color="rgba(120,100,165,.28)"/></linearGradient>' +
    '<radialGradient id="giBolsa" cx="35%" cy="32%" r="78%">' +
      '<stop offset="0%" stop-color="rgba(208,192,238,.42)"/>' +
      '<stop offset="100%" stop-color="rgba(120,100,165,.22)"/></radialGradient>' +
    '<pattern id="giGranulo" width="8" height="8" patternUnits="userSpaceOnUse">' +
      '<circle cx="2.2" cy="2.2" r="1.6" fill="rgba(92,80,142,.32)"/>' +
      '<circle cx="6" cy="5.8" r="1.3" fill="rgba(92,80,142,.24)"/></pattern>' +
  '</defs>' +

  '<g class="secc">' +
    '<text x="46"  y="38">1. Suministro y reguladores</text>' +
    '<text x="380" y="227">2. Proteccion</text>' +
    '<text x="634" y="284">3. Flujometros</text>' +
    '<text x="858" y="258">4. Mezcla, vaporizador y salida</text>' +
    '<text x="46"  y="760">5. Circuito circular</text>' +
    '<text x="46"  y="778">del paciente</text>' +
    '<text x="250" y="960">6. Ventilador, bolsa</text>' +
    '<text x="250" y="978">y evacuacion</text>' +
  '</g>' +

  '<g class="tramos">' + lineas + '</g>' +
  '<g class="uniones">' +
    union(330, 278) + union(330, 506) + union(660, 310) + union(720, 310) + union(780, 310) +
    union(1080, 790) + union(660, 890) + union(660, 915) + union(300, 700) + union(420, 700) +
  '</g>' +
  '<g class="flechas">' +
    flecha(255, 278, 'der') + flecha(255, 392, 'der') + flecha(255, 506, 'der') +
    flecha(560, 278, 'der') + flecha(560, 506, 'der') +
    flecha(820, 310, 'der') + flecha(925, 368, 'abajo') + flecha(925, 534, 'abajo') +
    flecha(680, 660, 'izq') + flecha(820, 700, 'der') + flecha(1080, 752, 'abajo') +
    flecha(600, 890, 'izq') + flecha(300, 880, 'arriba') + flecha(1100, 790, 'der') +
  '</g>' +
  '<g id="gasParticulas"></g>' +
  '<g class="nodos">' + nodos + '</g>' +
'</svg>';
  }

  /* ---------------------------------------------------------------- */
  /* Particulas                                                        */
  /* ---------------------------------------------------------------- */
  var GRUPOS = [
    { id: 'cilO2', c: 'o2' }, { id: 'tubO2', c: 'o2' }, { id: 'feedO2', c: 'o2' },
    { id: 'tubAire', c: 'aire' }, { id: 'feedAire', c: 'aire' },
    { id: 'tubN2O', c: 'n2o' }, { id: 'feedN2O', c: 'n2o' }, { id: 'cilN2O', c: 'n2o' },
    { id: 'busO2', c: 'o2' }, { id: 'busAire', c: 'aire' }, { id: 'busN2O', c: 'n2o' },
    { id: 'aColector', c: 'mezcla' }, { id: 'aVapor', c: 'mezcla' },
    { id: 'aCgo', c: 'agente' }, { id: 'aCircuito', c: 'agente' },
    { id: 'insp1', c: 'mezcla' }, { id: 'insp2', c: 'mezcla' }, { id: 'aPaciente', c: 'mezcla' },
    { id: 'esp1', c: 'espirado' }, { id: 'esp2', c: 'espirado' },
    { id: 'retorno1', c: 'espirado' }, { id: 'retorno2', c: 'mezcla' },
    { id: 'aFuelle', c: 'espirado' }, { id: 'aBolsa', c: 'espirado' }, { id: 'aAgss', c: 'residual' }
  ];

  function crearParticulas(svg) {
    var capa = svg.querySelector('#gasParticulas');
    if (!capa) return {};
    var g = {};
    GRUPOS.forEach(function (def) {
      var n = Math.max(2, Math.round(largo(T[def.id]) / 52));
      var arr = [];
      for (var i = 0; i < n; i++) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', '4.5');
        c.setAttribute('fill', COLORES[def.c]);
        c.setAttribute('opacity', '0');
        capa.appendChild(c);
        arr.push({ el: c, t: i / n });
      }
      g[def.id] = { parts: arr };
    });
    return g;
  }

  function actualizarParticulas(grupos, calc, dt) {
    if (!grupos || !calc) return;
    var gf = calc.gasFresco, v = calc.ventilacion;

    function mover(id, vel, visible) {
      var g = grupos[id];
      if (!g) return;
      g.parts.forEach(function (p) {
        if (!visible || vel <= 0) { p.el.setAttribute('opacity', '0'); return; }
        p.t += vel * dt;
        while (p.t > 1) p.t -= 1;
        var pt = puntoEn(T[id], p.t);
        p.el.setAttribute('cx', pt[0].toFixed(1));
        p.el.setAttribute('cy', pt[1].toFixed(1));
        p.el.setAttribute('opacity', '0.92');
      });
    }

    var k = 0.05;
    var cilO2 = calc.suministro.fuenteActiva.o2 === 'cilindro';
    var cilN2O = calc.suministro.fuenteActiva.n2o === 'cilindro';
    mover('cilO2', gf.o2 * k, cilO2 && gf.o2 > 0.02);
    mover('tubO2', gf.o2 * k, !cilO2 && gf.o2 > 0.02);
    mover('feedO2', gf.o2 * k, gf.o2 > 0.02);
    mover('tubAire', gf.aire * k, gf.aire > 0.02);
    mover('feedAire', gf.aire * k, gf.aire > 0.02);
    mover('cilN2O', gf.n2o * k, cilN2O && gf.n2o > 0.02);
    mover('tubN2O', gf.n2o * k, !cilN2O && gf.n2o > 0.02);
    mover('feedN2O', gf.n2o * k, gf.n2o > 0.02);
    mover('busO2', gf.o2 * k, gf.o2 > 0.02);
    mover('busAire', gf.aire * k, gf.aire > 0.02);
    mover('busN2O', gf.n2o * k, gf.n2o > 0.02);

    var vm = gf.fgf * 0.028;
    mover('aColector', vm, gf.fgf > 0.05);
    mover('aVapor', vm, gf.fgf > 0.05);
    mover('aCgo', vm, gf.fgf > 0.05);
    mover('aCircuito', Math.max(0.04, vm * 0.5), gf.fgf > 0.05);

    var ciclando = v.hayVentilacion && v.vtEntregado > 5;
    var base = ciclando ? 0.24 : (gf.fgf > 0.05 ? 0.055 : 0);
    var insp = v.enInspiracion ? base : base * 0.1;
    var esp = v.enInspiracion ? base * 0.1 : base;
    mover('insp1', insp, base > 0);
    mover('insp2', insp, base > 0);
    mover('aPaciente', insp, base > 0 && !calc.circuito.desconectado);
    mover('esp1', esp, base > 0);
    mover('esp2', esp, base > 0);
    mover('retorno1', esp, base > 0);
    mover('retorno2', esp, base > 0);
    mover('aFuelle', v.ventilaMecanica ? base : 0, v.ventilaMecanica && base > 0);
    mover('aBolsa', v.ventilaManual ? base : base * 0.3, base > 0);
    mover('aAgss', gf.fgf * 0.02, gf.fgf > 0.05);
  }

  /* ---------------------------------------------------------------- */
  /* Valores en vivo y animacion de los componentes                    */
  /* ---------------------------------------------------------------- */
  function n1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function n0(x) { return Math.round(x).toString(); }

  function actualizar(svg, est, calc, perfil) {
    if (!svg || !calc) return;
    var q = function (sel) { return svg.querySelector(sel); };
    function val(id, t) { var e = q('#val-' + id); if (e) e.textContent = t; }
    function cls(id, c, on) { var e = q('#blq-' + id); if (e) e.classList.toggle(c, !!on); }
    function tramo(id, c, on) { var e = q('#tr-' + id); if (e) e.classList.toggle(c, !!on); }

    var s = calc.suministro, gf = calc.gasFresco, v = calc.ventilacion;

    /* --- textos --- */
    val('cilO2', est.suministro.cilindroAbierto.o2 ? n0(s.cilindro.o2) + ' kPa' : 'cerrado');
    val('cilN2O', est.suministro.cilindroAbierto.n2o ? n0(s.cilindro.n2o) + ' kPa' : 'cerrado');
    val('tubO2', n0(est.suministro.tuberia.o2) + ' kPa');
    val('tubAire', n0(est.suministro.tuberia.aire) + ' kPa');
    val('tubN2O', n0(est.suministro.tuberia.n2o) + ' kPa');
    val('regCilO2', '340 kPa'); val('regCilN2O', '340 kPa');
    val('protecO2', s.n2oCortado ? 'corta el N2O' : 'habilitado');
    val('corteN2O', s.n2oCortado ? 'cerrado' : 'abierto');
    val('fmO2', n1(gf.o2) + ' L/min');
    val('fmAire', n1(gf.aire) + ' L/min');
    val('fmN2O', n1(gf.n2o) + ' L/min');
    val('colector', n1(gf.fgf) + ' L/min  ·  FiO2 ' + n0(gf.fio2 * 100) + ' %');
    val('vapor', n1(est.vaporizador.dial) + ' vol. %');
    val('cgo', n1(gf.fgf) + ' L/min al circuito');
    val('valvInsp', v.hayVentilacion && v.enInspiracion ? 'abierta' : 'cerrada');
    val('valvEsp', v.hayVentilacion && !v.enInspiracion ? 'abierta' : 'cerrada');
    val('paciente', calc.monitor.valido ? n0(v.vte) + ' mL  ·  EtCO2 ' + n0(calc.monitor.etco2)
                                        : n0(v.vte) + ' mL');
    val('absorb', n0(Math.max(0, 100 - est.circuito.absorbedorAvance * 100)) + ' % de capacidad');
    val('fuelle', v.ventilaMecanica ? n0(v.llenado * 100) + ' % de llenado' : 'en reposo');
    val('bolsa', est.circuito.modo === 'manual' ? 'en uso' : 'en espera');
    val('agss', 'evacuando');

    /* --- bobinas de los flujometros --- */
    function bobina(sel, lpm) {
      var e = q(sel); if (!e) return;
      var bajo = 434, alto = 342;
      e.setAttribute('cy', (bajo - (bajo - alto) * Math.min(1, lpm / 10)).toFixed(1));
    }
    bobina('#gi-bobO2', gf.o2);
    bobina('#gi-bobAire', gf.aire);
    bobina('#gi-bobN2O', gf.n2o);

    /* --- agujas de los manometros --- */
    function aguja(sel, kPa, max) {
      var e = q(sel); if (!e) return;
      var f = Math.max(0, Math.min(1, kPa / max));
      e.setAttribute('transform', 'rotate(' + (-135 + f * 270).toFixed(1) + ' ' +
        e.getAttribute('x1') + ' ' + e.getAttribute('y1') + ')');
    }
    aguja('#gi-agCilO2', s.cilindro.o2, 15000);
    aguja('#gi-agCilN2O', s.cilindro.n2o, 6000);

    /* --- dial y nivel del vaporizador --- */
    var av = q('#gi-agVapor');
    if (av) av.setAttribute('transform', 'rotate(' + (-120 + est.vaporizador.dial / 8 * 240).toFixed(1) +
      ' ' + (B.vapor.x + B.vapor.w / 2) + ' ' + (B.vapor.y + 44) + ')');
    var nv = q('#gi-nivelVapor');
    if (nv) nv.setAttribute('width', (90 * est.vaporizador.nivelLiquidoPct / 100).toFixed(1));

    /* --- discos de las valvulas: levantan cuando abren --- */
    function disco(sel, abierta, cyBase) {
      var e = q(sel); if (!e) return;
      e.setAttribute('cy', (abierta ? cyBase - 11 : cyBase).toFixed(1));
      e.classList.toggle('abierta', !!abierta);
    }
    disco('#gi-discoInsp', v.hayVentilacion && v.enInspiracion, B.valvInsp.y + B.valvInsp.h / 2 + 4);
    disco('#gi-discoEsp', v.hayVentilacion && !v.enInspiracion, B.valvEsp.y + B.valvEsp.h / 2 + 4);

    /* --- concertina --- */
    var f = q('#gi-fuelle'), pl = q('#gi-pliegues');
    if (f) {
      var comp;
      if (!v.ventilaMecanica || v.vtEntregado <= 5) comp = 0.22;
      else comp = v.enInspiracion ? 1 - v.avanceFase * 0.7 : 0.3 + v.avanceFase * 0.7;
      var tope = typeof v.llenado === 'number' ? Math.max(0.15, v.llenado) : 1;
      comp = Math.min(comp, tope);
      var baseY = B.fuelle.y + B.fuelle.h - 26;
      var alto = 14 + 72 * comp;
      f.setAttribute('height', alto.toFixed(1));
      f.setAttribute('y', (baseY - alto).toFixed(1));
      f.classList.toggle('sin-tope', tope < 0.9);
      if (pl) {
        if (!pl.childNodes.length) {
          for (var i = 0; i < 7; i++) {
            var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('class', 'gi-pliegue');
            pl.appendChild(p);
          }
        }
        var x0 = B.fuelle.x + 22, x1 = B.fuelle.x + B.fuelle.w - 22, xm = (x0 + x1) / 2;
        var hijos = pl.childNodes, n = hijos.length;
        for (var j = 0; j < n; j++) {
          var yy = (baseY - alto) + alto * ((j + 1) / (n + 1));
          hijos[j].setAttribute('d', 'M ' + x0 + ' ' + yy.toFixed(1) + ' L ' + xm + ' ' +
            (yy + 3).toFixed(1) + ' L ' + x1 + ' ' + yy.toFixed(1));
        }
      }
    }

    /* --- bolsa --- */
    var bo = q('#gi-bolsa');
    if (bo) {
      var ll = est.circuito.desconectado ? 0.34
        : Math.max(0.36, Math.min(1, 0.56 + gf.fgf / 14 - est.circuito.fugaQ30 / 9000));
      bo.setAttribute('rx', (34 * ll).toFixed(1));
      bo.setAttribute('ry', (32 * ll).toFixed(1));
    }

    /* --- cal del absorbedor --- */
    var vr = q('#gi-virado');
    if (vr) vr.setAttribute('height', Math.max(5, (B.absorb.h - 36) * Math.min(1, est.circuito.colorVirado)).toFixed(1));

    /* --- pulmones --- */
    var pu = q('#gi-pulmon');
    if (pu) {
      var esc = v.hayVentilacion && v.enInspiracion ? 1 + v.avanceFase * 0.12 : 1.01;
      if (!v.hayVentilacion) esc = 1;
      var pcx = B.paciente.x + 52, pcy = B.paciente.y + 96;
      pu.setAttribute('transform', 'translate(' + pcx + ' ' + pcy + ') scale(' + esc.toFixed(3) +
        ') translate(' + (-pcx) + ' ' + (-pcy) + ')');
    }

    /* --- tomas de pared y pilotos --- */
    ['o2', 'aire', 'n2o'].forEach(function (g) {
      var t = svg.querySelector('.gi-toma.' + g);
      if (t) t.classList.toggle('sin-presion', est.suministro.tuberia[g] <= 100);
    });
    var po = q('#gi-pilotoO2');
    if (po) po.classList.toggle('alerta', s.o2BajoAlarma);
    var pn = q('#gi-pilotoN2O');
    if (pn) pn.classList.toggle('alerta', s.n2oCortado);

    /* --- estados de los nodos --- */
    cls('protecO2', 'alerta', s.n2oCortado);
    cls('corteN2O', 'inactivo', s.n2oCortado);
    cls('tubO2', 'alerta', est.suministro.tuberia.o2 < SIM.pv('suministro.alarmaO2Baja', perfil));
    cls('cilO2', 'activo', est.suministro.cilindroAbierto.o2);
    cls('cilN2O', 'activo', est.suministro.cilindroAbierto.n2o);
    cls('valvInsp', 'activo', v.hayVentilacion && v.enInspiracion);
    cls('valvEsp', 'activo', v.hayVentilacion && !v.enInspiracion);
    cls('fuelle', 'activo', v.ventilaMecanica);
    cls('bolsa', 'activo', est.circuito.modo === 'manual');
    cls('absorb', 'alerta', calc.monitor.valido && calc.monitor.fico2 > SIM.pv('absorbedor.alarmaFiCO2Alta', perfil));
    cls('paciente', 'alerta', calc.circuito.desconectado);

    /* --- tramos --- */
    tramo('corteN2O', 'sin-flujo', s.n2oCortado || gf.n2o <= 0.02);
    tramo('feedN2O', 'sin-flujo', s.n2oCortado || gf.n2o <= 0.02);
    tramo('tubN2O', 'sin-flujo', gf.n2o <= 0.02);
    tramo('tubO2', 'sin-flujo', gf.o2 <= 0.02 || s.fuenteActiva.o2 === 'cilindro');
    tramo('cilO2', 'sin-flujo', s.fuenteActiva.o2 !== 'cilindro');
    tramo('cilN2O', 'sin-flujo', s.fuenteActiva.n2o !== 'cilindro');
    tramo('tubAire', 'sin-flujo', gf.aire <= 0.02);
    tramo('feedAire', 'sin-flujo', gf.aire <= 0.02);
    var hayFuga = est.circuito.fugaQ30 > SIM.pv('pruebas.fugaAceptable', perfil);
    ['insp1', 'insp2', 'esp1', 'esp2'].forEach(function (id) { tramo(id, 'con-fuga', hayFuga); });
    tramo('aPaciente', 'cortado', est.circuito.desconectado);
  }

  /* ---------------------------------------------------------------- */
  function preparar(svg, alElegir, alPasar) {
    if (!svg) return;
    var gs = svg.querySelectorAll('.blq');
    for (var i = 0; i < gs.length; i++) {
      (function (g) {
        var id = g.getAttribute('data-blq');
        if (alElegir) {
          g.addEventListener('click', function () { alElegir(id, B[id]); });
          g.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alElegir(id, B[id]); }
          });
        }
        if (alPasar) {
          g.addEventListener('mouseenter', function () { alPasar(id, B[id]); });
          g.addEventListener('mouseleave', function () { alPasar(null, null); });
        }
      })(gs[i]);
    }
  }

  function marcar(svg, id) {
    if (!svg) return;
    var gs = svg.querySelectorAll('.blq');
    for (var i = 0; i < gs.length; i++) {
      gs[i].classList.toggle('sel', gs[i].getAttribute('data-blq') === id);
    }
  }

  return {
    B: B, T: T, COLORES: COLORES,
    markup: markup,
    crearParticulas: crearParticulas,
    actualizarParticulas: actualizarParticulas,
    actualizar: actualizar,
    preparar: preparar,
    marcar: marcar
  };
})();
