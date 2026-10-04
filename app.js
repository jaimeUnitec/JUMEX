/* =====================================================================
   Grupo Jumex · Inventario de Equipos de Impresión  —  Etapa 1
   SPA: Ubicaciones (mapa + plano + departamentos + equipos)
   Fuente de datos: Google Sheets (inventario de equipos)
   ===================================================================== */

/* ---------------------------------------------------------------------
   CONFIGURACIÓN
   --------------------------------------------------------------------- */
const CONFIG = {
  SHEET_ID: '1oBVTICQaBym4v99-ghs4c_-F_bnHI7MpjbUybB8zBQo',
  GID_EQUIPOS: '722318139',          // pestaña con el inventario (el "gid" de la URL)
  SHEET_COORDENADAS: 'Coordenadas',  // pestaña OPCIONAL para coordenadas exactas y planos
  MAP_CENTER: [23.6, -102.5],   // centro de la República (si no cargan los estados)
  MAP_ZOOM: 5
};

/* ---------------------------------------------------------------------
   MAPEO DE COLUMNAS
   Se reconocen por palabra clave, así que no importa el orden de las
   columnas ni los títulos de bloque ("BLOQUE 2 · EQUIPO …").
   --------------------------------------------------------------------- */
const FIELDS = {
  estado:      { match: h => h.endsWith('ubicacion') || h.endsWith('estado'),  label: 'Estado' },
  localidad:   { match: h => h.includes('localidad') || h.endsWith('planta'),   label: 'Localidad' },
  unidad:      { match: h => h.includes('unidad de negocio') || h.includes('unidad_negocio'), label: 'Unidad de negocio' },
  depto:       { match: h => h.includes('departamento'),                        label: 'Departamento' },
  modelo:      { match: h => h.includes('modelo') || h.includes('equipo_impresion'), label: 'Modelo' },
  serie:       { match: h => h.endsWith('serie'),                               label: 'No. de serie' },
  tipo:        { match: h => h.includes('tipo de equipo'),                      label: 'Tipo' },
  canal:       { match: h => h.endsWith('canal'),                               label: 'Canal' },
  periodo:     { match: h => h.endsWith('periodo'),                             label: 'Periodo' },
  cc:          { match: h => h.endsWith('centro de costo principal'),           label: 'Centro de costo' },
  responsable: { match: h => h.endsWith('responsable'),                         label: 'Responsable' },
  volumen:     { match: h => h.endsWith('volumen total'),                       label: 'Volumen total' },
  estatus:     { match: h => h.includes('estatus de uso'),                      label: 'Estatus de uso' },
  renta:       { match: h => h.includes('renta mensual'),                       label: 'Renta mensual' },
  subtotal:    { match: h => h.includes('subtotal'),                            label: 'Subtotal' },
  cpp:         { match: h => h.includes('costo por pagina'),                    label: 'Costo por página' },
  obs:         { match: h => h.includes('observaciones'),                       label: 'Observaciones' },
  lat:         { match: h => /(^| )latitud$/.test(h),                           label: 'Latitud' },
  lng:         { match: h => /(^| )longitud$/.test(h),                          label: 'Longitud' },
  plano:       { match: h => h.includes('plano'),                               label: 'Plano' }
};
const REQUIRED = ['localidad', 'modelo', 'serie'];

/* ---------------------------------------------------------------------
   COORDENADAS APROXIMADAS POR LOCALIDAD (centro de la ciudad/zona).
   Para ubicaciones exactas crea la pestaña "Coordenadas" en tu Sheet con:
   Localidad | Unidad_Negocio (opcional) | Latitud | Longitud | URL_Plano_Planta
   --------------------------------------------------------------------- */
const COORDS = {
  'cma fresh': [19.5745, -99.0445], 'cuautitlan': [19.6700, -99.1790], 'el peral izcalli': [19.6310, -99.2270],
  'los reyes la paz': [19.3600, -98.9800], 'naucalpan': [19.4785, -99.2396], 'tecamac': [19.7130, -98.9690],
  'toluca': [19.2826, -99.6557], 'tulpetlac': [19.5660, -99.0540], 'xalostoc': [19.5270, -99.0740],
  'la villa': [19.4840, -99.1170], 'merced': [19.4250, -99.1240], 'polanco': [19.4330, -99.1950],
  'polanco/museo': [19.4405, -99.2046], 'tlahuac': [19.2860, -99.0040], 'aguascalientes': [21.8853, -102.2916],
  'ensenada': [31.8667, -116.5964], 'mexicali': [32.6245, -115.4523], 'tijuana': [32.5149, -117.0382],
  'la paz': [24.1426, -110.3128], 'escarcega': [18.6090, -90.7440], 'tapachula': [14.9057, -92.2634],
  'tuxtla': [16.7530, -93.1150], 'chihuahua': [28.6320, -106.0691], 'juarez': [31.6904, -106.4245],
  'la junta': [28.4760, -107.3310], 'monclova': [26.9080, -101.4215], 'piedras negras': [28.7000, -100.5230],
  'saltillo': [25.4232, -101.0053], 'torreon': [25.5428, -103.4068], 'colima': [19.2433, -103.7250],
  'durango': [24.0277, -104.6532], 'irapuato': [20.6767, -101.3563], 'leon': [21.1250, -101.6860],
  'acapulco': [16.8531, -99.8237], 'pachuca': [20.1011, -98.7591], 'progreso': [20.2470, -99.1890],
  'atotonilco': [20.5510, -102.5130], 'guadalajara': [20.6597, -103.3496], 'tlajomulco': [20.4730, -103.4450],
  'morelia': [19.7060, -101.1950], 'zamora': [19.9850, -102.2830], 'cuernavaca': [18.9242, -99.2216],
  'tepic': [21.5040, -104.8950], 'guadalupe': [25.6770, -100.2590], 'monterrey': [25.6866, -100.3161],
  'huajuapan': [17.8040, -97.7760], 'oaxaca': [17.0732, -96.7266], 'puebla': [19.0414, -98.2063],
  'queretaro': [20.5888, -100.3899], 'cancun': [21.1619, -86.8515], 'chetumal': [18.5001, -88.2961],
  'cozumel': [20.5083, -86.9458], 'matehuala': [23.6480, -100.6440], 'rio verde': [21.9300, -99.9950],
  'san luis potosi': [22.1565, -100.9855], 'valles': [21.9850, -99.0100], 'culiacan': [24.8091, -107.3940],
  'los mochis': [25.7930, -108.9860], 'mazatlan': [23.2494, -106.4111], 'hermosillo': [29.0729, -110.9559],
  'magdalena de kino': [30.6260, -110.9620], 'obregon': [27.4830, -109.9300], 'san luis rio colorado': [32.4560, -114.7720],
  'villahermosa': [17.9892, -92.9475], 'laredo': [27.4760, -99.5160], 'reynosa': [26.0922, -98.2779],
  'tampico': [22.2331, -97.8611], 'victoria': [23.7369, -99.1411], 'poza rica': [20.5330, -97.4590],
  'san andres tuxtla': [18.4480, -95.2130], 'tuxpan': [20.9560, -97.4000], 'veracruz': [19.1738, -96.1342],
  'merida': [20.9674, -89.5926], 'zacatecas': [22.7709, -102.5833]
};

