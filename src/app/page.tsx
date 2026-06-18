import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import ReactionButtons from "@/components/ReactionButtons";
import IntroBanner from "@/components/IntroBanner";
import MentionText from "@/components/MentionText";
import FeedLoadMore from "@/components/FeedLoadMore";
import { formatDate } from "@/lib/utils";
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Camera, 
  Users, 
  Award, 
  Eye, 
  Sparkles 
} from "lucide-react";

export const revalidate = 0; // Fresh content on homepage always

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const user = await getSessionUser();
  const activeTab = tab || "bugun";

  let entries: any[] = [];
  let popularTopics: any[] = [];

  // Query database based on selected tab
  if (activeTab === "bugun") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const topics = await prisma.topic.findMany({
      where: {
        entries: {
          some: {
            createdAt: { gte: todayStart }
          }
        }
      },
      include: {
        entries: {
          where: {
            createdAt: { gte: todayStart }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          include: {
            author: {
              select: { id: true, username: true, avatarColor: true, avatarUrl: true }
            },
            likes: true
          }
        },
        poll: {
          select: { id: true }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 20
    });

    entries = topics
      .filter(t => t.entries.length > 0)
      .map(t => ({
        ...t.entries[0],
        topic: {
          id: t.id,
          title: t.title,
          slug: t.slug,
          poll: t.poll
        }
      }));
  } else if (activeTab === "gundem") {
    // General agenda flow (recent entries, grouped by topic)
    const topics = await prisma.topic.findMany({
      where: {
        entries: {
          some: {}
        }
      },
      include: {
        entries: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          include: {
            author: {
              select: { id: true, username: true, avatarColor: true, avatarUrl: true }
            },
            likes: true
          }
        },
        poll: {
          select: { id: true }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 20
    });

    entries = topics
      .filter(t => t.entries.length > 0)
      .map(t => ({
        ...t.entries[0],
        topic: {
          id: t.id,
          title: t.title,
          slug: t.slug,
          poll: t.poll
        }
      }));
  } else if (activeTab === "pozkes") {
    // Only entries with images
    entries = await prisma.entry.findMany({
      where: {
        imageUrl: { not: null }
      },
      include: {
        topic: {
          include: {
            poll: {
              select: { id: true }
            }
          }
        },
        author: {
          select: { id: true, username: true, avatarColor: true, avatarUrl: true }
        },
        likes: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });
  } else if (activeTab === "takip") {
    if (user) {
      // Find following IDs
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
      });
      const followingIds = follows.map((f) => f.followingId);

      const topics = await prisma.topic.findMany({
        where: {
          entries: {
            some: {
              authorId: { in: followingIds }
            }
          }
        },
        include: {
          entries: {
            where: {
              authorId: { in: followingIds }
            },
            orderBy: {
              createdAt: "desc"
            },
            take: 1,
            include: {
              author: {
                select: { id: true, username: true, avatarColor: true, avatarUrl: true }
              },
              likes: true
            }
          },
          poll: {
            select: { id: true }
          }
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 20
      });

      entries = topics
        .filter(t => t.entries.length > 0)
        .map(t => ({
          ...t.entries[0],
          topic: {
            id: t.id,
            title: t.title,
            slug: t.slug,
            poll: t.poll
          }
        }));
    }
  } else if (activeTab === "begenilen") {
    // Fetch recent 100 entries, group by topic, then sort by likes count
    const rawEntries = await prisma.entry.findMany({
      include: {
        topic: {
          include: {
            poll: {
              select: { id: true }
            }
          }
        },
        author: {
          select: { id: true, username: true, avatarColor: true, avatarUrl: true }
        },
        likes: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    const uniqueMap = new Map<string, any>();
    for (const entry of rawEntries) {
      if (!uniqueMap.has(entry.topicId)) {
        uniqueMap.set(entry.topicId, entry);
      }
    }

    entries = Array.from(uniqueMap.values())
      .sort((a, b) => {
        const aLikes = a.likes.filter((l: any) => l.isLike).length;
        const bLikes = b.likes.filter((l: any) => l.isLike).length;
        return bLikes - aLikes;
      })
      .slice(0, 20);
  } else if (activeTab === "goruntulenen") {
    // Fetch topics with most views, along with their first entry
    popularTopics = await prisma.topic.findMany({
      include: {
        poll: {
          select: { id: true }
        },
        entries: {
          include: {
            author: {
              select: { id: true, username: true, avatarColor: true, avatarUrl: true }
            },
            likes: true
          },
          orderBy: {
            createdAt: "asc"
          },
          take: 1
        }
      },
      orderBy: {
        viewCount: "desc"
      },
      take: 15
    });
  }

  // Map entries to inject user reactions
  const formattedEntries = entries.map((entry) => {
    const likesCount = entry.likes.filter((l: any) => l.isLike).length;
    const dislikesCount = entry.likes.filter((l: any) => !l.isLike).length;
    const userLike = user ? entry.likes.find((l: any) => l.userId === user.id) : null;
    const userReaction = userLike ? (userLike.isLike ? ("LIKE" as const) : ("DISLIKE" as const)) : null;

    return {
      id: entry.id,
      content: entry.content,
      imageUrl: entry.imageUrl,
      createdAt: entry.createdAt,
      topic: entry.topic,
      author: entry.author,
      likesCount,
      dislikesCount,
      userReaction,
    };
  });



  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner / Hero Section */}
      <IntroBanner />



      {/* Content Stream */}
      <section className="space-y-6">
        
        {/* Auth wall for Following tab */}
        {activeTab === "takip" && !user && (
          <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center text-zinc-500">
            <Users className="h-8 w-8 text-zinc-650 mx-auto mb-3" />
            <p className="text-sm">Takip ettiğiniz yazarların akışını görmek için giriş yapmalısınız.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/giris" className="px-4 py-1.5 bg-lime-500 text-black text-xs font-bold rounded-full">giriş yap</Link>
              <Link href="/kaydol" className="px-4 py-1.5 bg-zinc-800 text-white text-xs font-bold rounded-full">kaydol</Link>
            </div>
          </div>
        )}

        {/* Entries list render (standard tabs) */}
        {activeTab !== "goruntulenen" ? (
          formattedEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center text-zinc-500">
              <AlertTriangle className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm">Bu kategoride henüz girilmiş bir entry bulunamadı zzz.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formattedEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-3.5 hover:border-zinc-800 transition-all hover:bg-zinc-900/5"
                >
                  {/* Entry Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-1">
                    <Link
                      href={`/baslik/${entry.topic.slug}`}
                      className="text-sm sm:text-base font-bold text-white hover:text-lime-400 transition-colors flex items-center gap-1.5 flex-wrap"
                    >
                      <span>{entry.topic.title}</span>
                      {entry.topic.poll && (
                        <span className="text-xs shrink-0" title="Anket">📊</span>
                      )}
                    </Link>

                    {/* Author / Date */}
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-500 shrink-0">
                      <Link
                        href={`/yazar/${entry.author.username}`}
                        className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white/5"
                          style={{ backgroundColor: entry.author.avatarColor }}
                        >
                          {entry.author.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold">@{entry.author.username}</span>
                      </Link>
                      <span>•</span>
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>
                  </div>

                  {/* Photo Akışı (PozKes) Image rendering */}
                  {entry.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/40 max-w-xl">
                      <img 
                        src={entry.imageUrl} 
                        alt="PozKes" 
                        loading="lazy"
                        className="w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Entry Content */}
                  <div className="mt-3 text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    <MentionText content={entry.content} />
                  </div>

                  {/* Reactions */}
                  <ReactionButtons
                    entryId={entry.id}
                    initialLikesCount={entry.likesCount}
                    initialDislikesCount={entry.dislikesCount}
                    userReaction={entry.userReaction}
                    isLoggedIn={!!user}
                    topicSlug={entry.topic.slug}
                    authorUsername={entry.author.username}
                  />
                </article>
              ))}
              <FeedLoadMore tab={activeTab} initialOffset={formattedEntries.length} isLoggedIn={!!user} />
            </div>
          )
        ) : (
          /* "En Çok Görüntülenen" Topics list rendering */
          popularTopics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center text-zinc-500">
              <AlertTriangle className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm">Henüz görüntülenen başlık bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {popularTopics.map((topic) => {
                const firstEntry = topic.entries[0];
                if (!firstEntry) return null;

                const likesCount = firstEntry.likes.filter((l: any) => l.isLike).length;
                const dislikesCount = firstEntry.likes.filter((l: any) => !l.isLike).length;
                const userLike = user ? firstEntry.likes.find((l: any) => l.userId === user.id) : null;
                const userReaction = userLike ? (userLike.isLike ? ("LIKE" as const) : ("DISLIKE" as const)) : null;

                return (
                  <article
                    key={topic.id}
                    className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-3.5 hover:border-zinc-800 transition-all hover:bg-zinc-900/5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-1">
                      <Link
                        href={`/baslik/${topic.slug}`}
                        className="text-sm sm:text-base font-bold text-white hover:text-lime-400 transition-colors flex items-center gap-1.5 flex-wrap"
                      >
                        <span>{topic.title}</span>
                        {topic.poll && (
                          <span className="text-xs shrink-0" title="Anket">📊</span>
                        )}
                      </Link>

                      {/* Views & Author info */}
                      <div className="flex items-center gap-3 text-[11px] sm:text-xs text-zinc-500 shrink-0">
                        <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                          <Eye className="h-3.5 w-3.5 text-lime-400" />
                          <span>{topic.viewCount} görüntülenme</span>
                        </span>
                        <span>•</span>
                        <Link
                          href={`/yazar/${firstEntry.author.username}`}
                          className="flex items-center gap-1 hover:text-zinc-300"
                        >
                          <span className="font-semibold">@{firstEntry.author.username}</span>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      <MentionText content={firstEntry.content} />
                    </div>

                    <ReactionButtons
                      entryId={firstEntry.id}
                      initialLikesCount={likesCount}
                      initialDislikesCount={dislikesCount}
                      userReaction={userReaction}
                      isLoggedIn={!!user}
                      topicSlug={topic.slug}
                      authorUsername={firstEntry.author.username}
                      entryIndex={1}
                    />
                  </article>
                );
              })}
            </div>
          )
        )}
      </section>
    </div>
  );
}
