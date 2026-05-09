"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AdminGuard } from "@/components/admin-guard";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/pedidos?nuevo=1", label: "Nuevo pedido" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/costos", label: "Costos" },
  { href: "/admin/reportes", label: "Reportes" }
];

function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCreatingOrder = pathname === "/admin/pedidos" && searchParams.get("nuevo") === "1";

  return (
    <aside className="rounded-lg border border-[#ead8c7] bg-white p-2 soft-shadow">
      <p className="hidden px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#c9657e] lg:block">
        Admin privado
      </p>
      <nav className="flex overflow-x-auto gap-1 pb-1 lg:grid lg:pb-0">
        {adminLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : link.href === "/admin/pedidos?nuevo=1"
                ? isCreatingOrder
                : link.href === "/admin/pedidos"
                  ? pathname === "/admin/pedidos" && !isCreatingOrder
                  : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-ring whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive ? "bg-[#f4b6c4] text-[#3b2924]" : "text-[#5f4b44] hover:bg-[#fff9f3]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <AdminGuard>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <AdminNav />
          <div>{children}</div>
        </div>
      </AdminGuard>
    </main>
  );
}