/* Colores por unidad de negocio */
const UNIT_COLORS = {
  'complejo': '#0b1f8f', 'centros de distribucion': '#2f8fd0', 'corporativo': '#7c3aed',
  'estrategico': '#f28c28', 'punto de traslado': '#0d9488', 'cma': '#65a30d', 'museo': '#db2777'
};
const unitColor = u => UNIT_COLORS[norm(u)] || '#64748b';

/* Datos de ejemplo (solo si no se puede leer la hoja) */
const DEMO_ROWS = [
  ['Estado de México', 'Tulpetlac', 'Complejo', 'Aséptica', 'ECOSYS M3655idn', 'R4P2Z21182', 'Monocromático', 'Normal', '3,120'],
  ['Estado de México', 'Tulpetlac', 'Complejo', 'Cuarto de control', 'ECOSYS M6230cidn', 'REZ3X02216', 'Color', 'Alto', '9,800'],
  ['Estado de México', 'Xalostoc', 'Corporativo', 'Compras', 'ECOSYS M3655idn', 'R4P2Z20529', 'Monocromático', 'Normal', '2,010'],
  ['CDMX', 'Polanco', 'Corporativo', 'Diseño', 'ECOSYS M6230cidn', 'REZ3201534', 'Color', 'Bajo', '410'],
  ['Nuevo León', 'Monterrey', 'Complejo', 'Microbiología', 'ECOSYS M2640idw/L', 'VRA2Y30947', 'Monocromático', 'Sin uso', '0']
].map(r => ({ estado: r[0], localidad: r[1], unidad: r[2], depto: r[3], modelo: r[4], serie: r[5], tipo: r[6], estatus: r[7], volumen: r[8] }));

/* ---------------------------------------------------------------------
   ESTADO
   --------------------------------------------------------------------- */
const state = {
  rows: [],
  plants: new Map(),      // key → { key, name, localidad, estado, unidad, lat, lng, approx, plano, depts: Map }
  coordsOverride: new Map(),
  selectedPlant: null,
  selectedDept: null,
  planoMode: 'plano',            // vista por defecto: Plano
  unitFilter: '',
  estadoFilter: null,
  query: '',
  source: 'demo'
};
let map, markers = new Map();

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const num = s => { const n = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
const fmt = n => n.toLocaleString('es-MX');
const blank = v => v == null || String(v).trim() === '' || norm(v) === 'sin dato';

/* ---------------------------------------------------------------------
   CARGA DE DATOS
   --------------------------------------------------------------------- */
function gvizUrl(params) {
  return `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&${params}&_=${Date.now()}`;
}

function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true, header: false, skipEmptyLines: true,
      complete: res => res.data?.length ? resolve(res.data) : reject(new Error('Hoja vacía')),
      error: err => reject(err)
    });
  });
}

/* Detecta la fila de encabezados (puede haber una fila de "BLOQUE …" arriba) y mapea columnas */
function mapTable(table) {
  for (let hRow = 0; hRow < Math.min(4, table.length - 1); hRow++) {
    const headers = table[0].map((_, c) => norm(table.slice(0, hRow + 1).map(r => r[c] ?? '').join(' ')));
    const idx = {};
    for (const [key, f] of Object.entries(FIELDS)) {
      const i = headers.findIndex(h => h && f.match(h));
      if (i >= 0) idx[key] = i;
    }
    if (REQUIRED.every(k => k in idx) || ('localidad' in idx && 'lat' in idx)) {
      return table.slice(hRow + 1).map(r => {
        const o = {};
        for (const [k, i] of Object.entries(idx)) o[k] = String(r[i] ?? '').trim();
        return o;
      });
    }
  }
  return null;
}

async function loadData() {
  setBadge('Cargando…', 'bg-slate-100 text-slate-500');
  let rows = null, source = 'demo';
  state.coordsOverride.clear();
  if (CONFIG.SHEET_ID) {
    try {
      const table = await fetchCsv(gvizUrl(`gid=${CONFIG.GID_EQUIPOS}`));
      rows = mapTable(table);
      if (!rows) throw new Error('no se reconocieron las columnas Localidad / Modelo / Serie');
      source = 'sheet';
    } catch (e) {
      console.error(e);
      toast('No se pudo leer Google Sheets (' + e.message + '). Mostrando datos de ejemplo.');
    }
    // Pestaña opcional de coordenadas
    try {
      const t = await fetchCsv(gvizUrl(`sheet=${encodeURIComponent(CONFIG.SHEET_COORDENADAS)}`));
      const c = mapTable(t);
      // Si la pestaña no existe, Google devuelve la primera hoja: se descarta porque no trae Latitud.
      if (c && c.length && 'lat' in c[0]) {
        for (const r of c) {
          if (!r.localidad) continue;
          const lat = parseFloat(String(r.lat).replace(',', '.')), lng = parseFloat(String(r.lng).replace(',', '.'));
          state.coordsOverride.set(norm(r.localidad) + '|' + norm(r.unidad), { lat, lng, plano: r.plano || '' });
        }
      }
    } catch (e) { /* pestaña opcional */ }
  }
  state.rows = (rows || DEMO_ROWS).filter(r => !blank(r.localidad) || !blank(r.serie));
  state.source = source;
  buildModel();
  setBadge(source === 'sheet' ? '● Google Sheets' : 'Datos de ejemplo',
           source === 'sheet' ? 'bg-jleaf/15 text-green-700' : 'bg-amber-100 text-amber-700');
  $('#lastUpdate').textContent = 'Actualizado: ' + new Date().toLocaleString('es-MX');
  renderUnitFilter();
  renderAll();
}

