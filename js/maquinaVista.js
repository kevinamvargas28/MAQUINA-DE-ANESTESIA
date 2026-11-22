/* =====================================================================
   maquinaVista.js  -  Vista frontal de la maquina de anestesia completa
   ---------------------------------------------------------------------
   Maquina generica de arquitectura estandar, dibujada aqui: no es ninguna
   marca ni modelo concreto (seccion 7 del documento: "sin marca
   especifica"; seccion 11: no se replica el software de un fabricante).

   Ensayo 3: se rehizo el dibujo buscando realismo. Las superficies
   cilindricas (cilindros, tubos de flujometro, fuelle, canister, bolsa)
   llevan degradado horizontal oscuro-claro-oscuro, que es lo que da la
   sensacion de volumen; el metal lleva degradado vertical con un filo de
   luz arriba; el cristal lleva dos franjas de reflejo en diagonal. Se
   anadieron manometros con escala y aguja, dial graduado, fuelle en
   acordeon, abrazadera y purga del canister, mangueras con relieve,
   ruedas con horquilla, tornillos, cables y la linea de muestreo de
   gases.

   Dos usos:
     - vista grande: mapa de la maquina, se entra a los modulos desde ella
     - localizador: la misma vista en pequeno, con el modulo activo
       iluminado y el resto atenuado
   ===================================================================== */

