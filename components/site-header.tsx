"use client";

import Link from "next/link";
import { darkActionStyle } from "@/lib/styles";
import { useAuth } from "@/components/auth-provider";

const links = [
  { href: "/productos", label: "Productos" },
  { href: "/pedido", label: "Pedido" },
  { href: "/mis-pedidos", label: "Mis pedidos" }
];

export function SiteHeader() {
  const { user, profile, logout, loading, isAdmin } = useAuth();
  const firstName = profile?.name?.split(" ")[0] || user?.email?.split("@")[0] || "";

  return (
    <header className="sticky top-0 z-20 border-b border-[#ead8c7] bg-[#fff9f3]/92 backdrop-blur">
      <div className="bg-[#3b2924] px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[#fff9f3]">
        Pedidos con mínimo 24 horas de anticipación
      </div>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-md">
          <img
            src="/images/lara-bakery-logo.jpeg"
            alt="Lara Bakery"
            className="h-12 w-12 rounded-full border border-[#e5d2b6] object-cover"
          />
          <span>
            <span className="block text-base font-semibold">Lara Bakery</span>
            <span className="block text-xs text-[#74635c]">Artesanal</span>
          </span>
        </Link>

        {/* Navegación — solo desktop, en mobile la maneja el BottomNav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-[#5f4b44] transition hover:bg-white"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-[#c9657e] transition hover:bg-white"
            >
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && firstName && (
            <span className="hidden max-w-[120px] truncate text-sm text-[#74635c] md:block">
              {firstName}
            </span>
          )}
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="focus-ring dark-action rounded-full px-4 py-2 text-sm font-semibold transition"
              style={darkActionStyle}
            >
              Salir
            </button>
          ) : (
            <Link
              href="/login"
              className="focus-ring dark-action rounded-full px-4 py-2 text-sm font-semibold transition"
              style={darkActionStyle}
              aria-disabled={loading}
            >
              Ingresar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
