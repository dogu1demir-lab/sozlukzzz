import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import ProfileDashboard from "@/components/ProfileDashboard";
import { Metadata } from "next";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const author = await prisma.user.findFirst({
    where: {
      username: {
        equals: decodedUsername,
        mode: "insensitive"
      }
    },
    select: { username: true, bio: true, avatarUrl: true }
  });

  if (!author) {
    return {
      title: "Yazar Bulunamadı — sözlükzzz",
    };
  }

  const bioSnippet = author.bio 
    ? author.bio 
    : `@${author.username} yazarının profili, girdileri ve vızıltı puanları.`;

  const avatarImage = author.avatarUrl ? author.avatarUrl : "/og-image.jpg";

  return {
    title: `@${author.username} (Yazar) — sözlükzzz`,
    description: bioSnippet,
    openGraph: {
      title: `@${author.username} — sözlükzzz`,
      description: bioSnippet,
      images: [
        {
          url: avatarImage,
          alt: `@${author.username}`,
        }
      ]
    },
    twitter: {
      card: "summary",
      title: `@${author.username} — sözlükzzz`,
      description: bioSnippet,
      images: [avatarImage],
    }
  };
}

export const revalidate = 0; // Fresh profiles on every visit

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function AuthorProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const sessionUser = await getSessionUser();

  const author = await prisma.user.findFirst({
    where: {
      username: {
        equals: decodedUsername,
        mode: "insensitive"
      }
    },
    include: {
      entries: {
        include: {
          topic: true,
          likes: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      followers: {
        include: {
          following: {
            select: { id: true, username: true, avatarColor: true, role: true, avatarUrl: true }
          }
        }
      },
      following: {
        include: {
          follower: {
            select: { id: true, username: true, avatarColor: true, role: true, avatarUrl: true }
          }
        }
      }
    }
  });

  if (!author) {
    notFound();
  }

  // Fetch comments written by the author to display on Stalk tab
  const comments = await prisma.comment.findMany({
    where: { authorId: author.id },
    include: {
      entry: {
        include: {
          topic: true
        }
      },
      likes: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Calculate statistics & Score
  const totalEntries = author.entries.length;
  const totalComments = comments.length;
  let totalLikesReceived = 0;
  
  author.entries.forEach(entry => {
    totalLikesReceived += entry.likes.filter(l => l.isLike).length;
  });

  // Score Formula: (Entry * 10) + (Comment * 5) + (LikesReceived * 3)
  const score = (totalEntries * 10) + (totalComments * 5) + (totalLikesReceived * 3);

  const isFollowing = sessionUser ? author.following.some(f => f.followerId === sessionUser.id) : false;

  const formattedEntries = author.entries.map((entry) => {
    const likesCount = entry.likes.filter((l) => l.isLike).length;
    const dislikesCount = entry.likes.filter((l) => !l.isLike).length;
    const userLike = sessionUser ? entry.likes.find((l) => l.userId === sessionUser.id) : null;
    const userReaction = userLike ? (userLike.isLike ? ("LIKE" as const) : ("DISLIKE" as const)) : null;

    return {
      id: entry.id,
      content: entry.content,
      imageUrl: entry.imageUrl,
      createdAt: entry.createdAt,
      topic: {
        title: entry.topic.title,
        slug: entry.topic.slug
      },
      likesCount,
      dislikesCount,
      userReaction
    };
  });

  const formattedComments = comments.map(c => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    entry: {
      id: c.entry.id,
      topic: {
        title: c.entry.topic.title,
        slug: c.entry.topic.slug
      }
    },
    likesCount: c.likes.length
  }));

  const followersList = author.following.map(f => f.follower);
  const followingList = author.followers.map(f => f.following);

  return (
    <ProfileDashboard
      author={{
        id: author.id,
        username: author.username,
        avatarColor: author.avatarColor,
        avatarUrl: author.avatarUrl,
        role: author.role,
        bio: author.bio,
        createdAt: author.createdAt
      }}
      sessionUser={sessionUser ? {
        id: sessionUser.id,
        username: sessionUser.username,
        role: sessionUser.role
      } : null}
      followersCount={author.following.length}
      followingCount={author.followers.length}
      isFollowing={isFollowing}
      score={score}
      entries={formattedEntries}
      comments={formattedComments}
      followers={followersList}
      following={followingList}
    />
  );
}
