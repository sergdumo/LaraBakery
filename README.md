# Lara Bakery — Sitio web

Plataforma de pedidos para Lara Bakery. Los clientes navegan el catálogo, hacen pedidos y pagan por Nequi. Lara gestiona todo desde el panel de administración.

**Live:** https://larabakery.web.app · **Docs:** [`documentacion/`](./documentacion/)

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router, `output: export`) |
| Estilos | Tailwind CSS |
| Base de datos | Firebase Firestore |
| Autenticación | Firebase Auth (Google Sign-In) |
| Hosting | Firebase Hosting |

El sitio es 100% estático — Next.js genera HTML/JS en el build y Firebase lo sirve. Toda la lógica de datos es client-side con Firestore SDK.

---

## Requisitos

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Cuenta en el proyecto Firebase `larabakery-d98a0`

---

## Configuración local

```bash
# Clonar e instalar
npm install

# Variables de entorno (crear .env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=larabakery-d98a0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/573012481041
NEXT_PUBLIC_PAYMENT_NEQUI=301 248 1041
NEXT_PUBLIC_PAYMENT_NAME=Lara Bakery

# Correr en desarrollo
npm run dev
```

---

## Deploy

```bash
firebase deploy --only hosting
```

El script de predeploy corre `npm run build` automáticamente (configurado en `firebase.json`).

---

## Estructura de rutas

```
/                    → Home: hero, categorías, productos destacados
/productos           → Catálogo completo
/productos/[id]      → Detalle de producto
/pedido              → Formulario de pedido (requiere login)
/mis-pedidos         → Historial del cliente (requiere login)
/login               → Login con Google
/admin               → Dashboard admin
/admin/pedidos       → Lista y gestión de pedidos
/admin/pedidos/[id]  → Detalle de pedido con notas internas
/admin/productos     → CRUD de productos
/admin/costos        → Costos y márgenes por producto
/admin/reportes      → Métricas de ventas y estado de pedidos
```

---

## Firestore — Colecciones

### `users/{uid}`
Creado automáticamente al hacer login por primera vez.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre del perfil de Google |
| `email` | string | Email de Google |
| `role` | `"customer"` \| `"admin"` | Los admins se definen en `firebase-store.ts` |
| `phone` | string? | Teléfono opcional |

### `products/{productId}`
Catálogo de productos. Si la colección está vacía, el sitio usa los datos de `lib/data.ts` como fallback.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre del producto |
| `description` | string | Descripción corta |
| `price` | number | Precio en COP |
| `category` | string | Ej: "Alfajores", "Tortas" |
| `presentation` | string | Ej: "Caja x8" |
| `imageUrl` | string | URL de imagen |
| `isAvailable` | boolean | Si aparece en el formulario de pedido |
| `isFeatured` | boolean | Si aparece en el home |
| `prepHours` | number | Horas mínimas de preparación |

### `orders/{orderId}`
IDs con formato `LB-YYMMDD-NN` (ej: `LB-260510-01`). El contador diario vive en `counters/orders`.

| Campo | Tipo | Descripción |
|---|---|---|
| `user_id` | string | UID del cliente |
| `customer_name` | string | |
| `customer_email` | string | |
| `customer_phone` | string | |
| `status` | OrderStatus | Ver tabla abajo |
| `payment_status` | PaymentStatus | Ver tabla abajo |
| `delivery_method` | `"recoger"` \| `"domicilio"` | |
| `delivery_address` | string | Solo si es domicilio |
| `requested_delivery_date` | string | Formato `YYYY-MM-DD` |
| `subtotal` | number | Sin domicilio |
| `delivery_fee` | number | 6000 si es domicilio |
| `total` | number | |
| `customer_notes` | string | Notas del cliente |
| `internal_notes` | string | Notas privadas del admin |

**Subcolección** `orders/{orderId}/items/{itemId}`:

| Campo | Tipo |
|---|---|
| `product_id` | string |
| `product_name` | string |
| `quantity` | number |
| `unit_price` | number |
| `total_price` | number |
| `notes` | string |

