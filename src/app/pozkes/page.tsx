import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import PozKesCard from "@/components/PozKesCard";
import PozKesLoadMore from "@/components/PozKesLoadMore";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PozKes 📸 — sözlükzzz",
  description: "Yazarların paylaştığı anlık fotoğraflar, sinek manzaraları ve kadrajlar. vızzz!",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr"}/pozkes`,
  },
  openGraph: {
    title: "PozKes 📸 — sözlükzzz",
    description: "Yazarların paylaştığı anlık fotoğraflar, sinek manzaraları ve kadrajlar. vızzz!",
  }
};

export const revalidate = 0; // Disable cache to fetch real-time items

export default async function PozKesPage() {
  const user = await getSessionUser();

  const entries = await prisma.entry.findMany({
    where: {
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

      {/* Feed list */}
      <div className="kd-feed">
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
