/* =====================================================================
   maquinaPortada.js — la maquina de la portada, en perspectiva.
   ---------------------------------------------------------------------
   Por que existe, habiendo ya un dibujo de la maquina:

   El de maquinaVista.js es de frente a proposito. Ahi se aprende: nada
   se tapa, las etiquetas caben y cada modulo es clicable sin ambiguedad.
   Este es para la portada, donde el trabajo es otro: que se reconozca de
   un vistazo como una maquina de anestesia y no como un esquema.

   Como esta hecho:

   No se dibuja a mano en perspectiva. La maquina se define como cajas y
   cilindros con medidas en centimetros, y una proyeccion los convierte
   en poligonos. Asi las lineas de fuga son consistentes por
   construccion, que es justo donde fallan los dibujos en perspectiva
   hechos a ojo.

   El sombreado tampoco se elige pieza por pieza: cada cara recibe la luz
   segun su normal, con una fuente principal arriba y al frente y un
   relleno debil desde el lado opuesto. Las caras grandes ademas llevan
   un degradado propio en la direccion de su vertical, que es lo que
   evita que las superficies se vean como papel recortado.

   Las medidas son las tipicas de una estacion de trabajo de anestesia
   (carro de unos 80 cm de frente, encimera a 90 cm, monitor sobre brazo
   a 155 cm). Son proporciones de referencia, no de un equipo concreto:
   marcadas [P] en SUPUESTOS.md, igual que la disposicion de las piezas.
   ===================================================================== */
window.SIM = window.SIM || {};

