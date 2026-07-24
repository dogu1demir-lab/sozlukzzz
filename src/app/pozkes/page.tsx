import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import PozKesCard from "@/components/PozKesCard";
import PozKesLoadMore from "@/components/PozKesLoadMore";
import PozKesHashRedirector from "@/components/PozKesHashRedirector";
import PozKesUploadBox from "@/components/PozKesUploadBox";
import { Metadata } from "next";

interface Props {
  searchParams: Promise<{ e?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const entryId = resolvedParams?.e;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr";

  if (entryId) {
    try {
      const entry = await prisma.entry.findUnique({
        where: { id: entryId },
        include: { author: true }
      });

      if (entry && entry.imageUrl) {
        let customTitle = "";
        let bodyText = entry.content || "";
        const match = entry.content?.match(/^\*\*(.+?)\*\*\n\n?([\s\S]*)$/);
        if (match) {
          customTitle = match[1].trim();
          bodyText = match[2].trim();
        }

        const displayTitle = customTitle
          ? `${customTitle} 📸 — PozKes`
          : `@${entry.author.displayName ?? entry.author.username} PozKes Paylaşımı`;

        const displayDesc = bodyText
          ? `"${bodyText.substring(0, 120)}"`
          : "Yazarların paylaştığı anlık fotoğraflar, estetik kareler ve özel kadrajlar.";

        const imageUrl = `${baseUrl}/api/image/${entry.id}`;

        return {
          title: displayTitle,
          description: displayDesc,
          alternates: {
            canonical: `${baseUrl}/pozkes?e=${entry.id}`,
          },
          openGraph: {
            title: displayTitle,
            description: displayDesc,
            url: `${baseUrl}/pozkes?e=${entry.id}`,
            siteName: "sözlükzzz",
            images: [
              {
                url: imageUrl,
                width: 1200,
                height: 1200,
                alt: customTitle || "PozKes Fotoğrafı"
              }
            ],
            type: "article"
          },
          twitter: {
            card: "summary_large_image",
            title: displayTitle,
            description: displayDesc,
            images: [imageUrl]
          }
        };
      }
    } catch (e) {
      console.error("Failed to generate dynamic metadata for PozKes:", e);
    }
  }

  return {
    title: "PozKes 📸 — sözlükzzz",
    description: "Yazarların paylaştığı anlık fotoğraflar, estetik kareler ve özel kadrajlar.",
    alternates: {
      canonical: `${baseUrl}/pozkes`,
    },
    openGraph: {
      title: "PozKes 📸 — sözlükzzz",
      description: "Yazarların paylaştığı anlık fotoğraflar, estetik kareler ve özel kadrajlar.",
      url: `${baseUrl}/pozkes`,
      siteName: "sözlükzzz",
      images: [
        {
          url: `${baseUrl}/icon.jpg`,
          width: 800,
          height: 800,
          alt: "PozKes sözlükzzz"
        }
      ]
    }
  };
}

export const revalidate = 0; // Disable cache to fetch real-time items

export default async function PozKesPage() {
  const user = await getSessionUser();

  const entries = await prisma.entry.findMany({
    where: {
      topic: { slug: "pozkes-galeri" },
      imageUrl: { not: null }
    },
    include: {
      topic: true,
      author: {
        select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
      },
      likes: true,
      comments: {
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
          },
          likes: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 7
  });

  const formattedEntries = entries.map((entry) => {
    const likesCount = entry.likes.filter((l) => l.isLike).length;
    const hasLiked = user ? entry.likes.some((l) => l.userId === user.id && l.isLike) : false;

    const formattedComments = entry.comments.map((comment) => {
      const likesCount = comment.likes.length;
      const hasLiked = user ? comment.likes.some((l) => l.userId === user.id) : false;
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.id,
          username: comment.author.username,
          displayName: comment.author.displayName,
          avatarColor: comment.author.avatarColor,
          avatarUrl: comment.author.avatarUrl ? `/api/yazar-image/${encodeURIComponent(comment.author.username)}` : null,
        },
        likesCount,
        hasLiked
      };
    });

    return {
      id: entry.id,
      content: entry.content,
      imageUrl: entry.imageUrl ? `/api/image/${entry.id}` : "",
      createdAt: entry.createdAt,
      topic: {
        title: entry.topic.title,
        slug: entry.topic.slug
      },
      author: {
        id: entry.author.id,
        username: entry.author.username,
        displayName: entry.author.displayName,
        avatarColor: entry.author.avatarColor,
        avatarUrl: entry.author.avatarUrl ? `/api/yazar-image/${encodeURIComponent(entry.author.username)}` : null,
      },
      likesCount,
      hasLiked,
      comments: formattedComments
    };
  });

  return (
    <div className="kd-page">
      {/* Page Header */}
      <div className="kd-header">
        <h1 className="kd-title">PozKes 📸</h1>
        <p className="kd-subtitle">Kullanıcıların paylaştığı fotoğraflar</p>
      </div>

      {/* Direct Upload Box */}
      <PozKesUploadBox isLoggedIn={!!user} />

      {/* Feed list */}
      <div className="kd-feed">
        <PozKesHashRedirector
          initialEntryIds={formattedEntries.map(e => e.id)}
          isLoggedIn={!!user}
          currentUserId={user?.id}
          isAdmin={user?.role === "ADMIN"}
        />
        {formattedEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center text-zinc-500">
            <p className="text-sm">PozKes'te henüz paylaşılmış bir fotoğraf bulunamadı zzz.</p>
          </div>
        ) : (
          <>
            {formattedEntries.map((entry) => (
              <PozKesCard
                key={entry.id}
                entry={entry}
                isLoggedIn={!!user}
                currentUserId={user?.id}
                isAdmin={user?.role === "ADMIN"}
              />
            ))}
            <PozKesLoadMore
              initialOffset={formattedEntries.length}
              isLoggedIn={!!user}
              currentUserId={user?.id}
              isAdmin={user?.role === "ADMIN"}
            />
          </>
        )}
      </div>
    </div>
  );
}
