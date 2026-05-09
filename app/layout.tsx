import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthProvider } from "@/components/auth-provider";
import { WhatsappFloat } from "@/components/whatsapp-float";
import { BottomNav } from "@/components/bottom-nav";
import { LayoutPadding } from "@/components/layout-padding";
import { createPageMetadata, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...createPageMetadata({
    title: "Lara Bakery | Repostería artesanal en Medellín",
    description:
      "Alfajores artesanales, tortas y postres por encargo en Medellín. Pedidos online, pago por Nequi y atención personalizada por WhatsApp.",
    path: "/"
  }),
  applicationName: "Lara Bakery",
  keywords: [
    "alfajores artesanales Medellín",
    "tortas por encargo Medellín",
    "repostería artesanal Medellín",
    "postres artesanales Medellín",
    "Lara Bakery"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <SiteHeader />
          <LayoutPadding>{children}</LayoutPadding>
          <SiteFooter />
          <BottomNav />
          <WhatsappFloat />
        </AuthProvider>
      </body>
    </html>
  );
}
