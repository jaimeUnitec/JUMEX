/* =====================================================================
   Grupo Jumex · Generador de PLANOS ILUSTRATIVOS por sede  (v2)
   - Plantilla arquitectónica distinta por tipo de sede (Planta industrial,
     CEDIS, Corporativo, Estratégico, Punto de traslado, Museo).
   - Cada departamento del inventario se coloca en la zona que le
     corresponde (oficinas, almacén, producción, carga, calidad…) y se
     dibuja con su mobiliario (escritorios, racks, máquinas, andenes…).
   - Se usa cuando la sede aún no tiene plano real en "planos/".
   ===================================================================== */
(function () {
  const W = 1000, H = 620;

  /* ---------- Categorías de área ---------- */
  const CATS = [
    { k: 'calidad', name: 'Calidad y laboratorio',    color: '#9fdccc', re: /(calidad|lab\b|lab\.|laborator|microbio|quimic|investigacion)/ },
    { k: 'mtto',    name: 'Mantenimiento',            color: '#d6cf9c', re: /(mantenimiento|mtto|mecanic|ingenieria|proyecto)/ },
    { k: 'embot',   name: 'Embotellado',              color: '#9fd5f0', re: /(embotell|envasad|llenad)/ },
    { k: 'almacen', name: 'Almacén / Materia prima',  color: '#b7b9f0', re: /(almacen|materia prima|\bmp\b|refaccion|stock|picking|recibo|recepcion de mat|bahia|jaula|camaras)/ },
    { k: 'carga',   name: 'Logística y carga',        color: '#eccaa0', re: /(logistic|embarque|despacho|cmd|ewm|distribuc|devoluc|exportac|frontera|interplanta|traslado|rejas|carga|patio)/ },
    { k: 'prod',    name: 'Área de producción',       color: '#dbe9a0', re: /(produccion|enlatad|juguera|aseptic|botemex|lata|botella|concentrad|multiempaque|manufactura|cerrador|procesos|setes|tmp|planta)/ },
    { k: 'oficina', name: 'Oficinas administrativas', color: '#f3c0ab', re: /(oficina|administra|direccion|gerencia|finanzas|compras|factura|caja|ventas|rh\b|capital humano|seleccion|presidencia|planeacion|costos|liquida|menudeo|mayoreo|comercial|disen|papeleria|\bti\b|sap|monitoreo|uso comun|area comun|analista|supervisor|route|asistente|museo|inplant|ar\b|durango|laredo)/ },
    { k: 'serv',    name: 'Servicios',                color: '#dde2e9', re: /.*/ }
  ];
  const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
  const n0 = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const catOf = d => CATS.find(c => c.re.test(n0(d)));
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = n => Math.round(n * 10) / 10;

  const TITLES = {
    'complejo': 'Planta Industrial', 'centros de distribucion': 'CEDIS',
    'corporativo': 'Corporativo', 'estrategico': 'Centro Estratégico',
    'punto de traslado': 'Punto de Traslado', 'museo': 'Museo', 'cma': 'Planta CMA'
  };

  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- Treemap "squarified" ---------- */
  function squarify(items, x, y, w, h) {
    const total = items.reduce((a, b) => a + b.weight, 0) || 1;
    const nodes = items.map(i => ({ ...i, area: i.weight * (w * h) / total }));
    const out = []; let r = { x, y, w, h }; let row = [];
    const worst = (row, len) => {
      const s = row.reduce((a, b) => a + b.area, 0);
      const mx = Math.max(...row.map(q => q.area)), mn = Math.min(...row.map(q => q.area));
      return Math.max(len * len * mx / (s * s), (s * s) / (len * len * mn));
    };
    const place = row => {
      const s = row.reduce((a, b) => a + b.area, 0);
      if (r.w >= r.h) { const cw = s / r.h; let cy = r.y; row.forEach(q => { const ch = q.area / cw; out.push({ ...q, x: r.x, y: cy, w: cw, h: ch }); cy += ch; }); r = { x: r.x + cw, y: r.y, w: r.w - cw, h: r.h }; }
      else { const ch = s / r.w; let cx = r.x; row.forEach(q => { const cw = q.area / ch; out.push({ ...q, x: cx, y: r.y, w: cw, h: ch }); cx += cw; }); r = { x: r.x, y: r.y + ch, w: r.w, h: r.h - ch }; }
    };
    for (const nd of nodes) {
      const len = Math.min(r.w, r.h);
      if (!row.length || worst([...row, nd], len) <= worst(row, len)) row.push(nd);
      else { place(row); row = [nd]; }
    }
    if (row.length) place(row);
    return out;
  }

  /* =====================================================================
     MOBILIARIO por tipo de área (se dibuja dentro de cada recinto)
     ===================================================================== */
  const FUR = '#94a3b8', FURF = '#ffffff';
  const furniture = {
    oficina(r, R) {               // escritorios con silla
      let s = ''; const cw = 25, chh = 21;
      const cols = Math.floor((r.w - 10) / cw), rows = Math.floor((r.h - 10) / chh);
      if (cols < 1 || rows < 1) return '';
      const ox = r.x + (r.w - cols * cw) / 2 + 4, oy = r.y + (r.h - rows * chh) / 2 + 3;
      let n = 0;
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        if (n++ > 60) break;
        const x = ox + j * cw, y = oy + i * chh;
        s += `<rect x="${f1(x)}" y="${f1(y)}" width="16" height="8" rx="1" fill="${FURF}" stroke="${FUR}" stroke-width=".7"/><circle cx="${f1(x + 8)}" cy="${f1(y + 12)}" r="2.6" fill="none" stroke="${FUR}" stroke-width=".7"/>`;
      }
      return s;
    },
    almacen(r) {                  // racks paralelos
      let s = ''; const horiz = r.w >= r.h;
      const len = (horiz ? r.w : r.h) - 16, span = horiz ? r.h : r.w;
      const n = Math.min(24, Math.floor((span - 8) / 13));
      for (let i = 0; i < n; i++) {
        const o = 6 + i * 13 + (span - 8 - n * 13) / 2;
        s += horiz
          ? `<rect x="${f1(r.x + 8)}" y="${f1(r.y + o)}" width="${f1(len)}" height="5" fill="#d7dce4" stroke="${FUR}" stroke-width=".6"/>`
          : `<rect x="${f1(r.x + o)}" y="${f1(r.y + 8)}" width="5" height="${f1(len)}" fill="#d7dce4" stroke="${FUR}" stroke-width=".6"/>`;
      }
      return s;
    },
    prod(r, R) {                  // líneas de máquinas y tanques
      let s = ''; const lines = Math.max(1, Math.min(5, Math.floor((r.h - 10) / 26)));
      for (let i = 0; i < lines; i++) {
        const y = r.y + 10 + i * ((r.h - 20) / lines);
        s += `<line x1="${f1(r.x + 8)}" y1="${f1(y + 7)}" x2="${f1(r.x + r.w - 8)}" y2="${f1(y + 7)}" stroke="${FUR}" stroke-width="1" stroke-dasharray="3 2"/>`;
        let x = r.x + 10;
        while (x < r.x + r.w - 22) {
          const mw = 8 + R() * 22;
          if (R() < .25) s += `<circle cx="${f1(x + 6)}" cy="${f1(y + 7)}" r="6" fill="${FURF}" stroke="${FUR}" stroke-width=".8"/>`;
          else s += `<rect x="${f1(x)}" y="${f1(y + 2)}" width="${f1(mw)}" height="10" fill="${FURF}" stroke="${FUR}" stroke-width=".8"/>`;
          x += mw + 6 + R() * 8;
        }
      }
      return s;
    },
    embot(r, R) {                 // banda serpenteante con botellas
      let s = ''; const rows = Math.max(1, Math.min(4, Math.floor((r.h - 10) / 22)));
      let d = '';
      for (let i = 0; i < rows; i++) {
        const y = r.y + 12 + i * ((r.h - 24) / Math.max(1, rows - 1 || 1));
        d += i === 0 ? `M${f1(r.x + 10)} ${f1(y)} H${f1(r.x + r.w - 10)}` : ` V${f1(y)} H${f1(i % 2 ? r.x + 10 : r.x + r.w - 10)}`;
      }
      s += `<path d="${d}" fill="none" stroke="${FUR}" stroke-width="3" stroke-linejoin="round" opacity=".8"/>`;
      for (let x = r.x + 16; x < r.x + r.w - 12; x += 14) s += `<circle cx="${f1(x)}" cy="${f1(r.y + 12)}" r="2" fill="${FUR}"/>`;
      return s;
    },
    carga(r) {                    // carriles de andén con flechas y tarimas
      let s = ''; const lanes = Math.max(1, Math.min(4, Math.floor(r.h / 26)));
      for (let i = 0; i < lanes; i++) {
        const y = r.y + (i + .5) * (r.h / lanes);
        s += `<line x1="${f1(r.x + 8)}" y1="${f1(y)}" x2="${f1(r.x + r.w - 8)}" y2="${f1(y)}" stroke="${FUR}" stroke-dasharray="6 4"/>`;
        for (let x = r.x + 20; x < r.x + r.w - 20; x += 60) s += `<path d="M${f1(x)} ${f1(y - 3)} l6 3 l-6 3" fill="none" stroke="#64748b" stroke-width="1.1"/>`;
      }
      for (let x = r.x + 10; x < r.x + r.w - 14 && x < r.x + 10 + 9 * 12; x += 12) s += `<rect x="${f1(x)}" y="${f1(r.y + r.h - 12)}" width="8" height="7" fill="#e7d3b5" stroke="${FUR}" stroke-width=".6"/>`;
      return s;
    },
    calidad(r) {                  // mesas de laboratorio perimetrales + isla
      if (r.w < 30 || r.h < 26) return '';
      return `<rect x="${f1(r.x + 5)}" y="${f1(r.y + 5)}" width="${f1(r.w - 10)}" height="6" fill="${FURF}" stroke="${FUR}" stroke-width=".7"/>
        <rect x="${f1(r.x + 5)}" y="${f1(r.y + r.h - 11)}" width="${f1(r.w - 10)}" height="6" fill="${FURF}" stroke="${FUR}" stroke-width=".7"/>
        ${r.h > 50 ? `<rect x="${f1(r.x + r.w * .25)}" y="${f1(r.y + r.h / 2 - 5)}" width="${f1(r.w * .5)}" height="10" fill="${FURF}" stroke="${FUR}" stroke-width=".7"/>` : ''}`;
    },
    mtto(r, R) {                  // bancos de trabajo y equipo
      let s = '';
      for (let x = r.x + 8; x < r.x + r.w - 26; x += 34) s += `<rect x="${f1(x)}" y="${f1(r.y + 6)}" width="24" height="7" fill="${FURF}" stroke="${FUR}" stroke-width=".7"/>`;
      if (r.h > 44) for (let x = r.x + 14; x < r.x + r.w - 16; x += 30) s += `<rect x="${f1(x)}" y="${f1(r.y + r.h - 20)}" width="12" height="12" fill="none" stroke="${FUR}" stroke-width=".8"/><line x1="${f1(x)}" y1="${f1(r.y + r.h - 20)}" x2="${f1(x + 12)}" y2="${f1(r.y + r.h - 8)}" stroke="${FUR}" stroke-width=".6"/>`;
      return s;
    },
    serv(r) {                     // casilleros
      let s = '';
      for (let x = r.x + 6; x < r.x + r.w - 8 && x < r.x + 6 + 14 * 7; x += 7) s += `<rect x="${f1(x)}" y="${f1(r.y + 5)}" width="6" height="9" fill="${FURF}" stroke="${FUR}" stroke-width=".5"/>`;
      return s;
    },
    galeria(r) {                  // sala de exhibición ovalada
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      let s = `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r.w * .4)}" ry="${f1(r.h * .4)}" fill="#fff" stroke="#64748b" stroke-width="1.6"/>
        <ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r.w * .28)}" ry="${f1(r.h * .28)}" fill="none" stroke="${FUR}" stroke-dasharray="4 3"/>`;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; s += `<rect x="${f1(cx + Math.cos(a) * r.w * .34 - 4)}" y="${f1(cy + Math.sin(a) * r.h * .34 - 4)}" width="8" height="8" fill="#e2e8f0" stroke="${FUR}" stroke-width=".6"/>`; }
      return s;
    },
    juntas(r) {                   // mesa de juntas con sillas
      const tw = Math.min(r.w * .6, 150), th = Math.min(r.h * .35, 26);
      const x = r.x + (r.w - tw) / 2, y = r.y + (r.h - th) / 2;
      let s = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(tw)}" height="${f1(th)}" rx="${f1(th / 2)}" fill="#fff" stroke="#64748b" stroke-width=".9"/>`;
      const n = Math.floor(tw / 16);
      for (let i = 0; i < n; i++) { const cx = x + 8 + i * (tw - 16) / Math.max(1, n - 1); s += `<circle cx="${f1(cx)}" cy="${f1(y - 5)}" r="3" fill="none" stroke="${FUR}"/><circle cx="${f1(cx)}" cy="${f1(y + th + 5)}" r="3" fill="none" stroke="${FUR}"/>`; }
      return s;
    },
    nucleo(r) {                   // elevadores, escaleras, sanitarios
      const w3 = (r.w - 12) / 3;
      let s = '';
      ['Elev.', 'Escal.', 'WC'].forEach((t, i) => {
        const x = r.x + 6 + i * (w3 + 0);
        s += `<rect x="${f1(x)}" y="${f1(r.y + 6)}" width="${f1(w3 - 4)}" height="${f1(r.h - 12)}" fill="#fff" stroke="#64748b" stroke-width=".9"/>`;
        if (i === 1) for (let k = 0; k < 6; k++) s += `<line x1="${f1(x)}" y1="${f1(r.y + 10 + k * (r.h - 20) / 6)}" x2="${f1(x + w3 - 4)}" y2="${f1(r.y + 10 + k * (r.h - 20) / 6)}" stroke="${FUR}" stroke-width=".6"/>`;
        s += `<text x="${f1(x + (w3 - 4) / 2)}" y="${f1(r.y + r.h / 2 + 3)}" text-anchor="middle" font-size="8" fill="#64748b">${t}</text>`;
      });
      return s;
    }
  };

  /* =====================================================================
     PLANTILLAS por tipo de sede
     zones: { x,y,w,h, acc:[categorías que acepta], cat: mobiliario por defecto, label }
     ===================================================================== */
  const ALL = ['oficina', 'serv', 'calidad', 'mtto', 'almacen', 'carga', 'prod', 'embot'];

  function tplPlanta(R) {
    return {
      site: 'M28 76 H 744 L 786 118 V 606 H 28 Z',
      buildings: [
        { x: 96, y: 104, w: 470, h: 324, name: 'Nave de producción' },
        { x: 596, y: 104, w: 172, h: 196, name: 'Edificio administrativo' },
        { x: 596, y: 330, w: 172, h: 140, name: 'CEDIS / Embarques' }
      ],
      zones: [
        { x: 100, y: 108, w: 300, h: 206, acc: ['prod', 'embot'], cat: 'prod', label: 'Área de producción' },
        { x: 404, y: 108, w: 158, h: 206, acc: ['almacen'], cat: 'almacen', label: 'Almacén de materia prima' },
        { x: 100, y: 318, w: 230, h: 106, acc: ['calidad', 'mtto'], cat: 'mtto', label: 'Mantenimiento' },
        { x: 334, y: 318, w: 228, h: 106, acc: ['serv'], cat: 'serv', label: 'Servicios' },
        { x: 600, y: 108, w: 164, h: 188, acc: ['oficina'], cat: 'oficina', label: 'Oficinas administrativas' },
        { x: 600, y: 334, w: 164, h: 132, acc: ['carga'], cat: 'carga', label: 'Embarques' }
      ],
      docks: [{ x: 600, y: 470, n: 7 }, { x: 380, y: 428, n: 6 }],
      parking: [{ x: 38, y: 130, cols: 1, rows: 18, vert: false }, { x: 120, y: 500, cols: 14, rows: 1, vert: true }],
      trees: [{ x: 40, y: 480, w: 60, h: 100 }, { x: 560, y: 520, w: 210, h: 60 }],
      road: { y: 470, x1: 96, x2: 560 },
      entry: { x: 330, y: 600, label: 'Entrada principal' }
    };
  }
  function tplCedis(R) {
    return {
      site: 'M28 76 H 760 L 786 102 V 606 H 28 Z',
      buildings: [
        { x: 130, y: 104, w: 480, h: 330, name: 'Nave de almacenamiento' },
        { x: 636, y: 104, w: 132, h: 190, name: 'Oficinas' }
      ],
      zones: [
        { x: 134, y: 108, w: 472, h: 250, acc: ['almacen', 'prod', 'embot', 'calidad', 'mtto'], cat: 'almacen', label: 'Racks de almacenamiento' },
        { x: 134, y: 362, w: 472, h: 68, acc: ['carga'], cat: 'carga', label: 'Andenes de carga' },
        { x: 640, y: 108, w: 124, h: 182, acc: ['oficina', 'serv'], cat: 'oficina', label: 'Oficinas' }
      ],
      docks: [{ x: 150, y: 434, n: 20 }],
      trucks: { x: 150, y: 470, n: 20 },
      parking: [{ x: 640, y: 320, cols: 6, rows: 1, vert: true }, { x: 640, y: 380, cols: 6, rows: 1, vert: true }, { x: 38, y: 120, cols: 1, rows: 20, vert: false }],
      trees: [{ x: 636, y: 450, w: 140, h: 130 }],
      road: { y: 540, x1: 40, x2: 620 },
      entry: { x: 690, y: 600, label: 'Acceso' }
    };
  }
  function tplCorporativo(R) {
    return {
      site: 'M28 76 H 786 V 606 H 28 Z',
      buildings: [{ x: 90, y: 100, w: 676, h: 392, name: 'Edificio corporativo' }],
      zones: [
        { x: 94, y: 104, w: 668, h: 98, acc: ['oficina'], cat: 'oficina', label: 'Oficinas privadas' },
        { x: 94, y: 296, w: 300, h: 192, acc: ['oficina'], cat: 'oficina', label: 'Área abierta' },
        { x: 462, y: 296, w: 300, h: 192, acc: ['oficina'], cat: 'oficina', label: 'Área abierta' },
        { x: 94, y: 212, w: 228, h: 76, acc: ALL.filter(k => k !== 'oficina'), cat: 'juntas', label: 'Sala de juntas' },
        { x: 334, y: 212, w: 196, h: 76, acc: [], cat: 'nucleo', label: '' },
        { x: 542, y: 212, w: 220, h: 76, acc: ['serv'], cat: 'serv', label: 'Recepción' }
      ],
      parking: [{ x: 110, y: 520, cols: 34, rows: 1, vert: true }],
      trees: [{ x: 36, y: 100, w: 44, h: 390 }],
      entry: { x: 430, y: 600, label: 'Acceso principal' }
    };
  }
  function tplEstrategico(R) {
    return {
      site: 'M28 76 H 786 V 580 L 750 606 H 28 Z',
      buildings: [
        { x: 96, y: 104, w: 400, h: 300, name: 'Almacén' },
        { x: 524, y: 104, w: 244, h: 150, name: 'Oficinas' },
        { x: 524, y: 276, w: 244, h: 128, name: 'Patio de maniobras' }
      ],
      zones: [
        { x: 100, y: 108, w: 392, h: 292, acc: ['almacen', 'prod', 'embot', 'calidad', 'mtto'], cat: 'almacen', label: 'Almacén' },
        { x: 528, y: 108, w: 236, h: 142, acc: ['oficina', 'serv'], cat: 'oficina', label: 'Oficinas' },
        { x: 528, y: 280, w: 236, h: 120, acc: ['carga'], cat: 'carga', label: 'Andenes de carga' }
      ],
      docks: [{ x: 540, y: 404, n: 10 }, { x: 120, y: 404, n: 12 }],
      trucks: { x: 540, y: 440, n: 10 },
      parking: [{ x: 110, y: 470, cols: 20, rows: 1, vert: true }],
      trees: [{ x: 36, y: 100, w: 46, h: 300 }],
      road: { y: 545, x1: 40, x2: 760 },
      entry: { x: 640, y: 600, label: 'Acceso' }
    };
  }
  function tplTraslado(R) {
    return {
      site: 'M28 76 H 786 V 606 H 28 Z',
      buildings: [{ x: 110, y: 200, w: 600, h: 190, name: 'Cross-dock' }],
      zones: [
        { x: 114, y: 204, w: 150, h: 182, acc: ['oficina', 'serv', 'calidad', 'mtto'], cat: 'oficina', label: 'Oficina' },
        { x: 268, y: 204, w: 438, h: 182, acc: ['carga', 'almacen', 'prod', 'embot'], cat: 'carga', label: 'Zona de transferencia' }
      ],
      docks: [{ x: 290, y: 196, n: 16 }, { x: 290, y: 390, n: 16 }],
      trucksTop: { x: 290, y: 120, n: 16 },
      trucks: { x: 290, y: 420, n: 16 },
      parking: [{ x: 40, y: 220, cols: 1, rows: 10, vert: false }],
      trees: [{ x: 36, y: 480, w: 200, h: 100 }],
      entry: { x: 420, y: 600, label: 'Acceso' }
    };
  }
  function tplMuseo(R) {
    return {
      site: 'M28 76 H 786 V 606 H 28 Z',
      buildings: [{ x: 110, y: 104, w: 650, h: 390, name: 'Museo' }],
      zones: [
        { x: 114, y: 108, w: 360, h: 382, acc: [], cat: 'galeria', label: 'Galería principal' },
        { x: 478, y: 108, w: 278, h: 190, acc: ALL, cat: 'oficina', label: 'Administración' },
        { x: 478, y: 302, w: 278, h: 188, acc: ['serv', 'almacen', 'mtto'], cat: 'serv', label: 'Talleres y bodega' }
      ],
      parking: [{ x: 120, y: 520, cols: 30, rows: 1, vert: true }],
      trees: [{ x: 36, y: 100, w: 60, h: 390 }],
      entry: { x: 300, y: 600, label: 'Acceso al público' }
    };
  }
  const TEMPLATE_BY_UNIT = {
    'complejo': tplPlanta, 'cma': tplPlanta, 'centros de distribucion': tplCedis,
    'corporativo': tplCorporativo, 'estrategico': tplEstrategico,
    'punto de traslado': tplTraslado, 'museo': tplMuseo
  };

  /* ---------- texto en 1–2 líneas ---------- */
  function wrap(label, w, fs) {
    const maxC = Math.max(3, Math.floor((w - 6) / (fs * 0.56)));
    const words = label.split(/\s+/); const lines = [''];
    for (const wd of words) {
      const cur = lines[lines.length - 1];
      if ((cur + ' ' + wd).trim().length <= maxC) lines[lines.length - 1] = (cur + ' ' + wd).trim();
      else if (lines.length < 2) lines.push(wd);
      else { lines[1] += ' ' + wd; break; }
    }
    return lines.map(l => l.length > maxC ? l.slice(0, maxC - 1) + '…' : l).filter(Boolean);
  }
  const halo = 'stroke="#fff" stroke-width="3" paint-order="stroke" stroke-linejoin="round"';

  /* =====================================================================
     CONSTRUCCIÓN DEL PLANO
     ===================================================================== */
  function build(p, selectedDept, opts = {}) {
    const compact = !!opts.compact;
    const seed = hash(p.name);
    const R = rng(seed);
    const unitKey = n0(p.unidad);
    const T = (TEMPLATE_BY_UNIT[unitKey] || tplCedis)(R);

    // 1) Departamentos → categoría
    const depts = [...p.depts.entries()].map(([d, eqs]) => ({ d, eqs, cat: catOf(d).k, weight: 1 + eqs.length * 0.7 }));
    const totalEq = depts.reduce((a, b) => a + b.eqs.length, 0);

    // 2) Categoría → zonas que la aceptan (si ninguna, la zona "comodín" más grande que acepte oficinas o la mayor)
    const zones = T.zones.map(z => ({ ...z, items: [], load: 0 }));
    const accepting = cat => {
      let zs = zones.filter(z => z.acc.includes(cat));
      if (!zs.length) zs = zones.filter(z => z.acc.includes('oficina'));
      if (!zs.length) zs = zones.filter(z => z.acc.length);
      return zs;
    };
    depts.sort((a, b) => b.weight - a.weight).forEach(dp => {
      const zs = accepting(dp.cat);
      const z = zs.reduce((best, z) => (z.load / (z.w * z.h)) < (best.load / (best.w * best.h)) ? z : best, zs[0]);
      z.items.push(dp); z.load += dp.weight;
    });

    // 3) Dibujo de zonas
    let zonesSvg = '';
    const usedCats = new Set();
    for (const z of zones) {
      if (!z.items.length) {
        // zona sin departamentos: se dibuja como área genérica con su mobiliario
        const c = CAT[z.cat];
        const fill = c ? c.color : '#f1f5f9';
        if (c) usedCats.add(z.cat);
        zonesSvg += `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" fill="${fill}" fill-opacity=".35" stroke="#64748b" stroke-width=".8"/>`;
        zonesSvg += (furniture[z.cat] || (() => ''))({ x: z.x, y: z.y, w: z.w, h: z.h }, R);
        if (z.label) zonesSvg += `<text x="${f1(z.x + z.w / 2)}" y="${f1(z.cat === 'juntas' ? z.y + 12 : z.y + z.h / 2 + 4)}" text-anchor="middle" font-size="11" font-style="italic" fill="#64748b" ${halo}>${e(z.label)}</text>`;
        continue;
      }
      const cells = squarify(z.items, z.x, z.y, z.w, z.h);
      for (const c of cells) {
        const cat = CAT[c.cat]; usedCats.add(c.cat);
        // en plantillas de un solo tipo de zona, el mobiliario lo define la zona (ej. racks en CEDIS)
        const furCat = (z.acc.length > 2 && c.cat !== 'oficina' && c.cat !== 'carga') ? z.cat : c.cat;
        const act = c.d === selectedDept ? ' active' : '';
        const fs = Math.max(7, Math.min(12, c.h / 3.6, c.w / 7.5));
        const lines = (c.w > 30 && c.h > 18) ? wrap(c.d, c.w, fs) : [];
        const lh = fs * 1.15;
        const ty = c.y + c.h / 2 - (lines.length * lh) / 2 + fs * .85;
        const txt = lines.map((l, i) => `<text x="${f1(c.x + c.w / 2)}" y="${f1(ty + i * lh)}" text-anchor="middle" font-size="${f1(fs)}" font-weight="700" fill="#1e293b" ${halo}>${e(l)}</text>`).join('');
        // impresoras en la esquina superior izquierda
        const ic = Math.max(0, Math.min(14, c.h * .26, c.w * .22));
        let icons = '';
        if (ic >= 7) {
          const n = c.eqs.length, fit = Math.max(1, Math.floor((c.w - 8) / (ic + 2)));
          const k = Math.min(n, fit, 4);
          for (let i = 0; i < k; i++) icons += `<use href="#prn" x="${f1(c.x + 4 + i * (ic + 2))}" y="${f1(c.y + 4)}" width="${f1(ic)}" height="${f1(ic)}"/>`;
          if (n > k) icons += `<text x="${f1(c.x + 6 + k * (ic + 2))}" y="${f1(c.y + 4 + ic * .8)}" font-size="${f1(Math.max(7, ic * .7))}" font-weight="700" fill="#15803d" ${halo}>×${n}</text>`;
        }
        zonesSvg += `<g class="pl-zone${act}" data-dept="${e(c.d)}">
          <title>${e(c.d)} — ${c.eqs.length} impresora(s)</title>
          <rect class="pl-fill" x="${f1(c.x)}" y="${f1(c.y)}" width="${f1(c.w)}" height="${f1(c.h)}" fill="${cat.color}" fill-opacity=".72" stroke="#475569" stroke-width="1.1"/>
          <g pointer-events="none">${(furniture[furCat] || (() => ''))({ x: c.x, y: c.y, w: c.w, h: c.h }, R)}</g>
          ${txt}${icons}
        </g>`;
      }
    }

    // 4) Entorno: áreas verdes, estacionamiento, camino, andenes, camiones
    let env = '';
    for (const t of T.trees || []) {
      env += `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="6" fill="#ecfccb" stroke="#bef264" stroke-width=".8"/>`;
      const nt = Math.max(2, Math.floor(t.w * t.h / 900));
      for (let i = 0; i < Math.min(nt, 18); i++) env += `<circle cx="${f1(t.x + 8 + R() * (t.w - 16))}" cy="${f1(t.y + 8 + R() * (t.h - 16))}" r="${f1(4 + R() * 4)}" fill="#bbf7d0" stroke="#4ade80" stroke-width=".7"/>`;
    }
    for (const pk of T.parking || []) {
      for (let i = 0; i < pk.rows; i++) for (let j = 0; j < pk.cols; j++) {
        env += pk.vert
          ? `<rect x="${pk.x + j * 17}" y="${pk.y + i * 44}" width="12" height="36" rx="1" fill="#e2e8f0" stroke="#94a3b8" stroke-width=".6"/>`
          : `<rect x="${pk.x}" y="${pk.y + i * 15}" width="40" height="11" rx="1" fill="#e2e8f0" stroke="#94a3b8" stroke-width=".6"/>`;
      }
    }
    if (T.road) env += `<rect x="${T.road.x1}" y="${T.road.y}" width="${T.road.x2 - T.road.x1}" height="18" fill="#f1f5f9"/><line x1="${T.road.x1 + 6}" y1="${T.road.y + 9}" x2="${T.road.x2 - 6}" y2="${T.road.y + 9}" stroke="#cbd5e1" stroke-dasharray="10 8"/>`;
    const truck = (x, y, up) => `<rect x="${x}" y="${y}" width="13" height="42" rx="2" fill="#fff" stroke="#64748b" stroke-width=".8"/><rect x="${x + 1.5}" y="${up ? y + 31 : y + 1.5}" width="10" height="9" fill="#cbd5e1"/>`;
    if (T.trucks) for (let i = 0; i < T.trucks.n; i++) env += truck(T.trucks.x + i * 22, T.trucks.y, false);
    if (T.trucksTop) for (let i = 0; i < T.trucksTop.n; i++) env += truck(T.trucksTop.x + i * 22, T.trucksTop.y, true);
    let docks = '';
    for (const d of T.docks || []) for (let i = 0; i < d.n; i++) docks += `<rect x="${d.x + i * 22}" y="${d.y - 3}" width="13" height="7" fill="#334155"/>`;

    // 5) Edificios (muros) y nombres
    let bld = '';
    for (const b of T.buildings) {
      bld += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none" stroke="#1e293b" stroke-width="4"/>`;
      if (T.buildings.length > 1 && b.name) bld += `<text x="${b.x + b.w / 2}" y="${b.y - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">${e(b.name)}</text>`;
      // puerta de acceso al edificio
      bld += `<rect x="${b.x + b.w * .45}" y="${b.y + b.h - 2.5}" width="16" height="5" fill="#fff"/><path d="M${b.x + b.w * .45} ${b.y + b.h} a16 16 0 0 1 16 -16" fill="none" stroke="#64748b" stroke-width=".7"/>`;
    }
    const entry = T.entry ? `<g transform="translate(${T.entry.x},${T.entry.y})"><path d="M0 -16 l-7 11 h14 z" fill="#15803d"/><text x="0" y="0" text-anchor="middle" font-size="9.5" font-weight="700" fill="#15803d" dy="-20">${e(T.entry.label)}</text></g>` : '';

    // 6) Leyenda y marco
    const cats = CATS.filter(c => usedCats.has(c.k));
    let ly = 160;
    const legendItems = cats.map(c => { const r = `<rect x="814" y="${ly - 9}" width="14" height="11" fill="${c.color}" stroke="#64748b" stroke-width=".6"/><text x="834" y="${ly}" font-size="11" fill="#334155">${e(c.name)}</text>`; ly += 19; return r; }).join('');
    const legendExtra = `<use href="#prn" x="814" y="${ly - 10}" width="14" height="14"/><text x="834" y="${ly}" font-size="11" fill="#334155">Impresora</text>
      <rect x="814" y="${ly + 10}" width="14" height="10" fill="#e2e8f0" stroke="#94a3b8" stroke-width=".6"/><text x="834" y="${ly + 19}" font-size="11" fill="#334155">Estacionamiento</text>
      <circle cx="821" cy="${ly + 34}" r="5" fill="#bbf7d0" stroke="#4ade80"/><text x="834" y="${ly + 38}" font-size="11" fill="#334155">Área verde</text>
      <path d="M821 ${ly + 47} l-6 10 h12 z" fill="#15803d"/><text x="834" y="${ly + 57}" font-size="11" fill="#334155">Acceso</text>`;
    const legendH = (ly + 68) - 134;

    const tipo = TITLES[unitKey] || 'Sede';
    const title = `${tipo} – Grupo Jumex – ${p.localidad}`;

    return `<svg viewBox="${compact ? '20 68 774 548' : `0 0 ${W} ${H}`}" role="img" aria-label="Plano de ${e(p.name)}" font-family="Montserrat, sans-serif">
      <defs>
        <symbol id="prn" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#15803d"/><path d="M5 3.5h6v3H5z M3.6 7h8.8a1 1 0 0 1 1 1v3.6h-2V10H4.6v1.6h-2V8a1 1 0 0 1 1-1z M5 10.5h6v2.5H5z" fill="#fff"/></symbol>
      </defs>
      <rect width="${W}" height="${H}" fill="#ffffff"/>
      ${compact ? '' : `<text x="36" y="44" font-size="22" font-weight="700" fill="#1e293b">${e(title)}</text><line x1="36" y1="58" x2="${W - 36}" y2="58" stroke="#e2e8f0"/>`}
      <path d="${T.site}" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
      <g transform="translate(56,96)"><circle r="12" fill="#fff" stroke="#475569"/><path d="M0 -9 L5 6 L0 2 L-5 6 Z" fill="#334155"/><text y="-15" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">N</text></g>
      ${env}
      ${T.buildings.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#fff"/>`).join('')}
      ${zonesSvg}
      ${bld}${docks}${entry}
      ${compact ? '' : `
      <image href="logo-jumex.png" x="806" y="72" width="170" height="54" preserveAspectRatio="xMidYMid meet"/>
      <rect x="802" y="134" width="180" height="${legendH}" rx="6" fill="#fff" stroke="#cbd5e1"/>
      <text x="814" y="146" font-size="12" font-weight="700" fill="#0b1f8f">Leyenda</text>
      ${legendItems}${legendExtra}
      <text x="814" y="${134 + legendH + 22}" font-size="10" fill="#64748b">${depts.length} áreas · ${totalEq} impresoras</text>
      <text x="36" y="${H - 4}" font-size="9" fill="#94a3b8">Plano ilustrativo generado a partir del inventario (no a escala). Reemplázalo con el plano real en planos/${e(slug(p))}.jpg</text>`}
    </svg>`;
  }

  function slug(p) { return n0(p.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  window.JumexPlano = { build, slug, TITLES, n0 };
})();
