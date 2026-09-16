# Dashboard anual de Lara Bakery

## Objetivo

Agregar una lectura anual al dashboard administrativo sin perder la vista mensual actual y sin desplegar cambios a produccion durante la validacion.

## Experiencia

- El encabezado tendra un selector segmentado `Mes | Ano` y conservara el selector de ano.
- En modo mensual se mantiene el contenido operativo existente y el selector de mes.
- En modo anual se mostraran indicadores acumulados de ventas, ganancia estimada, pedidos y ticket promedio.
- El grafico principal combinara barras de ventas mensuales con una linea de ganancia estimada. Cada mes sera seleccionable para abrir su detalle mensual.
- Una curva acumulada mostrara el avance real del ano. No se dibujara una meta ficticia.
- El ranking anual mostrara hasta cinco productos por facturacion, con unidades y margen estimado.
- Un mapa de calor mostrara actividad diaria por mes y dia de la semana para revelar concentraciones de demanda.

## Reglas de negocio

- Se usa `requestedDeliveryDate` como fecha de atribucion, igual que el dashboard mensual existente.
- Los pedidos cancelados se excluyen de ventas, costos, ganancia, ticket y rankings.
- La ganancia es estimada: venta menos costos configurados por producto.
- La cobertura de costos debe mostrarse para no presentar una ganancia incompleta como definitiva.
- Los meses sin actividad aparecen con valor cero.
- La comparacion interanual se oculta cuando no existe un ano anterior con pedidos.

## Arquitectura

- `lib/dashboard-analytics.ts` concentrara calculos puros y reutilizables.
- `components/annual-dashboard.tsx` renderizara la vista anual y emitira la seleccion de mes.
- `app/admin/page.tsx` conservara la carga de Firestore y alternara entre la vista mensual existente y la anual.
- No se agregaran dependencias de graficos; se usaran SVG y CSS para conservar el bundle y el export estatico.

## Estados y accesibilidad

- Con datos vacios se muestran ceros y mensajes explicitos, sin graficos enganosos.
- Los elementos seleccionables seran botones con nombre accesible y foco visible.
- Los colores no seran el unico medio para comunicar valores; cada grafico tendra etiquetas y cifras.
- La vista debe funcionar en movil y escritorio.

## Validacion

- Pruebas unitarias para agregacion por mes, exclusion de cancelados, costos faltantes, acumulados y actividad diaria.
- `npm run lint` y `npm run build` deben terminar sin errores.
- Revision visual local en anchos movil y escritorio antes de solicitar autorizacion de despliegue.
