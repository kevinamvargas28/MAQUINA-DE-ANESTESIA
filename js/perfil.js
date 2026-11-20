/* =====================================================================
   SIMULADOR DE MAQUINA DE ANESTESIA - ENSAYO 1
   perfil.js  -  Perfil base configurable y catalogo de fuentes
   ---------------------------------------------------------------------
   Seccion 5.2 del documento de contexto tecnico.
   Los umbrales NO son constantes universales: son parametros de perfil,
   porque cambian entre maquinas (seccion 5 del documento).

   Etiquetas de evidencia:
     [M] consta en un manual, con cita
     [I] inferencia razonada
     [P] propuesta de diseno, sin validar
     [V] consta pero es ambiguo, hay que verificar
   ===================================================================== */

window.SIM = window.SIM || {};

/* ------------------------------------------------------------------ */
/* 1. CATALOGO DE FUENTES (seccion 2 del documento)                    */
/* ------------------------------------------------------------------ */

SIM.FUENTES = {
  M1:  { doc: 'Mindray WATO EX-55/65', tipo: 'Manual de servicio', ver: 'Rev. 1.1, 2009-03' },
  M2:  { doc: 'Datex-Ohmeda ADU S/5 y AS/3', tipo: 'Manual de referencia del usuario', ver: 'Doc. 8501703-2, 2003' },
  M3:  { doc: 'Mindray WATO EX-65', tipo: 'Manual del operador', ver: 'Rev. 1.0, 2009-01' },
  M4:  { doc: 'GE Carestation 620/650/650c (A1)', tipo: 'Manual de referencia del usuario', ver: '2076152-ES, sw rev. 01' },
  M5:  { doc: 'Mindray V60 Anesthetic Vaporizer', tipo: 'Manual del operador', ver: 'Nov. 2015' },
  M6:  { doc: 'ADOX AS3000', tipo: 'Manual operativo', ver: 'Ver 1.02, 2014' },
  M7:  { doc: 'Drager - Anestesia de flujo bajo, flujo minimo y flujo metabolico', tipo: 'Libro tecnico-clinico', ver: 's.f.' },
  M8:  { doc: 'SEMICYUC - Guia practica de torres de anestesia', tipo: 'Guia clinica con checklist', ver: '2020 aprox.' },
  M9:  { doc: 'Verbeke et al., When to replace a CO2 absorber?', tipo: 'Revision cientifica', ver: 'Acta Anaesth Belg 2023;74(1):43-48' },
  M10: { doc: 'Freas R., Oxygen: do you have enough?', tipo: 'Presentacion docente', ver: 's.f.' },
  M11: { doc: 'Drager Vapor 2000', tipo: 'Documentacion tecnica del vaporizador', ver: '11/1999 - marcada uso interno' },
  M12: { doc: 'Barletta M., How to test and troubleshoot the anesthesia machine', tipo: 'Hoja docente', ver: 's.f.' }
};

/* Aviso que acompana a las fuentes de menor jerarquia (seccion 2) */
SIM.FUENTES_AVISO = {
  M10: 'Material docente: debe respaldarse con una fuente mas formal antes de citarse en el documento final.',
  M12: 'Material docente de medicina veterinaria: debe respaldarse con una fuente mas formal.',
  M11: 'Documento marcado "for internal use only": confirmar con el director si puede citarse.'
};

/* ------------------------------------------------------------------ */
/* 2. PERFIL BASE PROPUESTO PARA LA VERSION 1 (seccion 5.2)            */
/* ------------------------------------------------------------------ */

