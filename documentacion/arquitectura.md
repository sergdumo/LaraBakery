# Arquitectura y estructura técnica

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Render | Export estático — `output: "export"` |
| UI | React 19 · TypeScript · Tailwind CSS |
| Autenticación | Firebase Auth (Google Sign-In) |
| Base de datos | Firebase Firestore |
| Hosting | Firebase Hosting — https://larabakery.web.app |
| Automatización | Firebase Functions 2nd Gen |
| Fallback de datos | `lib/data.ts` |

El sitio genera HTML/JS estático en el build y Firebase lo sirve sin servidor. Toda la lógica de datos es client-side con el SDK de Firestore.

---

## Estructura de archivos

```
RepoLaraBakery/
├── app/
│   ├── page.tsx                        ← Home
│   ├── layout.tsx                      ← Layout global (header, footer, nav, WhatsApp)
│   ├── robots.ts                       ← robots.txt estático
│   ├── sitemap.ts                      ← sitemap.xml estático
│   ├── productos/
│   │   ├── page.tsx                    ← Catálogo
│   │   └── [id]/page.tsx               ← Detalle de producto
│   ├── pedido/
│   │   ├── page.tsx
│   │   └── order-form.tsx              ← Formulario de pedido (client component)
│   ├── mis-pedidos/page.tsx            ← Historial del cliente
│   ├── login/page.tsx
│   └── admin/
│       ├── layout.tsx                  ← Layout admin con sidebar + AdminGuard
│       ├── page.tsx                    ← Dashboard
│       ├── pedidos/
│       │   ├── page.tsx                ← Lista de pedidos
│       │   └── [id]/
│       │       ├── page.tsx            ← Wrapper servidor (generateStaticParams)
│       │       └── admin-order-detail.tsx  ← Detalle pedido (client component)
│       ├── productos/page.tsx          ← CRUD de productos
│       ├── costos/page.tsx             ← Costos y márgenes
│       └── reportes/page.tsx          ← Métricas de ventas
├── components/
│   ├── site-header.tsx                 ← Header sticky
│   ├── site-footer.tsx                 ← Footer con WhatsApp
│   ├── bottom-nav.tsx                  ← Nav mobile fija
│   ├── layout-padding.tsx              ← Padding inferior para bottom nav
│   ├── whatsapp-float.tsx              ← Botón flotante WhatsApp
│   ├── auth-provider.tsx               ← Contexto de autenticación global
│   ├── admin-guard.tsx                 ← Bloqueo de acceso a admin
│   ├── product-card.tsx
│   ├── product-grid.tsx
│   └── status-pill.tsx                 ← Pastilla de estado con color automático
├── lib/
│   ├── data.ts                         ← Tipos + datos fallback + formatCurrency + formatStatus
│   ├── firebase.ts                     ← Inicialización Firebase
│   ├── firebase-store.ts               ← Todas las operaciones Firestore
│   └── styles.ts                       ← Estilos compartidos (darkActionStyle)
├── functions/                          ← Firebase Functions / Genkit
│   └── src/index.ts                    ← notifyAdminOnNewOrder
├── public/images/                      ← Imágenes locales
├── documentacion/
├── firestore.rules
└── firebase.json
```

---

## Rutas

### Públicas
| Ruta | Descripción |
|---|---|
| `/` | Home: hero, categorías, productos destacados, trust items |
| `/productos` | Catálogo con todos los productos disponibles |
| `/productos/[id]` | Detalle de producto (hoy usa `lib/data.ts`) |
| `/login` | Login con Google |

### Cliente autenticado
| Ruta | Descripción |
|---|---|
| `/pedido` | Formulario de pedido; requiere login para confirmar |
| `/mis-pedidos` | Historial de pedidos del usuario autenticado |

### Admin (requiere rol `admin`)
| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard mensual con métricas, costos, ventas diarias, estados/pagos interactivos, productos y últimos pedidos |
| `/admin/pedidos` | Lista, búsqueda, filtros por estado/pago, orden y cambio de estado |
| `/admin/pedidos?nuevo=1` | Apertura directa del formulario de pedido manual |
| `/admin/pedidos/[id]` | Detalle completo, edición de pedido, notas internas y eliminación |
| `/admin/productos` | CRUD: toggle, edición inline, crear nuevo |
| `/admin/costos` | Costos por producto y cálculo de margen |
| `/admin/reportes` | Ventas, estados, top productos |

---

## Firebase — `lib/firebase-store.ts`

Todas las operaciones Firestore están en este archivo.

