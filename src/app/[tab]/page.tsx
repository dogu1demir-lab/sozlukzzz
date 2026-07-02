import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { Metadata } from "next";
import ReactionButtons from "@/components/ReactionButtons";
import IntroBanner from "@/components/IntroBanner";
import ExpandableMentionText from "@/components/ExpandableMentionText";
import FeedLoadMore from "@/components/FeedLoadMore";
import { formatDate } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import { redis } from "@/lib/redis";
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
  params: Promise<{ tab: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tab } = await params;
  const activeTab = tab || "bugun";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr";
  return {
    alternates: {
      canonical: `${appUrl}/${activeTab}`,
    }
  };
}

const VALID_TABS = ["bugun", "gundem", "takip", "begenilen", "goruntulenen"];

export default async function Home({ params }: PageProps) {
  const pageStart = performance.now();
  const { tab } = await params;
  const activeTab = tab || "bugun";

  if (!VALID_TABS.includes(activeTab)) {
    redirect("/bugun");
  }

  const user = await getSessionUser();

  let entries: any[] = [];
  let popularTopics: any[] = [];

  const dbStart = performance.now();

  // Query database or Redis based on selected tab
  if (activeTab === "bugun") {
    const cacheKey = "stream:bugun";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        entries = JSON.parse(cached);
      }
    } catch (redisErr) {
      console.error("Redis get bugun error:", redisErr);
    }

    if (entries.length === 0) {
      // Calculate today's start in Turkey (UTC+3) to ensure correctness on UTC servers
      const now = new Date();
      const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const todayStartTurkey = new Date(
        Date.UTC(
          turkeyTime.getUTCFullYear(),
          turkeyTime.getUTCMonth(),
          turkeyTime.getUTCDate(),
          0, 0, 0, 0
        )
      );
      const todayStart = new Date(todayStartTurkey.getTime() - 3 * 60 * 60 * 1000);
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

      const todayTopics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" },
          lastEntryAt: { gte: todayStart }
        },
        include: {
          entries: {
            orderBy: {
              createdAt: "asc"
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
          lastEntryAt: "desc"
        }
      });

      const yesterdayTopics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" },
          lastEntryAt: { gte: yesterdayStart, lt: todayStart }
        },
        include: {
          entries: {
            orderBy: {
              createdAt: "asc"
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
          lastEntryAt: "desc"
        }
      });

      const combined = [...todayTopics, ...yesterdayTopics];
      let initialLimit = 7;
      if (todayTopics.length > 0 && todayTopics.length < 7) {
        // Show at least 4 yesterday topics on first load
        initialLimit = Math.max(7, todayTopics.length + 4);
      }
      const paginatedTopics = combined.slice(0, initialLimit);

      entries = paginatedTopics
        .filter(t => t.entries.length > 0)
        .map(t => {
          const entry = t.entries[0];
          return {
            ...entry,
            imageUrl: entry.imageUrl ? `/api/image/${entry.id}` : null,
            topic: {
              id: t.id,
              title: t.title,
              slug: t.slug,
              poll: t.poll
            }
          };
        });

      // Cache for 30 seconds
      try {
        await redis.set(cacheKey, JSON.stringify(entries), "EX", 30);
      } catch (redisErr) {
        console.error("Redis set bugun error:", redisErr);
      }
    }
  } else if (activeTab === "gundem") {
    const cacheKey = "stream:gundem";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        entries = JSON.parse(cached);
      }
    } catch (redisErr) {
      console.error("Redis get gundem error:", redisErr);
    }

    if (entries.length === 0) {
      // General agenda flow (recent entries, grouped by topic, sorted by total entry count)
      const topics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" },
          entries: {
            some: {}
          }
        },
        include: {
          entries: {
            orderBy: {
              createdAt: "asc"
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
        orderBy: [
          {
            entries: {
              _count: "desc"
            }
          },
          {
            lastEntryAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        take: 7
      });

      entries = topics
        .filter(t => t.entries.length > 0)
        .map(t => {
          const entry = t.entries[0];
          return {
            ...entry,
            imageUrl: entry.imageUrl ? `/api/image/${entry.id}` : null,
            topic: {
              id: t.id,
              title: t.title,
              slug: t.slug,
              poll: t.poll
            }
          };
        });

      // Cache for 60 seconds (1 minute)
      try {
        await redis.set(cacheKey, JSON.stringify(entries), "EX", 60);
      } catch (redisErr) {
        console.error("Redis set gundem error:", redisErr);
      }
    }
  } else if (activeTab === "pozkes") {
    const cacheKey = "stream:pozkes";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        entries = JSON.parse(cached);
      }
    } catch (redisErr) {
      console.error("Redis get pozkes error:", redisErr);
    }

    if (entries.length === 0) {
      const rawEntries = await prisma.entry.findMany({
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
        take: 7
      });

      entries = rawEntries.map(entry => ({
        ...entry,
        imageUrl: entry.imageUrl ? `/api/image/${entry.id}` : null
      }));

      try {
        await redis.set(cacheKey, JSON.stringify(entries), "EX", 30);
      } catch (redisErr) {
        console.error("Redis set pozkes error:", redisErr);
      }
    }
  } else if (activeTab === "takip") {
    const cacheKey = user ? `stream:takip:${user.id}` : "stream:takip:guest";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        entries = JSON.parse(cached);
      }
    } catch (redisErr) {
      console.error("Redis get takip error:", redisErr);
    }

    if (entries.length === 0 && user) {
      // Find following IDs
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
      });
      const followingIds = follows.map((f) => f.followingId);

      const topics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" },
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
          lastEntryAt: "desc"
        },
        take: 7
      });

      entries = topics
        .filter(t => t.entries.length > 0)
        .map(t => {
          const entry = t.entries[0];
          return {
            ...entry,
            imageUrl: entry.imageUrl ? `/api/image/${entry.id}` : null,
            topic: {
              id: t.id,
              title: t.title,
              slug: t.slug,
              poll: t.poll
            }
          };
        });

      try {
        await redis.set(cacheKey, JSON.stringify(entries), "EX", 15);
      } catch (redisErr) {
        console.error("Redis set takip error:", redisErr);
      }
    }
  } else if (activeTab === "begenilen") {
    const cacheKey = "stream:begenilen";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        entries = JSON.parse(cached);
      }
    } catch (redisErr) {
      console.error("Redis get begenilen error:", redisErr);
    }

    if (entries.length === 0) {
      // Fetch recent 100 entries, group by topic, then sort by likes count
      const rawEntries = await prisma.entry.findMany({
        where: {
          topic: {
            slug: { not: "pozkes-galeri" }
          }
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
          likes: {
            _count: "desc"
          }
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
        .slice(0, 7);

      try {
        await redis.set(cacheKey, JSON.stringify(entries), "EX", 60);
      } catch (redisErr) {
        console.error("Redis set begenilen error:", redisErr);
      }
    }
  } else if (activeTab === "goruntulenen") {
    const cacheKey = "stream:goruntulenen";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        popularTopics = JSON.parse(cached);
      }
    } catch (redisErr) {
      console.error("Redis get goruntulenen error:", redisErr);
    }

    if (popularTopics.length === 0) {
      // Fetch topics with most views, along with their first entry
      popularTopics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" }
        },
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
        take: 7
      });

      try {
        await redis.set(cacheKey, JSON.stringify(popularTopics), "EX", 60);
      } catch (redisErr) {
        console.error("Redis set goruntulenen error:", redisErr);
      }
    }
  }

  const dbDuration = performance.now() - dbStart;


  // Map entries to inject user reactions
  const formattedEntries = entries.map((entry) => {
    const likesCount = entry.likes.filter((l: any) => l.isLike).length;
    const dislikesCount = entry.likes.filter((l: any) => !l.isLike).length;
    const userLike = user ? entry.likes.find((l: any) => l.userId === user.id) : null;
    const userReaction = userLike ? (userLike.isLike ? ("LIKE" as const) : ("DISLIKE" as const)) : null;

    return {
      id: entry.id,
      content: entry.content,
      imageUrl: entry.imageUrl ? (entry.imageUrl.startsWith("data:") ? `/api/image/${entry.id}` : entry.imageUrl) : null,
      createdAt: entry.createdAt,
      topic: entry.topic,
      author: {
        id: entry.author.id,
        username: entry.author.username,
        avatarColor: entry.author.avatarColor,
        avatarUrl: entry.author.avatarUrl ? `/api/yazar-image/${encodeURIComponent(entry.author.username)}` : null,
      },
      likesCount,
      dislikesCount,
      userReaction,
    };
  });

  const renderStart = performance.now();

  const element = (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner / Hero Section */}
      <IntroBanner isLoggedIn={!!user} />

      {/* Content Stream */}
      <section className="space-y-6">
        
        {/* Auth wall for Following tab */}
        {activeTab === "takip" && !user && (
          <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center text-zinc-500">
            <Users className="h-8 w-8 text-zinc-650 mx-auto mb-3" />
            <p className="text-sm">Takip ettiğiniz yazarların akışını görmek için giriş yapmalısınız.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/giris" prefetch={false} className="px-4 py-1.5 bg-lime-500 text-black text-xs font-bold rounded-full">giriş yap</Link>
              <Link href="/kaydol" prefetch={false} className="px-4 py-1.5 bg-zinc-800 text-white text-xs font-bold rounded-full">kaydol</Link>
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
                      prefetch={false}
                      className="text-sm sm:text-base font-bold text-white hover:text-lime-400 transition-colors flex items-center gap-1.5 flex-wrap min-w-0"
                    >
                      <span className="break-words break-all block min-w-0">{entry.topic.title}</span>
                      {entry.topic.poll && (
                        <span className="text-xs shrink-0" title="Anket">📊</span>
                      )}
                    </Link>

                    {/* Author / Date */}
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-400 shrink-0">
                      <Link
                        href={`/yazar/${entry.author.username}`}
                        prefetch={false}
                        className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"
                      >
                        {entry.author.avatarUrl ? (
                          <img
                            src={`/api/yazar-image/${encodeURIComponent(entry.author.username)}`}
                            alt={entry.author.username}
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover border border-white/5"
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white/5"
                            style={{ backgroundColor: entry.author.avatarColor }}
                          >
                            {entry.author.username.substring(0, 2).toUpperCase()}
                          </div>
                        )}
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
                        width={600}
                        height={400}
                        className="w-full max-h-96 object-cover hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Entry Content */}
                  <div className="mt-3 text-sm sm:text-base text-zinc-200 leading-relaxed">
                    <ExpandableMentionText content={entry.content} />
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
                        prefetch={false}
                        className="text-sm sm:text-base font-bold text-white hover:text-lime-400 transition-colors flex items-center gap-1.5 flex-wrap min-w-0"
                      >
                        <span className="break-words break-all block min-w-0">{topic.title}</span>
                        {topic.poll && (
                          <span className="text-xs shrink-0" title="Anket">📊</span>
                        )}
                      </Link>

                      {/* Views & Author info */}
                      <div className="flex items-center gap-3 text-[11px] sm:text-xs text-zinc-400 shrink-0">
                        <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                          <Eye className="h-3.5 w-3.5 text-lime-400" />
                          <span>{topic.viewCount} görüntülenme</span>
                        </span>
                        <span>•</span>
                        <Link
                          href={`/yazar/${firstEntry.author.username}`}
                          prefetch={false}
                          className="flex items-center gap-1 hover:text-zinc-300"
                        >
                          <span className="font-semibold">@{firstEntry.author.username}</span>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
                      <ExpandableMentionText content={firstEntry.content} />
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
  
  return element;
}
