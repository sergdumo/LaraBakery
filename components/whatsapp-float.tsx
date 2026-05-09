"use client";

import { usePathname } from "next/navigation";

export function WhatsappFloat() {
  const pathname = usePathname();
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "/pedido";
  const isExternal = whatsappUrl.startsWith("http");
  // /pedido: sube sobre la barra sticky de confirmación
  // otras páginas mobile: sube sobre el bottom nav
  const bottomClass = pathname === "/pedido" ? "bottom-24 md:bottom-5" : "bottom-20 md:bottom-5";

  return (
    <a
      href={whatsappUrl}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className={`focus-ring fixed right-5 z-30 rounded-full bg-[#2fbf71] px-4 py-3 text-sm font-semibold text-white soft-shadow transition hover:bg-[#249b5b] ${bottomClass}`}
      aria-label="Escribir a Lara Bakery por WhatsApp"
    >
      WhatsApp
    </a>
  );
}
