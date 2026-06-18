import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EntryBlock from "@/components/EntryBlock";
import AddEntryForm from "@/components/AddEntryForm";
import MentionText from "@/components/MentionText";
import { formatDate } from "@/lib/utils";
import { HelpCircle, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { Suspense } from "react";
import PollBlock from "@/components/PollBlock";
import { Metadata } from "next";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: { title: true, entries: { take: 1, select: { content: true } } }
  });

  if (!topic) {
    return {
      title: "Konu Bulunamadı — sözlükzzz",
    };
  }

  const snippet = topic.entries[0]?.content
    ? topic.entries[0].content.substring(0, 150) + "..."
    : "Bu başlık altındaki vızıltıları oku ve sinekler hakkında tartış!";

  return {
    title: `${topic.title} — sözlükzzz`,
    description: snippet,
    openGraph: {
      title: `${topic.title} — sözlükzzz`,
      description: snippet,
    }
  };
}


export const revalidate = 0; // Disable caching to fetch real-time entries

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function TopicPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  if (slug === "pozkes-galeri") {
    redirect("/pozkes");
  }
  const { q } = await searchParams;
  const user = await getSessionUser();

  // Fetch topic with entries, authors, likes and poll
  const topic = await prisma.topic.findUnique({
    where: { slug },
    include: {
      poll: {
        include: {
          options: {
            include: {
              votes: true
            }
          },
          votes: true
        }
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
        }
      }
    }
  });

  // If topic exists, increment its view count
  if (topic) {
    await prisma.topic.update({
      where: { id: topic.id },
      data: { viewCount: { increment: 1 } }
    });
  }

  // If topic is not found
  if (!topic) {
    const searchTitle = q || slug.replace(/-/g, " ");

    return (
      <div className="max-w-xl mx-auto py-8 text-center animate-in fade-in duration-300">
        <HelpCircle className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-white">
          &quot;{searchTitle}&quot;
        </h1>
        <p className="mt-2 text-zinc-550 text-sm">
          Bu başlık henüz vızıldatılmamış. İlk entry&apos;i girmek ister misin?
        </p>

        {user ? (
          <div className="mt-6 rounded-xl border border-zinc-850 bg-black/40 p-6 text-left shadow-xl">
            <h3 className="text-sm font-bold text-lime-400 mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>yeni başlık oluştur</span>
            </h3>
            {/* Direct creation link to prefill title */}
            <Link
              href={`/yeni?title=${encodeURIComponent(searchTitle)}`}
              className="group flex items-center justify-between w-full h-11 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:text-white hover:border-lime-500 transition-all"
            >
              <span className="font-medium truncate">Başlığı oluşturmaya başla: &quot;{searchTitle}&quot;</span>
              <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 text-sm text-zinc-400">
            Fikirlerini paylaşıp bu başlığı oluşturmak için lütfen önce{" "}
            <Link href="/giris" className="text-lime-400 font-bold hover:underline">
              giriş yapın
            </Link>{" "}
            veya{" "}
            <Link href="/kaydol" className="text-lime-400 font-bold hover:underline">
              kaydolun
            </Link>
            .
          </div>
        )}
      </div>
    );
  }

  // Format entries with user's specific reactions
  const formattedEntries = topic.entries.map((entry) => {
    const likesCount = entry.likes.filter((l) => l.isLike).length;
    const dislikesCount = entry.likes.filter((l) => !l.isLike).length;
    const userLike = user ? entry.likes.find((l) => l.userId === user.id) : null;
    const userReaction = userLike ? (userLike.isLike ? ("LIKE" as const) : ("DISLIKE" as const)) : null;

    return {
      ...entry,
      likesCount,
      dislikesCount,
      userReaction,
      topic: {
        slug: topic.slug,
        title: topic.title
      }
    };
  });

  // Format poll details if present
  let formattedPoll = null;
  if (topic.poll) {
    const totalVotes = topic.poll.votes.length;
    const hasVotedAny = user ? topic.poll.votes.some(v => v.userId === user.id) : false;
    const options = topic.poll.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      votesCount: opt.votes.length,
      hasVoted: user ? opt.votes.some(v => v.userId === user.id) : false
    }));

    formattedPoll = {
      id: topic.poll.id,
      question: topic.poll.question,
      options,
      totalVotes,
      hasVotedAny
    };
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Topic Title Header */}
      <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-white hover:text-lime-400 transition-colors inline-block select-all">
          {topic.title}
        </h1>
        {topic.poll && (
          <span className="bg-lime-500/10 text-lime-400 border border-lime-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            📊 Anket
          </span>
        )}
      </div>

      {/* Render Poll Block if present */}
      {formattedPoll && (
        <PollBlock
          pollId={formattedPoll.id}
          question={formattedPoll.question}
          options={formattedPoll.options}
          totalVotes={formattedPoll.totalVotes}
          isLoggedIn={!!user}
          hasVotedAny={formattedPoll.hasVotedAny}
        />
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {formattedEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-850 p-10 text-center text-zinc-550 text-xs italic">
            Bu anket başlığına henüz vızıldanmamış. Aşağıdan ilk entry&apos;i girerek tartışmayı başlatın!
          </div>
        ) : (
          formattedEntries.map((entry, idx) => (
            <EntryBlock
              key={entry.id}
              entry={entry as any}
              index={idx}
              isLoggedIn={!!user}
              currentUserId={user?.id}
              isAdmin={user?.role === "ADMIN"}
            />
          ))
        )}
      </div>

      {/* Add Entry Editor Form */}
      <Suspense fallback={<div className="h-20 bg-zinc-950/20 animate-pulse rounded-xl border border-zinc-900"></div>}>
        <AddEntryForm topicId={topic.id} isLoggedIn={!!user} />
      </Suspense>

    </div>
  );
}

