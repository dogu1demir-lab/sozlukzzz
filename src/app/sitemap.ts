import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr";

  // Base routes
  const routes = [
    "",
    "/pozkes",
    "/giris",
    "/kaydol",
  ].map((route) => ({
    url: `${appUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    // Dynamic Topics (fetch all topics)
    const topics = await prisma.topic.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const topicRoutes = topics.map((t) => ({
      url: `${appUrl}/baslik/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    // Dynamic Yazars (fetch all users)
    const users = await prisma.user.findMany({
      select: {
        username: true,
        updatedAt: true,
      },
    });

    const yazarRoutes = users.map((u) => ({
      url: `${appUrl}/yazar/${u.username}`,
      lastModified: u.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    return [...routes, ...topicRoutes, ...yazarRoutes];
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    return routes;
  }
}
