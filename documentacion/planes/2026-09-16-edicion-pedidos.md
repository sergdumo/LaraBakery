# Edición de pedidos

Objetivo: abrir y guardar un pedido existente conservando su ID, estados y fecha de creación.

Diseño: página estática `/admin/pedidos/detalle?id=...`, protegida por AdminGuard, reutilizando el formulario existente. Todos los enlaces administrativos usarán esta ruta. Se descarta generar IDs al compilar porque los pedidos se crean después del despliegue. No se requiere migrar el alojamiento.

Plan: verificar que el artefacto estático de detalle existe (regresión del 404); implementar ruta y enlaces; manejar errores de carga; permitir vaciar notas y precios cero; mostrar confirmación de guardado y subtotal/domicilio/total coherentes. Ejecutar lint, TypeScript y compilación estática. No modificar pedidos de producción para probar.

Validación: ESLint y compilación Next.js (incluido TypeScript) completados. La prueba `node --test tests/order-detail-export.test.mjs` comprueba la existencia del HTML de detalle exportado. Primera compilación con variables Firebase ficticias, solo para validación. El 2026-09-16 se recuperó la configuración del SDK desde Firebase y se recompiló con la configuración real. Publicado en https://larabakery.web.app, versión Hosting `61bfe13a602b024e`. Falta validación autenticada de guardado y recarga contra Firebase. No se modificaron pedidos remotos.

Alcance del formulario: datos del cliente, fecha y método de entrega, dirección, observaciones, nombres/cantidades/precios/notas de las líneas existentes. Agregar o eliminar líneas no forma parte de este cambio. Los enlaces antiguos con el ID como segmento siguen sin página; los enlaces de la aplicación ahora usan la ruta fija.
