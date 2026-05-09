import type { MetadataRoute } from "next";
import { products } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const productRoutes = products.map((product) => ({
    url: `${siteUrl}/productos/${product.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/productos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/pedido`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    },
    ...productRoutes
  ];
}
