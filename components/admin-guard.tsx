"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <section className="rounded-lg border border-[#ead8c7] bg-white p-6 soft-shadow">
        <p className="text-sm font-semibold text-[#74635c]">Validando acceso...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded-lg border border-[#ead8c7] bg-white p-6 soft-shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Acceso privado</p>
        <h1 className="mt-2 text-2xl font-semibold">Ingresa para continuar</h1>
        <p className="mt-3 leading-7 text-[#74635c]">El panel administrativo requiere una cuenta con rol admin.</p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="focus-ring mt-5 rounded-full bg-[#3b2924] px-5 py-3 text-sm font-semibold text-white"
        >
          Continuar con Google
        </button>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="rounded-lg border border-[#ead8c7] bg-white p-6 soft-shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Sin permisos</p>
        <h1 className="mt-2 text-2xl font-semibold">Este modulo es privado</h1>
        <p className="mt-3 leading-7 text-[#74635c]">
          El panel administrativo solo esta habilitado para las cuentas autorizadas de Lara Bakery.
        </p>
        <Link href="/" className="focus-ring mt-5 inline-block rounded-full border border-[#c9657e] px-5 py-3 text-sm font-semibold">
          Volver al sitio
        </Link>
      </section>
    );
  }

  return children;
}
