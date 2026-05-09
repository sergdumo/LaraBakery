import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Mis pedidos | Lara Bakery",
  description: "Consulta el estado de tus pedidos en Lara Bakery.",
  path: "/mis-pedidos",
  noIndex: true
});

export default function MyOrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