window.SIM = window.SIM || {};
SIM.maquinaVista = (function () {
  'use strict';

  /* ---------------------------------------------------------------- */
  /* Zonas: nombre, resumen y rectangulos sensibles                    */
  /* ---------------------------------------------------------------- */
  var ZONAS = [
    { id: 'monitor', nombre: 'Monitor y alarmas',
      resumen: 'Muestra las curvas, los valores medidos y las alarmas con su prioridad.',
      cajas: [[122, 6, 288, 116]] },

    { id: 'suministro', nombre: 'Suministro de gases',
      resumen: 'Tuberia de pared, cilindros de respaldo, reguladores y la proteccion de O2.',
      cajas: [[2, 180, 78, 104], [456, 58, 104, 220], [418, 294, 38, 34]] },

    { id: 'flujometros', nombre: 'Flujometros y mezclador',
      resumen: 'Fijan el caudal de cada gas. De su mezcla sale el gas fresco y la FiO2.',
      cajas: [[84, 156, 132, 144]] },

    { id: 'vaporizador', nombre: 'Vaporizador',
      resumen: 'Anade el agente al gas fresco en la concentracion del dial.',
      cajas: [[218, 156, 114, 144]] },

    { id: 'ventilador', nombre: 'Ventilador y fuelle',
      resumen: 'Mueve el gas con un gas motriz a presion. La concertina muestra el volumen.',
      cajas: [[68, 330, 112, 126]] },

    { id: 'absorbedor', nombre: 'Absorbedor de CO2',
      resumen: 'Retira el CO2 del gas espirado para que se pueda reinhalar sin acumularlo.',
      cajas: [[68, 456, 112, 112]] },

    { id: 'circuito', nombre: 'Circuito respiratorio',
      resumen: 'Valvulas, mangueras, pieza en Y y bolsa. Lleva el gas al paciente y lo trae.',
      cajas: [[176, 450, 284, 88], [0, 458, 56, 74]] },

    { id: 'evacuacion', nombre: 'Evacuacion (AGSS)',
      resumen: 'Saca del quirofano el gas que sobra del circuito.',
      cajas: [[58, 570, 130, 38]] }
  ];

  function zona(id) {
    for (var i = 0; i < ZONAS.length; i++) if (ZONAS[i].id === id) return ZONAS[i];
    return null;
  }

  /* ---------------------------------------------------------------- */
  /* Piezas repetitivas generadas: tornillos, escalas, graduaciones     */
  /* ---------------------------------------------------------------- */
  function tornillo(x, y) {
    return '<g class="tornillo"><circle cx="' + x + '" cy="' + y + '" r="2.6"/>' +
           '<line x1="' + (x - 1.5) + '" y1="' + y + '" x2="' + (x + 1.5) + '" y2="' + y + '"/></g>';
  }

  /* Escala de un tubo de flujometro: trazos a la derecha del tubo */
  function escalaTubo(x, yTop, yBot) {
    var s = '';
    for (var i = 0; i <= 10; i++) {
      var y = yBot - (yBot - yTop) * (i / 10);
      var largo = (i % 5 === 0) ? 6 : 3.2;
      s += '<line class="tick" x1="' + x + '" y1="' + y.toFixed(1) +
           '" x2="' + (x + largo) + '" y2="' + y.toFixed(1) + '"/>';
    }
    return s;
  }

  /* Corona moleteada del dial del vaporizador */
  function moleteado(cx, cy, r, n) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var x1 = cx + Math.cos(a) * (r - 3.5), y1 = cy + Math.sin(a) * (r - 3.5);
      var x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
      s += '<line class="moleteado" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
           '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }
    return s;
  }

  /* Numeros alrededor del dial, de 0 a 8 vol.% */
  function graduacionDial(cx, cy, r) {
    var s = '';
    for (var v = 0; v <= 8; v++) {
      var ang = (-120 + (v / 8) * 240) * Math.PI / 180 - Math.PI / 2;
      var x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
      var xt = cx + Math.cos(ang) * (r - 5), yt = cy + Math.sin(ang) * (r - 5);
      s += '<line class="tick-dial" x1="' + xt.toFixed(1) + '" y1="' + yt.toFixed(1) +
           '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>';
      if (v % 2 === 0) {
        var xn = cx + Math.cos(ang) * (r + 7), yn = cy + Math.sin(ang) * (r + 7);
        s += '<text class="num-dial" x="' + xn.toFixed(1) + '" y="' + (yn + 3).toFixed(1) + '">' + v + '</text>';
      }
    }
    return s;
  }

  /* Escala de un manometro */
  function escalaManometro(cx, cy, r) {
    var s = '';
    for (var i = 0; i <= 8; i++) {
      var ang = (-135 + (i / 8) * 270) * Math.PI / 180 - Math.PI / 2;
      var x1 = cx + Math.cos(ang) * (r - 4), y1 = cy + Math.sin(ang) * (r - 4);
      var x2 = cx + Math.cos(ang) * (r - 1), y2 = cy + Math.sin(ang) * (r - 1);
      s += '<line class="tick-man" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) +
           '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }
    return s;
  }

  function manometro(id, cx, cy, r, etiqueta) {
    return '<g class="manometro-g">' +
      '<circle class="man-aro" cx="' + cx + '" cy="' + cy + '" r="' + (r + 2) + '"/>' +
      '<circle class="man" id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
      escalaManometro(cx, cy, r) +
      '<line class="man-aguja" id="' + id + 'Aguja" x1="' + cx + '" y1="' + cy +
        '" x2="' + cx + '" y2="' + (cy - r + 4) + '"/>' +
      '<circle class="man-centro" cx="' + cx + '" cy="' + cy + '" r="2.4"/>' +
      '<path class="man-brillo" d="M ' + (cx - r + 3) + ' ' + (cy - 3) +
        ' A ' + (r - 3) + ' ' + (r - 3) + ' 0 0 1 ' + (cx - 2) + ' ' + (cy - r + 3) + '"/>' +
      (etiqueta ? '<text class="rot nano c" x="' + cx + '" y="' + (cy + r + 11) + '">' + etiqueta + '</text>' : '') +
      '</g>';
  }

  /* ---------------------------------------------------------------- */
  /* Trazado                                                           */
  /* ---------------------------------------------------------------- */
  function markup(idSvg) {
    return '' +
'<svg id="' + (idSvg || 'svgVista') + '" class="vista-maquina" viewBox="0 0 580 700" ' +
     'preserveAspectRatio="xMidYMid meet" role="img" ' +
     'aria-label="Maquina de anestesia generica vista de frente">' +

  '<defs>' +
    /* metal: luz arriba, sombra abajo */
    '<linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#32485a"/><stop offset="12%" stop-color="#26394a"/>' +
      '<stop offset="100%" stop-color="#16242e"/></linearGradient>' +
    '<linearGradient id="gMetalLat" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#16242e"/><stop offset="35%" stop-color="#2b3f50"/>' +
      '<stop offset="100%" stop-color="#162029"/></linearGradient>' +
    /* cilindrico: oscuro-claro-oscuro */
    '<linearGradient id="gCilindrico" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#16242e"/><stop offset="28%" stop-color="#3a5368"/>' +
      '<stop offset="55%" stop-color="#2a3d4c"/><stop offset="100%" stop-color="#121d25"/></linearGradient>' +
    '<linearGradient id="gCristal" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="rgba(200,232,246,.05)"/>' +
      '<stop offset="22%" stop-color="rgba(200,232,246,.20)"/>' +
      '<stop offset="60%" stop-color="rgba(200,232,246,.07)"/>' +
      '<stop offset="100%" stop-color="rgba(200,232,246,.03)"/></linearGradient>' +
    '<linearGradient id="gTuboVidrio" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#050a0e"/><stop offset="30%" stop-color="#16242e"/>' +
      '<stop offset="52%" stop-color="#0c151c"/><stop offset="100%" stop-color="#04080b"/></linearGradient>' +
    '<linearGradient id="gCal" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#b9b2ea"/><stop offset="30%" stop-color="#e8e4ff"/>' +
      '<stop offset="70%" stop-color="#cdc6f4"/><stop offset="100%" stop-color="#a9a1dd"/></linearGradient>' +
    '<linearGradient id="gFuelle" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="rgba(140,118,186,.30)"/>' +
      '<stop offset="30%" stop-color="rgba(201,183,236,.46)"/>' +
      '<stop offset="100%" stop-color="rgba(120,100,165,.28)"/></linearGradient>' +
    '<radialGradient id="gBolsa" cx="35%" cy="32%" r="78%">' +
      '<stop offset="0%" stop-color="rgba(208,192,238,.42)"/>' +
      '<stop offset="100%" stop-color="rgba(120,100,165,.22)"/></radialGradient>' +
    '<radialGradient id="gRueda" cx="35%" cy="32%" r="75%">' +
      '<stop offset="0%" stop-color="#2b3e4c"/><stop offset="100%" stop-color="#0e161c"/></radialGradient>' +
    '<linearGradient id="gPantalla" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#071017"/><stop offset="100%" stop-color="#030709"/></linearGradient>' +
    '<linearGradient id="gSuperficie" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#3b5467"/><stop offset="100%" stop-color="#273948"/></linearGradient>' +
    '<pattern id="pGranulo" width="8" height="8" patternUnits="userSpaceOnUse">' +
      '<circle cx="2.2" cy="2.2" r="1.6" fill="rgba(92,80,142,.32)"/>' +
      '<circle cx="6" cy="5.8" r="1.3" fill="rgba(92,80,142,.24)"/>' +
      '<circle cx="4.4" cy="0.6" r="1" fill="rgba(92,80,142,.18)"/></pattern>' +
    '<filter id="fSombra" x="-25%" y="-25%" width="150%" height="150%">' +
      '<feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".55"/></filter>' +
    '<filter id="fSombraSuave" x="-30%" y="-30%" width="160%" height="160%">' +
      '<feDropShadow dx="1" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".45"/></filter>' +
  '</defs>' +

  /* sombra en el suelo */
  '<ellipse class="sombra-suelo" cx="262" cy="668" rx="214" ry="16"/>' +

  /* ================= TOMA DE PARED Y MANGUERAS ================= */
  '<g class="pieza">' +
    '<rect class="pared" x="6" y="186" width="26" height="92" rx="5"/>' +
    '<rect class="pared-luz" x="8" y="188" width="22" height="2" rx="1"/>' +
    '<circle class="toma-aro o2"   cx="19" cy="206" r="7.5"/>' +
    '<circle class="toma o2"   cx="19" cy="206" r="4.6"/>' +
    '<circle class="toma-aro aire" cx="19" cy="232" r="7.5"/>' +
    '<circle class="toma aire" cx="19" cy="232" r="4.6"/>' +
    '<circle class="toma-aro n2o"  cx="19" cy="258" r="7.5"/>' +
    '<circle class="toma n2o"  cx="19" cy="258" r="4.6"/>' +
    '<path class="manguera-base" d="M 27 206 C 50 206 58 210 76 215"/>' +
    '<path class="manguera o2"   d="M 27 206 C 50 206 58 210 76 215"/>' +
    '<path class="manguera-base" d="M 27 232 C 50 232 58 234 76 239"/>' +
    '<path class="manguera aire" d="M 27 232 C 50 232 58 234 76 239"/>' +
    '<path class="manguera-base" d="M 27 258 C 50 258 58 258 76 263"/>' +
    '<path class="manguera n2o"  d="M 27 258 C 50 258 58 258 76 263"/>' +
    '<text class="rot nano" x="3" y="298">Tuberia</text>' +
  '</g>' +

  /* ================= CILINDROS DE RESPALDO ================= */
  '<g class="pieza">' +
    /* yugo de montaje */
    '<rect class="yugo" x="460" y="212" width="96" height="18" rx="4"/>' +
    /* cilindro O2 */
    '<rect class="cil-cuerpo" id="vmCilO2" x="468" y="98" width="38" height="118" rx="6"/>' +
    '<path class="cil-hombro" d="M 468 110 C 470 94 482 86 487 86 C 492 86 504 94 506 110 Z"/>' +
    '<rect class="cil-cuello" x="482" y="72" width="10" height="16" rx="2"/>' +
    '<circle class="volante" cx="487" cy="66" r="9"/>' +
    '<line class="volante-radio" x1="479" y1="66" x2="495" y2="66"/>' +
    '<line class="volante-radio" x1="487" y1="58" x2="487" y2="74"/>' +
    '<rect class="cil-brillo" x="474" y="104" width="5" height="106" rx="2.5"/>' +
    '<text class="rot cil o2" x="487" y="170">O2</text>' +
    /* cilindro N2O */
    '<rect class="cil-cuerpo" id="vmCilN2O" x="514" y="98" width="38" height="118" rx="6"/>' +
    '<path class="cil-hombro" d="M 514 110 C 516 94 528 86 533 86 C 538 86 550 94 552 110 Z"/>' +
    '<rect class="cil-cuello" x="528" y="72" width="10" height="16" rx="2"/>' +
    '<circle class="volante" cx="533" cy="66" r="9"/>' +
    '<line class="volante-radio" x1="525" y1="66" x2="541" y2="66"/>' +
    '<line class="volante-radio" x1="533" y1="58" x2="533" y2="74"/>' +
    '<rect class="cil-brillo" x="520" y="104" width="5" height="106" rx="2.5"/>' +
    '<text class="rot cil n2o" x="533" y="170">N2O</text>' +
    /* manometros de cilindro */
    manometro('vmManCilO2', 487, 252, 17, 'O2') +
    manometro('vmManCilN2O', 533, 252, 17, 'N2O') +
    '<path class="tubo-rigido" d="M 487 230 V 235 M 533 230 V 235"/>' +
    '<path class="tubo-rigido" d="M 470 252 H 456 V 296 H 448"/>' +
  '</g>' +

  /* ================= MONITOR ================= */
  '<g class="pieza">' +
    '<rect class="brazo" x="250" y="112" width="20" height="42" rx="3"/>' +
    '<rect class="brazo-luz" x="252" y="112" width="3" height="42" rx="1.5"/>' +
    '<path class="cable" d="M 262 150 C 262 170 240 176 226 180"/>' +
    '<rect class="bisel" x="128" y="10" width="276" height="106" rx="9" filter="url(#fSombra)"/>' +
    '<rect class="pantalla" id="vmPantalla" x="136" y="18" width="260" height="74" rx="4"/>' +
    '<rect class="pantalla-brillo" x="140" y="21" width="252" height="12" rx="4"/>' +
    '<polyline class="traza paw"   id="vmTrazaPaw"   points=""/>' +
    '<polyline class="traza capno" id="vmTrazaCapno" points=""/>' +
    '<text class="rot nano" x="142" y="30">Paw</text>' +
    '<text class="rot nano" x="142" y="68">CO2</text>' +
    '<rect class="led" id="vmLed" x="382" y="22" width="9" height="9" rx="4.5"/>' +
    /* botonera inferior del monitor */
    '<rect class="btn-mon" x="146" y="98" width="22" height="10" rx="3"/>' +
    '<rect class="btn-mon" x="174" y="98" width="22" height="10" rx="3"/>' +
    '<rect class="btn-mon" x="202" y="98" width="22" height="10" rx="3"/>' +
    '<rect class="btn-mon alarma-btn" x="230" y="98" width="30" height="10" rx="3"/>' +
    '<circle class="knob" cx="378" cy="103" r="9"/>' +
    '<circle class="knob-int" cx="378" cy="103" r="3.5"/>' +
    '<line class="knob-marca" x1="378" y1="96" x2="378" y2="100"/>' +
  '</g>' +

  /* ================= CABEZAL ================= */
  '<g class="pieza">' +
    '<rect class="cabezal" x="76" y="150" width="372" height="154" rx="9" filter="url(#fSombra)"/>' +
    '<rect class="cabezal-luz" x="84" y="156" width="356" height="2.5" rx="1.25"/>' +
    tornillo(84, 296) + tornillo(440, 296) + tornillo(84, 160) + tornillo(440, 160) +
  '</g>' +

  /* --- Flujometros --- */
  '<g class="pieza">' +
    '<rect class="panel-int" x="88" y="162" width="124" height="134" rx="6"/>' +
    /* tubo O2 */
    '<rect class="fm-tubo" x="97"  y="172" width="22" height="84" rx="11"/>' +
    '<rect class="fm-brillo" x="100" y="176" width="3.5" height="76" rx="1.75"/>' +
    escalaTubo(120, 176, 252) +
    /* tubo aire */
    '<rect class="fm-tubo" x="134" y="172" width="22" height="84" rx="11"/>' +
    '<rect class="fm-brillo" x="137" y="176" width="3.5" height="76" rx="1.75"/>' +
    escalaTubo(157, 176, 252) +
    /* tubo N2O */
    '<rect class="fm-tubo" x="171" y="172" width="22" height="84" rx="11"/>' +
    '<rect class="fm-brillo" x="174" y="176" width="3.5" height="76" rx="1.75"/>' +
    escalaTubo(194, 176, 252) +
    '<circle class="fm-bobina o2"   id="vmBobO2"   cx="108" cy="246" r="7.5"/>' +
    '<circle class="fm-bobina aire" id="vmBobAire" cx="145" cy="246" r="7.5"/>' +
    '<circle class="fm-bobina n2o"  id="vmBobN2O"  cx="182" cy="246" r="7.5"/>' +
    /* perillas */
    '<circle class="perilla o2"   cx="108" cy="276" r="9"/>' +
    '<circle class="perilla aire" cx="145" cy="276" r="9"/>' +
    '<circle class="perilla n2o"  cx="182" cy="276" r="9"/>' +
    '<line class="perilla-marca" x1="108" y1="269" x2="108" y2="273"/>' +
    '<line class="perilla-marca" x1="145" y1="269" x2="145" y2="273"/>' +
    '<line class="perilla-marca" x1="182" y1="269" x2="182" y2="273"/>' +
    '<text class="rot nano c" x="108" y="294">O2</text>' +
    '<text class="rot nano c" x="145" y="294">Aire</text>' +
    '<text class="rot nano c" x="182" y="294">N2O</text>' +
  '</g>' +

  /* --- Vaporizador instalado y puesto libre --- */
  '<g class="pieza">' +
    '<rect class="vapor-base" x="220" y="290" width="112" height="10" rx="3"/>' +
    '<rect class="vapor-cuerpo" id="vmVapor" x="224" y="160" width="104" height="132" rx="7" filter="url(#fSombraSuave)"/>' +
    '<rect class="vapor-luz" x="228" y="164" width="96" height="2" rx="1"/>' +
    '<rect class="palanca" x="229" y="170" width="9" height="26" rx="3"/>' +
    graduacionDial(276, 206, 32) +
    moleteado(276, 206, 28, 28) +
    '<circle class="vapor-dial" cx="276" cy="206" r="24"/>' +
    '<line class="vapor-aguja" id="vmAguja" x1="276" y1="206" x2="276" y2="187"/>' +
    '<circle class="vapor-centro" cx="276" cy="206" r="4"/>' +
    '<rect class="vapor-vis" x="240" y="252" width="72" height="18" rx="3"/>' +
    '<rect class="vapor-nivel" id="vmNivel" x="242" y="254" width="50" height="14" rx="2"/>' +
    '<line class="vapor-min" x1="246" y1="252" x2="246" y2="270"/>' +
    '<line class="vapor-max" x1="306" y1="252" x2="306" y2="270"/>' +
    '<text class="rot nano c" x="276" y="284">vol. %</text>' +
    /* puesto libre */
    '<rect class="puesto-libre" x="342" y="160" width="98" height="132" rx="7"/>' +
    '<rect class="rail" x="346" y="286" width="90" height="6" rx="3"/>' +
    '<text class="rot nano c" x="391" y="222">puesto</text>' +
    '<text class="rot nano c" x="391" y="236">libre</text>' +
  '</g>' +

  /* ================= SUPERFICIE DE TRABAJO ================= */
  '<g class="pieza">' +
    '<rect class="superficie" x="62" y="302" width="392" height="12" rx="3"/>' +
    '<rect class="superficie-canto" x="62" y="313" width="392" height="9" rx="2"/>' +
    '<circle class="flush-aro" cx="436" cy="308" r="12"/>' +
    '<circle class="flush" id="vmFlush" cx="436" cy="308" r="8.5"/>' +
    '<text class="rot nano c" x="436" y="336">O2 rapido</text>' +
  '</g>' +

  /* ================= CUERPO Y CAJONES ================= */
  '<g class="pieza">' +
    '<rect class="carro" x="192" y="322" width="262" height="288" rx="7"/>' +
    '<rect class="carro-luz" x="196" y="325" width="254" height="2" rx="1"/>' +
    '<rect class="cajon" x="202" y="334" width="242" height="80" rx="4"/>' +
    '<rect class="cajon-sombra" x="202" y="334" width="242" height="4" rx="2"/>' +
    '<rect class="tirador" x="286" y="368" width="74" height="8" rx="4"/>' +
    '<rect class="tirador-luz" x="288" y="369" width="70" height="2" rx="1"/>' +
    '<rect class="cajon" x="202" y="420" width="242" height="80" rx="4"/>' +
    '<rect class="cajon-sombra" x="202" y="420" width="242" height="4" rx="2"/>' +
    '<rect class="tirador" x="286" y="454" width="74" height="8" rx="4"/>' +
    '<rect class="tirador-luz" x="288" y="455" width="70" height="2" rx="1"/>' +
    '<rect class="cajon" x="202" y="506" width="242" height="92" rx="4"/>' +
    '<rect class="cajon-sombra" x="202" y="506" width="242" height="4" rx="2"/>' +
    '<rect class="tirador" x="286" y="546" width="74" height="8" rx="4"/>' +
    '<rect class="tirador-luz" x="288" y="547" width="70" height="2" rx="1"/>' +
  '</g>' +

  /* ================= SISTEMA RESPIRATORIO ================= */
  '<g class="pieza">' +
    '<rect class="bloque-resp" x="60" y="322" width="128" height="248" rx="7"/>' +
    '<rect class="bloque-luz" x="64" y="325" width="120" height="2" rx="1"/>' +
  '</g>' +

  /* --- Ventilador: camara de cristal y concertina --- */
  '<g class="pieza">' +
    '<rect class="camara-tapa" x="70" y="330" width="108" height="10" rx="4"/>' +
    '<rect class="camara" x="74" y="338" width="100" height="112" rx="10"/>' +
    '<rect class="fuelle" id="vmFuelle" x="86" y="368" width="76" height="74" rx="4"/>' +
    '<g class="fuelle-pliegues" id="vmPliegues"></g>' +
    '<rect class="camara-base" x="72" y="444" width="104" height="10" rx="4"/>' +
    '<path class="cristal-brillo" d="M 84 344 L 96 344 L 78 444 L 74 420 Z"/>' +
    '<path class="cristal-brillo tenue" d="M 150 344 L 158 344 L 146 444 L 140 436 Z"/>' +
    '<text class="rot chapa c" x="124" y="338">FUELLE</text>' +
  '</g>' +

  /* --- Absorbedor --- */
  '<g class="pieza">' +
    '<rect class="canister-tapa" x="70" y="454" width="108" height="10" rx="4"/>' +
    '<rect class="canister" x="74" y="462" width="100" height="98" rx="8"/>' +
    '<rect class="canister-cal" x="77" y="465" width="94" height="92" rx="6"/>' +
    '<rect class="canister-virado" id="vmVirado" x="77" y="465" width="94" height="5" rx="3"/>' +
    '<rect class="canister-grano" x="77" y="465" width="94" height="92" rx="6"/>' +
    '<rect class="abrazadera" x="70" y="506" width="108" height="9" rx="3"/>' +
    '<circle class="abrazadera-tuerca" cx="176" cy="510" r="4"/>' +
    '<path class="cristal-brillo" d="M 84 468 L 94 468 L 80 554 L 76 534 Z"/>' +
    '<rect class="purga" x="114" y="558" width="16" height="9" rx="2"/>' +
    '<text class="rot chapa c" x="120" y="513">ABSORBEDOR CO2</text>' +
  '</g>' +

  /* --- Bolsa reservorio --- */
  '<g class="pieza">' +
    '<path class="tubo-rigido" d="M 60 478 H 44"/>' +
    '<rect class="bolsa-cuello" x="34" y="474" width="12" height="9" rx="3"/>' +
    '<ellipse class="bolsa" id="vmBolsa" cx="24" cy="504" rx="22" ry="26"/>' +
    '<ellipse class="bolsa-brillo" cx="17" cy="494" rx="6" ry="9"/>' +
    '<text class="rot nano c" x="24" y="546">Bolsa</text>' +
  '</g>' +

  /* --- Valvulas, mangueras al paciente y pieza en Y --- */
  '<g class="pieza">' +
    '<circle class="valv-aro" cx="188" cy="470" r="13"/>' +
    '<circle class="valv" id="vmValvInsp" cx="188" cy="470" r="10"/>' +
    '<path class="valv-flecha" d="M 184 470 L 191 470 M 188 467 L 191 470 L 188 473"/>' +
    '<circle class="valv-aro" cx="188" cy="506" r="13"/>' +
    '<circle class="valv" id="vmValvEsp" cx="188" cy="506" r="10"/>' +
    '<path class="valv-flecha" d="M 192 506 L 185 506 M 188 503 L 185 506 L 188 509"/>' +
    '<path class="corrugada-base" d="M 190 470 C 258 486 344 462 420 482"/>' +
    '<path class="corrugada insp" id="vmHoseInsp" d="M 190 470 C 258 486 344 462 420 482"/>' +
    '<path class="corrugada-base" d="M 190 506 C 258 522 344 498 420 518"/>' +
    '<path class="corrugada esp"  id="vmHoseEsp"  d="M 190 506 C 258 522 344 498 420 518"/>' +
    '<path class="pieza-y-cuerpo" d="M 418 480 L 436 496 L 436 506 L 418 520 Z"/>' +
    '<circle class="pieza-y" cx="432" cy="501" r="9"/>' +
    '<path class="tubo-paciente" d="M 440 501 H 468"/>' +
    '<path class="pulmon" id="vmPulmon" d="M 468 501 c 9 -18 32 -18 36 0 c 5 21 -12 33 -18 33 c -6 0 -23 -12 -18 -33 z"/>' +
    '<path class="pulmon-traquea" d="M 486 501 V 516"/>' +
    '<text class="rot nano c" x="486" y="552">Paciente</text>' +
    '<text class="rot nano c" x="430" y="476">Y</text>' +
    /* linea de muestreo de gases: del Y al modulo del monitor */
    '<path class="linea-muestreo" id="vmLineaMuestreo" d="M 436 492 C 456 432 458 368 448 320"/>' +
    '<rect class="trampa-agua" x="447" y="392" width="13" height="18" rx="3"/>' +
  '</g>' +

  /* ================= EVACUACION ================= */
  '<g class="pieza">' +
    '<path class="manguera-agss" d="M 122 567 V 574"/>' +
    '<rect class="agss" x="60" y="572" width="128" height="32" rx="5"/>' +
    '<circle class="agss-indic" cx="76" cy="588" r="4"/>' +
    '<text class="rot nano" x="88" y="592">AGSS</text>' +
  '</g>' +

  /* ================= BASE Y RUEDAS ================= */
  '<g class="pieza">' +
    '<rect class="base" x="56" y="608" width="404" height="24" rx="6"/>' +
    '<rect class="base-luz" x="60" y="610" width="396" height="2" rx="1"/>' +
    '<g class="rueda-g"><rect class="horquilla" x="90" y="630" width="12" height="12" rx="2"/>' +
      '<circle class="rueda" cx="96" cy="652" r="18"/><circle class="rueda-int" cx="96" cy="652" r="7"/>' +
      '<circle class="rueda-eje" cx="96" cy="652" r="2.5"/></g>' +
    '<g class="rueda-g"><rect class="horquilla" x="160" y="630" width="12" height="12" rx="2"/>' +
      '<circle class="rueda" cx="166" cy="652" r="18"/><circle class="rueda-int" cx="166" cy="652" r="7"/>' +
      '<circle class="rueda-eje" cx="166" cy="652" r="2.5"/></g>' +
    '<g class="rueda-g"><rect class="horquilla" x="344" y="630" width="12" height="12" rx="2"/>' +
      '<circle class="rueda" cx="350" cy="652" r="18"/><circle class="rueda-int" cx="350" cy="652" r="7"/>' +
      '<circle class="rueda-eje" cx="350" cy="652" r="2.5"/></g>' +
    '<g class="rueda-g"><rect class="horquilla" x="414" y="630" width="12" height="12" rx="2"/>' +
      '<circle class="rueda" cx="420" cy="652" r="18"/><circle class="rueda-int" cx="420" cy="652" r="7"/>' +
      '<circle class="rueda-eje" cx="420" cy="652" r="2.5"/></g>' +
  '</g>' +

  /* capa de zonas: la rellena JS desde la tabla ZONAS */
  '<g class="capa-zonas" id="vmZonas"></g>' +
'</svg>';
  }

  /* ---------------------------------------------------------------- */
  /* Zonas sensibles y pliegues del fuelle                             */
  /* ---------------------------------------------------------------- */
  var NS = 'http://www.w3.org/2000/svg';
  var N_PLIEGUES = 8;

  function preparar(svg, alElegirZona, alPasar) {
    if (!svg) return;

    /* pliegues de la concertina: chevrones, no lineas rectas */
    var pl = svg.querySelector('#vmPliegues');
    if (pl && !pl.childNodes.length) {
      for (var i = 0; i < N_PLIEGUES; i++) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('class', 'pliegue');
        pl.appendChild(p);
      }
    }

    /* zonas sensibles */
    var capa = svg.querySelector('#vmZonas');
    if (!capa || capa.childNodes.length) return;

    ZONAS.forEach(function (z) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'zona-m');
      g.setAttribute('data-zona', z.id);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', z.nombre);

      z.cajas.forEach(function (c) {
        var r = document.createElementNS(NS, 'rect');
        r.setAttribute('class', 'realce');
        r.setAttribute('x', c[0]); r.setAttribute('y', c[1]);
        r.setAttribute('width', c[2]); r.setAttribute('height', c[3]);
        r.setAttribute('rx', '8');
        g.appendChild(r);
      });

      var t = document.createElementNS(NS, 'title');
      t.textContent = z.nombre;
      g.appendChild(t);

      if (alElegirZona) {
        g.addEventListener('click', function () { alElegirZona(z.id); });
        g.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alElegirZona(z.id); }
        });
      }
      if (alPasar) {
        g.addEventListener('mouseenter', function () { alPasar(z); });
        g.addEventListener('focus', function () { alPasar(z); });
        g.addEventListener('mouseleave', function () { alPasar(null); });
        g.addEventListener('blur', function () { alPasar(null); });
      }
      capa.appendChild(g);
    });
  }

  function marcar(svg, idActiva, descartadas) {
    if (!svg) return;
    var zs = svg.querySelectorAll('.zona-m');
    for (var i = 0; i < zs.length; i++) {
      var id = zs[i].getAttribute('data-zona');
      zs[i].classList.toggle('activa', id === idActiva);
      zs[i].classList.toggle('descartada', !!(descartadas && descartadas.indexOf(id) >= 0));
    }
    svg.classList.toggle('con-activa', !!idActiva);
  }

  /* ---------------------------------------------------------------- */
  /* Refresco con los valores de la simulacion                         */
  /* ---------------------------------------------------------------- */
  function actualizar(svg, est, calc, alarmas) {
    if (!svg || !calc) return;
    var q = function (sel) { return svg.querySelector(sel); };

    /* --- Flujometros: la bobina sube con el caudal --- */
    function bobina(sel, lpm) {
      var e = q(sel); if (!e) return;
      var yBajo = 246, yAlto = 182;
      e.setAttribute('cy', (yBajo - (yBajo - yAlto) * Math.min(1, lpm / 10)).toFixed(1));
    }
    var fl = q('#vmFlush');
    if (fl) fl.classList.toggle('activo', !!est.circuito.flushActivo);

    bobina('#vmBobO2', calc.gasFresco.o2);
    bobina('#vmBobAire', calc.gasFresco.aire);
    bobina('#vmBobN2O', calc.gasFresco.n2o);

    /* --- Vaporizador --- */
    var ag = q('#vmAguja');
    if (ag) ag.setAttribute('transform',
      'rotate(' + (-120 + (est.vaporizador.dial / 8) * 240).toFixed(1) + ' 276 206)');
    var nv = q('#vmNivel');
    if (nv) nv.setAttribute('width', (68 * est.vaporizador.nivelLiquidoPct / 100).toFixed(1));

    /* --- Manometros de cilindro: aguja sobre escala de 270 grados --- */
    function aguja(sel, kPa, max) {
      var e = q(sel); if (!e) return;
      var f = Math.max(0, Math.min(1, kPa / max));
      e.setAttribute('transform', 'rotate(' + (-135 + f * 270).toFixed(1) + ' ' +
        e.getAttribute('x1') + ' ' + e.getAttribute('y1') + ')');
    }
    aguja('#vmManCilO2Aguja', calc.suministro.cilindro.o2, 15000);
    aguja('#vmManCilN2OAguja', calc.suministro.cilindro.n2o, 6000);
    var mo = q('#vmManCilO2');
    if (mo) mo.classList.toggle('alerta', est.suministro.cilindroAbierto.o2 && calc.suministro.cilindro.o2 < 3500);

    /* --- Fuelle: baja en inspiracion y no llega al tope si hay fuga --- */
    var v = calc.ventilacion;
    var f = q('#vmFuelle'), pl = q('#vmPliegues');
    if (f) {
      var comp;
      if (!v.hayVentilacion || v.vtEntregado <= 5) comp = 0.2;
      else comp = v.enInspiracion ? 1 - v.avanceFase * 0.7 : 0.3 + v.avanceFase * 0.7;
      var tope = typeof v.llenado === 'number' ? Math.max(0.15, v.llenado) : 1;
      comp = Math.min(comp, tope);
      var alto = 16 + 74 * comp;
      var yTop = 442 - alto;
      f.setAttribute('height', alto.toFixed(1));
      f.setAttribute('y', yTop.toFixed(1));
      f.classList.toggle('sin-tope', tope < 0.9);
      if (pl) {
        var hijos = pl.childNodes, n = hijos.length;
        for (var i = 0; i < n; i++) {
          var yy = yTop + alto * ((i + 1) / (n + 1));
          hijos[i].setAttribute('d',
            'M 88 ' + yy.toFixed(1) + ' L 124 ' + (yy + 3.2).toFixed(1) + ' L 160 ' + yy.toFixed(1));
        }
      }
    }

    /* --- Bolsa --- */
    var b = q('#vmBolsa');
    if (b) {
      var ll = est.circuito.desconectado ? 0.32
        : Math.max(0.34, Math.min(1, 0.55 + calc.gasFresco.fgf / 14 - est.circuito.fugaQ30 / 9000));
      b.setAttribute('rx', (22 * ll).toFixed(1));
      b.setAttribute('ry', (26 * ll).toFixed(1));
    }

    /* --- Valvulas --- */
    var vi = q('#vmValvInsp'), ve = q('#vmValvEsp');
    if (vi) vi.classList.toggle('abierta', v.hayVentilacion && v.enInspiracion);
    if (ve) ve.classList.toggle('abierta', v.hayVentilacion && !v.enInspiracion);

    /* --- Mangueras --- */
    var hi = q('#vmHoseInsp'), he = q('#vmHoseEsp');
    var hayFlujo = v.hayVentilacion || calc.gasFresco.fgf > 0.05;
    if (hi) { hi.classList.toggle('inactiva', !hayFlujo);
              hi.classList.toggle('desconectada', est.circuito.desconectado); }
    if (he) he.classList.toggle('inactiva', !hayFlujo);

    /* --- Linea de muestreo de gases --- */
    var lm = q('#vmLineaMuestreo');
    if (lm) lm.classList.toggle('ocluida', !calc.monitor.valido);
    var tr = svg.querySelector('.trampa-agua');
    if (tr) tr.classList.toggle('llena', est.monitoreo.trampaAgua === 'llena');

    /* --- Absorbedor: la cal vira desde arriba --- */
    var vr = q('#vmVirado');
    if (vr) vr.setAttribute('height', Math.max(4, 90 * Math.min(1, est.circuito.colorVirado)).toFixed(1));

    /* --- Pulmon --- */
    var pu = q('#vmPulmon');
    if (pu) {
      var esc = v.hayVentilacion && v.enInspiracion ? 1 + v.avanceFase * 0.14 : 1.01;
      if (!v.hayVentilacion) esc = 1;
      pu.setAttribute('transform', 'translate(486 517) scale(' + esc.toFixed(3) + ') translate(-486 -517)');
    }

    /* --- Pantalla del monitor --- */
    pintarTrazas(svg, est.historia);
    var led = q('#vmLed'), pan = q('#vmPantalla');
    var pri = alarmas && alarmas.maxPrioridad;
    if (led) led.setAttribute('class', 'led' + (pri ? ' pri-' + pri : ''));
    if (pan) pan.setAttribute('class', 'pantalla' + (pri === 'alta' ? ' alarma-alta' : ''));

    /* --- Suministro: tomas, mangueras y cilindro activo --- */
    ['o2', 'aire', 'n2o'].forEach(function (g) {
      var t = svg.querySelector('.toma.' + g), m = svg.querySelector('.manguera.' + g);
      var ok = est.suministro.tuberia[g] > 100;
      if (t) t.classList.toggle('sin-presion', !ok);
      if (m) m.classList.toggle('sin-presion', !ok);
    });
    var cO2 = q('#vmCilO2');
    if (cO2) cO2.classList.toggle('activo',
      est.suministro.cilindroAbierto.o2 && calc.suministro.fuenteActiva.o2 === 'cilindro');
    var cN2O = q('#vmCilN2O');
    if (cN2O) cN2O.classList.toggle('activo', est.suministro.cilindroAbierto.n2o);
  }

  /* Dos trazas pequenas dentro de la pantalla del monitor */
  function pintarTrazas(svg, historia) {
    if (!historia) return;
    var x0 = 140, x1 = 390;
    function puntos(datos, yTop, yBot, max) {
      if (!datos || !datos.length) return '';
      var n = Math.min(datos.length, 90);
      var ini = datos.length - n;
      var s = [];
      for (var i = 0; i < n; i++) {
        var x = x0 + (i / (n - 1)) * (x1 - x0);
        var val = Math.min(max, Math.max(0, datos[ini + i]));
        s.push(x.toFixed(1) + ',' + (yBot - (val / max) * (yBot - yTop)).toFixed(1));
      }
      return s.join(' ');
    }
    var a = svg.querySelector('#vmTrazaPaw');
    var b = svg.querySelector('#vmTrazaCapno');
    if (a) a.setAttribute('points', puntos(historia.presion, 24, 52, 45));
    if (b) b.setAttribute('points', puntos(historia.capno, 62, 88, 60));
  }

  return {
    ZONAS: ZONAS,
    zona: zona,
    markup: markup,
    preparar: preparar,
    marcar: marcar,
    actualizar: actualizar
  };
})();
