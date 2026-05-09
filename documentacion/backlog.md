# Backlog de desarrollo

---

## Pendiente

### Alta prioridad
- **QR Nequi real** — reemplazar `/public/images/nequi-qr.svg` con el QR real de Lara. Solo cambiar el archivo.
- **`/productos/[id]` desde Firestore** — hoy usa datos de `lib/data.ts`. Si Lara edita un producto desde el admin, el detalle no lo refleja.
- **SEO de productos creados en Firestore** — definir si los productos SEO viven en `lib/data.ts`, si se sincronizan desde Firestore antes del build o si se migra a SSR/ISR.
- ~~**Instagram en el footer**~~ — agregado: https://www.instagram.com/lara.bakeryy/

### Media prioridad
- **Validación 24h en formulario al submit** — hoy solo bloquea el input de fecha. Un usuario técnico podría enviarlo igualmente. Agregar validación al momento de guardar en `confirmOrder()`.
- **Validación segura de edición/eliminación de pedidos pendientes** — la UI y reglas lo permiten; conviene agregar validación defensiva en una capa backend cuando existan Functions productivas.
- **Filtros por categoría en catálogo** — útil si el catálogo crece.
- **Gestión de roles desde UI** — hoy agregar un admin requiere editar código. Podría ser un toggle en el detalle de usuario dentro del admin.
- **Historial de cambios por pedido** — registrar quién cambió el estado y cuándo.
- **Índices Firestore** — cuando el volumen de pedidos crezca, pueden necesitarse índices compuestos para consultas con múltiples `where` y `orderBy`.

### Baja prioridad
- **Búsqueda de productos en catálogo** — útil con catálogo grande.
- **Reportes por rango de fecha** — filtrar ventas por semana/mes seleccionado.
- **Mejoras de accesibilidad** — revisar contraste, foco de teclado, atributos ARIA.
- **Notificación a Lara cuando llega un pedido** — por email o WhatsApp automático (requeriría Firebase Functions).
- **Limpiar archivos duplicados/sobrantes** — revisar archivos con sufijo ` 2` y reglas temporales antes de entregar o mantener rama principal.

---

## Completado

### Sesión 3 — 2026-05-09
- SEO inicial implementado: metadata por rutas públicas, metadata dinámica de productos estáticos, canonicals, OpenGraph, Twitter cards, JSON-LD de negocio local/producto, `sitemap.xml`, `robots.txt` y señales locales de Medellín.
- Dashboard `/admin` actualizado con selector mes/año, ventas del mes, ganancia estimada, ticket promedio, pedidos, cobros, costos, cobertura de costos, gráfica de ventas diarias, distribución de estados/pagos, productos más pedidos, productos por ingresos y últimos pedidos.
- Productos con variantes/tamaños y precio propio (`variants`) para tortas.
- Formulario de pedido soporta selección de variante y guarda nombre/precio histórico de la variante.
- Admin `/pedidos`: formulario de pedido manual para pedidos tomados por WhatsApp u otros canales.
- Admin `/pedidos`: eliminación de pedidos desde lista y detalle.
- Admin `/pedidos/[id]`: edición de datos del cliente, entrega, items, cantidades, precios y notas.
- Cliente `/mis-pedidos`: edición y eliminación de pedidos propios mientras estén en estado `pendiente`.
- Firestore rules actualizadas para permitir edición/eliminación del dueño solo mientras el pedido esté `pendiente`.
- `firebase-store.ts`: nuevas funciones `createManualOrder`, `updateOrderDetails` y `deleteOrder`.
- Scaffold de Firebase Functions/Genkit agregado en `functions/` para futuras automatizaciones.

### Sesión 2 — 2026-05-08
- Hero home compacto para mobile (imagen oculta en mobile, `min-h` eliminado).
- Admin `/pedidos/[id]` conectado a Firestore (antes usaba datos estáticos).
- Admin `/productos` con CRUD: toggle disponible/activar, edición inline, crear producto nuevo. Seed button eliminado.
- Admin `/pedidos` con búsqueda (ID/nombre/teléfono) y filtro por estado.
- Admin layout: `AdminGuard` envuelve sidebar + contenido; nav mobile horizontal con scroll.
- `/mis-pedidos` con `StatusPill` con color para estado de pedido y pago.
- Formulario de pedido: validación de fecha mínima 24h (timezone Colombia).
- `SiteFooter` con WhatsApp y copyright.
- `StatusPill` con colores automáticos por valor (sin necesidad de pasar `tone` manual).
- `formatStatus()` en `lib/data.ts` para mostrar etiquetas legibles.
- Tildes y acentos corregidos en toda la UI.

### Sesión 1 — 2026-05-08
- Navegación mobile con `BottomNav` (Inicio, Productos, Pedir, Mis pedidos, Admin).
- WhatsApp float visible en mobile con posición adaptada por ruta.
- Datos de pago reales: Nequi 301 248 1041 / Lara Bakery + QR placeholder.
- Mensaje de WhatsApp prellenado con número de pedido, nombre y total.
- ID de pedido formato `LB-YYMMDD-NN` con contador diario en Firestore.
- Nombre del usuario en el header cuando está logueado.
- Admin `/costos` conectado a Firestore.
- Admin `/reportes` conectado a Firestore.
- Botones +/− de cantidad en el formulario de pedido.
- Barra sticky mobile en `/pedido` con total y botón de confirmar.
- Imagen QR placeholder para Nequi.

### Base inicial — 2026-05-08
- Firebase Auth con Google.
- Perfiles de usuario en Firestore.
- Catálogo público con fallback a `lib/data.ts`.
- Flujo de pedido completo con guardado en Firestore.
- Vista "Mis pedidos" filtrada por usuario.
- Panel admin con listado y cambio de estado de pedidos.
- Reglas Firestore iniciales.
- Guard visual para `/admin`.
- Export estático con Firebase Hosting.
