/* =====================================================================
   monitor.js  -  Curvas compactas de presion de via aerea y capnografia
   ---------------------------------------------------------------------
   Dos tarjetas pequenas, una al lado de la otra. La idea no es llenar la
   pantalla de trazo sino que se vea de un golpe si el nivel se salio del
   rango: por eso cada curva lleva una banda sombreada con el rango normal
   del perfil, una escala fija y el valor actual en grande.
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.monitor = (function () {
  'use strict';

  function medidas(canvas) {
    var r = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(140, Math.floor(r.width || canvas.clientWidth || 200));
    var h = Math.max(70, Math.floor(r.height || canvas.clientHeight || 96));
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  /* -----------------------------------------------------------------
     Una curva: escala fija, banda de rango normal, trazo y valor.
     ----------------------------------------------------------------- */
  function curva(canvas, opc) {
    var m = medidas(canvas);
    if (!m) return;
    var ctx = m.ctx, w = m.w, h = m.h;

    var padIzq = 26, padDer = 6, padArr = 4, padAba = 13;
    var x0 = padIzq, x1 = w - padDer;
    var y0 = padArr, y1 = h - padAba;
    var alto = y1 - y0, ancho = x1 - x0;

    function yDe(v) {
      var f = (Math.min(opc.max, Math.max(opc.min, v)) - opc.min) / (opc.max - opc.min);
      return y1 - f * alto;
    }

    /* --- banda de rango normal --- */
    if (opc.banda) {
      var ya = yDe(opc.banda[1]), yb = yDe(opc.banda[0]);
      ctx.fillStyle = opc.colorBanda || 'rgba(61,220,132,.09)';
      ctx.fillRect(x0, ya, ancho, yb - ya);
      ctx.strokeStyle = opc.colorBandaLinea || 'rgba(61,220,132,.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x0, ya); ctx.lineTo(x1, ya);
      ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* --- marco y escala --- */
    ctx.strokeStyle = 'rgba(125,180,195,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.fillStyle = 'rgba(142,168,181,.85)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(opc.max), x0 - 4, y0 + 7);
    ctx.fillText(String(opc.min), x0 - 4, y1);
    if (opc.banda) {
      ctx.fillStyle = 'rgba(61,220,132,.75)';
      ctx.fillText(String(opc.banda[0]), x0 - 4, yDe(opc.banda[0]) + 3);
    }

    /* --- trazo --- */
    var d = opc.datos || [];
    if (d.length > 1) {
      ctx.strokeStyle = opc.color;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var i = 0; i < d.length; i++) {
        var x = x0 + (i / (d.length - 1)) * ancho;
        var y = yDe(d[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      /* relleno tenue bajo el trazo */
      ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath();
      ctx.fillStyle = opc.relleno || 'rgba(125,211,252,.08)';
      ctx.fill();
    }

    /* --- linea de FiCO2 cuando hay reinhalacion --- */
    if (opc.lineaExtra !== undefined && opc.lineaExtra !== null && opc.lineaExtra > 0.5) {
      var ye = yDe(opc.lineaExtra);
      ctx.strokeStyle = 'rgba(255,197,61,.8)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, ye); ctx.lineTo(x1, ye); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,197,61,.95)';
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('FiCO2 ' + opc.lineaExtra.toFixed(1), x0 + 4, ye - 3);
    }

    /* --- eje de tiempo --- */
    ctx.fillStyle = 'rgba(95,122,136,.9)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(opc.ventana || '10 s', x0 + 1, h - 3);
    ctx.textAlign = 'right';
    ctx.fillText(opc.unidad || '', x1, h - 3);
  }

  /* -----------------------------------------------------------------
     Dibuja las dos curvas del escenario.
     ----------------------------------------------------------------- */
  function dibujarPar(cvPaw, cvCapno, historia, calc, perfil) {
    var pMax = SIM.pv('ventilacion.limitePresion', perfil);          // 30 cmH2O
    var pMin = SIM.pv('ventilacion.limiteBajoPresion', perfil) + 4;  // 12 cmH2O

    if (cvPaw) {
      curva(cvPaw, {
        datos: historia.presion,
        min: 0, max: 45,
        banda: [pMin, pMax],
        color: '#7dd3fc',
        relleno: 'rgba(125,211,252,.09)',
        unidad: 'cmH2O'
      });
    }

    if (cvCapno) {
      var ok = calc.monitor.valido;
      curva(cvCapno, {
        datos: ok ? historia.capno : [],
        min: 0, max: 60,
        banda: [SIM.pv('absorbedor.alarmaEtCO2Baja', perfil), SIM.pv('absorbedor.alarmaEtCO2Alta', perfil)],
        color: '#66e398',
        relleno: 'rgba(102,227,152,.08)',
        lineaExtra: ok ? calc.monitor.fico2 : null,
        unidad: 'mmHg'
      });
      if (!ok) {
        var m = cvCapno.getContext('2d');
        if (m) {
          m.fillStyle = 'rgba(138,160,168,.9)';
          m.font = '11px system-ui, sans-serif';
          m.textAlign = 'center';
          m.fillText('sin dato del monitor', cvCapno.clientWidth / 2, cvCapno.clientHeight / 2);
        }
      }
    }
  }

  return { dibujarPar: dibujarPar, curva: curva };
})();
