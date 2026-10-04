# Guía de implementación — Etapa 1: Ubicaciones
**App web de inventario de equipos de impresión · Grupo Jumex**

---

## 1. Contenido del paquete

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página: encabezado, menú (Ubicaciones / Dashboard), mapa, lista y detalle de sede. |
| `styles.css` | Estilos visuales (colores, tarjetas, marcadores, esquema). |
| `app.js` | Lógica: lee Google Sheets, arma sedes/departamentos/equipos, mapa y búsqueda. **Aquí está la configuración.** |
| `estados-mx.js` | Límites de los 32 estados de México (capa de división estatal del mapa). |
| `plano.js` | Genera el plano ilustrativo de cada sede (zonas por tipo de área, impresoras, leyenda y logo). |
| `logo-jumex.png` | Logotipo de Grupo Jumex (encabezado, planos e ícono de pestaña). |
| `planos/` | Carpeta para los planos reales de cada sede (ver `planos/LEEME.txt`). |
| `fondo-jumex.jpg` | Foto de fondo del banner principal. Para cambiarla, reemplaza el archivo con el mismo nombre. |
| `plantilla_Coordenadas.csv` | Plantilla opcional con las 78 sedes y coordenadas aproximadas para corregir. |
| `GUIA_IMPLEMENTACION.md` | Este documento. |

`index.html`, `styles.css`, `app.js`, `plano.js`, `estados-mx.js`, `logo-jumex.png`, `fondo-jumex.jpg` y la carpeta `planos/` deben estar **siempre juntos en la misma carpeta**.

**Librerías (se cargan solas desde internet, no hay que instalar nada):** Tailwind CSS, Leaflet (mapa), Leaflet.markercluster (agrupa sedes cercanas), PapaParse (lectura del Sheet) y la fuente Montserrat.

**Mapa base:** Esri Light Gray (por defecto) y OpenStreetMap (seleccionable en el botón de capas, arriba a la derecha). Ninguno requiere API key. La división estatal se dibuja desde `estados-mx.js`, así que se ve aunque el mapa base no cargue.

---

## 2. Requisitos

- Navegador actualizado (Chrome, Edge o Firefox).
- Conexión a internet (para el mapa, las librerías y Google Sheets).
- El Google Sheet del inventario compartido como **"Cualquier persona con el enlace → Lector"**.

---

## 3. Implementación paso a paso

### Paso 1 — Descomprimir
Descomprime `jumex-ubicaciones.zip` en una carpeta de tu computadora, por ejemplo `Documentos/jumex-ubicaciones`.

### Paso 2 — Verificar el Google Sheet
1. Abre el Sheet del inventario.
2. **Compartir → Acceso general → "Cualquier persona con el enlace" → Lector.** (Ya estaba así al momento de la revisión.)
3. No es necesario cambiar columnas. La app reconoce automáticamente:
   `Ubicación` · `Localidad` · `Unidad de Negocio` · `Departamento / Área` · `Modelo de Equipo` · `Serie` · `Tipo de Equipo` · `Estatus de Uso` · `Volumen Total` · `Renta Mensual` · `Centro de Costo Principal` · `Responsable` · `Periodo` · `Observaciones`.
   Puedes reordenarlas o agregar otras; lo importante es **no renombrar** `Localidad`, `Modelo de Equipo` y `Serie` (son obligatorias).

### Paso 3 — Revisar la configuración (ya viene lista)
Abre `app.js` con un editor de texto (Bloc de notas o VS Code). Al inicio verás:

```js
const CONFIG = {
  SHEET_ID: '1oBVTICQaBym4v99-ghs4c_-F_bnHI7MpjbUybB8zBQo',
  GID_EQUIPOS: '722318139',
  SHEET_COORDENADAS: 'Coordenadas',
  ...
};
```

- `SHEET_ID`: el ID de tu hoja (entre `/d/` y `/edit` en la URL).
- `GID_EQUIPOS`: número de la pestaña del inventario (lo que aparece después de `gid=` en la URL). Si mueves los datos a otra pestaña, cambia este número.
- `SHEET_COORDENADAS`: nombre de la pestaña opcional de coordenadas.