| Función | Descripción |
|---|---|
| `ensureUserProfile` | Crea o actualiza perfil al hacer login |
| `getUserProfile` | Lee perfil y rol de un usuario |
| `getProducts` | Lee productos; fallback a `lib/data.ts` si está vacío |
| `updateProduct` | Edita campos de un producto (nombre, precio, disponibilidad, etc.) |
| `createProduct` | Crea producto nuevo en Firestore |
| `createOrder` | Genera ID secuencial y guarda pedido + items |
| `createManualOrder` | Permite que admin cree pedidos externos al sitio |
| `getOrderById` | Lee un pedido por ID (para el detalle admin) |
| `getOrdersForUser` | Lista pedidos del cliente autenticado |
| `getAllOrders` | Lista todos los pedidos para admin |
| `updateOrderState` | Actualiza estado de pedido y pago |
| `updateOrderDetails` | Actualiza datos del pedido e items; usado por cliente/admin |
| `updateOrderInternalNotes` | Guarda notas internas del admin |
| `deleteOrder` | Elimina pedido e items; admin o cliente si está pendiente |
| `getProductCosts` | Lee costos por producto |
| `saveProductCost` | Guarda/actualiza costos de un producto |

### Dashboard admin

`app/admin/page.tsx` carga `getAllOrders()` y `getProductCosts()` para construir un resumen client-side del periodo seleccionado.

Métricas principales:

- Ventas del mes, ganancia estimada, ticket promedio y pedidos del mes.
- Progreso de cobro, margen estimado y avance de entregas.
- Ventas diarias con gráfica de línea/área SVG.
- Distribución de pedidos por estado y pagos por estado.
- Selección interactiva de estado/pago para ver clientes y pedidos dentro del segmento.
- Enlace "Ver filtro" hacia `/admin/pedidos?estado=...` o `/admin/pedidos?pago=...`.
- Productos más pedidos por unidades.
- Productos por ingresos.
- Costos estimados y cobertura de costos configurados.
- Últimos pedidos con enlace directo al detalle.

El filtro de periodo usa mes y año en timezone `America/Bogota`. La lista operativa de `/admin/pedidos` ordena por `created_at desc` por defecto, con opciones de entrega próxima/lejana.

### Notificaciones por e-mail

`functions/src/index.ts` expone `notifyAdminOnNewOrder`, una Function 2nd Gen que escucha `orders/{orderId}`.

- Lee los items de `orders/{orderId}/items`.
- Envía e-mail a los admins con cliente, WhatsApp, productos, fecha, entrega y total.
- Usa secretos `GMAIL_USER` y `GMAIL_PASS`.
- Registra control de duplicados en `notification_logs/order-{orderId}-admin-email`.
- Estados del log: `sending`, `sent`, `failed`.
- Si Gmail rechaza credenciales, el error queda en logs de Functions y en el documento de `notification_logs`.

---

## Colecciones Firestore

### `users/{uid}`
| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | Del perfil de Google |
| `email` | string | |
| `image` | string | URL foto de Google |
| `role` | `"customer"` \| `"admin"` | |
| `phone` | string? | Opcional |

### `products/{productId}`
| Campo | Tipo | Notas |
|---|---|---|
| `name` | string | |
| `description` | string | Corta |
| `longDescription` | string | Para detalle |
| `price` | number | COP |
| `category` | string | Ej: "Alfajores" |
| `presentation` | string | Ej: "Caja x8" |
| `imageUrl` | string | |
| `isAvailable` | boolean | Aparece en formulario de pedido |
| `isFeatured` | boolean | Aparece en el home |
| `prepHours` | number | Horas mínimas de preparación |
| `variants` | array? | Tamaños/presentaciones con precio propio |

### `orders/{orderId}`
IDs con formato `LB-YYMMDD-NN` (ej: `LB-260510-01`).

| Campo | Tipo |
|---|---|
| `user_id` | string (UID) |
| `customer_name` | string |
| `customer_email` | string |
| `customer_phone` | string |
| `status` | `OrderStatus` |
| `payment_status` | `PaymentStatus` |
| `delivery_method` | `"recoger"` \| `"domicilio"` |
| `delivery_address` | string |
| `requested_delivery_date` | `YYYY-MM-DD` |
| `subtotal` | number |
| `delivery_fee` | number (6000 si domicilio) |
| `total` | number |
| `customer_notes` | string |
| `internal_notes` | string (solo visible para admin) |
| `source` | string? |
| `created_by` | string? |

**Subcolección** `orders/{orderId}/items/{itemId}`:

