"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminOrderDetail } from "../[id]/admin-order-detail";

function OrderDetail() {
  const id = useSearchParams().get("id")?.trim();
  if (!id || id.includes("/")) {
    return <section><p>No se indicó un ID de pedido válido.</p><Link href="/admin/pedidos">Volver a pedidos</Link></section>;
  }
  return <AdminOrderDetail key={id} id={id} />;
}

export default function OrderDetailPage() {
  return <Suspense fallback={<p>Cargando pedido...</p>}><OrderDetail /></Suspense>;
}