**Estados de pedido (`OrderStatus`):**

| Valor | Etiqueta |
|---|---|
| `pendiente` | Pendiente |
| `confirmado` | Confirmado |
| `en_preparacion` | En preparación |
| `listo_para_entrega` | Listo p/entrega |
| `entregado` | Entregado |
| `cancelado` | Cancelado |

**Estados de pago (`PaymentStatus`):** `pendiente` · `pagado` · `parcial` · `cancelado`

### `product_costs/{productId}`
Costos por producto para calcular márgenes en `/admin/costos`.

| Campo | Tipo |
|---|---|
| `ingredients` | number (COP) |
| `packaging` | number (COP) |
| `labor` | number (COP) |
| `other` | number (COP) |
| `total_cost` | number (calculado) |

### `counters/orders`
Contador diario para generar IDs secuenciales.

| Campo | Descripción |
|---|---|
| `date` | Fecha en formato `YYMMDD` (timezone Colombia) |
| `count` | Último número del día |

---

## Admins

Los emails con acceso de administrador se definen en **dos lugares** (deben mantenerse sincronizados):

1. `lib/firebase-store.ts` → array `adminEmails`
2. `firestore.rules` → función `isAdmin()`

Admins actuales: `serdumo@gmail.com`, `saralaracorrea@gmail.com`

Para agregar un admin nuevo, editar ambos archivos y hacer deploy.

---

## Componentes principales

| Componente | Descripción |
|---|---|
| `SiteHeader` | Header sticky con logo, nav desktop, login/logout |
| `BottomNav` | Navegación mobile fija en la parte inferior (oculta en `/pedido`) |
| `WhatsappFloat` | Botón flotante de WhatsApp (se eleva sobre la barra de pedido) |
| `SiteFooter` | Footer con WhatsApp y copyright |
| `AdminGuard` | Bloquea acceso al panel si no es admin |
| `StatusPill` | Pastilla de estado con color automático por valor |
| `ProductGrid` | Grid de productos con carga desde Firestore |
| `OrderForm` | Formulario de pedido completo con carrito y confirmación |
| `LayoutPadding` | Agrega padding inferior en mobile para no quedar bajo el BottomNav |

---

## Flujo de un pedido

```
1. Cliente navega el catálogo → /productos
2. Selecciona producto → /pedido?producto=ID
3. Completa el formulario (nombre, teléfono, fecha, método de entrega)
   └─ Fecha mínima: mañana (validación 24h en timezone Colombia)
4. Hace login con Google si no está autenticado
5. Confirma el pedido → se guarda en Firestore con estado "pendiente"
6. Ve pantalla de confirmación con:
   └─ Número de pedido (LB-YYMMDD-NN)
   └─ Datos Nequi para pagar
   └─ Botón para enviar comprobante por WhatsApp
7. Lara recibe el pedido en /admin/pedidos
8. Lara cambia el estado y confirma pago desde el detalle del pedido
```

---

## QR Nequi

El archivo `/public/images/nequi-qr.svg` es un placeholder. Para reemplazarlo con el QR real, guardar la imagen en esa misma ruta (puede ser `.png` o `.jpg`) y actualizar la referencia en `app/pedido/order-form.tsx`:

```tsx
<img src="/images/nequi-qr.png" ... />
```

---

## Notas técnicas

- **Static export + rutas dinámicas:** `/admin/pedidos/[id]` requiere `generateStaticParams`. Retorna `[{ id: "placeholder" }]` para satisfacer el build. La navegación real siempre ocurre via el router de Next.js (client-side) desde la lista de pedidos.
- **Timezone:** Todos los cálculos de fecha (IDs de pedido, mínimo 24h) usan `America/Bogota`.
- **Variables de entorno:** Son baked en el build (no runtime). Cambiar `.env.local` requiere nuevo `firebase deploy`.
- **Fallback de productos:** Si Firestore no tiene productos, `getProducts()` retorna los datos de `lib/data.ts`. Esto evita pantalla vacía en desarrollo.
