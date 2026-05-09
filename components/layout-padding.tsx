"use client";

import { usePathname } from "next/navigation";

export function LayoutPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // /pedido tiene su propia barra sticky — no necesita padding del bottom nav
  const needsNavPadding = pathname !== "/pedido";
  return (
    <div className={needsNavPadding ? "pb-16 md:pb-0" : ""}>
      {children}
    </div>
  );
}
