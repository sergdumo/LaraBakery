import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Ingresar | Lara Bakery",
  description: "Ingresa a Lara Bakery para hacer pedidos y consultar su estado.",
  path: "/login",
  noIndex: true
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

