/* =====================================================================
   modelo.js  -  Modelo dinamico de primer orden (seccion 5.1)
   ---------------------------------------------------------------------
   Cada funcion declara su fuente. Las funciones marcadas [P] son
   supuestos de diseno: no constan en los manuales y hay que validarlos.
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.modelo = (function () {
  'use strict';

  function limitar(v, min, max) {
    v = Number(v);
    if (isNaN(v)) v = min;
    return Math.min(max, Math.max(min, v));
  }

  /* -----------------------------------------------------------------
     FiO2 de una mezcla aire / O2 / N2O
     [M] M8 3.2:  FiO2 = [(0,21 x aire) + O2] / (aire + O2) x 100
     El N2O se suma al denominador porque diluye la mezcla [I].
     ----------------------------------------------------------------- */
  function fio2Mezcla(lpmO2, lpmAire, lpmN2O) {
    var total = lpmO2 + lpmAire + lpmN2O;
    if (total <= 0) return 0.21;            // sin flujo, el circuito tiende a aire [I]
    var o2 = lpmO2 + 0.21 * lpmAire;
    return limitar(o2 / total, 0.0, 1.0);
  }

  /* -----------------------------------------------------------------
     Reinhalacion
     [M] M9 Fig. 1 (p.44):  fR = 1 - FGF/MV   si FGF < MV
     [M] M8 2.2: volumen reinhalado = MV - FGF
     ----------------------------------------------------------------- */
  function fraccionReinhalada(fgf, mv) {
    if (mv <= 0) return 0;
    if (fgf >= mv) return 0;
    return limitar(1 - fgf / mv, 0, 1);
  }

  /* -----------------------------------------------------------------
     FiCO2 con el absorbedor agotado (sin absorcion)
     [M] M9 p.44-45, ensayo in vitro con MV 5 L/min y VCO2 0,160 L/min:
         FGF 0,5 -> 17 % ; 2 -> 4,4 % ; 3 -> 1,3 % ; 6 -> 0
     [P] La interpolacion entre esos cuatro puntos y el escalado por
         MV y VCO2 son supuestos de diseno.
     ----------------------------------------------------------------- */
  var PUNTOS_FICO2 = [[0.5, 17.0], [2.0, 4.4], [3.0, 1.3], [6.0, 0.0]];

  function fico2SinAbsorbedor(fgf, mv, vco2) {
    var f = limitar(fgf, 0, 20);
    var pct;
    if (f <= PUNTOS_FICO2[0][0]) {
      pct = PUNTOS_FICO2[0][1];
    } else if (f >= PUNTOS_FICO2[PUNTOS_FICO2.length - 1][0]) {
      pct = 0;
    } else {
      pct = 0;
      for (var i = 0; i < PUNTOS_FICO2.length - 1; i++) {
        var a = PUNTOS_FICO2[i], b = PUNTOS_FICO2[i + 1];
        if (f >= a[0] && f <= b[0]) {
          var t = (f - a[0]) / (b[0] - a[0]);
          pct = a[1] + t * (b[1] - a[1]);
          break;
        }
      }
    }
    /* [P] escalado respecto del ensayo de referencia (MV 5, VCO2 0,160) */
    var escala = (mv > 0 ? 5 / mv : 1) * (vco2 / 0.160);
    return limitar(pct * escala, 0, 20);   // en % de volumen
  }

  /* -----------------------------------------------------------------
     CO2 espirado
     [M] M9 p.46:  FETCO2 = FiCO2 + VCO2/MV
     [P] Se usa ventilacion alveolar (MV x (1 - Vd/Vt)) en lugar de MV
         para que el valor de partida sea fisiologicamente coherente.
     ----------------------------------------------------------------- */
  function etco2mmHg(fico2Pct, mv, vco2, vdvt) {
    var mvAlveolar = Math.max(0.3, mv * (1 - vdvt));
    var fraccion = vco2 / mvAlveolar;                 // fraccion de volumen
    var pctTotal = fico2Pct + fraccion * 100;
    return limitar(pctTotal * 7.13, 0, 120);          // % -> mmHg (presion seca 713 mmHg)
  }

  function pctAmmHg(pct) { return pct * 7.13; }
  function mmHgApct(mmHg) { return mmHg / 7.13; }

  /* -----------------------------------------------------------------
     Cambio de composicion del gas en el circuito (constante de tiempo)
     [M] M7 5.3 (p.83):  T = VS / (VD - VU)
         VS volumen del sistema, VD gas fresco, VU consumo del paciente.
     Con gas fresco bajo los cambios son lentos.
     ----------------------------------------------------------------- */
  function constanteTiempoCircuito(volSistemaL, fgf, consumoLpm) {
    var neto = fgf - consumoLpm;
    if (neto <= 0.05) return 999;        // practicamente no se renueva
    return volSistemaL / neto;           // minutos
  }

  /* Aproximacion de primer orden hacia un objetivo */
  function primerOrden(actual, objetivo, dtSeg, tauSeg) {
    if (tauSeg <= 0) return objetivo;
    var k = 1 - Math.exp(-dtSeg / tauSeg);
    return actual + (objetivo - actual) * k;
  }

  /* -----------------------------------------------------------------
     Duracion de un cilindro
     [M] M10 diap. 2-3:  t(min) = presion(psi) x k / flujo(L/min)
         k = 0,28 (cilindro E) ; 0,16 (cilindro D)
     ----------------------------------------------------------------- */
  function duracionCilindroMin(presionKPa, flujoLpm, factor) {
    if (flujoLpm <= 0) return Infinity;
    var psi = presionKPa * 0.145038;
    return (psi * factor) / flujoLpm;
  }

  function kPaApsi(kPa) { return kPa * 0.145038; }
  function psiAkPa(psi) { return psi / 0.145038; }

  /* -----------------------------------------------------------------
     FUGA
     [P] Supuesto de diseno 1 del documento:
         Q_fuga(P) = Q30 x (P/30)^n   con n entre 0,5 (orificio) y 1 (laminar)
         dP/dt = (FGF - Q_fuga)/C     con C la compliancia del circuito
     Se usa n = 0,65.
     ----------------------------------------------------------------- */
  var EXPONENTE_FUGA = 0.65;             // [P]

  function flujoFuga(q30MlMin, presionCmH2O) {
    if (q30MlMin <= 0 || presionCmH2O <= 0) return 0;
    return q30MlMin * Math.pow(presionCmH2O / 30, EXPONENTE_FUGA);
  }

  /* Prueba de fugas: el circuito se presuriza y se observa la caida.
     Devuelve la presion tras dt segundos. [P] */
  function pasoPruebaFuga(presionCmH2O, q30MlMin, flujoAporteMlMin, complianciaMlCmH2O, dtSeg) {
    var qf = flujoFuga(q30MlMin, presionCmH2O);            // mL/min
    var dP = ((flujoAporteMlMin - qf) / 60) * dtSeg / complianciaMlCmH2O;
    return Math.max(0, presionCmH2O + dP);
  }

  /* -----------------------------------------------------------------
     Fuga durante la ventilacion
     [M] M2 p.169 [177]: con ventilacion normal (presion media 10 cmH2O,
         I:E 1:2) la fuga real es aproximadamente el 10 % de la fuga
         medida en la prueba.
     [P] El reparto de esa perdida entre volumen y presion pico.
     ----------------------------------------------------------------- */
  function perdidaPorRespiracionMl(q30MlMin, fraccion, frecuencia) {
    if (frecuencia <= 0) return 0;
    var perdidaPorMinuto = q30MlMin * fraccion;
    return perdidaPorMinuto / frecuencia;
  }

  /* -----------------------------------------------------------------
     Vaporizador: efecto del gas portador
     [M] M11 3.3 [PDF 16]: con O2 al 100 % la concentracion entregada
         sube hasta un 10 % relativo (max 0,4 vol.%); con 30 % O2 y
         70 % N2O baja hasta un 10 % relativo.
     ----------------------------------------------------------------- */
  function salidaVaporizador(dialPct, fraccionO2, fraccionN2O) {
    if (dialPct <= 0) return 0;
    /* interpolacion lineal entre los dos extremos documentados [I] */
    var desviacionRelativa = 0.10 * (fraccionO2 - 0.30) / 0.70;
    desviacionRelativa = limitar(desviacionRelativa, -0.10, 0.10);
    var delta = dialPct * desviacionRelativa;
    if (delta > 0.4) delta = 0.4;
    if (delta < -0.4) delta = -0.4;
    return Math.max(0, dialPct + delta);
  }

  /* Conversion vol.% <-> presion parcial
     [M] M11 3.4 [PDF 17]: concentracion (% presion parcial)
         = valor medido [vol.%] x presion [hPa] / 1013 */
  function volPctAPresionParcial(volPct, presionHPa) {
    return volPct * presionHPa / 1013;
  }

  /* -----------------------------------------------------------------
     Agotamiento del absorbedor
     [M] M9 Tabla II p.45: 80-125 min por cada 100 g hasta FiCO2 0,5 %
     [P] La forma de la curva (sigmoidea) es un supuesto de diseno.
     'avance' va de 0 (nuevo) a 1 (agotado al criterio de cambio).
     ----------------------------------------------------------------- */
  function capacidadMinutos(masaG, minPor100g) {
    return (masaG / 100) * minPor100g;
  }

  function fico2PorAgotamiento(avance, fico2Maximo) {
    /* [P] sigmoidea: casi cero hasta ~0,7 y luego sube con rapidez */
    var a = limitar(avance, 0, 1.6);
    var s = 1 / (1 + Math.exp(-12 * (a - 0.85)));
    var s0 = 1 / (1 + Math.exp(-12 * (0 - 0.85)));
    return limitar(((s - s0) / (1 - s0)) * fico2Maximo, 0, fico2Maximo);
  }

  return {
    limitar: limitar,
    fio2Mezcla: fio2Mezcla,
    fraccionReinhalada: fraccionReinhalada,
    fico2SinAbsorbedor: fico2SinAbsorbedor,
    etco2mmHg: etco2mmHg,
    pctAmmHg: pctAmmHg,
    mmHgApct: mmHgApct,
    constanteTiempoCircuito: constanteTiempoCircuito,
    primerOrden: primerOrden,
    duracionCilindroMin: duracionCilindroMin,
    kPaApsi: kPaApsi,
    psiAkPa: psiAkPa,
    flujoFuga: flujoFuga,
    pasoPruebaFuga: pasoPruebaFuga,
    perdidaPorRespiracionMl: perdidaPorRespiracionMl,
    salidaVaporizador: salidaVaporizador,
    volPctAPresionParcial: volPctAPresionParcial,
    capacidadMinutos: capacidadMinutos,
    fico2PorAgotamiento: fico2PorAgotamiento,
    EXPONENTE_FUGA: EXPONENTE_FUGA
  };
})();