### Paso 4 — Probar localmente
1. Doble clic en `index.html` (se abre en el navegador).
2. Arriba a la derecha debe aparecer **"● Google Sheets"** en verde.
3. Verifica: contadores (Estados, Sedes, Departamentos, Equipos), marcadores en el mapa, clic en una sede → esquema, departamentos y tarjetas de equipos.

> Si al abrirlo directamente aparece **"Datos de ejemplo"**, el navegador puede estar bloqueando la lectura desde un archivo local. Súbelo a un hosting (Paso 7) o ejecuta un servidor local:
> `python -m http.server 8000` dentro de la carpeta y abre `http://localhost:8000`.

### Paso 5 — Coordenadas exactas (recomendado)
Tu hoja no incluye coordenadas; la app usa el **centro de cada ciudad** (se indica "ubicación aproximada"). Para ubicar cada sede con precisión:

1. En el Google Sheet crea una pestaña nueva llamada exactamente **`Coordenadas`**.
2. **Archivo → Importar → Subir** → `plantilla_Coordenadas.csv` → *"Reemplazar hoja actual"*.
3. Columnas: `Localidad | Unidad_Negocio | Latitud | Longitud | URL_Plano_Planta`
4. Para cada sede: en Google Maps, clic derecho sobre el edificio → clic en los números para copiarlos → pega la latitud y longitud.
5. `Unidad_Negocio` solo se llena cuando una misma localidad tiene varias sedes (ya vienen: Monterrey, La Junta, Culiacán y Mérida).
6. El nombre en `Localidad` debe escribirse igual que en el inventario (los acentos y mayúsculas no importan).

### Paso 6 — Planos de planta
La pestaña **Plano** se muestra por defecto. Para cada sede la app busca, en este orden:
1. La URL en la columna `URL_Plano_Planta` de la pestaña `Coordenadas`.
2. Un archivo en la carpeta **`planos/`** con el nombre de la sede (la lista exacta está en `planos/LEEME.txt`, p. ej. `planos/tulpetlac.jpg`, `planos/monterrey-complejo.jpg`).
3. Si no encuentra ninguno, dibuja un **plano ilustrativo** con las áreas del inventario agrupadas por tipo (producción, almacén, oficinas, carga, calidad…), las impresoras de cada área, leyenda y logo. Lleva la nota "Plano ilustrativo… no a escala".

La opción más sencilla es la 2: copia las imágenes a `planos/` con el nombre indicado y vuelve a publicar la carpeta.
Las áreas del plano ilustrativo y del esquema son clicables y filtran las impresoras.
Al elegir una sede, "Distribución de la planta" muestra su plano; el botón **← Distribución nacional** regresa a la vista de todas las sedes.

### Paso 7 — Publicar para que otros la usen
**Opción A — Netlify Drop (la más rápida):**
1. Entra a https://app.netlify.com/drop (crea una cuenta gratuita).
2. Arrastra la **carpeta completa** `jumex-ubicaciones`.
3. Obtendrás una URL pública; puedes renombrarla en *Site settings*.
4. Para actualizar código, vuelve a arrastrar la carpeta en *Deploys*.

**Opción B — GitHub Pages:**
1. Crea un repositorio y sube todos los archivos y la carpeta `planos/`.
2. *Settings → Pages → Branch: main / root → Save*.
3. La URL quedará como `https://<usuario>.github.io/<repositorio>/`.

**Opción C — Servidor interno de Jumex:** copia todos los archivos y la carpeta `planos/` a cualquier servidor web (IIS, Apache, Nginx, SharePoint). No requiere backend ni base de datos.

> Importante: como la hoja es de lectura pública, cualquiera con el enlace del Sheet puede verla. Si la información es confidencial, publica la app solo en la red interna o valora en una siguiente etapa una conexión autenticada (Apps Script / API de Google).

---

## 4. Uso diario / mantenimiento

