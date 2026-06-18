import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/settings",
        "/mesajlar",
        "/yeni",
        "/sifremi-unuttum",
        "/sifre-sifirla",
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