function buildModel() {
  state.plants.clear();
  // ¿Qué localidades tienen más de una unidad de negocio? (ej. Monterrey Complejo / CD)
  const unitsByLoc = new Map();
  for (const r of state.rows) {
    const l = norm(r.localidad);
    if (!unitsByLoc.has(l)) unitsByLoc.set(l, []);
    if (!unitsByLoc.get(l).includes(norm(r.unidad))) unitsByLoc.get(l).push(norm(r.unidad));
  }
  for (const r of state.rows) {
    const loc = blank(r.localidad) ? 'Sin ubicación' : r.localidad.trim();
    const unidad = blank(r.unidad) ? '' : r.unidad.trim();
    const key = norm(loc) + '|' + norm(unidad);
    if (!state.plants.has(key)) {
      const units = unitsByLoc.get(norm(r.localidad)) || [];
      const multi = units.length > 1;
      const ov = state.coordsOverride.get(key) || state.coordsOverride.get(norm(loc) + '|');
      let lat = NaN, lng = NaN, approx = false;
      if (ov && !isNaN(ov.lat) && !isNaN(ov.lng)) { lat = ov.lat; lng = ov.lng; }
      else if (COORDS[norm(loc)]) {
        [lat, lng] = COORDS[norm(loc)];
        approx = true;
        if (multi) { const k = units.indexOf(norm(unidad)); lat += k * 0.012; lng += k * 0.012; } // separa marcadores
      }
      state.plants.set(key, {
        key, localidad: loc, unidad, estado: blank(r.estado) ? '' : r.estado.trim(),
        name: multi && unidad ? `${loc} (${unidad})` : loc,
        lat, lng, approx, plano: ov?.plano || '', depts: new Map()
      });
    }
    const p = state.plants.get(key);
    const dept = blank(r.depto) ? 'Sin área' : r.depto.trim();
    if (!p.depts.has(dept)) p.depts.set(dept, []);
    p.depts.get(dept).push({ ...r, depto: dept, localidad: loc });
  }
}