- **Actualizar datos:** edita el Google Sheet y presiona el botón 🔄 en la app (o recarga la página). No hay que tocar el código.
- **Agregar una sede nueva:** agrégala en el inventario; si su ciudad no está en la lista interna, agrégala en la pestaña `Coordenadas` para que aparezca en el mapa (si no, aparece en la lista con la leyenda "sin mapa").
- **Distribución de la planta (en Ubicaciones, debajo del mapa):** sin sede seleccionada muestra la vista nacional: incluye un mapa nacional con pines por tipo de sede (clic en un pin = ventana con su plano), las 4 sedes con más impresoras, filtro por estado y la galería completa.
  Los planos ilustrativos usan una plantilla distinta por tipo de sede (Planta industrial, CEDIS, Corporativo, Estratégico, Punto de traslado, Museo) con mobiliario por área.
- **Galería:** muestra todas las sedes en tarjetas con su plano, encabezado del color de su unidad de negocio y logo. Filtra por unidad o busca por sede/estado, alterna Plano/Esquema, y haz clic en una tarjeta para abrir su detalle. Las sedes con plano real en `planos/` muestran la etiqueta "● Plano real".
- **Buscar:** el buscador encuentra por sede, estado, departamento, modelo, serie o responsable.
- **Filtrar:** los botones de color filtran por Unidad de Negocio. Clic en un **estado** del mapa filtra sus sedes (clic otra vez o botón **MX** para ver toda la República).
- **Mapa:** los estados se colorean según el número de equipos; los círculos azules agrupan sedes cercanas (clic para abrirlos).

---

## 5. Comprobar que ves la versión más reciente
Al pie de la página debe decir **"Versión 3.0"**. Si no aparece, el navegador o el hosting están usando archivos anteriores:
- Reemplaza la carpeta completa (no solo algunos archivos) y, si usas Netlify/GitHub, vuelve a publicarla.
- En el navegador presiona **Ctrl + F5** (Windows) o **Cmd + Shift + R** (Mac) para recargar sin caché.

## 6. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| Dice "Datos de ejemplo" | Hoja no compartida, ID/gid incorrecto o archivo abierto localmente | Revisa Paso 2 y 3; prueba con servidor local o hosting (Paso 4/7). |
| Mensaje "no se reconocieron las columnas" | Se renombró `Localidad`, `Modelo de Equipo` o `Serie` | Restaura esos encabezados. |
| Una sede no aparece en el mapa | Ciudad sin coordenadas | Agrégala en la pestaña `Coordenadas`. |
| Marcador en lugar incorrecto | Coordenada aproximada | Corrige Latitud/Longitud en `Coordenadas`. |
| El plano no carga | Imagen no compartida o enlace de carpeta | Comparte la imagen (no la carpeta) como "Cualquier persona con el enlace". |
| Mapa en gris / "API KEY REQUIRED" | Versión anterior (CARTO) o red bloquea el mapa base | Usa esta versión; si la red bloquea Esri, cambia a "Calles (OpenStreetMap)" en el botón de capas. La división estatal se ve de todas formas. |
| No se ven los estados | Falta `estados-mx.js` en la carpeta | Súbelo junto con los demás archivos. |

---

## 7. Observaciones del inventario actual

- 2 equipos con **"SIN UBICACIÓN"**: aparecen en la lista, no en el mapa. Conviene asignarles localidad.
- **"CMA Fresh"** no es una ciudad; se ubicó provisionalmente cerca de Tulpetlac. Captura su dirección real en `Coordenadas`.
- Personaliza el logotipo: en `index.html` reemplaza el bloque marcado con el comentario del logo por `<img src="logo-jumex.png" class="h-10">` y coloca la imagen en la misma carpeta.

---

## 8. Checklist de cierre de Etapa 1

- [ ] Archivos descomprimidos en una carpeta
- [ ] Sheet compartido como lector
- [ ] App muestra "● Google Sheets"
- [ ] Pestaña `Coordenadas` creada y corregida
- [ ] Planos cargados (opcional)
- [ ] Logotipo oficial colocado
- [ ] App publicada (Netlify / GitHub Pages / servidor interno)
- [ ] URL compartida con los usuarios

**Siguiente:** Etapa 2 — Dashboard de KPIs (volumen por sede, estatus de uso, renta y costo por página), usando la misma hoja.