SIM.maquinaPortada = (function () {
  'use strict';

  /* ---- camara ------------------------------------------------------ */
  var GRADO = Math.PI / 180;
  var GIRO   = 20.5 * GRADO;
  var PICADO =  6.5 * GRADO;
  var OJO    = 96;
  var FOCAL  = 540;
  var ESCALA = 3.05;
  var CX = 360, CY = 455;

  /* ---- luz --------------------------------------------------------- */
  function unit(v) {
    var m = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / m, v[1] / m, v[2] / m];
  }
  var LUZ    = unit([0.34, 0.82, 0.46]);   /* principal: arriba y al frente */
  var RELLENO = unit([-0.70, 0.18, 0.36]); /* debil, desde el otro lado     */
  var AMB = 0.34;

  /* ---- colores ----------------------------------------------------- */
  var C = {
    cuerpo:   [224, 228, 231],
    cuerpoAl: [237, 240, 243],
    encimera: [202, 207, 211],
    panel:    [212, 217, 221],
    zocalo:   [ 88,  95, 101],
    metal:    [146, 154, 160],
    oscuro:   [ 46,  51,  56],
    grafito:  [ 62,  68,  74],
    pantalla: [ 20,  23,  26],
    cajon:    [216, 221, 225],
    tirador:  [138, 146, 152],
    o2:       [ 53, 168, 100],
    n2o:      [ 74, 134, 200],
    aire:     [212, 160,  58],
    sevo:     [217, 176,  70],
    iso:      [168, 148, 200],
    cal:      [190, 180, 210],
    calUsada: [150, 128, 176],
    vidrio:   [198, 208, 214],
    bolsa:    [96, 102, 107],
    rojo:     [176,  62,  54],
    blanco:   [242, 245, 247]
  };

  /* ---- proyeccion -------------------------------------------------- */
  var cg = Math.cos(GIRO), sg = Math.sin(GIRO);
  var cp = Math.cos(PICADO), sp = Math.sin(PICADO);

  /* La misma maquina se mira desde dos sitios: en diagonal para la
     portada, y casi de frente para aprender, donde interesa que nada se
     tape y que cada pieza sea facil de senalar. */
  function camaraDesde(giro, picado) {
    GIRO = giro * GRADO; PICADO = picado * GRADO;
    cg = Math.cos(GIRO); sg = Math.sin(GIRO);
    cp = Math.cos(PICADO); sp = Math.sin(PICADO);
  }

  function camara(p) {
    var x1 =  p[0] * cg + p[2] * sg;
    var z1 = -p[0] * sg + p[2] * cg;
    var y1 =  p[1] - OJO;
    return [x1, y1 * cp - z1 * sp, y1 * sp + z1 * cp];
  }

  function proy0(p) {
    var c = camara(p);
    var k = FOCAL / (FOCAL - c[2]);
    return [CX + c[0] * k * ESCALA, CY - c[1] * k * ESCALA];
  }

  /* Caja envolvente de lo dibujado, para encuadrar el lienzo alrededor
     del equipo en vez de dejarlo flotando en una esquina. */
  var caj = null;
  function proy(p) {
    var q = proy0(p);
    if (!caj) { caj = [q[0], q[1], q[0], q[1]]; }
    else {
      if (q[0] < caj[0]) { caj[0] = q[0]; }
      if (q[1] < caj[1]) { caj[1] = q[1]; }
      if (q[0] > caj[2]) { caj[2] = q[0]; }
      if (q[1] > caj[3]) { caj[3] = q[1]; }
    }
    return q;
  }

  function hondura(p) { return camara(p)[2]; }

  function giraNormal(n) {
    var x1 =  n[0] * cg + n[2] * sg;
    var z1 = -n[0] * sg + n[2] * cg;
    return [x1, n[1] * cp - z1 * sp, n[1] * sp + z1 * cp];
  }

  function factorLuz(n, extra) {
    var d  = Math.max(0, n[0] * LUZ[0] + n[1] * LUZ[1] + n[2] * LUZ[2]);
    var r  = Math.max(0, n[0] * RELLENO[0] + n[1] * RELLENO[1] + n[2] * RELLENO[2]);
    return (AMB + 0.74 * d + 0.16 * r) * (extra === undefined ? 1 : extra);
  }

  function rgbTxt(rgb, f) {
    function v(x) { return Math.max(0, Math.min(255, Math.round(x * f))); }
    return 'rgb(' + v(rgb[0]) + ',' + v(rgb[1]) + ',' + v(rgb[2]) + ')';
  }

  function tono(rgb, n, extra) { return rgbTxt(rgb, factorLuz(n, extra)); }

  /* ---- escena, por capas ---------------------------------------------
     No se ordena todo junto. Ordenar por profundidad media falla cuando
     una pieza pequena se apoya sobre una cara grande: la cara grande
     abarca mucho fondo, su media queda cerca y termina tapando lo que
     tiene encima. Las piezas se agrupan en capas con un orden fijo y
     solo se ordena dentro de cada capa.                               */
  var capas = [], actual = null, suelto = '', modActual = null;
  function mod(id) { modActual = id; }

  function capa(fn) { actual = []; fn(); capas.push(actual); }
  function crudo(svg) { suelto += svg; }

  function cara(puntos, rgb, normal, opc) {
    opc = opc || {};
    var z = 0, i, cen = [0, 0, 0];
    for (i = 0; i < puntos.length; i++) {
      z += hondura(puntos[i]);
      cen[0] += puntos[i][0]; cen[1] += puntos[i][1]; cen[2] += puntos[i][2];
    }
    z /= puntos.length;
    cen[0] /= puntos.length; cen[1] /= puntos.length; cen[2] /= puntos.length;

    var nc = giraNormal(normal);
    if (!opc.siempre && nc[2] <= 0.015) { return null; }

    var pts = [], d = '';
    for (i = 0; i < puntos.length; i++) {
      var q = proy(puntos[i]);
      pts.push(q);
      d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    }
    var f = {
      z: z, d: d + 'Z', pts: pts, cen: cen, n: normal, m: modActual,
      rgb: rgb, extra: opc.extra, plano: opc.plano, op: opc.op
    };
    actual.push(f);
    return f;
  }

  /* Area proyectada, para saber si a la cara le vale la pena un
     degradado propio o basta un color plano. */
  function area(pts) {
    var a = 0, i, j;
    for (i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
    }
    return Math.abs(a / 2);
  }

  /* ---- primitivas --------------------------------------------------- */
  function caja(x, y, z, an, al, pr, rgb, opc) {
    opc = opc || {};
    var x2 = x + an, y2 = y + al, z2 = z + pr;
    var b = opc.bisel || 0;

    if (!b) {
      var A = [x, y, z2], B = [x2, y, z2], Cc = [x2, y2, z2], D = [x, y2, z2];
      var E = [x, y, z],  F = [x2, y, z],  G = [x2, y2, z],   H = [x, y2, z];
      cara([D, Cc, G, H], opc.claro || rgb, [0, 1, 0], opc);
      cara([A, B, Cc, D], rgb, [0, 0, 1], opc);
      cara([B, F, G, Cc], rgb, [1, 0, 0], opc);
      cara([E, A, D, H], rgb, [-1, 0, 0], opc);
      if (opc.arista !== false) {
        filete([D, Cc], 1.15, 0.42);
        filete([Cc, G], 1.15, 0.26);
        filete([D, H], 1.0, 0.20);
        filete([A, D], 1.0, 0.24);
        filete([E, H], 1.0, 0.30);
      }
      return;
    }

    /* Canto redondeado de verdad.
       Las caras se meten hacia dentro y el canto se rellena con varias
       tiras cuyas normales recorren el cuarto de circunferencia. Con una
       sola tira ya se ve el brillo del canto; con tres o cuatro el ojo
       lo lee como un radio y no como un chaflan, que es la diferencia
       entre una carcasa moldeada y una caja de carton. */
    var k = opc.pasos || 3;
    var o = { extra: opc.extra, plano: true, op: opc.op };
    var claro = opc.claro || rgb;
    var th = [], j2;
    for (j2 = 0; j2 <= k; j2++) { th.push((j2 / k) * Math.PI / 2); }

    cara([[x + b, y2, z2 - b], [x2 - b, y2, z2 - b], [x2 - b, y2, z + b], [x + b, y2, z + b]],
         claro, [0, 1, 0], { extra: opc.extra, op: opc.op });
    cara([[x + b, y + b, z2], [x2 - b, y + b, z2], [x2 - b, y2 - b, z2], [x + b, y2 - b, z2]],
         rgb, [0, 0, 1], { extra: opc.extra, op: opc.op });
    cara([[x2, y + b, z2 - b], [x2, y + b, z + b], [x2, y2 - b, z + b], [x2, y2 - b, z2 - b]],
         rgb, [1, 0, 0], { extra: opc.extra, op: opc.op });
    cara([[x, y + b, z + b], [x, y + b, z2 - b], [x, y2 - b, z2 - b], [x, y2 - b, z + b]],
         rgb, [-1, 0, 0], { extra: opc.extra, op: opc.op });

    function arcoTF(t) { return [y2 - b + b * Math.sin(t), z2 - b + b * Math.cos(t)]; }
    function arcoLat(t) { return [b * Math.sin(t), y2 - b + b * Math.cos(t)]; }
    function arcoVert(t) { return [b * Math.sin(t), z2 - b + b * Math.cos(t)]; }

    for (j2 = 0; j2 < k; j2++) {
      var t0 = th[j2], t1 = th[j2 + 1];
      var nm = [(Math.sin(t0) + Math.sin(t1)) / 2, (Math.cos(t0) + Math.cos(t1)) / 2];
      var a0 = arcoTF(t0), a1 = arcoTF(t1);
      /* canto superior del frente */
      cara([[x + b, a0[0], a0[1]], [x2 - b, a0[0], a0[1]],
            [x2 - b, a1[0], a1[1]], [x + b, a1[0], a1[1]]],
           claro, [0, nm[0], nm[1]], o);
      /* canto superior derecho e izquierdo */
      var l0 = arcoLat(t0), l1 = arcoLat(t1);
      cara([[x2 - b + l0[0], l0[1], z2 - b], [x2 - b + l0[0], l0[1], z + b],
            [x2 - b + l1[0], l1[1], z + b], [x2 - b + l1[0], l1[1], z2 - b]],
           claro, [nm[0], nm[1], 0], o);
      cara([[x + b - l0[0], l0[1], z + b], [x + b - l0[0], l0[1], z2 - b],
            [x + b - l1[0], l1[1], z2 - b], [x + b - l1[0], l1[1], z + b]],
           claro, [-nm[0], nm[1], 0], o);
      /* cantos verticales del frente */
      var v0 = arcoVert(t0), v1 = arcoVert(t1);
      cara([[x2 - b + v0[0], y + b, v0[1]], [x2 - b + v0[0], y2 - b, v0[1]],
            [x2 - b + v1[0], y2 - b, v1[1]], [x2 - b + v1[0], y + b, v1[1]]],
           rgb, [nm[0], 0, nm[1]], o);
      cara([[x + b - v0[0], y2 - b, v0[1]], [x + b - v0[0], y + b, v0[1]],
            [x + b - v1[0], y + b, v1[1]], [x + b - v1[0], y2 - b, v1[1]]],
           rgb, [-nm[0], 0, nm[1]], o);
    }

    /* esquinas superiores: el triangulo esferico cerrado por los tres
       arcos, relleno plano. A este tamano no se distingue de la esfera. */
    var r3 = 1 / Math.sqrt(3), esq = [], e2 = [];
    for (j2 = 0; j2 <= k; j2++) {
      var aT = arcoTF(th[j2]);
      esq.push([x2 - b, aT[0], aT[1]]);
      e2.push([x + b, aT[0], aT[1]]);
    }
    for (j2 = k; j2 >= 0; j2--) {
      var aL = arcoLat(th[j2]);
      esq.push([x2 - b + aL[0], aL[1], z2 - b]);
      e2.push([x + b - aL[0], aL[1], z2 - b]);
    }
    cara(esq, claro, [r3, r3, r3], o);
    cara(e2, claro, [-r3, r3, r3], o);

    if (opc.arista !== false) {
      filete([[x + b, y2, z2 - b], [x2 - b, y2, z2 - b]], 0.8, 0.26);
    }
  }

  var filetes = [];
  function filete(seg, ancho, alfa) {
    filetes.push({ a: seg[0], b: seg[1], w: ancho, o: alfa, z: (hondura(seg[0]) + hondura(seg[1])) / 2 });
  }

  function cilindro(cx, cz, y0, y1, r, rgb, opc) {
    opc = opc || {};
    var n = opc.lados || 26, i, a0, a1, nx, nz;
    for (i = 0; i < n; i++) {
      a0 = (i / n) * Math.PI * 2;
      a1 = ((i + 1) / n) * Math.PI * 2;
      nx = Math.cos((a0 + a1) / 2); nz = Math.sin((a0 + a1) / 2);
      cara([[cx + r * Math.cos(a0), y0, cz + r * Math.sin(a0)],
            [cx + r * Math.cos(a1), y0, cz + r * Math.sin(a1)],
            [cx + r * Math.cos(a1), y1, cz + r * Math.sin(a1)],
            [cx + r * Math.cos(a0), y1, cz + r * Math.sin(a0)]],
           rgb, [nx, 0, nz], { extra: opc.extra, plano: true, op: opc.op });
    }
    if (opc.tapa !== false) { disco(cx, cz, y1, r, opc.claro || rgb, opc); }
  }

  /* Cuerpo de revolucion liso.
     Un cilindro hecho de tiras planas se ve facetado: cada tira tiene un
     color y se notan las bandas. Aqui se dibuja la silueta completa en
     una sola pieza y se rellena con un degradado cuyos topes salen de
     iluminar la superficie angulo por angulo. El resultado es una
     superficie continua, sin bandas ni malla. */
  var gradsExtra = [];

  function envolvente(p3) {
    var p = p3.map(proy).map(function (q, i) { return [q[0], q[1], i]; });
    p.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cruz(o, a, b) {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    }
    var abajo = [], arriba = [], i;
    for (i = 0; i < p.length; i++) {
      while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], p[i]) <= 0) { abajo.pop(); }
      abajo.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], p[i]) <= 0) { arriba.pop(); }
      arriba.push(p[i]);
    }
    abajo.pop(); arriba.pop();
    return abajo.concat(arriba);
  }

  function revolucionLisa(cx, cz, perfil, rgb, opc) {
    opc = opc || {};
    var n = 36, pts = [], i, k, a;
    for (k = 0; k < perfil.length; k++) {
      for (i = 0; i < n; i++) {
        a = (i / n) * Math.PI * 2;
        pts.push([cx + perfil[k][1] * Math.cos(a), perfil[k][0], cz + perfil[k][1] * Math.sin(a)]);
      }
    }
    var hull = envolvente(pts);
    if (hull.length < 3) { return; }

    /* topes del degradado: se ilumina la superficie angulo por angulo y
       cada angulo se coloca donde cae su generatriz en la imagen */
    var yMed = (perfil[0][0] + perfil[perfil.length - 1][0]) / 2;
    var rMed = perfil[Math.floor(perfil.length / 2)][1];
    var muestras = [], minX = 1e9, maxX = -1e9;
    for (i = 0; i <= 24; i++) {
      a = -Math.PI + (i / 24) * Math.PI * 2;
      var nn = giraNormal([Math.cos(a), 0, Math.sin(a)]);
      if (nn[2] <= 0.02) { continue; }
      var q = proy0([cx + rMed * Math.cos(a), yMed, cz + rMed * Math.sin(a)]);
      var f = factorLuz([Math.cos(a), 0, Math.sin(a)], opc.extra);
      muestras.push([q[0], q[1], f]);
      if (q[0] < minX) { minX = q[0]; }
      if (q[0] > maxX) { maxX = q[0]; }
    }
    if (muestras.length < 2) { return; }
    muestras.sort(function (u, v) { return u[0] - v[0]; });
    var topes = '', ancho = Math.max(0.01, maxX - minX);
    for (i = 0; i < muestras.length; i++) {
      topes += '<stop offset="' + (((muestras[i][0] - minX) / ancho) * 100).toFixed(1) +
               '%" stop-color="' + rgbTxt(rgb, muestras[i][2]) + '"/>';
    }
    var id = 'rv' + gradsExtra.length;
    if (opc.radial) {
      /* Una pieza redonda en los dos sentidos (la bolsa) no se resuelve
         con un degradado en una sola direccion: necesita un foco. */
      var cTop = proy0([cx, perfil[perfil.length - 2][0], cz]);
      var cBaj = proy0([cx, perfil[1][0], cz]);
      var rad = Math.max(Math.abs(maxX - minX), Math.abs(cBaj[1] - cTop[1])) * 0.78;
      gradsExtra.push('<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="' +
        (minX + (maxX - minX) * 0.34).toFixed(1) + '" cy="' +
        (cTop[1] + (cBaj[1] - cTop[1]) * 0.3).toFixed(1) + '" r="' + rad.toFixed(1) + '">' +
        '<stop offset="0%" stop-color="' + rgbTxt(rgb, factorLuz([0, 0.5, 0.86], opc.extra) * 1.22) + '"/>' +
        '<stop offset="55%" stop-color="' + rgbTxt(rgb, factorLuz([0, 0, 1], opc.extra) * 0.95) + '"/>' +
        '<stop offset="100%" stop-color="' + rgbTxt(rgb, factorLuz([-0.7, -0.4, 0.3], opc.extra) * 0.8) + '"/>' +
        '</radialGradient>');
    } else {
      gradsExtra.push('<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' +
        minX.toFixed(1) + '" y1="0" x2="' + maxX.toFixed(1) + '" y2="0">' + topes + '</linearGradient>');
    }

    var d = '';
    for (i = 0; i < hull.length; i++) {
      d += (i ? 'L' : 'M') + hull[i][0].toFixed(1) + ' ' + hull[i][1].toFixed(1);
      marcarPunto(hull[i]);
    }
    actual.push({
      z: hondura([cx, yMed, cz]) + (opc.sesgo || 0), m: modActual,
      d: d + 'Z', pts: hull, cen: [cx, yMed, cz], n: [0, 0, 1],
      rgb: rgb, plano: true, op: opc.op, relleno: 'url(#' + id + ')'
    });
  }

  function marcarPunto(q) {
    if (!caj) { caj = [q[0], q[1], q[0], q[1]]; return; }
    if (q[0] < caj[0]) { caj[0] = q[0]; }
    if (q[1] < caj[1]) { caj[1] = q[1]; }
    if (q[0] > caj[2]) { caj[2] = q[0]; }
    if (q[1] > caj[3]) { caj[3] = q[1]; }
  }

  function cilindroLiso(cx, cz, y0, y1, r, rgb, opc) {
    revolucionLisa(cx, cz, [[y0, r], [y1, r]], rgb, opc);
    if (!opc || opc.tapa !== false) { disco(cx, cz, y1, r, (opc && opc.claro) || rgb, opc); }
  }

  function disco(cx, cz, y, r, rgb, opc) {
    opc = opc || {};
    var n = opc.lados || 20, pts = [], i, a;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      pts.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]);
    }
    return cara(pts, rgb, [0, 1, 0], { extra: opc.extra, plano: opc.planoTapa, op: opc.op });
  }

  /* Cilindro tumbado sobre el eje Z (mandos, manometros, ruedas). */
  function cilindroZ(cx, cy, z0, z1, r, rgb, opc) {
    opc = opc || {};
    var n = opc.lados || 20, i, a0, a1, nx, ny;
    for (i = 0; i < n; i++) {
      a0 = (i / n) * Math.PI * 2;
      a1 = ((i + 1) / n) * Math.PI * 2;
      nx = Math.cos((a0 + a1) / 2); ny = Math.sin((a0 + a1) / 2);
      cara([[cx + r * Math.cos(a0), cy + r * Math.sin(a0), z0],
            [cx + r * Math.cos(a1), cy + r * Math.sin(a1), z0],
            [cx + r * Math.cos(a1), cy + r * Math.sin(a1), z1],
            [cx + r * Math.cos(a0), cy + r * Math.sin(a0), z1]],
           rgb, [nx, ny, 0], { extra: opc.extra, plano: true });
    }
    var pts = [], a;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z1]);
    }
    cara(pts, opc.claro || rgb, [0, 0, 1], { extra: opc.extra });
  }

  /* Rueda: un toro aplanado es excesivo; basta un cilindro tumbado
     sobre el eje X, que es como se ve una rueda de carro desde el frente. */
  function rueda(cx, cz, r, ancho) {
    var n = 14, i, a0, a1, ny, nz;
    for (i = 0; i < n; i++) {
      a0 = (i / n) * Math.PI * 2;
      a1 = ((i + 1) / n) * Math.PI * 2;
      ny = Math.sin((a0 + a1) / 2); nz = Math.cos((a0 + a1) / 2);
      cara([[cx - ancho / 2, r + r * Math.sin(a0), cz + r * Math.cos(a0)],
            [cx - ancho / 2, r + r * Math.sin(a1), cz + r * Math.cos(a1)],
            [cx + ancho / 2, r + r * Math.sin(a1), cz + r * Math.cos(a1)],
            [cx + ancho / 2, r + r * Math.sin(a0), cz + r * Math.cos(a0)]],
           C.oscuro, [0, ny, nz], { plano: true });
    }
    var pts = [], a;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      pts.push([cx + ancho / 2, r + r * Math.sin(a), cz + r * Math.cos(a)]);
    }
    cara(pts, C.grafito, [1, 0, 0], {});
  }

  /* ---- medidas ------------------------------------------------------ */
  var AN = 80, PR = 66;
  var X0 = -AN / 2, Z0 = -PR / 2;
  var FRENTE = Z0 + PR;
  var ENC = 90;                     /* altura de la encimera */
  var CAB_AN = 74, CAB_PR = 32, CAB_AL = 48;
  var cx0 = X0 + 3;
  var cz0 = Z0 + 3;
  var CF = cz0 + CAB_PR;            /* plano frontal del cabezal */

  function construir() {
    capas = []; caj = null; filetes = []; suelto = ''; sombras = []; gradsExtra = [];
    modActual = null; nClip = 0;

    /* ---------- 2. base ---------- */
    capa(function () {
      [[X0 + 12, Z0 + 11], [X0 + AN - 12, Z0 + 11],
       [X0 + 12, Z0 + PR - 11], [X0 + AN - 12, Z0 + PR - 11]].forEach(function (r) {
        rueda(r[0], r[1], 3.6, 2.6);
        caja(r[0] - 3, 7.2, r[1] - 3, 6, 3.6, 6, C.grafito, { arista: false });
      });
      /* pedal de freno en las ruedas delanteras */
      caja(X0 + 8, 7.4, FRENTE - 13, 10, 1.6, 3.4, C.rojo, { arista: false });
      caja(X0 + AN - 18, 7.4, FRENTE - 13, 10, 1.6, 3.4, C.rojo, { arista: false });
      caja(X0 + 1, 10.4, Z0 + 1, AN - 2, 5.6, PR - 2, C.zocalo, { claro: [108, 115, 121], bisel: 0.7 });
    });

    /* ---------- 3. cuerpo ---------- */
    capa(function () {
      caja(X0, 16, Z0 + 3, AN, ENC - 16, PR - 6, C.cuerpo, { claro: C.cuerpoAl, bisel: 1.5 });
      /* panel rehundido y riel lateral en el costado */
      caja(X0 - 0.6, 24, Z0 + 11, 0.6, ENC - 46, PR - 22, C.panel, { arista: false });
      caja(X0 - 0.2, 53, Z0 + 3, AN + 0.4, 0.5, PR - 6, C.metal, { arista: false, extra: 0.8 });
      caja(X0 - 2.2, ENC - 9, Z0 + 9, 2.2, 2.4, PR - 18, C.metal, { arista: false });
    });

    /* ---------- cilindros de reserva, en su bastidor lateral ----------
       Los dos sobre la misma base, uno al lado del otro, con la placa de
       respaldo detras y dos abrazaderas por cilindro que se ven pasar
       por delante. Montados al fondo del carro quedarian ocultos desde
       este angulo y no se verian sus colores de identificacion, que es
       lo que vale la pena ensenar. Se declara en SUPUESTOS.          */
    capa(function () {
      mod('suministro');
      var zc = Z0 + 24, cilx = [-57, -43.6];

      caja(-63.5, 20, zc - 9.6, 28, 74, 2.2, [84, 91, 97], { arista: false, extra: 0.9 });
      caja(-63.5, 20, zc - 9.6, 3.0, 74, 10, C.zocalo, { arista: false });
      caja(-38.5, 20, zc - 9.6, 3.0, 74, 10, C.zocalo, { arista: false });
      caja(-64.5, 22.4, zc - 11, 30, 3.6, 22, C.zocalo, { claro: [104, 111, 117] });
      caja(-39, 30, zc - 2, 10, 2.8, 2.8, C.zocalo, { arista: false });
      caja(-39, 82, zc - 2, 10, 2.8, 2.8, C.zocalo, { arista: false });

      cilx.forEach(function (cx, k) {
        revolucionLisa(cx, zc, [[26, 6.6], [80, 6.6], [84.5, 6.1], [87.5, 4.3], [89.5, 2.9]],
                       k ? C.n2o : C.o2, { extra: 0.84 });
        cilindroLiso(cx, zc, 89, 92.5, 2.8, C.metal, {});
        cilindro(cx, zc, 92.5, 96.5, 2.1, C.metal, { lados: 14 });
        caja(cx - 4.6, 91.5, zc - 1.8, 9.2, 4.6, 3.6, C.grafito, { arista: false });
        [42, 72].forEach(function (yy) {
          caja(cx - 7.4, yy, zc - 7.8, 14.8, 2.6, 15.8, C.grafito, { arista: false, extra: 1.08 });
          caja(cx - 8.2, yy - 0.5, zc + 6.6, 16.4, 3.6, 1.6, C.metal, { arista: false, extra: 1.12 });
        });
      });
    });

    /* ---------- 4. cajones ---------- */
    capa(function () {
      var cy = 21.5, i;
      for (i = 0; i < 4; i++) {
        caja(X0 + 3.5, cy, FRENTE - 3.2, AN - 7, 14.2, 1.6, C.cajon, { claro: C.cuerpoAl, bisel: 0.5 });
        /* tirador rehundido: una ranura oscura y un labio claro encima */
        caja(X0 + AN / 2 - 12, cy + 9.4, FRENTE - 1.8, 24, 2.6, 0.9, C.oscuro, { arista: false });
        caja(X0 + AN / 2 - 12, cy + 11.6, FRENTE - 1.4, 24, 1.1, 1.3, C.cuerpoAl, { arista: false });
        cy += 16.2;
      }
      /* cerradura */
      cilindroZ(X0 + AN - 9, 30, FRENTE - 1.8, FRENTE - 0.9, 1.1, C.metal, { lados: 10 });
    });

    /* ---------- 5. encimera ---------- */
    capa(function () {
      caja(X0 - 2.5, ENC - 4, Z0 + 0.5, AN + 5, 4, PR - 1, C.encimera, { claro: [233, 237, 240], bisel: 0.8 });
      /* canto de la encimera: una banda mas oscura marca el grosor */
      caja(X0 - 2.6, ENC - 4.1, Z0 + 0.4, AN + 5.2, 1.1, PR - 0.8, C.metal, { arista: false, extra: 0.85 });
    });

    /* ---------- 6. circuito del paciente, colgado al frente ----------
       Absorbedor, fuelle, valvulas unidireccionales, valvula APL y bolsa
       van todos bajo la encimera y por delante del carro. Puestos ahi no
       tapan el frente del cabezal, que es donde esta lo que identifica la
       maquina, y es ademas donde cuelga el conjunto en el equipo real. */
    capa(function () {
      var ax = X0 + 16, az = FRENTE - 1;
      mod('absorbedor');

      /* canister: el nivel de abajo ya virado, el de arriba sin usar */
      cilindroLiso(ax, az, 44, 47, 9.4, C.metal, {});
      cilindroLiso(ax, az, 47, 56, 8.6, C.calUsada, { extra: 1.05 });
      cilindroLiso(ax, az, 56, 68, 8.6, C.cal, { extra: 1.08 });
      cilindroLiso(ax, az, 68, 70.5, 9.4, C.metal, {});

      mod('ventilador');
      /* fuelle sobre el absorbedor, hasta justo debajo de la encimera */
      cilindroLiso(ax, az, 70.5, 72.5, 7.6, C.grafito, {});
      cilindroLiso(ax, az, 72.5, 85.5, 6.9, C.vidrio, { extra: 1.18, op: 0.9, tapa: false });
      var i;
      for (i = 0; i < 5; i++) {
        cilindro(ax, az, 74 + i * 2.2, 75.3 + i * 2.2, 5.4 - (i % 2) * 0.45,
                 C.panel, { lados: 16, extra: 0.96, tapa: false });
      }
      cilindroLiso(ax, az, 85.5, 87.5, 7.6, C.metal, {});

      mod('circuito');
      /* valvulas unidireccionales, a la derecha del canister */
      caja(ax + 10, 68, az - 7, 17, 6, 9, C.panel, { claro: C.cuerpoAl });
      [14, 22].forEach(function (dx) {
        cilindro(ax + dx, az - 2.5, 74, 77.5, 3.0, C.vidrio, { lados: 14, extra: 1.16, op: 0.92 });
        cilindro(ax + dx, az - 2.5, 77.5, 78.4, 3.3, C.metal, { lados: 14 });
      });

      /* Brazo de la bolsa y, justo encima, la valvula APL.
         Va ahi porque esa es la via de la ventilacion manual: lo que no
         cabe en la bolsa sale por la APL. En otro sitio no se entiende
         para que sirve. */
      var px2 = ax - 13, pz2 = az - 3;
      caja(px2, 70.5, pz2 - 1.3, 15, 2.6, 2.6, C.metal, { arista: false });
      cilindro(px2, pz2, 60, 70.5, 2.2, C.metal, { lados: 14 });
      bolsa(px2, pz2, 41, 60, 7.6);

      cilindro(px2, pz2, 73.1, 76, 3.0, C.metal, { lados: 16 });
      cilindro(px2, pz2, 76, 78.6, 4.6, C.panel, { lados: 18 });
      cilindro(px2, pz2, 78.6, 82.6, 4.0, C.grafito, { lados: 18, extra: 1.14 });
      estrias(px2, pz2, 78.6, 82.6, 4.2, 16);
      disco(px2, pz2, 82.6, 4.0, C.grafito, { extra: 1.24 });
      caja(px2 - 0.45, 82.6, pz2 + 1.4, 0.9, 0.25, 2.4, C.rojo, { arista: false });
      var k2, an2;
      for (k2 = 0; k2 < 9; k2++) {
        an2 = -2.2 + k2 * 0.42;
        caja(px2 + Math.cos(an2) * 4.2 - 0.17, 78.5, pz2 + Math.sin(an2) * 4.2 - 0.17,
             0.34, 0.22, 0.34, C.oscuro, { arista: false });
      }
    });

    /* ---------- 8. cabezal ---------- */
    capa(function () {
      caja(cx0, ENC, cz0, CAB_AN, CAB_AL, CAB_PR, C.cuerpo, { claro: C.cuerpoAl, bisel: 1.4 });
    });

    /* ---------- 9. frente del cabezal ----------
       Va en varias capas: lo que esta montado sobre una cara tiene que
       dibujarse despues de esa cara. Una sola capa no basta, porque una
       cara grande abarca mucho fondo y su profundidad media puede quedar
       por delante de las piezas pequenas que lleva encima. Asi
       desaparecia el tubo del N2O: el panel oscuro lo tapaba. */
    capa(function () {
      mod('flujometros');
      var fx = cx0 + 3.5;
      caja(fx, ENC + 4, CF - 0.3, 25, 38, 1.8, C.oscuro, { arista: false });
      mod('vaporizador');
      caja(cx0 + 29, ENC + 2, CF - 11, 15, 2.5, 12, C.grafito, { arista: false });
      caja(cx0 + 45, ENC + 2, CF - 11, 15, 2.5, 12, C.grafito, { arista: false });
    });

    capa(function () {
      mod('flujometros');
      var i;
      var fx = cx0 + 3.5;
      /* escala impresa: trazos finos al fondo del panel */
      for (i = 0; i < 16; i++) {
        caja(fx + 2.2, ENC + 11 + i * 1.6, CF + 1.5, (i % 5 === 0 ? 3.2 : 1.8), 0.28, 0.1,
             C.blanco, { arista: false, extra: 1.1 });
        caja(fx + 9.2, ENC + 11 + i * 1.6, CF + 1.5, (i % 5 === 0 ? 3.2 : 1.8), 0.28, 0.1,
             C.blanco, { arista: false, extra: 1.1 });
        caja(fx + 16.2, ENC + 11 + i * 1.6, CF + 1.5, (i % 5 === 0 ? 3.2 : 1.8), 0.28, 0.1,
             C.blanco, { arista: false, extra: 1.1 });
      }
      var gx = [fx + 5.6, fx + 12.6, fx + 19.6];
      var gas = [C.o2, C.aire, C.n2o];
      var flot = [20, 12, 5];
      for (i = 0; i < 3; i++) {
        cilindro(gx[i], CF + 2.2, ENC + 9, ENC + 36, 1.9, C.vidrio,
                 { lados: 10, extra: 1.18, op: 0.88, tapa: false });
        /* flotador */
        cilindro(gx[i], CF + 2.2, ENC + 9 + flot[i], ENC + 10.4 + flot[i], 1.65, C.metal,
                 { lados: 10, extra: 1.1 });
        cilindro(gx[i], CF + 2.2, ENC + 36, ENC + 38.4, 2.3, gas[i], { lados: 10 });
      }
      /* perillas: la de O2 mas grande y estriada, como exige la norma */
      perilla(gx[0], CF + 3.4, ENC + 1.6, 3.4, C.o2, true);
      perilla(gx[1], CF + 3.0, ENC + 2.2, 2.4, C.aire, false);
      perilla(gx[2], CF + 3.0, ENC + 2.2, 2.4, C.n2o, false);

      mod('suministro');
      /* --- manometros de red y de cilindro --- */
      [[cx0 + 31.5, ENC + 36], [cx0 + 41, ENC + 36]].forEach(function (m, k) {
        cilindroZ(m[0], m[1], CF - 1.2, CF + 1.4, 4.2, C.metal, { lados: 18 });
        var cara0 = cilindroZcara(m[0], m[1], CF + 1.45, 3.4, C.blanco);
        crudo(cara0);
        aguja(m[0], m[1], CF + 1.6, 2.6, k ? -40 : 35);
      });

      mod('vaporizador');
      /* --- dos vaporizadores --- */
      vaporizador(cx0 + 29, CF - 11, C.sevo, 0.62);
      vaporizador(cx0 + 45, CF - 11, C.iso, 0.18);

      mod('ventilador');
      /* --- pantalla del ventilador --- */
      var px = cx0 + 60;
      caja(px, ENC + 8, CF - 2.6, 13.5, 30, 3, C.grafito, { claro: [80, 86, 92], bisel: 0.6 });
      caja(px + 1.1, ENC + 14, CF + 0.3, 11.3, 15.5, 0.6, C.pantalla, { arista: false });
      for (i = 0; i < 4; i++) {
        caja(px + 1.2 + i * 2.9, ENC + 10.4, CF + 0.4, 2.1, 1.9, 0.5, C.metal, { arista: false });
      }
      cilindroZ(px + 6.7, ENC + 32, CF - 0.2, CF + 2.2, 2.3, C.metal, { lados: 14 });

      mod('flujometros');
      /* --- purga de O2: boton grande rehundido --- */
      cilindroZ(cx0 + 66, ENC + 3.4, CF - 1.4, CF + 0.4, 3.4, C.grafito, { lados: 22 });
      cilindroZ(cx0 + 66, ENC + 3.4, CF + 0.4, CF + 1.8, 2.6, C.o2, { lados: 22, extra: 1.12 });
    });

    /* ---------- evacuacion de gases ---------- */
    capa(function () {
      mod('evacuacion');
      /* Sistema de evacuacion: bloque receptor colgado del carro, tubo
         reservorio con su flotador de caudal y banda amarilla de aviso.
         Lo importante es que se vea de donde viene el gas: la manguera
         de transferencia baja desde la APL y el escape del ventilador.
         Sin esa manguera la pieza parecia un bote pegado al mueble. */
      var ex = X0 + 56, ez = FRENTE - 5;
      caja(ex - 5, 66, ez - 5, 11, 9, 7.5, C.panel, { claro: C.cuerpoAl, bisel: 0.6 });
      caja(ex - 5.2, 72.6, ez - 4.6, 11.4, 2.0, 7.8, [214, 178, 60], { arista: false });
      cilindroLiso(ex, ez - 1.2, 63, 66.5, 4.6, C.metal, {});
      cilindroLiso(ex, ez - 1.2, 44, 63, 3.9, C.vidrio, { extra: 1.14, op: 0.9, tapa: false });
      /* flotador indicador de caudal */
      cilindroLiso(ex, ez - 1.2, 52.5, 54.2, 3.1, C.metal, { extra: 1.1 });
      cilindroLiso(ex, ez - 1.2, 41, 44, 4.6, C.metal, {});
      /* boca de salida a la toma de pared */
      cilindro(ex + 4.4, ez - 1.2, 68, 70, 1.5, C.metal, { lados: 12 });
    });
    mod(null);

    /* ---------- rotulos y sombras de contacto ---------- */
    capa(function () { });   /* capa vacia: los rotulos van en 'suelto' */

    /* sombras donde una pieza vuela sobre otra */
    crudo(sombraBajo(X0 - 2.5, ENC - 4, Z0 + 0.5, AN + 5, 9, PR - 1, 0.34));
    crudo(sombraBajo(X0 + 1, 16, Z0 + 1, AN - 2, 5, PR - 2, 0.30));
    crudo(sombraBajo(cx0, ENC, cz0, CAB_AN, 3.4, CAB_PR, 0.26));

    /* rotulos del banco de flujometros */
    var fx = cx0 + 3.5;
    ['O2', 'Aire', 'N2O'].forEach(function (t, k) {
      crudo(textoEnPlano([fx + 5.6 + k * 7, ENC + 39.6, CF + 1.9], [1, 0, 0], [0, -1, 0],
                         t, 2.1, '#e7eaec', 'middle', true));
    });
    crudo(textoEnPlano([fx + 0.8, ENC + 6.4, CF + 1.9], [1, 0, 0], [0, -1, 0],
                       'L/min', 1.7, '#9aa3a9'));

    /* rotulos de los vaporizadores */
    [[cx0 + 29, 'SEVOFLURANO'], [cx0 + 45, 'ISOFLURANO']].forEach(function (v) {
      crudo(textoEnPlano([v[0] + 7.5, ENC + 20.4, CF + 1.3], [1, 0, 0], [0, -1, 0],
                         v[1], 1.45, '#3c4248', 'middle', true));
      crudo(textoEnPlano([v[0] + 10.5, ENC + 7.6, CF + 1.3], [1, 0, 0], [0, -1, 0],
                         'vol %', 1.5, '#767e85', 'middle'));
    });

    /* pantalla del ventilador: cifras */
    var px = cx0 + 60;
    crudo(textoEnPlano([px + 1.9, ENC + 31.6, CF + 0.9], [1, 0, 0], [0, -1, 0],
                       'VT 500', 2.0, '#cfd6da', 'start', true));

    /* monitor: rotulos y cifras */
    var mz = cz0 + 8.9, mx0 = cx0 + 15.8;
    crudo(textoEnPlano([mx0 + 1.2, 176.4, mz], [1, 0, 0], [0, -1, 0], 'Paw', 2.2, '#9fb0bd', 'start', true));
    crudo(textoEnPlano([mx0 + 1.2, 165.4, mz], [1, 0, 0], [0, -1, 0], 'CO2', 2.2, '#e8e6e3', 'start', true));
    crudo(textoEnPlano([mx0 + 36.6, 176.6, mz], [1, 0, 0], [0, -1, 0], '18', 5.0, '#9fb0bd', 'end', true));
    crudo(textoEnPlano([mx0 + 36.6, 165.6, mz], [1, 0, 0], [0, -1, 0], '35', 5.0, '#e8e6e3', 'end', true));

    crudo(textoEnPlano([cx0 + 66, ENC + 0.9, CF + 1.2], [1, 0, 0], [0, -1, 0],
                       'PURGA O2', 1.35, '#5d656c', 'middle', true));

    /* rotulos de los cilindros */
    /* El rotulo del cilindro se pone sobre su generatriz frontal y con
       el eje de lectura girado como la camara, para que se lea de frente
       y no de canto. */
    var haciaCam = [Math.sin(GIRO), 0, Math.cos(GIRO)];
    var derCam = [Math.cos(GIRO), 0, -Math.sin(GIRO)];
    [[-57, 'O2'], [-43.6, 'N2O']].forEach(function (g) {
      crudo(textoEnPlano([g[0] + haciaCam[0] * 6.75, 56, Z0 + 24 + haciaCam[2] * 6.75],
                         derCam, [0, -1, 0], g[1], 3.4, '#f4f7f9', 'middle', true));
    });
    crudo(textoEnPlano([X0 + 16 - 13, 87.5, FRENTE - 4 + 4.4], [1, 0, 0], [0, -1, 0],
                       'APL', 1.9, '#9aa2a8', 'middle', true));

    /* ---------- 10. brazo y monitor ---------- */
    capa(function () {
      mod('monitor');
      cilindro(cx0 + 67, cz0 + 8, ENC + CAB_AL, 152, 1.7, C.metal, { lados: 10 });
      caja(cx0 + 28, 150.5, cz0 + 6.8, 40, 2.6, 2.6, C.metal, { arista: false });
      cilindro(cx0 + 30, cz0 + 8, 148, 153, 1.5, C.metal, { lados: 10 });

      caja(cx0 + 13, 152, cz0 + 3.6, 46, 31, 4.6, C.grafito, { claro: [84, 90, 96], bisel: 0.9 });
      caja(cx0 + 14.6, 154.6, cz0 + 8.3, 39, 25.6, 0.6, C.pantalla, { arista: false });
      /* botones y mando del monitor */
      var i;
      for (i = 0; i < 4; i++) {
        caja(cx0 + 54.4, 156 + i * 5.6, cz0 + 8.3, 3, 3.4, 0.5, [100, 106, 112], { arista: false });
      }
      cilindroZ(cx0 + 56, 181, cz0 + 8.2, cz0 + 10.4, 2.4, C.metal, { lados: 14 });
    });
  }

  /* ---- piezas compuestas -------------------------------------------- */

  /* Bolsa reservorio: dos troncos de cono pegados, que es la forma que
     tiene colgada y llena a medias. */
  function bolsa(cx, cz, y0, y1, r) {
    /* Perfil de la bolsa: estrecha en el cuello, llena en el tercio
       bajo. Se dibuja como cuerpo de revolucion liso para que no salga
       facetada, que en una pieza de caucho canta mucho. */
    var perfil = [0.10, 0.50, 0.84, 1.00, 0.98, 0.82, 0.54, 0.22], p = [], k;
    for (k = 0; k < perfil.length; k++) {
      p.push([y0 + (y1 - y0) * (k / (perfil.length - 1)), r * perfil[k]]);
    }
    revolucionLisa(cx, cz, p, C.bolsa, { extra: 1.0, radial: true });
  }

  /* Perilla de caudal. La de oxigeno va mas grande y estriada: es un
     requisito de seguridad, no un adorno. */
  function perilla(cx, cz, y, r, rgb, estriada) {
    cilindro(cx, cz, y, y + 3.2, r, rgb, { lados: 16, extra: 0.92 });
    if (estriada) { estrias(cx, cz, y, y + 3.2, r + 0.25, 14); }
    disco(cx, cz, y + 3.2, r * 0.6, rgb, { extra: 1.12 });
  }

  function estrias(cx, cz, y0, y1, r, n) {
    var i, a;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      if (Math.sin(a) < -0.1) { continue; }   /* las de atras no se ven */
      cara([[cx + r * Math.cos(a) - 0.22 * Math.sin(a), y0, cz + r * Math.sin(a) + 0.22 * Math.cos(a)],
            [cx + r * Math.cos(a) + 0.22 * Math.sin(a), y0, cz + r * Math.sin(a) - 0.22 * Math.cos(a)],
            [cx + r * Math.cos(a) + 0.22 * Math.sin(a), y1, cz + r * Math.sin(a) - 0.22 * Math.cos(a)],
            [cx + r * Math.cos(a) - 0.22 * Math.sin(a), y1, cz + r * Math.sin(a) + 0.22 * Math.cos(a)]],
           C.oscuro, [Math.cos(a), 0, Math.sin(a)], { extra: 1.0, plano: true });
    }
  }

  /* Vaporizador: cuerpo, dial graduado con su indice, boca de llenado y
     barra de bloqueo entre los dos. */
  function vaporizador(x, z, rgb, giroDial) {
    var an = 15, al = 24, pr = 12;
    caja(x, ENC + 4.5, z, an, al, pr, [240, 242, 243], { claro: [250, 251, 252], bisel: 0.8 });
    /* franja de color del agente */
    caja(x, ENC + 22, z + pr - 0.1, an, 3.4, 0.4, rgb, { arista: false });
    /* dial: anillo estriado y marca de posicion */
    var dx = x + an / 2, dz = z + pr / 2;
    cilindro(dx, dz, ENC + 28.5, ENC + 32.5, 6.4, [228, 231, 233], { lados: 20, extra: 1.0 });
    estrias(dx, dz, ENC + 28.5, ENC + 32.5, 6.6, 20);
    disco(dx, dz, ENC + 32.5, 6.4, [236, 239, 241], { extra: 1.06 });
    var i, a;
    for (i = 0; i < 9; i++) {
      a = (-0.6 + i * 0.26);
      caja(dx + Math.cos(a) * 4.6 - 0.2, ENC + 32.5, dz + Math.sin(a) * 4.6 - 0.2,
           0.4, 0.2, 0.4, C.oscuro, { arista: false });
    }
    a = -0.6 + giroDial * 2.1;
    caja(dx + Math.cos(a) * 3.2 - 0.35, ENC + 32.6, dz + Math.sin(a) * 3.2 - 0.35,
         0.7, 0.25, 0.7, C.rojo, { arista: false });
    /* boca de llenado */
    cilindroZ(x + 3.4, ENC + 10, z + pr - 0.4, z + pr + 1.4, 2.1, C.metal, { lados: 14 });
  }

  /* Esfera de manometro dibujada como disco de frente al observador. */
  function cilindroZcara(cx, cy, z, r, rgb) {
    var n = 20, pts = [], i, a;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2;
      pts.push(proy([cx + r * Math.cos(a), cy + r * Math.sin(a), z]));
    }
    var d = '';
    for (i = 0; i < pts.length; i++) {
      d += (i ? 'L' : 'M') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
    }
    return '<path d="' + d + 'Z" fill="' + rgbTxt(rgb, factorLuz([0, 0, 1], 1.06)) + '"/>';
  }

  function aguja(cx, cy, z, largo, grados) {
    var a = grados * Math.PI / 180;
    var p0 = proy([cx, cy, z]);
    var p1 = proy([cx + Math.cos(a) * largo, cy + Math.sin(a) * largo, z]);
    crudo('<path d="M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + 'L' +
          p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) +
          '" stroke="#2a2e33" stroke-width="1.5" stroke-linecap="round"/>' +
          '<circle cx="' + p0[0].toFixed(1) + '" cy="' + p0[1].toFixed(1) +
          '" r="1.5" fill="#2a2e33"/>');
  }

  /* ---- texto pegado a una superficie --------------------------------
     Un equipo real esta lleno de rotulos, y su ausencia es buena parte
     de lo que hace que un dibujo parezca un juguete. El texto se situa
     dando el origen y dos vectores de un centimetro sobre el plano: la
     matriz resultante lo inclina con la superficie en vez de dejarlo
     plano sobre la imagen. */
  function textoEnPlano(O, U, V, txt, cm, color, anclaje, pesado) {
    var o = proy0(O);
    var u = proy0([O[0] + U[0], O[1] + U[1], O[2] + U[2]]);
    var v = proy0([O[0] + V[0], O[1] + V[1], O[2] + V[2]]);
    return '<text transform="matrix(' +
      (u[0] - o[0]).toFixed(3) + ',' + (u[1] - o[1]).toFixed(3) + ',' +
      (v[0] - o[0]).toFixed(3) + ',' + (v[1] - o[1]).toFixed(3) + ',' +
      o[0].toFixed(2) + ',' + o[1].toFixed(2) + ')" ' +
      'font-size="' + cm + '" font-family="Segoe UI,Roboto,Helvetica,Arial,sans-serif" ' +
      'font-weight="' + (pesado ? 600 : 400) + '" letter-spacing="' + (cm * 0.06).toFixed(2) + '" ' +
      'text-anchor="' + (anclaje || 'start') + '" fill="' + color + '">' + txt + '</text>';
  }

  /* Sombra de contacto bajo un vuelo: una banda con degradado pegada a
     la cara de abajo. Sin esto las piezas se ven posadas, no apoyadas. */
  function sombraBajo(x, y, z, an, alto, pr, fuerza) {
    var q = [proy0([x, y, z + pr]), proy0([x + an, y, z + pr]),
             proy0([x + an, y - alto, z + pr]), proy0([x, y - alto, z + pr])];
    var d = 'M' + q[0][0].toFixed(1) + ' ' + q[0][1].toFixed(1);
    var i;
    for (i = 1; i < 4; i++) { d += 'L' + q[i][0].toFixed(1) + ' ' + q[i][1].toFixed(1); }
    var id = 'so' + (sombras.length);
    sombras.push('<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' +
      ((q[0][0] + q[1][0]) / 2).toFixed(1) + '" y1="' + ((q[0][1] + q[1][1]) / 2).toFixed(1) +
      '" x2="' + ((q[3][0] + q[2][0]) / 2).toFixed(1) + '" y2="' + ((q[3][1] + q[2][1]) / 2).toFixed(1) +
      '"><stop offset="0%" stop-color="rgba(16,20,24,' + fuerza + ')"/>' +
      '<stop offset="100%" stop-color="rgba(16,20,24,0)"/></linearGradient>');
    return '<path d="' + d + 'Z" fill="url(#' + id + ')"/>';
  }
  var sombras = [];

  /* ---- trazos dentro de una pantalla ---------------------------------
     Las curvas se desplazan, como en un monitor de verdad. El truco es
     dibujar dos pantallas de onda y correrlas exactamente una pantalla:
     si la onda lleva un numero entero de ciclos por pantalla, el salto
     al reiniciar no se ve. El desplazamiento se calcula en la direccion
     que tiene el eje de la pantalla ya proyectado, para que la traza
     corra sobre el cristal y no sobre la imagen.                       */
  function ondaPaw(u) {
    var c = u - Math.floor(u);
    if (c < 0.12) { return c / 0.12 * 0.80; }
    if (c < 0.44) { return 0.80; }
    if (c < 0.58) { return 0.80 * (1 - (c - 0.44) / 0.14); }
    return 0.02;
  }
  function ondaCo2(u) {
    var c = u - Math.floor(u);
    if (c < 0.10) { return c / 0.10 * 0.60; }
    if (c < 0.54) { return 0.60 + (c - 0.10) * 0.32; }
    if (c < 0.62) { return 0.74 * (1 - (c - 0.54) / 0.08); }
    return 0.03;
  }

  var nClip = 0;
  function pantallaConTraza(x0, y0, an, al, z, trazas, dur) {
    /* recorte: el rectangulo de la pantalla, ya proyectado */
    var e = [proy0([x0, y0, z]), proy0([x0 + an, y0, z]),
             proy0([x0 + an, y0 + al, z]), proy0([x0, y0 + al, z])];
    var dRec = '', i;
    for (i = 0; i < 4; i++) { dRec += (i ? 'L' : 'M') + e[i][0].toFixed(1) + ' ' + e[i][1].toFixed(1); }
    var idc = 'clp' + (nClip++);
    gradsExtra.push('<clipPath id="' + idc + '"><path d="' + dRec + 'Z"/></clipPath>');

    var o = proy0([x0, y0, z]), f = proy0([x0 + an, y0, z]);
    var dx = (f[0] - o[0]).toFixed(2), dy = (f[1] - o[1]).toFixed(2);

    var cuerpo = '';
    trazas.forEach(function (t) {
      var d = '', k, u, q;
      for (k = 0; k <= 140; k++) {
        u = k / 140;                       /* 0..1 sobre dos pantallas */
        q = proy0([x0 + 2 * an * u, t.y + t.al * t.onda(u * 2 * t.ciclos), z]);
        d += (k ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      }
      cuerpo += '<path d="' + d + '" fill="none" stroke="' + t.color + '" stroke-width="' +
                t.grosor + '" stroke-linejoin="round" stroke-linecap="round" opacity=".92"/>';
    });

    return '<g clip-path="url(#' + idc + ')"><g class="maq-traza" style="--dx:' +
           (-dx) + 'px;--dy:' + (-dy) + 'px;--dur:' + dur + 's">' + cuerpo + '</g></g>';
  }

  /* ---- mangueras: se trazan ya proyectadas, porque son organicas ----- */
  function manguera(p0, p1, curva, ancho, color) {
    var a = proy(p0), b = proy(p1);
    var d = 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) +
            ' Q' + ((a[0] + b[0]) / 2).toFixed(1) + ' ' + ((a[1] + b[1]) / 2 + curva).toFixed(1) +
            ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + ancho +
           '" stroke-linecap="round"/>' +
           '<path d="' + d + '" fill="none" stroke="rgba(28,32,36,.22)" stroke-width="' +
           (ancho - 1.3) + '" stroke-dasharray="1.5 3.2" stroke-linecap="butt"/>';
  }

  /* ---- salida -------------------------------------------------------- */
  function markup(idSvg, opc) {
    opc = opc || {};
    camaraDesde(opc.giro === undefined ? 20.5 : opc.giro,
                opc.picado === undefined ? 6.5 : opc.picado);
    var zonas = !!opc.zonas;
    construir();

    var defs = '', s = '', nid = 0, i, j;

    for (i = 0; i < capas.length; i++) {
      capas[i].sort(function (a, b) { return a.z - b.z; });
      for (j = 0; j < capas[i].length; j++) {
        var f = capas[i][j];
        var base = factorLuz(f.n, f.extra);
        var relleno = f.relleno;
        if (relleno) { /* ya lo trae calculado */ } else

        if (!f.plano && area(f.pts) > 950) {
          /* Degradado propio, en la direccion de la vertical de la cara.
             Una cara grande con color plano se lee como papel recortado;
             con un degradado leve se lee como superficie. */
          var up = Math.abs(f.n[1]) > 0.5 ? [0, 0, 1] : [0, 1, 0];
          var a0 = proy0(f.cen);
          var a1 = proy0([f.cen[0] + up[0] * 9, f.cen[1] + up[1] * 9, f.cen[2] + up[2] * 9]);
          var vx = a1[0] - a0[0], vy = a1[1] - a0[1];
          var m = Math.sqrt(vx * vx + vy * vy) || 1;
          vx /= m; vy /= m;
          /* extremos de la cara medidos sobre esa direccion */
          var lo = 1e9, hi = -1e9, k, t;
          for (k = 0; k < f.pts.length; k++) {
            t = f.pts[k][0] * vx + f.pts[k][1] * vy;
            if (t < lo) { lo = t; }
            if (t > hi) { hi = t; }
          }
          var t0 = a0[0] * vx + a0[1] * vy;
          var alto = [a0[0] + vx * (hi - t0), a0[1] + vy * (hi - t0)];
          var bajo = [a0[0] + vx * (lo - t0), a0[1] + vy * (lo - t0)];
          var id = 'pg' + (nid++);
          defs += '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" ' +
                  'x1="' + alto[0].toFixed(1) + '" y1="' + alto[1].toFixed(1) +
                  '" x2="' + bajo[0].toFixed(1) + '" y2="' + bajo[1].toFixed(1) + '">' +
                  '<stop offset="0%" stop-color="' + rgbTxt(f.rgb, base * 1.16) + '"/>' +
                  '<stop offset="100%" stop-color="' + rgbTxt(f.rgb, base * 0.82) + '"/>' +
                  '</linearGradient>';
          relleno = 'url(#' + id + ')';
        } else {
          relleno = rgbTxt(f.rgb, base);
        }

        /* El contorno solo va en caras planas. En una superficie curva,
           que se aproxima con muchas tiras, dibujaria la malla y la
           pieza se veria como una pina en vez de como un cilindro. */
        s += '<path d="' + f.d + '" fill="' + relleno + '"' +
             (f.op !== undefined ? ' opacity="' + f.op + '"' : '') +
             (f.plano ? '' : ' stroke="rgba(26,31,36,.11)" stroke-width="0.4"') +
             (zonas && f.m ? ' data-mod="' + f.m + '" class="mp-pieza"' : '') + '/>';
      }
    }

    /* filetes de luz en los cantos superiores */
    var fil = '';
    filetes.sort(function (a, b) { return a.z - b.z; });
    for (i = 0; i < filetes.length; i++) {
      var q0 = proy0(filetes[i].a), q1 = proy0(filetes[i].b);
      fil += '<path d="M' + q0[0].toFixed(1) + ' ' + q0[1].toFixed(1) + 'L' +
             q1[0].toFixed(1) + ' ' + q1[1].toFixed(1) + '" stroke="rgba(255,255,255,' +
             filetes[i].o + ')" stroke-width="' + filetes[i].w + '" stroke-linecap="round"/>';
    }

    /* pantallas encendidas, con la traza corriendo.
       Dos filas, como en un monitor: rotulo a la izquierda, traza en el
       medio y la cifra grande a la derecha. */
    var pm = cz0 + 8.3 + 0.35;
    var pv = CF + 0.3 + 0.35;
    var mx = cx0 + 15.8;
    var trazos =
      pantallaConTraza(mx + 6.4, 167.6, 21, 10.4, pm, [
        { y: 168.6, al: 8.4, onda: ondaPaw, ciclos: 3, color: '#9fb0bd', grosor: 1.4 }
      ], 6) +
      pantallaConTraza(mx + 6.4, 156.6, 21, 10.4, pm, [
        { y: 157.4, al: 8.4, onda: ondaCo2, ciclos: 2, color: '#e8e6e3', grosor: 1.4 }
      ], 7) +
      pantallaConTraza(cx0 + 61.6, ENC + 14.5, 10.8, 10, pv, [
        { y: ENC + 15.5, al: 7.6, onda: ondaPaw, ciclos: 2, color: '#9fb0bd', grosor: 1.1 }
      ], 5);

    /* mangueras del circuito */
    var mang =
      manguera([X0 + 30, 77, FRENTE - 3.5], [X0 + 47, 58, FRENTE + 11], 20, 7.2, '#b4bcc1') +
      manguera([X0 + 38, 77, FRENTE - 3.5], [X0 + 49, 53, FRENTE + 14], 24, 7.2, '#ced4d8');
    /* manguera de transferencia: de la APL al receptor de evacuacion */
    mang += manguera([X0 + 4, 85.5, FRENTE - 6], [X0 + 56, 72.5, FRENTE - 6], -30, 4.6, '#878f95');

    var yA = proy([X0 + 48, 55, FRENTE + 12]);
    var yB = proy([X0 + 55, 50, FRENTE + 17]);
    mang += '<path d="M' + yA[0].toFixed(1) + ' ' + yA[1].toFixed(1) + 'L' + yB[0].toFixed(1) +
            ' ' + yB[1].toFixed(1) + '" stroke="#949ca2" stroke-width="9.5" stroke-linecap="round"/>' +
            '<circle cx="' + yB[0].toFixed(1) + '" cy="' + yB[1].toFixed(1) + '" r="5.2" fill="#767e84"/>';

    /* sombra de contacto */
    var suelo = proy0([0, 0, 4]);
    var anchoS = Math.abs(proy0([46, 0, 4])[0] - suelo[0]);

    var aire = 28;
    var vx2 = (caj[0] - aire).toFixed(0), vy2 = (caj[1] - aire).toFixed(0);
    var vw2 = (caj[2] - caj[0] + aire * 2).toFixed(0), vh2 = (caj[3] - caj[1] + aire * 2).toFixed(0);

    return '' +
'<svg id="' + (idSvg || 'svgPortada') + '" class="maq-portada" ' +
     'viewBox="' + vx2 + ' ' + vy2 + ' ' + vw2 + ' ' + vh2 + '" ' +
     'preserveAspectRatio="xMidYMid meet" role="img" ' +
     'aria-label="Maquina de anestesia generica vista en perspectiva">' +
  '<style>@keyframes maqCorre{from{transform:translate(0,0)}to{transform:translate(var(--dx),var(--dy))}}.maq-traza{animation:maqCorre var(--dur,6s) linear infinite}@media (prefers-reduced-motion:reduce){.maq-traza{animation:none}}</style>' +
  '<defs>' +
    '<radialGradient id="pHalo" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="rgba(255,255,255,.075)"/>' +
      '<stop offset="100%" stop-color="rgba(255,255,255,0)"/>' +
    '</radialGradient>' +
    '<radialGradient id="pSombra" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="rgba(0,0,0,.58)"/>' +
      '<stop offset="46%" stop-color="rgba(0,0,0,.30)"/>' +
      '<stop offset="100%" stop-color="rgba(0,0,0,0)"/>' +
    '</radialGradient>' +
    defs + sombras.join('') + gradsExtra.join('') +
  '</defs>' +
  '<ellipse cx="' + ((caj[0] + caj[2]) / 2).toFixed(0) + '" cy="' + ((caj[1] + caj[3]) / 2).toFixed(0) +
          '" rx="' + ((caj[2] - caj[0]) * 0.62).toFixed(0) + '" ry="' +
          ((caj[3] - caj[1]) * 0.58).toFixed(0) + '" fill="url(#pHalo)"/>' +
  '<ellipse cx="' + suelo[0].toFixed(0) + '" cy="' + (suelo[1] + 1).toFixed(0) + '" ' +
          'rx="' + (anchoS * 1.32).toFixed(0) + '" ry="' + (anchoS * 0.36).toFixed(0) +
          '" fill="url(#pSombra)"/>' +
  s + fil + suelto + trazos + mang +
'</svg>';
  }

  /* ---- modo interactivo: las piezas se pueden senalar y pulsar ------
     Cada cara lleva el identificador de su modulo, el mismo que usa la
     vista de frente, asi que el resto de la aplicacion no se entera de
     con cual de las dos esta trabajando. */
  var ultimoSobre = null;

  function piezasDe(svg, id) { return svg.querySelectorAll('.mp-pieza[data-mod="' + id + '"]'); }

  function resaltar(svg, id) {
    if (id === ultimoSobre) { return; }
    var i, ps;
    if (ultimoSobre) {
      ps = piezasDe(svg, ultimoSobre);
      for (i = 0; i < ps.length; i++) { ps[i].classList.remove('mp-sobre'); }
    }
    if (id) {
      ps = piezasDe(svg, id);
      for (i = 0; i < ps.length; i++) { ps[i].classList.add('mp-sobre'); }
    }
    ultimoSobre = id;
  }

  function marcar(svg, id, descartadas) {
    if (!svg) { return; }
    var ps = svg.querySelectorAll('.mp-pieza'), i, m;
    for (i = 0; i < ps.length; i++) {
      m = ps[i].getAttribute('data-mod');
      ps[i].classList.toggle('mp-activo', !!id && m === id);
      ps[i].classList.toggle('mp-fuera',
        !!descartadas && descartadas.length > 0 && descartadas.indexOf(m) >= 0);
    }
  }

  function preparar(svg, alElegir, alPasar) {
    if (!svg || svg.getAttribute('data-listo')) { return; }
    svg.setAttribute('data-listo', '1');
    ultimoSobre = null;

    function idDe(t) {
      return (t && t.getAttribute) ? t.getAttribute('data-mod') : null;
    }
    svg.addEventListener('mousemove', function (e) {
      var id = idDe(e.target);
      resaltar(svg, id);
      /* el resto de la aplicacion espera la zona, no su identificador */
      if (alPasar) { alPasar(id ? SIM.maquinaVista.zona(id) : null); }
    });
    svg.addEventListener('mouseleave', function () {
      resaltar(svg, null);
      if (alPasar) { alPasar(null); }
    });
    svg.addEventListener('click', function (e) {
      var id = idDe(e.target);
      if (id && alElegir) { alElegir(id); }
    });
  }

  return { markup: markup, preparar: preparar, marcar: marcar };
})();