/* Convierte enlaces de Google Drive a URL de imagen directa */
function directImageUrl(url) {
  if (!url) return '';
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([\w-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w2000` : url;
}

/* ---------------------------------------------------------------------
   RENDER GENERAL
   --------------------------------------------------------------------- */
const plantEquipCount = p => [...p.depts.values()].reduce((a, l) => a + l.length, 0);
const plantVolume = p => [...p.depts.values()].flat().reduce((a, e) => a + num(e.volumen), 0);

function renderAll() {
  const plants = [...state.plants.values()];
  animateNum('#stEstados', new Set(plants.map(p => norm(p.estado)).filter(e => e && e !== 'sin ubicacion')).size);
  animateNum('#stPlantas', plants.length);
  animateNum('#stDeptos', plants.reduce((a, p) => a + p.depts.size, 0));
  animateNum('#stEquipos', plants.reduce((a, p) => a + plantEquipCount(p), 0));
  if (statesLayer) statesLayer.setStyle(stateStyle);
  renderEstadoChip();
  renderMarkers();
  renderPlantList();
  if (state.selectedPlant && state.plants.has(state.selectedPlant)) selectPlant(state.selectedPlant, { keepDept: true, scroll: false });
  else closeDetail();
}

function renderUnitFilter() {
  const units = new Map();
  for (const p of state.plants.values()) if (p.unidad) units.set(norm(p.unidad), p.unidad);
  const box = $('#unitFilter');
  box.innerHTML = `<button class="unit-chip ${!state.unitFilter ? 'active' : ''}" data-u="">Todas</button>` +
    [...units.entries()].map(([k, u]) =>
      `<button class="unit-chip ${state.unitFilter === k ? 'active' : ''}" data-u="${esc(k)}"><span class="dot" style="background:${unitColor(u)}"></span>${esc(u)}</button>`).join('');
  box.querySelectorAll('.unit-chip').forEach(b => b.addEventListener('click', () => {
    state.unitFilter = b.dataset.u;
    renderUnitFilter(); renderMarkers(); renderPlantList();
  }));
}

/* Nombre de estado del Sheet → nombre en el mapa de estados */
const ESTADO_ALIAS = {
  'cdmx': 'ciudad de mexico', 'distrito federal': 'ciudad de mexico', 'df': 'ciudad de mexico',
  'estado de mexico': 'mexico', 'edomex': 'mexico', 'edo. mex.': 'mexico', 'edo mex': 'mexico',
  'coahuila de zaragoza': 'coahuila', 'michoacan de ocampo': 'michoacan', 'veracruz de ignacio de la llave': 'veracruz'
};
const estadoKey = e => { const k = norm(e); return ESTADO_ALIAS[k] || k; };

function plantMatches(p) {
  if (state.unitFilter && norm(p.unidad) !== state.unitFilter) return false;
  if (state.estadoFilter && estadoKey(p.estado) !== state.estadoFilter) return false;
  const q = norm(state.query);
  if (!q) return true;
  if (norm(p.name).includes(q) || norm(p.estado).includes(q)) return true;
  for (const [d, eqs] of p.depts) {
    if (norm(d).includes(q)) return true;
    if (eqs.some(e => norm(e.modelo).includes(q) || norm(e.serie).includes(q) || norm(e.responsable).includes(q))) return true;
  }
  return false;
}

/* ---------- Mapa ---------- */
let statesLayer = null, clusterLayer = null;
const STATE_STEPS = [[26, '#2563eb'], [11, '#60a5fa'], [6, '#93c5fd'], [3, '#bfdbfe'], [1, '#dbeafe'], [0, '#f8fafc']];
const stateFill = n => STATE_STEPS.find(([min]) => n >= min)[1];

function stateStats(featureName) {
  const k = estadoKey(featureName);
  let sedes = 0, eq = 0;
  for (const p of state.plants.values()) if (estadoKey(p.estado) === k) { sedes++; eq += plantEquipCount(p); }
  return { sedes, eq };
}

function stateStyle(f) {
  const { eq } = stateStats(f.properties.name);
  const sel = state.estadoFilter === estadoKey(f.properties.name);
  return { color: sel ? '#7cc242' : '#0b1f8f', weight: sel ? 3 : 1, opacity: sel ? 1 : .55,
           fillColor: stateFill(eq), fillOpacity: sel ? .75 : .6 };
}

function initMap() {
  map = L.map('map', { zoomControl: true, scrollWheelZoom: false, minZoom: 4, zoomSnap: 0.25 })
    .setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);

  // Mapas base gratuitos (no requieren API key)
  const claro = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16, attribution: 'Mapa base &copy; Esri'
  });
  const calles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  });
  claro.addTo(map);

  // División estatal
  if (window.MX_ESTADOS) {
    statesLayer = L.geoJSON(window.MX_ESTADOS, {
      style: stateStyle,
      onEachFeature: (f, layer) => {
        layer.bindTooltip(() => {
          const { sedes, eq } = stateStats(f.properties.name);
          return `<strong>${esc(f.properties.name)}</strong><br>${eq} equipos · ${sedes} sedes`;
        }, { sticky: true, className: 'state-tip' });
        layer.on({
          mouseover: e => { e.target.setStyle({ weight: 2.5, fillOpacity: .8 }); },
          mouseout: e => statesLayer.resetStyle(e.target),
          click: () => selectEstado(estadoKey(f.properties.name), layer)
        });
      }
    }).addTo(map);
  }

  // Agrupación de marcadores (si la librería cargó)
  clusterLayer = L.markerClusterGroup
    ? L.markerClusterGroup({
        showCoverageOnHover: false, maxClusterRadius: 38, spiderfyOnMaxZoom: true,
        iconCreateFunction: c => {
          const total = c.getAllChildMarkers().reduce((a, m) => a + (m.options.equipos || 0), 0);
          return L.divIcon({ className: 'jcluster-wrap', iconSize: [46, 46],
            html: `<div class="jcluster"><b>${total}</b><small>${c.getChildCount()} sedes</small></div>` });
        }
      })
    : L.featureGroup();
  clusterLayer.addTo(map);

  L.control.layers(
    { 'Mapa claro': claro, 'Calles (OpenStreetMap)': calles },
    Object.assign({ 'Sedes': clusterLayer }, statesLayer ? { 'División estatal': statesLayer } : {}),
    { collapsed: true, position: 'topright' }
  ).addTo(map);

  // Leyenda
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = () => {
    const d = L.DomUtil.create('div', 'map-legend');
    d.innerHTML = '<strong>Equipos por estado</strong>' +
      [...STATE_STEPS].reverse().map(([min, c], i, arr) => {
        const next = arr[i + 1]?.[0];
        const label = next ? (min === next - 1 ? `${min}` : `${min}–${next - 1}`) : `${min}+`;
        return `<span><i style="background:${c}"></i>${label}</span>`;
      }).join('');
    return d;
  };
  legend.addTo(map);

  // Botón "Ver todo México"
  const home = L.control({ position: 'topleft' });
  home.onAdd = () => {
    const b = L.DomUtil.create('button', 'map-home');
    b.title = 'Ver toda la República'; b.innerHTML = 'MX';
    L.DomEvent.on(b, 'click', e => { L.DomEvent.stop(e); selectEstado(null); });
    return b;
  };
  home.addTo(map);

  fitMexico();
  map.on('click', () => map.scrollWheelZoom.enable());
}

function fitMexico() {
  if (statesLayer) map.fitBounds(statesLayer.getBounds(), { padding: [10, 10] });
  else map.setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);
}

/* Filtra por estado al hacer clic en el mapa (clic de nuevo = quitar filtro) */
function selectEstado(key, layer) {
  state.estadoFilter = key && state.estadoFilter !== key ? key : null;
  if (statesLayer) statesLayer.setStyle(stateStyle);
  renderEstadoChip();
  renderMarkers();
  renderPlantList();
  if (state.estadoFilter && layer) map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 10 });
  else if (!state.estadoFilter) fitMexico();
}

function renderEstadoChip() {
  const box = $('#estadoChip');
  if (!box) return;
  if (!state.estadoFilter) { box.innerHTML = ''; return; }
  const f = window.MX_ESTADOS?.features.find(x => estadoKey(x.properties.name) === state.estadoFilter);
  box.innerHTML = `<button class="unit-chip active mb-2">Estado: ${esc(f?.properties.name || state.estadoFilter)} ✕</button>`;
  box.querySelector('button').addEventListener('click', () => selectEstado(null));
}

function makeIcon(p) {
  return L.divIcon({
    className: 'jmarker' + (p.key === state.selectedPlant ? ' active' : ''),
    html: `<div class="pin" style="background:${unitColor(p.unidad)}"><span>${plantEquipCount(p)}</span></div>`,
    iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34]
  });
}

function renderMarkers() {
  clusterLayer.clearLayers();
  markers.clear();
  for (const p of state.plants.values()) {
    if (isNaN(p.lat) || isNaN(p.lng) || !plantMatches(p)) continue;
    const n = plantEquipCount(p);
    const m = L.marker([p.lat, p.lng], { icon: makeIcon(p), title: p.name, equipos: n });
    m.bindPopup(`<strong style="color:#0b1f8f">${esc(p.name)}</strong><br>
      <span style="font-size:12px;color:#64748b">${esc(p.unidad)} · ${esc(p.estado)}<br>${p.depts.size} departamentos · ${n} equipos</span>`);
    m.on('click', () => selectPlant(p.key));
    markers.set(p.key, m);
    clusterLayer.addLayer(m);
  }
}

function focusMarker(key) {
  const m = markers.get(key);
  if (!m) return;
  if (clusterLayer.zoomToShowLayer) {
    clusterLayer.zoomToShowLayer(m, () => {
      if (map.getZoom() < 11) map.setView(m.getLatLng(), 11);
      m.openPopup();
    });
  } else {
    map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 11), { duration: .8 });
    m.openPopup();
  }
}

function refreshMarkerStyles() {
  markers.forEach((m, key) => { const p = state.plants.get(key); if (p) m.setIcon(makeIcon(p)); });
}

/* ---------- Lista lateral ---------- */
function renderPlantList() {
  const list = $('#plantList');
  const items = [...state.plants.values()].filter(plantMatches)
    .sort((a, b) => plantEquipCount(b) - plantEquipCount(a));
  $('#plantCount').textContent = `${items.length} de ${state.plants.size}`;
  list.innerHTML = items.length ? items.map(p => `
    <li class="plant-item ${p.key === state.selectedPlant ? 'active' : ''}" data-plant="${esc(p.key)}">
      <span class="plant-dot" style="background:${unitColor(p.unidad)}">${plantEquipCount(p)}</span>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold text-sm text-slate-800 truncate">${hl(p.name)}</span>
        <span class="block text-xs text-slate-400 truncate">${esc(p.estado)} · ${p.depts.size} deptos${isNaN(p.lat) ? ' · sin mapa' : ''}</span>
      </span>
      <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>
    </li>`).join('')
    : `<li class="text-sm text-slate-400 text-center py-8">Sin resultados.</li>`;
  list.querySelectorAll('[data-plant]').forEach(li => li.addEventListener('click', () => selectPlant(li.dataset.plant)));
}

function hl(text) {
  const raw = String(text ?? '');
  if (!state.query) return esc(raw);
  const n = norm(raw);
  const i = n.indexOf(norm(state.query));
  if (i < 0 || n.length !== raw.length) return esc(raw);
  const L2 = norm(state.query).length;
  return esc(raw.slice(0, i)) + '<mark>' + esc(raw.slice(i, i + L2)) + '</mark>' + esc(raw.slice(i + L2));
}

/* ---------------------------------------------------------------------
   DETALLE DE SEDE
   --------------------------------------------------------------------- */
function selectPlant(key, { keepDept = false, scroll = true } = {}) {
  const p = state.plants.get(key);
  if (!p) return;
  const changed = state.selectedPlant !== key;
  state.selectedPlant = key;
  if (!keepDept || changed || !p.depts.has(state.selectedDept)) state.selectedDept = null;
  if (changed) state.planoMode = 'plano';

  $('#plantDetail').classList.remove('hidden');
  $('#distNacional').classList.add('hidden');
  $('#pdUnit').textContent = [p.unidad, p.estado].filter(Boolean).join(' · ') || 'Sede seleccionada';
  $('#pdName').textContent = p.name;
  $('#pdCoords').textContent = isNaN(p.lat) ? 'Sin coordenadas (agrégalas en la pestaña Coordenadas)'
    : `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}${p.approx ? ' · ubicación aproximada' : ''}`;
  $('#pdDeptCount').textContent = `${p.depts.size} departamentos`;
  const vol = plantVolume(p);
  $('#pdEqCount').textContent = `${plantEquipCount(p)} equipos${vol ? ' · ' + fmt(vol) + ' págs.' : ''}`;

  if (!isNaN(p.lat) && changed) focusMarker(key);
  refreshMarkerStyles();
  renderPlantList();
  renderPlano();
  renderDepts();
  renderEquipos();
  if (scroll && changed) setTimeout(() => $('#plantDetail').scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
}

function closeDetail() {
  const wasOpen = !!state.selectedPlant;
  state.selectedPlant = null;
  state.selectedDept = null;
  $('#plantDetail').classList.add('hidden');
  $('#distNacional').classList.remove('hidden');
  renderNational();
  if (wasOpen) $('#distNacional').scrollIntoView({ behavior: 'smooth', block: 'start' });
  refreshMarkerStyles();
  renderPlantList();
}

function selectDept(dept) {
  state.selectedDept = state.selectedDept === dept ? null : dept;
  renderDepts();
  renderEquipos();
  document.querySelectorAll('.dept-rect, .pl-zone').forEach(g => g.classList.toggle('active', g.dataset.dept === state.selectedDept));
}

/* ---------- Plano / Esquema ---------- */
/* Busca el plano REAL de la sede, en este orden:
   1) URL_Plano_Planta de la pestaña "Coordenadas"
   2) Archivo en la carpeta planos/ con el nombre de la sede (ej. planos/tulpetlac.jpg)
   Si no hay ninguno, se dibuja un plano ilustrativo a partir del inventario. */
const planoCache = new Map();
function tryImage(url) {
  return new Promise(res => { const im = new Image(); im.onload = () => res(url); im.onerror = () => res(null); im.src = url; });
}
async function resolvePlano(p) {
  if (planoCache.has(p.key)) return planoCache.get(p.key);
  const slug = window.JumexPlano ? JumexPlano.slug(p) : '';
  const candidates = [];
  if (p.plano) candidates.push(directImageUrl(p.plano));
  if (slug) ['jpg', 'png', 'webp', 'jpeg'].forEach(ext => candidates.push(`planos/${slug}.${ext}`));
  let found = null;
  for (const c of candidates) { found = await tryImage(c); if (found) break; }
  planoCache.set(p.key, found);
  return found;
}

function bindZones(wrap) {
  wrap.querySelectorAll('.dept-rect, .pl-zone').forEach(g => g.addEventListener('click', () => selectDept(g.dataset.dept)));
}

async function renderPlano() {
  const p = state.plants.get(state.selectedPlant);
  const wrap = $('#planoWrap');
  document.querySelectorAll('#planoToggle .seg-btn').forEach(b => {
    b.disabled = false; b.title = '';
    b.classList.toggle('active', b.dataset.mode === state.planoMode);
  });

  if (state.planoMode === 'esquema') {
    wrap.innerHTML = buildSchematic(p);
    bindZones(wrap);
    return;
  }

  // Plano: primero el ilustrativo (inmediato) y, si existe, se reemplaza por el real
  wrap.innerHTML = window.JumexPlano ? JumexPlano.build(p, state.selectedDept) : buildSchematic(p);
  bindZones(wrap);
  const key = p.key;
  const real = await resolvePlano(p);
  if (real && state.selectedPlant === key && state.planoMode === 'plano') {
    wrap.innerHTML = `<div class="plano-real"><img src="${esc(real)}" alt="Plano de ${esc(p.name)}">
      <a href="${esc(real)}" target="_blank" rel="noopener" class="plano-open">Abrir en tamaño completo ↗</a></div>`;
  }
}

/* Esquema SVG de la sede generado a partir de sus departamentos */
function buildSchematic(p) {
  const depts = [...p.depts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  const n = depts.length;
  const cols = n <= 2 ? n : n <= 4 ? 2 : n <= 9 ? 3 : n <= 24 ? 4 : 5;
  const rows = Math.ceil(n / cols);
  const W = 640, pad = 24, gap = n > 24 ? 8 : 14, top = 44;
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const ch = n > 24 ? 62 : n > 9 ? 84 : 110;
  const H = top + rows * ch + (rows - 1) * gap + pad + 30;
  const fs = cols >= 5 ? 10 : cols === 4 ? 11.5 : 14;
  const maxChars = Math.floor((cw - 20) / (fs * 0.62));
  const palette = ['#0b1f8f', '#5fb4e5', '#7cc242', '#0d9488', '#7c3aed', '#2f8fd0'];

  let g = '';
  depts.forEach(([d, eqs], i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const inLast = Math.min(cols, n - r * cols);
    const offset = r === rows - 1 ? ((cols - inLast) * (cw + gap)) / 2 : 0;
    const x = pad + offset + c * (cw + gap), y = top + r * (ch + gap);
    const color = palette[i % palette.length];
    const label = d.length > maxChars ? d.slice(0, maxChars - 1) + '…' : d;
    const maxIcons = Math.floor((cw - 24) / 18);
    const printers = eqs.slice(0, maxIcons).map((e, k) =>
      `<rect x="${x + 14 + k * 18}" y="${y + ch - 20}" width="13" height="10" rx="2" fill="${norm(e.tipo) === 'color' ? '#f28c28' : color}" opacity=".85"/>`).join('');
    g += `
      <g class="dept-rect ${d === state.selectedDept ? 'active' : ''}" data-dept="${esc(d)}">
        <title>${esc(d)} — ${eqs.length} equipo(s)</title>
        <rect class="room" x="${x}" y="${y}" width="${cw}" height="${ch}" rx="8" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>
        <rect x="${x}" y="${y}" width="5" height="${ch}" rx="2.5" fill="${color}"/>
        <text x="${x + 13}" y="${y + fs + 8}" font-size="${fs}" font-weight="700" fill="#0f172a" font-family="Montserrat">${esc(label)}</text>
        <text x="${x + 13}" y="${y + fs * 2 + 12}" font-size="${fs - 2}" fill="#64748b" font-family="Montserrat">${eqs.length} equipo${eqs.length === 1 ? '' : 's'}</text>
        ${printers}
      </g>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Esquema de ${esc(p.name)}">
    <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="16" fill="none" stroke="#0b1f8f" stroke-width="2" stroke-dasharray="6 5" opacity=".35"/>
    <text x="${pad}" y="30" font-size="12" font-weight="700" fill="#0b1f8f" letter-spacing="1.5" font-family="Montserrat">${esc(p.name.toUpperCase())} · ESQUEMA</text>
    <g transform="translate(${W - pad - 150}, 20)" font-family="Montserrat" font-size="10" fill="#64748b">
      <rect width="11" height="9" rx="2" fill="#0b1f8f"/><text x="15" y="8">Mono</text>
      <rect x="60" width="11" height="9" rx="2" fill="#f28c28"/><text x="75" y="8">Color</text>
    </g>
    ${g}
    <g transform="translate(${W / 2 - 40}, ${H - 26})">
      <rect width="80" height="18" rx="9" fill="#7cc242"/>
      <text x="40" y="13" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="Montserrat">ACCESO</text>
    </g>
  </svg>`;
}

/* ---------- Departamentos ---------- */
function renderDepts() {
  const p = state.plants.get(state.selectedPlant);
  const box = $('#deptList');
  const entries = [...p.depts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  box.innerHTML = `<button class="dept-chip ${!state.selectedDept ? 'active' : ''}" data-dept="">Todos<span class="n">${plantEquipCount(p)}</span></button>` +
    entries.map(([d, eqs]) =>
      `<button class="dept-chip ${d === state.selectedDept ? 'active' : ''}" data-dept="${esc(d)}">${esc(d)}<span class="n">${eqs.length}</span></button>`
    ).join('');
  box.classList.toggle('max-h-44', entries.length > 12);
  box.classList.toggle('overflow-y-auto', entries.length > 12);
  box.querySelectorAll('.dept-chip').forEach(b => b.addEventListener('click', () => {
    b.dataset.dept ? selectDept(b.dataset.dept) : (state.selectedDept && selectDept(state.selectedDept));
  }));
}

/* ---------- Equipos ---------- */
function estatusBadge(v) {
  const k = norm(v);
  const cls = k === 'alto' ? 'b-alto' : k === 'normal' ? 'b-normal' : k === 'bajo' ? 'b-bajo' : 'b-sin';
  return `<span class="badge ${cls}">${esc(v)}</span>`;
}

function renderEquipos() {
  const p = state.plants.get(state.selectedPlant);
  let list = state.selectedDept ? p.depts.get(state.selectedDept) || [] : [...p.depts.values()].flat();
  const q = norm(state.query);
  if (q) {
    const filtered = list.filter(e => [e.modelo, e.serie, e.depto, e.responsable].some(v => norm(v).includes(q)));
    if (filtered.length) list = filtered;
  }
  $('#eqTitle').textContent = state.selectedDept ? `Equipos · ${state.selectedDept} (${list.length})` : `Todos los equipos (${list.length})`;

  const DETAIL = ['depto', 'localidad', 'estado', 'unidad', 'volumen', 'renta', 'cc', 'responsable', 'periodo', 'obs'];
  $('#eqList').innerHTML = list.length ? list.map((e, i) => {
    const tipo = blank(e.tipo) ? '' : `<span class="badge ${norm(e.tipo) === 'color' ? 'b-color' : 'b-mono'}">${esc(e.tipo)}</span>`;
    const est = blank(e.estatus) ? '' : estatusBadge(e.estatus);
    const rows = DETAIL.filter(k => !blank(e[k])).map(k => {
      const v = k === 'volumen' ? fmt(num(e[k])) + ' págs.' : e[k];
      return `<dt>${FIELDS[k]?.label || k}</dt><dd>${esc(v)}</dd>`;
    }).join('');
    return `
    <article class="eq-card" style="animation-delay:${Math.min(i, 10) * 30}ms">
      <div class="eq-icon">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/></svg>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <h4 class="font-bold text-sm text-jnavy mr-1">${hl(blank(e.modelo) ? 'Equipo sin modelo' : e.modelo)}</h4>${tipo}${est}
        </div>
        <dl class="eq-attr">
          <dt>No. Serie</dt><dd><span class="serial">${hl(e.serie || '—')}</span>
            ${e.serie ? `<button class="ml-1 text-jsky hover:text-jnavy text-[11px] font-semibold" data-copy="${esc(e.serie)}">Copiar</button>` : ''}</dd>
          ${rows}
        </dl>
      </div>
    </article>`;
  }).join('') : `<p class="text-sm text-slate-400 text-center py-8">Este departamento no tiene equipos registrados.</p>`;

  $('#eqList').querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Número de serie copiado'); }
    catch { toast(b.dataset.copy); }
  }));
}


/* ---------------------------------------------------------------------
   VISTA NACIONAL DE PLANOS
   --------------------------------------------------------------------- */
const UNIT_ORDER = ['corporativo', 'complejo', 'estrategico', 'centros de distribucion', 'punto de traslado', 'cma', 'museo'];
const nat = { mode: 'plano', unit: '', q: '', estado: '' };
let natObserver = null;

const pinSvg = c => `<svg width="18" height="22" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 30 12 30s12-9.6 12-18.3C24 5.2 18.6 0 12 0z" fill="${c}"/><circle cx="12" cy="11.5" r="4.6" fill="#fff"/></svg>`;

function natPlants() {
  const q = norm(nat.q);
  return [...state.plants.values()]
    .filter(p => !nat.unit || norm(p.unidad) === nat.unit)
    .filter(p => !nat.estado || norm(p.estado) === nat.estado)
    .filter(p => !q || norm(p.name).includes(q) || norm(p.estado).includes(q))
    .sort((a, b) => {
      const ua = UNIT_ORDER.indexOf(norm(a.unidad)), ub = UNIT_ORDER.indexOf(norm(b.unidad));
      return (ua < 0 ? 99 : ua) - (ub < 0 ? 99 : ub) || plantEquipCount(b) - plantEquipCount(a);
    });
}

function natTitle(p) {
  const tipo = (window.JumexPlano && JumexPlano.TITLES[norm(p.unidad)]) || p.unidad || 'Sede';
  return `${tipo} – ${p.localidad}`;
}

function renderNational() {
  if (!state.plants.size) return;
  // Filtros por unidad
  const units = new Map();
  for (const p of state.plants.values()) if (p.unidad) units.set(norm(p.unidad), p.unidad);
  $('#natUnits').innerHTML = `<button class="unit-chip ${!nat.unit ? 'active' : ''}" data-u="">Todas</button>` +
    [...units.entries()].sort((a, b) => UNIT_ORDER.indexOf(a[0]) - UNIT_ORDER.indexOf(b[0])).map(([k, u]) =>
      `<button class="unit-chip ${nat.unit === k ? 'active' : ''}" data-u="${esc(k)}"><span class="dot" style="background:${unitColor(u)}"></span>${esc(u)}</button>`).join('');
  $('#natUnits').querySelectorAll('.unit-chip').forEach(b => b.onclick = () => { nat.unit = b.dataset.u; renderNational(); });
  document.querySelectorAll('#natToggle .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === nat.mode));

  const list = natPlants();
  const eq = list.reduce((a, p) => a + plantEquipCount(p), 0);
  $('#natSubtitle').textContent = `${list.length} sedes · ${eq} impresoras · vista ${nat.mode === 'plano' ? 'de planos' : 'esquemática'}`;

  // Tarjetas (el plano se dibuja cuando la tarjeta entra en pantalla)
  if (natObserver) natObserver.disconnect();
  $('#natGrid').innerHTML = list.length ? list.map(p => natCardHtml(p)).join('') : '<p class="text-slate-400 text-sm p-6">Sin sedes para este filtro.</p>';
  const featured = [...list].sort((a, b) => plantEquipCount(b) - plantEquipCount(a)).slice(0, 4);
  $('#natFeatured').innerHTML = featured.map(p => natCardHtml(p, true)).join('');
  renderNatMap(list);
  // Estados disponibles
  const sel = $('#natEstado');
  const estados = [...new Map([...state.plants.values()].filter(p => p.estado).map(p => [norm(p.estado), p.estado])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  sel.innerHTML = '<option value="">Todos los estados</option>' + estados.map(([k, v]) => `<option value="${esc(k)}" ${nat.estado === k ? 'selected' : ''}>${esc(v)}</option>`).join('');

  natObserver = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) { natObserver.unobserve(en.target); drawNatCard(en.target); }
  }, { rootMargin: '300px' });
  document.querySelectorAll('#natGrid .nat-card, #natFeatured .nat-card').forEach(card => {
    natObserver.observe(card);
    card.addEventListener('click', () => selectPlant(card.dataset.key));
  });

  // Leyenda lateral: tipos de sede con sus localidades
  const groups = new Map();
  for (const p of list) {
    const k = norm(p.unidad);
    if (!groups.has(k)) groups.set(k, { u: p.unidad || 'Sin unidad', locs: [] });
    groups.get(k).locs.push(p.localidad);
  }
  $('#natLegend').innerHTML = `<h3 class="font-bold text-jnavy mb-3">Tipos de sede</h3>` +
    [...groups.values()].map(g => `<div class="nat-leg">
      ${pinSvg(unitColor(g.u))}
      <div class="min-w-0"><b>${esc(g.u)}</b> <span class="text-slate-400 text-xs">(${g.locs.length})</span>
      <p>${esc([...new Set(g.locs)].slice(0, 6).join(', '))}${g.locs.length > 6 ? '…' : ''}</p></div></div>`).join('');
}


function natCardHtml(p, small = false) {
  const c = unitColor(p.unidad);
  return `<article class="nat-card${small ? ' nat-small' : ''}" data-key="${esc(p.key)}" style="--uc:${c}">
    <header class="nat-head">
      <div class="min-w-0">
        <h3 class="nat-title">${esc(natTitle(p))}</h3>
        <p class="nat-sub">${esc(p.estado)}${p.unidad ? ' · ' + esc(p.unidad) : ''}</p>
      </div>
      <img src="logo-jumex.png" alt="" class="nat-logo">
    </header>
    <div class="nat-body"><div class="nat-ph">Cargando plano…</div></div>
    <footer class="nat-foot">
      <span>${p.depts.size} áreas · <b>${plantEquipCount(p)}</b> impresoras</span>
      <span class="nat-real hidden">● Plano real</span>
      ${small ? '' : '<button class="nat-btn">Ver detalle →</button>'}
    </footer>
  </article>`;
}

/* Mapa nacional estático (SVG) con pines por sede */
const PROJ = { lng0: -118.6, lat0: 32.9, k: 22 };
const proj = (lng, lat) => [(lng - PROJ.lng0) * PROJ.k, (PROJ.lat0 - lat) * PROJ.k * 1.06];
let natMapBase = null;
function natMapPaths() {
  if (natMapBase || !window.MX_ESTADOS) return natMapBase || '';
  const ring = r => r.map((c, i) => { const [x, y] = proj(c[0], c[1]); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join('') + 'Z';
  natMapBase = MX_ESTADOS.features.map(f => {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    return `<path d="${polys.map(pl => pl.map(ring).join('')).join('')}" fill="#e7ecf3" stroke="#fff" stroke-width="1"><title>${esc(f.properties.name)}</title></path>`;
  }).join('');
  return natMapBase;
}
function renderNatMap(list) {
  const pins = list.filter(p => !isNaN(p.lat)).sort((a, b) => b.lat - a.lat).map(p => {
    const [x, y] = proj(p.lng, p.lat);
    return `<g class="nat-pin" data-key="${esc(p.key)}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <title>${esc(p.name)} · ${plantEquipCount(p)} impresoras</title>
      <path d="M0 0 C-2 -6 -8 -9 -8 -15 A8 8 0 1 1 8 -15 C8 -9 2 -6 0 0Z" fill="${unitColor(p.unidad)}" stroke="#fff" stroke-width="1.5"/>
      <circle cy="-15" r="3.2" fill="#fff"/></g>`;
  }).join('');
  $('#natMap').innerHTML = `<svg viewBox="0 0 704 432" class="w-full h-auto">${natMapPaths()}${pins}</svg>`;
  const units = new Map(list.map(p => [norm(p.unidad), p.unidad]));
  $('#natMapLegend').innerHTML = [...units.values()].map(u => `<span class="inline-flex items-center gap-1">${pinSvg(unitColor(u)).replace('width="18" height="22"', 'width="11" height="14"')}${esc(u || 'Sin unidad')}</span>`).join('');
  $('#natPop').classList.add('hidden');
  document.querySelectorAll('#natMap .nat-pin').forEach(g => g.addEventListener('click', ev => { ev.stopPropagation(); showNatPop(g.dataset.key); }));
}
function showNatPop(key) {
  const p = state.plants.get(key); if (!p) return;
  const [x, y] = proj(p.lng, p.lat);
  const pop = $('#natPop');
  pop.style.setProperty('--uc', unitColor(p.unidad));
  pop.innerHTML = `<div class="nat-pop-head"><b>${esc(natTitle(p))}</b><button aria-label="Cerrar">✕</button></div>
    <div class="nat-pop-body">${window.JumexPlano ? JumexPlano.build(p, null, { compact: true }) : ''}</div>
    <div class="nat-pop-foot"><span>${p.depts.size} áreas · ${plantEquipCount(p)} impresoras</span><a href="#ubicaciones" data-key="${esc(key)}">Ver detalle →</a></div>`;
  const left = x / 704 * 100, top = y / 432 * 100;
  pop.style.left = Math.min(Math.max(left, 22), 62) + '%';
  pop.style.top = (top > 55 ? top - 58 : top + 3) + '%';
  pop.classList.remove('hidden');
  pop.querySelector('button').onclick = () => pop.classList.add('hidden');
  pop.querySelector('a').onclick = e => { e.preventDefault(); selectPlant(key); };
  resolvePlano(p).then(real => { if (real && !pop.classList.contains('hidden')) pop.querySelector('.nat-pop-body').innerHTML = `<img src="${esc(real)}" alt="">`; });
}

async function drawNatCard(card) {
  const p = state.plants.get(card.dataset.key);
  const body = card.querySelector('.nat-body');
  if (!p) return;
  if (nat.mode === 'esquema') { body.innerHTML = buildSchematic(p); return; }
  body.innerHTML = window.JumexPlano ? JumexPlano.build(p, null, { compact: true }) : buildSchematic(p);
  const real = await resolvePlano(p);
  if (real && card.isConnected && nat.mode === 'plano') {
    body.innerHTML = `<img src="${esc(real)}" alt="Plano de ${esc(p.name)}">`;
    card.querySelector('.nat-real').classList.remove('hidden');
  }
}

/* ---------------------------------------------------------------------
   NAVEGACIÓN (hash routing)
   --------------------------------------------------------------------- */
function route() {
  const view = location.hash.replace('#', '') || 'ubicaciones';
  const v = ['ubicaciones', 'dashboard'].includes(view) ? view : 'ubicaciones';
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('hidden', s.id !== `view-${v}`));
  document.querySelectorAll('#mainNav .nav-link').forEach(a => a.classList.toggle('active', a.dataset.view === v));
  if (v === 'ubicaciones' && map) setTimeout(() => map.invalidateSize(), 50);
}

/* ---------------------------------------------------------------------
   UTILIDADES UI
   --------------------------------------------------------------------- */
function setBadge(text, cls) {
  const b = $('#dataBadge');
  b.className = 'hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg ' + cls;
  b.textContent = text;
}
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 3500);
}
function animateNum(sel, to) {
  const el = $(sel); if (!el) return;
  const from = parseInt(el.textContent) || 0, t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / 600);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------------------
   INICIO
   --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  route();
  window.addEventListener('hashchange', route);
  $('#btnReload').addEventListener('click', loadData);
  $('#btnClose').addEventListener('click', closeDetail);
  $('#searchInput').addEventListener('input', e => {
    state.query = e.target.value.trim();
    renderMarkers(); renderPlantList();
    if (state.selectedPlant) renderEquipos();
  });
  document.querySelectorAll('#planoToggle .seg-btn').forEach(b => b.addEventListener('click', () => {
    if (b.disabled) return;
    state.planoMode = b.dataset.mode; renderPlano();
  }));
  document.querySelectorAll('#natToggle .seg-btn').forEach(b => b.addEventListener('click', () => {
    nat.mode = b.dataset.mode; renderNational();
  }));
  $('#natSearch').addEventListener('input', e => { nat.q = e.target.value.trim(); renderNational(); });
  $('#natEstado').addEventListener('change', e => { nat.estado = e.target.value; renderNational(); });
  loadData();
});