| Campo | Tipo |
|---|---|
| `product_id` | string |
| `product_name` | string (copia histórica; puede incluir variante) |
| `quantity` | number |
| `unit_price` | number |
| `total_price` | number |
| `notes` | string |

### `counters/orders`
Contador diario para IDs secuenciales.

| Campo | Descripción |
|---|---|
| `date` | `YYMMDD` en timezone Colombia |
| `count` | Último consecutivo del día |

### `product_costs/{productId}`
| Campo | Tipo |
|---|---|
| `ingredients` | number (COP) |
| `packaging` | number (COP) |
| `labor` | number (COP) |
| `other` | number (COP) |
| `total_cost` | number (calculado) |

### `notification_logs/{logId}`
Usado por Functions para idempotencia y diagnóstico de notificaciones.

| Campo | Tipo |
|---|---|
| `type` | string |
| `order_id` | string |
| `status` | `"sending"` \| `"sent"` \| `"failed"` |
| `attempts` | number |
| `error` | string? |
| `created_at` | timestamp |
| `updated_at` | timestamp |
| `sent_at` | timestamp? |

---

## Roles y admins

Los emails con acceso admin se definen en **dos lugares** (deben mantenerse sincronizados):

1. `lib/firebase-store.ts` → array `adminEmails`
2. `firestore.rules` → función `isAdmin()`

Para agregar un admin: editar ambos archivos y hacer `firebase deploy`.

---

## Reglas de seguridad (`firestore.rules`)

| Colección | Lectura | Escritura |
|---|---|---|
| `users` | Dueño o admin | Dueño (sin cambiar rol) o admin |
| `products` | Pública | Solo admin |
| `orders` | Dueño o admin | Cliente crea con estado inicial `pendiente`; cliente puede editar/eliminar su pedido mientras siga `pendiente`; admin administra |
| `orders/*/items` | Dueño o admin | Cliente crea/edita/elimina items mientras el pedido siga `pendiente`; admin siempre |
| `counters` | Autenticado | Autenticado |
| `product_costs` | Solo admin | Solo admin |

---

## Componentes clave

| Componente | Descripción |
|---|---|
| `AuthProvider` | Contexto global con `user`, `profile`, `isAdmin`, `login`, `logout` |
| `AdminGuard` | Muestra loading → login → sin permisos → contenido, según estado |
| `StatusPill` | Pastilla con color automático según valor (`en_preparacion` → rosa, `pagado` → verde, etc.) |
| `BottomNav` | Nav mobile fija; se oculta en `/pedido` donde la reemplaza la barra de confirmación |
| `LayoutPadding` | Agrega `pb-16 md:pb-0` en todas las páginas excepto `/pedido` |
| `WhatsappFloat` | `bottom-24` en `/pedido` (sobre barra de confirmación) · `bottom-20` en el resto (sobre bottom nav) |

---

## Decisiones técnicas

- **SEO:** las rutas públicas tienen metadata específica, canonicals, OpenGraph y Twitter cards. Home y producto incluyen JSON-LD (`Bakery` y `Product`).
- **Sitemap:** `app/sitemap.ts` incluye home, catálogo, pedido y productos de `lib/data.ts`.
- **Robots:** `app/robots.ts` permite páginas públicas y bloquea `/admin`, `/login` y `/mis-pedidos`.
- **IDs de pedido:** generados con transacción Firestore en `counters/orders` para garantizar secuencialidad sin colisiones.
- **Creación de pedido:** `createOrder()` guarda documento padre e items en un solo batch para que las notificaciones lean datos completos.
- **Anti doble submit:** `OrderForm` usa un bloqueo inmediato en cliente para ignorar clicks repetidos mientras se guarda el pedido.
- **Timezone:** todos los cálculos de fecha usan `America/Bogota`.
- **Static export + ruta dinámica admin:** `generateStaticParams` retorna `[{ id: "placeholder" }]` para satisfacer el build. La navegación siempre ocurre via Next.js router desde la lista de pedidos.
- **Fallback de productos:** `getProducts()` retorna `lib/data.ts` si Firestore está vacío, evitando pantalla en blanco.
- **Variables de entorno:** baked en el build, no en runtime. Cambiar `.env.local` requiere nuevo deploy.
- **Domicilio:** tarifa fija de $6.000 COP.
- **Funciones:** existe trigger productivo de e-mail para pedidos nuevos. Cualquier cambio de secretos `GMAIL_USER`/`GMAIL_PASS` requiere redeploy de Functions.
