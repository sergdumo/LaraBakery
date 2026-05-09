"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { user, profile, loading, signInWithGoogle, logout } = useAuth();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-md place-items-center px-4 py-10">
      <section className="w-full rounded-lg border border-[#ead8c7] bg-white p-6 text-center soft-shadow">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f4b6c4] text-xl font-semibold">LB</span>
        {user ? (
          <>
            <h1 className="mt-5 text-2xl font-semibold">Hola, {profile?.name || user.displayName || "cliente"}</h1>
            <p className="mt-3 text-sm leading-6 text-[#74635c]">Ya tienes sesion activa en Lara Bakery.</p>
            <div className="mt-6 grid gap-3">
              <Link href="/mis-pedidos" className="focus-ring rounded-full bg-[#3b2924] px-5 py-3 text-sm font-semibold text-white">
                Ver mis pedidos
              </Link>
              {profile?.role === "admin" && (
                <Link href="/admin" className="focus-ring rounded-full border border-[#c9657e] px-5 py-3 text-sm font-semibold">
                  Entrar al admin
                </Link>
              )}
              <button onClick={logout} className="focus-ring rounded-full border border-[#ead8c7] bg-[#fff9f3] px-5 py-3 text-sm font-semibold">
                Cerrar sesion
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-semibold">Ingresa a Lara Bakery</h1>
            <p className="mt-3 text-sm leading-6 text-[#74635c]">
              Usa tu cuenta de Google para hacer pedidos y consultar su estado.
            </p>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="focus-ring mt-6 w-full rounded-full border border-[#ead8c7] bg-[#fff9f3] px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Cargando..." : "Continuar con Google"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