SIM.PERFIL_BASE = {
  id: 'base-v1',
  nombre: 'Perfil base v1 (maquina generica)',
  nota: 'Eleccion entre fuentes, no un dato de una maquina real (seccion 12 del documento).',

  /* --- Suministro de gases ---------------------------------------- */
  suministro: {
    presionNominalTuberia:  { valor: 340,  unidad: 'kPa', ev: 'M', cita: 'M6 p.84; rango 280-600 kPa en M3 B-4 [226] y M4 11-6 [212]' },
    rangoTuberia:           { valor: [280, 600], unidad: 'kPa', ev: 'M', cita: 'M3 B-4 [226]; M4 11-6 [212]' },
    alarmaO2Baja:           { valor: 250,  unidad: 'kPa', ev: 'M', cita: 'M2 p.130 [138] y M6 coinciden en 250 kPa; M3 usa <220, M4 usa <252' },
    prioridadAlarmaO2:      { valor: 'alta', ev: 'M', cita: 'M1 5-5 [125]; M3 D-6 [256]; M4 7-11 [141]; M2 p.130 [138]' },
    corteN2O_bajo:          { valor: 172,  unidad: 'kPa', ev: 'V', cita: 'M6 p.17 - verificar a que gases corta' },
    corteN2O_repone:        { valor: 227,  unidad: 'kPa', ev: 'V', cita: 'M6 p.17 - histeresis' },
    o2MinimoMezcla:         { valor: 25,   unidad: '%',   ev: 'M', cita: 'M1 3-5 [41]; M3 B-5 [227]. M3 6-8 [90] dice >=21 %: discrepancia [V]' },
    cilindroO2Lleno:        { valor: 13800, unidad: 'kPa', ev: 'M', cita: 'M1 2-5 [21]: cilindros llenos 6,9-15 MPa' },
    cilindroN2OLleno:       { valor: 5100, unidad: 'kPa', ev: 'M', cita: 'M1 2-5 [21]' },
    factorCilindroE:        { valor: 0.28, unidad: 'min*L/(min*psi)', ev: 'M', cita: 'M10 diap. 2-3 (cilindro E, 625 L a 2216 psi)' },
    factorCilindroD:        { valor: 0.16, unidad: '-', ev: 'M', cita: 'M10 diap. 2-3 (cilindro D, 350 L)' },
    gasMotrizMin:           { valor: 280,  unidad: 'kPa', ev: 'M', cita: 'M3 B-8 [230]: gas motriz entregado 280-600 kPa' },
    gasMotrizDisparo:       { valor: 140,  unidad: 'kPa', ev: 'M', cita: 'M1 5-21 [141]: el interruptor se ajusta para disparar cerca de 0,14 MPa, dentro de 0,05-0,2 MPa' }
  },

  /* --- Ventilacion base ------------------------------------------- */
  ventilacion: {
    volumenTidal:    { valor: 500, unidad: 'mL',    ev: 'M', cita: 'M3 F-4 [272] (valor de fabrica)' },
    frecuencia:      { valor: 12,  unidad: '/min',  ev: 'M', cita: 'M3 F-4 [272]' },
    relacionIE:      { valor: '1:2', ev: 'M', cita: 'M3 F-4 [272]' },
    limitePresion:   { valor: 30,  unidad: 'cmH2O', ev: 'M', cita: 'M3 F-4 [272]' },
    peep:            { valor: 3,   unidad: 'cmH2O', ev: 'P', cita: 'Supuesto de diseno: PEEP baja de partida' },
    presionSostenidaSeg: { valor: 15, unidad: 's',  ev: 'M', cita: 'M1, M3 y M4 coinciden en 15 s, prioridad alta' },
    presionViaAereaBajaSeg: { valor: 20, unidad: 's', ev: 'M', cita: 'M3 D-1 [251] (Paw Too Low, 20 s); M4 7-11 [141] (20 s si FR>=4)' },
    limiteBajoPresion: { valor: 8, unidad: 'cmH2O', ev: 'P', cita: 'Pmin ajustable. M4 7-11 [141] dispara con Ppico < Pmin+4; M8 3.5 recomienda ajustar este limite para detectar fugas y desconexiones.' },
    prioridadPresionBaja: { valor: 'alta', ev: 'P', cita: 'Eleccion entre fuentes: M3 la pone alta, M4 media. Parametro del perfil.' },
    apneaSeg:        { valor: 20,  unidad: 's', ev: 'M', cita: 'M3 D-2 [252]; M4 7-6 [136] (retardo 10-30 s)' },
    apneaAltaSeg:    { valor: 120, unidad: 's', ev: 'M', cita: 'M3 D-2 [252] (Volume Apnea > 2 min, alta); M4 7-6 [136]' },
    fugaVTeUmbral:   { valor: 50,  unidad: '% de VTi', ev: 'M', cita: 'M4 7-7 [137]: VTesp < mitad de VTinsp' },
    fugaVTeSeg:      { valor: 30,  unidad: 's', ev: 'M', cita: 'M4 7-7 [137]: al menos 30 s' },
    prioridadFugaCircuito: { valor: 'media', ev: 'M', cita: 'M4 7-7 [137]; M3 D-6 [256] (Patient Circuit Leak, media)' }
  },

  /* --- Pruebas ----------------------------------------------------- */
  pruebas: {
    presionPruebaFuga:   { valor: 30,  unidad: 'cmH2O', ev: 'M', cita: 'M2 p.88 [96]; M12 p.1-2' },
    fugaAceptable:       { valor: 150, unidad: 'mL/min', ev: 'M', cita: 'M2 p.88 [96] (AUTO); M3 B-5 [227] (<=150 mL/min a 3 kPa)' },
    fugaAceptableManual: { valor: 100, unidad: 'mL/min', ev: 'M', cita: 'M2 p.88 [96] (chequeo MAN)' },
    fugaAceptableM12:    { valor: 350, unidad: 'mL/min', ev: 'M', cita: 'M12 p.1-2: sistema respiratorio <=350 mL/min a 30 cmH2O' },
    complianciaSistema:  { valor: [1, 10], unidad: 'mL/cmH2O', ev: 'M', cita: 'M2 p.88 [96]; p.169 [177]' },
    fraccionFugaEnVentilacion: { valor: 0.10, ev: 'M', cita: 'M2 p.169 [177]: con presion media 10 cmH2O e I:E 1:2 la fuga real es ~10 % de la medida en prueba' },
    caidaCilindroFugaAlta: { valor: 5000, unidad: 'kPa', ev: 'M', cita: 'M1 3-3 [39]; M3 6-5 [87]: caida >5000 kPa indica fuga' }
  },

  /* --- Absorbedor de CO2 ------------------------------------------ */
  absorbedor: {
    alarmaFiCO2Alta:   { valor: 4,  unidad: 'mmHg', ev: 'M', cita: 'M3 F-1 [269] (limite de fabrica)' },
    umbralCambio:      { valor: 0.5, unidad: '% (3-4 mmHg)', ev: 'M', cita: 'M9 p.43 y p.48; M8 3.1.3 usa 5 mmHg' },
    alarmaEtCO2Alta:   { valor: 50, unidad: 'mmHg', ev: 'M', cita: 'M3 F-1 [269]' },
    alarmaEtCO2Baja:   { valor: 15, unidad: 'mmHg', ev: 'M', cita: 'M3 F-1 [269]' },
    vidaPor100g:       { valor: [80, 125], unidad: 'min/100 g', ev: 'M', cita: 'M9 Tabla II p.45 (in vitro, MV 5 L/min, VCO2 0,160 L/min)' },
    masaCanister:      { valor: 2000, unidad: 'g', ev: 'M', cita: 'M6 5.6 p.19: ~2 kg de cal sodada' },
    fraccionValvulaIncompetente: { valor: 0.55, unidad: 'fraccion del maximo sin absorbedor', ev: 'P', cita: 'Supuesto de diseno: fraccion del volumen espirado que vuelve al paciente sin pasar por la cal cuando una valvula unidireccional no cierra. Ninguna de las fuentes citadas da esa fraccion.' },
    tempCanisterReaccion: { valor: 40, unidad: 'C', ev: 'P', cita: 'Supuesto de diseno. La reaccion de la cal sodada con el CO2 es exotermica, y de ahi que el canister se caliente mientras absorbe; las fuentes citadas mencionan el calor y la humedad del absorbedor pero no dan una temperatura.' },
    tempCanisterInerte:   { valor: 23, unidad: 'C', ev: 'P', cita: 'Supuesto de diseno: temperatura ambiente del quirofano, que es la que alcanza un canister que ya no reacciona.' },
    avanceCanisterCaliente: { valor: 0.95, unidad: 'fraccion de la vida util', ev: 'P', cita: 'Supuesto de diseno: por encima de este avance se considera que la cal ya no reacciona de forma apreciable y el canister se enfria.' }
  },

  /* --- Monitoreo de gases ----------------------------------------- */
  monitoreo: {
    prioridadFiO2Baja:       { valor: 'alta', ev: 'P', cita: 'Eleccion entre fuentes: M3 D-1 [251] y M4 7-9 [139] alta; M6 p.54 baja.' },
    prioridadLineaOcluida:   { valor: 'media', ev: 'P', cita: 'Eleccion entre fuentes: M3 D-9 [259] alta, M4 7-12 media.' },
    fiO2AlarmaBaja:          { valor: 28, unidad: '%', ev: 'M', cita: 'M7 3.6 p.48: fijar la alarma de FiO2 inspirada en 28 % para prevenir hipoxia' },
    celulaO2Minima:          { valor: 5,  unidad: '%', ev: 'M', cita: 'M3 D-7 [257]; M4 7-11 [141]: O2 medido <5 % = sensor defectuoso' },
    calibracionAireAmbiente: { valor: 21, unidad: '%', ev: 'M', cita: 'M3 7.5 [103]; M3 D-7 [257]' },
    flujoMuestraNominal:     { valor: 200, unidad: 'mL/min', ev: 'P', cita: 'Supuesto de diseno: M4 7-10 [140] habla de un porcentaje del nominal pero no da la cifra.' },
    flujoMuestraBajoPct:     { valor: 80, unidad: '% del nominal', ev: 'M', cita: 'M4 7-10 [140]: flujo de muestra bajo si cae por debajo del 80 % del nominal durante 20 s' },
    flujoViaAereaOcluida:    { valor: 20, unidad: 'mL/min', ev: 'M', cita: 'M3 D-9 [259]: bomba por debajo de 20 mL/min durante mas de 1 s' },
    agenteDesviacionPct:  { valor: 30, unidad: '% relativo al dial', ev: 'P', cita: 'Supuesto de diseno: umbral para declarar que lo entregado no coincide con lo fijado. M11 3.3 [PDF 16] solo documenta la desviacion por gas portador (10 % relativo, max 0,4 vol.%).' },
    presionCiclicaMaxMuestra:{ valor: 10, unidad: 'kPa', ev: 'M', cita: 'M3 8-6, 9-7: la exactitud se degrada con fuga del gas de muestra, golpes o presion ciclica mayor a 10 kPa' }
  },

  /* --- Vaporizador -------------------------------------------------- */
  vaporizador: {
    tecnologia:        { valor: 'mecanico de insercion (colector Selectatec)', ev: 'P', cita: 'Eleccion: es la tecnologia de M1, M3 y M4. M2 usa cassette electronico.' },
    pruebaContrapresionFlujo: { valor: 6, unidad: 'L/min', ev: 'M', cita: 'M1 3-5, 3-6 [41-42]; M3 6-8 [90]' },
    caidaMaximaContrapresion: { valor: 1, unidad: 'L/min', ev: 'M', cita: 'M1 3-5 [41]: el flujo no debe bajar mas de 1 L/min' },
    efectoGasPortador: { valor: 10, unidad: '% relativo (max 0,4 vol.%)', ev: 'M', cita: 'M11 3.3 [PDF 16]' },
    equilibrioTermico: { valor: 15, unidad: 'min por grado fuera de 10-40 C', ev: 'M', cita: 'M11 3.1 [PDF 14]' },
    contrapresionMax:  { valor: 150, unidad: 'mbar', ev: 'M', cita: 'M11 3.5 [PDF 18]' },
    nivelMinimoPct:    { valor: 20, unidad: '%', ev: 'P', cita: 'Supuesto de diseno: por debajo de esta marca la mampara se considera en reserva. Los manuales piden revisar el nivel pero no fijan un porcentaje.' },
    fugaColectorQ30:   { valor: 2200, unidad: 'mL/min', ev: 'P', cita: 'Supuesto de diseno calibrado para que el analizador de agente muestre una caida inequivoca sin detener la ventilacion. No hay caudal de fuga documentado para un vaporizador mal bloqueado.' },
    caidaRestriccionSalida: { valor: 1.8, unidad: 'L/min', ev: 'P', cita: 'Supuesto de diseno: supera el limite de 1 L/min que M1 3-5 [41] acepta en la prueba de contrapresion, para que la prueba falle sin ambiguedad.' },
    fugaDialCerradoQ30: { valor: 0, unidad: 'mL/min', ev: 'I', cita: 'Se asume que con el dial en cero las valvulas de puerto del vaporizador cierran el paso y la fuga del colector no se manifiesta. Por eso la prueba de fuga se repite con el vaporizador encendido (M1 3-5, 3-6 [41-42]; M3 6-8 [90] exigen probar con el vaporizador en funcionamiento).' }
  },

  /* --- Paciente y metabolismo -------------------------------------- */
  paciente: {
    peso:    { valor: 70,   unidad: 'kg',    ev: 'P', cita: 'Supuesto de diseno: adulto de referencia' },
    vo2:     { valor: 3.5,  unidad: 'mL/min/kg', ev: 'M', cita: 'M7 3.1 p.30-31' },
    vco2:    { valor: 0.16, unidad: 'L/min', ev: 'M', cita: 'M9 p.44 (0,13-0,16 L/min en el adulto bajo anestesia)' },
    espacioMuertoVdVt: { valor: 0.33, ev: 'P', cita: 'Supuesto de diseno: necesario para convertir ventilacion minuto en alveolar.' },
    volumenSistema: { valor: 6, unidad: 'L', ev: 'P', cita: 'Supuesto de diseno: volumen del circuito mas capacidad funcional residual.' }
  },

  /* --- Alarmas: presentacion --------------------------------------- */
  alarmas: {
    pausaAudioSeg: { valor: 120, unidad: 's', ev: 'M', cita: 'M4 7-2 [132]; M6 p.52' },
    colores: {
      alta:  { color: '#ff4d4f', patron: 'parpadeo rapido', ev: 'M', cita: 'M3 11-1, 11-2 [141-142] (rojo rapido); M4 (rojo)' },
      media: { color: '#ffc53d', patron: 'parpadeo lento',  ev: 'M', cita: 'M3 11-1, 11-2 [141-142] (amarillo lento); M4 (amarillo)' },
      baja:  { color: '#ffd666', patron: 'fijo',            ev: 'M', cita: 'M3 11-1, 11-2 [141-142] (amarillo fijo); M4 usa azul' }
    }
  }
};

/* Acceso corto a un valor del perfil: SIM.pv('suministro.alarmaO2Baja') */
SIM.pv = function (ruta, perfil) {
  var p = perfil || SIM.PERFIL_BASE;
  var partes = ruta.split('.');
  var nodo = p;
  for (var i = 0; i < partes.length; i++) {
    if (nodo === undefined || nodo === null) return undefined;
    nodo = nodo[partes[i]];
  }
  return nodo && nodo.valor !== undefined ? nodo.valor : nodo;
};

/* Devuelve el objeto completo (valor + evidencia + cita) para la capa 3 */
SIM.pref = function (ruta, perfil) {
  var p = perfil || SIM.PERFIL_BASE;
  var partes = ruta.split('.');
  var nodo = p;
  for (var i = 0; i < partes.length; i++) {
    if (nodo === undefined || nodo === null) return undefined;
    nodo = nodo[partes[i]];
  }
  return nodo;
};
