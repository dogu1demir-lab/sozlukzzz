"use server";

import { prisma } from "@/lib/db";
import { saveBase64Image, deleteImageFile } from "@/lib/upload";
import { redis } from "@/lib/redis";
import { getSessionUser, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/mail";

// Helper: Hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

import { cleanUsernameHandle } from "@/lib/utils";

// Helper: Calculate user score and check link posting capability (Level 15 / Aerodinamik Sinek -> score >= 930)
async function userCanPostLinks(userId: string, role: string): Promise<{ allowed: boolean; score: number }> {
  if (role === "ADMIN") return { allowed: true, score: 99999 };

  const totalEntries = await prisma.entry.count({
    where: { authorId: userId }
  });

  const totalComments = await prisma.comment.count({
    where: { authorId: userId }
  });

  // Calculate likes received (isLike: true)
  const totalLikesReceived = await prisma.like.count({
    where: {
      entry: { authorId: userId },
      isLike: true
    }
  });

  const score = (totalEntries * 10) + (totalComments * 5) + (totalLikesReceived * 3);
  return { allowed: score >= 930, score };
}

// Helper: Invalidate cached entries/sidebars on database modifications
export async function clearAllFeedAndSidebarCaches(userId?: string, extraUserIds?: string[]) {
  try {
    const keysToDel = [
      "stream:bugun",
      "stream:gundem",
      "stream:pozkes",
      "stream:begenilen",
      "stream:goruntulenen"
    ];
    
    const sidebarTabs = ["bugun", "gundem", "takip", "begenilen", "goruntulenen", "pozkes"];
    for (const tab of sidebarTabs) {
      const pattern = `sidebar:${tab}:*`;
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        keysToDel.push(...keys);
      }
    }

    if (userId) {
      keysToDel.push(`stream:takip:${userId}`);
      keysToDel.push(`session:user:${userId}`);
      keysToDel.push(`user:notifications:${userId}`);
      keysToDel.push(`user:notifications:count:${userId}`);
    }

    if (extraUserIds && extraUserIds.length > 0) {
      for (const uid of extraUserIds) {
        keysToDel.push(`user:notifications:${uid}`);
        keysToDel.push(`user:notifications:count:${uid}`);
      }
    }

    const takipKeys = await redis.keys("stream:takip:*");
    if (takipKeys && takipKeys.length > 0) {
      keysToDel.push(...takipKeys);
    }

    const uniqueKeys = Array.from(new Set(keysToDel));
    if (uniqueKeys.length > 0) {
      await redis.del(uniqueKeys);
    }
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }
}

// Helper: Convert Turkish text to SEO Slug
export async function convertToSlug(text: string): Promise<string> {
  let slug = text.trim().toLowerCase();
  const turkishChars: { [key: string]: string } = {
    'ı': 'i', 'ş': 's', 'ç': 'c', 'ğ': 'g', 'ü': 'u', 'ö': 'o',
    'â': 'a', 'î': 'i', 'û': 'u'
  };
  
  for (const char in turkishChars) {
    slug = slug.replaceAll(char, turkishChars[char]);
  }
  
  slug = slug
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/-+/g, '-');         // Replace multiple dashes
    
  return slug;
}

// Action: Register
export async function registerAction(prevState: any, formData: FormData) {
  // Honeypot check to block automated spam bots
  const honeypot = formData.get("website")?.toString();
  if (honeypot) {
    console.log("[SECURITY] Bot registration attempt blocked via Honeypot.");
    return { error: "Güvenlik kontrolü başarısız oldu zzz." };
  }

  try {
    const disableSignups = await redis.get("settings:disable_signups");
    if (disableSignups === "true") {
      return { error: "Yeni üye alımı geçici olarak kapatılmıştır." };
    }
  } catch (err) {
    console.error("Redis signup check error:", err);
  }

  const displayName = formData.get("displayName")?.toString().trim();
  const username = formData.get("username")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!displayName || !username || !password || !email) {
    return { error: "Lütfen tüm alanları doldurun." };
  }

  if (displayName.length < 3 || displayName.length > 20) {
    return { error: "Görünen isim 3-20 karakter arasında olmalıdır." };
  }

  if (username.length < 3 || username.length > 14) {
    return { error: "Kullanıcı adı (etiket) 3-14 karakter arasında olmalıdır." };
  }

  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalıdır." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Lütfen geçerli bir e-posta adresi girin." };
  }

  // Check display name characters (allow spaces, Turkish characters)
  if (!/^[a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ\s]+$/.test(displayName)) {
    return { error: "Görünen isim yalnızca harf, sayı, boşluk ve alt çizgi içerebilir." };
  }

  // Check username handle characters (strictly English alphanumeric and underscores)
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { error: "Kullanıcı adı (etiket) yalnızca küçük İngilizce harfler, sayılar ve alt çizgi içerebilir." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return { error: "Bu kullanıcı adı zaten alınmış." };
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return { error: "Bu e-posta adresi zaten kullanımda." };
    }

    // Colors for default avatar
    const colors = ["#14b8a6", "#f97316", "#a855f7", "#ec4899", "#3b82f6", "#22c55e", "#ef4444"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await prisma.user.create({
      data: {
        username: username,
        displayName: displayName,
        passwordHash: hashPassword(password),
        email: email,
        avatarColor: randomColor,
      }
    });

    // Send a beautifully styled welcome email in the background without blocking registration
    if (email) {
      sendWelcomeEmail(email, displayName).catch((mailError) => {
        console.error("Welcome email sending failed in background:", mailError);
      });
    }

    await setSessionCookie(user.id);
    let xSignupEventId = "";
    try {
      xSignupEventId = (await redis.get("settings:x_signup_event_id")) || "";
    } catch (redisErr) {}
    return { success: true, xSignupEventId };
  } catch (e) {
    return { error: "Kayıt olurken bir hata oluştu." };
  }
}

// Action: Login
export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { error: "Lütfen tüm alanları doldurun." };
  }

  try {
    const cleanHandle = cleanUsernameHandle(username);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: {
              equals: cleanHandle,
              mode: 'insensitive'
            }
          },
          {
            email: {
              equals: username,
              mode: 'insensitive'
            }
          }
        ]
      }
    });

    if (!user || user.passwordHash !== hashPassword(password)) {
      return { error: "Kullanıcı adı/e-posta veya şifre hatalı." };
    }

    await setSessionCookie(user.id);
    return { success: true };
  } catch (e) {
    return { error: "Giriş yapılırken bir hata oluştu." };
  }
}

// Action: Logout
export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath("/");
  return { success: true };
}

// Action: Create Topic & Entry (New Thread)
export async function createTopicAndEntryAction(title: string, content: string, imageUrl?: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanTitle = title.trim();
  const cleanContent = content.trim();

  if (!cleanTitle || !cleanContent) {
    return { error: "Başlık ve içerik boş olamaz." };
  }

  if (cleanTitle.length > 80) {
    return { error: "Başlık en fazla 80 karakter olabilir." };
  }

  if (cleanContent.length < 45) {
    return { error: "İçerik en az 45 karakter olmalıdır zzz." };
  }

  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
  if (linkRegex.test(cleanTitle) || linkRegex.test(cleanContent)) {
    const { allowed, score } = await userCanPostLinks(user.id, user.role);
    if (!allowed) {
      return { 
        error: `Link paylaşabilmek için en az 15. rütbe (Aerodinamik Sinek) olmanız gerekmektedir. Şu anki puanınız: ${score} (Gerekli: 930) zzz!` 
      };
    }
  }
  if (cleanContent.length > 5000) {
    return { error: "İçerik en fazla 5000 karakter olabilir zzz." };
  }

  try {
    const slug = await convertToSlug(cleanTitle);

    let savedImageUrl: string | null = null;
    if (imageUrl) {
      savedImageUrl = await saveBase64Image(imageUrl, "entries");
    }

    // Check if topic exists
    let topic = await prisma.topic.findUnique({
      where: { slug }
    });

    if (topic) {
      // If topic exists, just add entry to it
      const entry = await prisma.entry.create({
        data: {
          content: cleanContent,
          topicId: topic.id,
          authorId: user.id,
          imageUrl: savedImageUrl
        }
      });

      // Touch topic lastEntryAt to bubble it up in sidebars and feeds
      await prisma.$executeRaw`UPDATE "Topic" SET "lastEntryAt" = ${new Date()} WHERE "id" = ${topic.id}`;

      // Calculate target page for this new entry in the existing topic
      const totalEntries = await prisma.entry.count({
        where: { topicId: topic.id }
      });
      const page = Math.ceil(totalEntries / 10) || 1;

      // Parse mentions and create notifications
      const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
      const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
      
      for (const rawUsername of mentionedUsernames) {
        const username = cleanUsernameHandle(rawUsername);
        if (username === user.username) continue;
        const targetUser = await prisma.user.findUnique({
          where: { username }
        });
        if (targetUser) {
          await prisma.notification.create({
            data: {
              type: "REPLY",
              content: `@${user.username} bir entry'de sizden bahsetti!`,
              userId: targetUser.id,
              relatedUrl: `/baslik/${slug}?p=${page}#entry-${entry.id}`
            }
          });
        }
      }

      await clearAllFeedAndSidebarCaches(user.id);

      // Publish global update to Redis for real-time sidebar & page updates
      try {
        await redis.publish("global:updates", JSON.stringify({ type: "NEW_ENTRY", topicId: topic.id }));
      } catch (redisErr) {
        console.error("Redis global publish error:", redisErr);
      }

      revalidatePath("/");
      revalidatePath(`/baslik/${slug}`);
      return { success: true, slug, entryId: entry.id, page };
    }

    // Create new topic and entry
    const newTopic = await prisma.topic.create({
      data: {
        title: cleanTitle,
        slug,
        createdById: user.id,
        entries: {
          create: {
            content: cleanContent,
            authorId: user.id,
            imageUrl: savedImageUrl
          }
        }
      },
      include: {
        entries: true
      }
    });

    const entryId = newTopic.entries[0].id;
    // Parse mentions and create notifications
    const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
    const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
    
    for (const rawUsername of mentionedUsernames) {
      const username = cleanUsernameHandle(rawUsername);
      if (username === user.username) continue;
      const targetUser = await prisma.user.findUnique({
        where: { username }
      });
      if (targetUser) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            content: `@${user.username} yeni bir başlıkta sizden bahsetti! vızzz!`,
            userId: targetUser.id,
            relatedUrl: `/baslik/${slug}#entry-${entryId}`
          }
        });
      }
    }

    await clearAllFeedAndSidebarCaches(user.id);

    // Publish global update to Redis for real-time sidebar & page updates
    try {
      await redis.publish("global:updates", JSON.stringify({ type: "NEW_TOPIC", topicId: newTopic.id, title: newTopic.title, slug: newTopic.slug }));
    } catch (redisErr) {
      console.error("Redis global publish error:", redisErr);
    }
    revalidatePath("/");
    revalidatePath(`/baslik/${slug}`);
    return { success: true, slug, entryId, page: 1 };
  } catch (e) {
    return { error: "Başlık oluşturulurken bir hata oluştu." };
  }
}

// Action: Create Entry under existing topic
export async function createEntryAction(topicId: string, content: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanContent = content.trim();
  if (!cleanContent) return { error: "İçerik boş olamaz." };
  if (cleanContent.length < 45) {
    return { error: "Entry en az 45 karakter olmalıdır zzz." };
  }

  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
  if (linkRegex.test(cleanContent)) {
    const { allowed, score } = await userCanPostLinks(user.id, user.role);
    if (!allowed) {
      return { 
        error: `Link paylaşabilmek için en az 15. rütbe (Aerodinamik Sinek) olmanız gerekmektedir. Şu anki puanınız: ${score} (Gerekli: 930) zzz!` 
      };
    }
  }
  if (cleanContent.length > 5000) {
    return { error: "Entry en fazla 5000 karakter olabilir zzz." };
  }

  try {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) return { error: "Başlık bulunamadı." };

    const entry = await prisma.entry.create({
      data: {
        content: cleanContent,
        topicId,
        authorId: user.id
      }
    });

    // Touch topic lastEntryAt to bubble it up in sidebars and feeds (using raw SQL to prevent Prisma's automatic updatedAt trigger)
    await prisma.$executeRaw`UPDATE "Topic" SET "lastEntryAt" = ${new Date()} WHERE "id" = ${topicId}`;

    // Calculate target page for this new entry
    const totalEntries = await prisma.entry.count({
      where: { topicId }
    });
    const page = Math.ceil(totalEntries / 10) || 1;

    // Parse mentions and create notifications
    const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
    const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
    const uniqueMentions = Array.from(new Set(mentionedUsernames));

    for (const rawUsername of uniqueMentions) {
      const username = cleanUsernameHandle(rawUsername);
      if (username === user.username) continue;
      const targetUser = await prisma.user.findUnique({
        where: { username }
      });
      if (targetUser) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            content: `@${user.username} bir entry'de sizden bahsetti! vızzz!`,
            userId: targetUser.id,
            relatedUrl: `/baslik/${topic.slug}?p=${page}#entry-${entry.id}`
          }
        });
      }
    }

    // Notify other participants in this topic (excluding the author themselves and mentioned users who already got a notification)
    const otherAuthors = await prisma.entry.findMany({
      where: {
        topicId,
        authorId: { 
          notIn: [user.id, ...uniqueMentions.map(u => u.toLowerCase())] 
        }
      },
      select: { authorId: true, author: { select: { username: true } } },
      distinct: ['authorId']
    });

    for (const other of otherAuthors) {
      // Skip if they were already mentioned (just to be safe)
      if (uniqueMentions.some(u => u.toLowerCase() === other.author.username.toLowerCase())) continue;
      
      await prisma.notification.create({
        data: {
          type: "REPLY",
          content: `@${user.username} "${topic.title}" başlığına yeni bir vızzz girdi!`,
          userId: other.authorId,
          relatedUrl: `/baslik/${topic.slug}?p=${page}#entry-${entry.id}`
        }
      });
    }

    await clearAllFeedAndSidebarCaches(user.id);

    // Publish global update to Redis for real-time sidebar & page updates
    try {
      await redis.publish("global:updates", JSON.stringify({ type: "NEW_ENTRY", topicId }));
    } catch (redisErr) {
      console.error("Redis global publish error:", redisErr);
    }
    revalidatePath(`/baslik/${topic.slug}`);
    return { success: true, entryId: entry.id, page };
  } catch (e) {
    return { error: "Entry gönderilirken bir hata oluştu." };
  }
}

// Action: Like / Dislike Entry
export async function likeEntryAction(entryId: string, isLike: boolean) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { topic: true }
    });

    if (!entry) return { error: "Entry bulunamadı." };

    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        entryId_userId: { entryId, userId: user.id }
      }
    });

    if (existingLike) {
      if (existingLike.isLike === isLike) {
        // If same reaction, remove it (toggle)
        await prisma.like.delete({
          where: { id: existingLike.id }
        });
      } else {
        // If different reaction, update it
        await prisma.like.update({
          where: { id: existingLike.id },
          data: { isLike }
        });
      }
    } else {
      // Create new like
      await prisma.like.create({
        data: {
          entryId,
          userId: user.id,
          isLike
        }
      });

      // Send notification to entry author (if it's not the user themselves)
      if (entry.authorId !== user.id && isLike) {
        // Calculate page of the liked entry
        const entryCountBefore = await prisma.entry.count({
          where: {
            topicId: entry.topicId,
            createdAt: { lte: entry.createdAt }
          }
        });
        const page = Math.ceil(entryCountBefore / 10) || 1;

        await prisma.notification.create({
          data: {
            type: "LIKE",
            content: `@${user.username} bir entry'nizi beğendi! vızzz!`,
            userId: entry.authorId,
            relatedUrl: `/baslik/${entry.topic.slug}?p=${page}#entry-${entry.id}`
          }
        });
      }
    }

    await clearAllFeedAndSidebarCaches(user.id, entry.authorId !== user.id ? [entry.authorId] : undefined);
    revalidatePath(`/baslik/${entry.topic.slug}`);
    return { success: true };
  } catch (e) {
    return { error: "Reaksiyon kaydedilirken bir hata oluştu." };
  }
}

// Action: Send Private Message
export async function sendMessageAction(receiverUsername: string, content: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanContent = content.trim();
  if (!cleanContent) return { error: "Mesaj boş olamaz." };
  if (cleanContent.length > 2000) {
    return { error: "Mesaj en fazla 2000 karakter olabilir zzz." };
  }

  try {
    const targetHandle = cleanUsernameHandle(receiverUsername);
    const receiver = await prisma.user.findUnique({
      where: { username: targetHandle }
    });

    if (!receiver) return { error: "Alıcı kullanıcı bulunamadı." };
    if (receiver.id === user.id) return { error: "Kendinize mesaj gönderemezsiniz." };

    const message = await prisma.message.create({
      data: {
        content: cleanContent,
        senderId: user.id,
        receiverId: receiver.id
      }
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        type: "MESSAGE",
        content: `@${user.username} size özel bir vızzz gönderdi!`,
        userId: receiver.id,
        relatedUrl: `/mesajlar?u=${user.username}`
      }
    });

    // Publish event to Redis for instant real-time UI refresh
    try {
      await redis.publish(`user:${receiver.id}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
      await redis.publish(`user:${user.id}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
    } catch (redisErr) {
      console.error("Redis publish error:", redisErr);
    }

    revalidatePath(`/mesajlar`);
    return { success: true };
  } catch (e) {
    return { error: "Mesaj gönderilirken bir hata oluştu." };
  }
}

// Action: Edit Private Message
export async function editMessageAction(messageId: string, newContent: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanContent = newContent.trim();
  if (!cleanContent) return { error: "Mesaj boş olamaz." };
  if (cleanContent.length > 2000) {
    return { error: "Mesaj en fazla 2000 karakter olabilir zzz." };
  }

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) return { error: "Mesaj bulunamadı." };
    if (message.senderId !== user.id) {
      return { error: "Bu işlem için yetkiniz yoktur." };
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { content: cleanContent }
    });

    // Notify both users for instant updates
    try {
      await redis.publish(`user:${message.receiverId}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
      await redis.publish(`user:${message.senderId}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
    } catch (redisErr) {
      console.error("Redis publish error:", redisErr);
    }

    revalidatePath(`/mesajlar`);
    return { success: true };
  } catch (e) {
    return { error: "Mesaj düzenlenirken bir hata oluştu." };
  }
}

// Action: Delete Private Message (Kökten Silme)
export async function deleteMessageAction(messageId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) return { error: "Mesaj bulunamadı." };
    if (message.senderId !== user.id) {
      return { error: "Bu işlem için yetkiniz yoktur." };
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    // Notify both users for instant updates
    try {
      await redis.publish(`user:${message.receiverId}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
      await redis.publish(`user:${message.senderId}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
    } catch (redisErr) {
      console.error("Redis publish error:", redisErr);
    }

    revalidatePath(`/mesajlar`);
    return { success: true };
  } catch (e) {
    return { error: "Mesaj silinirken bir hata oluştu." };
  }
}

// Action: Clear/Delete Conversation (Sohbeti Kökten Temizleme)
export async function clearConversationAction(partnerUsername: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const targetHandle = cleanUsernameHandle(partnerUsername);
    const partner = await prisma.user.findUnique({
      where: { username: targetHandle }
    });

    if (!partner) return { error: "Kullanıcı bulunamadı." };

    // Delete all messages in the thread (both sent and received)
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: partner.id },
          { senderId: partner.id, receiverId: user.id }
        ]
      }
    });

    // Notify both users for instant updates
    try {
      await redis.publish(`user:${partner.id}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
      await redis.publish(`user:${user.id}:messages`, JSON.stringify({ type: "NEW_MESSAGE", senderUsername: user.username }));
    } catch (redisErr) {
      console.error("Redis publish error:", redisErr);
    }

    revalidatePath(`/mesajlar`);
    return { success: true };
  } catch (e) {
    return { error: "Sohbet geçmişi temizlenirken bir hata oluştu." };
  }
}

// Action: Mark Notifications as Read
export async function markNotificationsAsReadAction() {
  const user = await getSessionUser();
  if (!user) return { error: "Yetkisiz işlem." };

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    });
    await clearAllFeedAndSidebarCaches(user.id);
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: "Bildirimler güncellenemedi." };
  }
}

// Action: Follow / Unfollow User
export async function followUserAction(followingId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };
  if (user.id === followingId) return { error: "Kendinizi takip edemezsiniz." };

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) return { error: "Takip edilecek kullanıcı bulunamadı." };

    // Check if follow relation exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: user.id, followingId }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });
      await clearAllFeedAndSidebarCaches(user.id, [followingId]);
      revalidatePath(`/yazar/${targetUser.username}`);
      return { success: true, followed: false };
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId
        }
      });

      // Create notification for the followed user
      await prisma.notification.create({
        data: {
          type: "SYSTEM",
          content: `@${user.username} sizi takip etmeye başladı! vızzz!`,
          userId: followingId,
          relatedUrl: `/yazar/${user.username}`
        }
      });

      await clearAllFeedAndSidebarCaches(user.id, [followingId]);
      revalidatePath(`/yazar/${targetUser.username}`);
      return { success: true, followed: true };
    }
  } catch (e) {
    return { error: "Takip işlemi gerçekleştirilemedi." };
  }
}

// Action: Create PozKes Entry (Entry with Image)
export async function createPozKesEntryAction(title: string, content: string, base64Image: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const disablePozkes = await redis.get("settings:disable_pozkes");
    if (disablePozkes === "true") {
      return { error: "PozKes özelliği geçici olarak devre dışı bırakılmıştır." };
    }
  } catch (err) {
    console.error("Redis pozkes check error:", err);
  }

  const cleanTitle = title.trim() || "pozkes galeri";
  const cleanContent = content.trim();

  if (!cleanContent) {
    return { error: "Açıklama boş olamaz." };
  }
  if (cleanContent.length > 5000) {
    return { error: "Açıklama en fazla 5000 karakter olabilir zzz." };
  }

  if (!base64Image) {
    return { error: "Lütfen bir görsel yükleyin." };
  }

  try {
    const slug = await convertToSlug(cleanTitle);

    const savedImageUrl = await saveBase64Image(base64Image, "entries");
    if (!savedImageUrl) {
      return { error: "Görsel kaydedilemedi, geçersiz veri." };
    }

    // Check if topic exists
    let topic = await prisma.topic.findUnique({
      where: { slug }
    });

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          title: cleanTitle,
          slug,
          createdById: user.id
        }
      });
    }

    const entry = await prisma.entry.create({
      data: {
        content: cleanContent,
        imageUrl: savedImageUrl,
        topicId: topic.id,
        authorId: user.id
      }
    });

    // Update topic lastEntryAt timestamp for Bugün and Gündem tabs
    await prisma.topic.update({
      where: { id: topic.id },
      data: { lastEntryAt: new Date() }
    });

    // Calculate page for PozKes entry inside its topic
    const entryCountBefore = await prisma.entry.count({
      where: {
        topicId: topic.id,
        createdAt: { lte: entry.createdAt }
      }
    });
    const page = Math.ceil(entryCountBefore / 10) || 1;

    // Parse mentions and create notifications
    const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
    const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
    
    for (const rawUsername of mentionedUsernames) {
      const username = cleanUsernameHandle(rawUsername);
      if (username === user.username) continue;
      const targetUser = await prisma.user.findUnique({
        where: { username }
      });
      if (targetUser) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            content: `@${user.username} PozKes'te sizden bahsetti! vızzz!`,
            userId: targetUser.id,
            relatedUrl: `/baslik/${slug}?p=${page}#entry-${entry.id}`
          }
        });
      }
    }

    await clearAllFeedAndSidebarCaches(user.id);

    // Publish global update to Redis for real-time sidebar & page updates
    try {
      await redis.publish("global:updates", JSON.stringify({ type: "NEW_ENTRY", topicId: topic.id }));
    } catch (redisErr) {
      console.error("Redis global publish error:", redisErr);
    }
    revalidatePath("/");
    revalidatePath(`/baslik/${slug}`);
    revalidatePath(`/yazar/${user.username}`);
    revalidatePath("/pozkes");
    return { success: true, slug };
  } catch (e) {
    return { error: "Görsel paylaşılırken bir hata oluştu." };
  }
}

// Action: Create Comment under a PozKes Entry
export async function createCommentAction(entryId: string, content: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanContent = content.trim();
  if (!cleanContent) return { error: "Yorum boş olamaz." };
  if (cleanContent.length > 500) {
    return { error: "Yorum en fazla 500 karakter olabilir zzz." };
  }

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { author: true }
    });

    if (!entry) return { error: "Görsel bulunamadı." };

    const comment = await prisma.comment.create({
      data: {
        content: cleanContent,
        entryId,
        authorId: user.id
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
        }
      }
    });

    // Notify PozKes entry author
    if (entry.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "REPLY",
          content: `@${user.username} PozKes'teki fotoğrafına vızıldadı! vızzz!`,
          userId: entry.authorId,
          relatedUrl: `/pozkes#entry-${entryId}`
        }
      });
    }

    // Parse mentions and create notifications
    const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
    const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
    
    for (const rawUsername of mentionedUsernames) {
      const username = cleanUsernameHandle(rawUsername);
      if (username === user.username) continue;
      if (username === cleanUsernameHandle(entry.author.username)) continue; // already notified above
      
      const targetUser = await prisma.user.findUnique({
        where: { username }
      });
      if (targetUser) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            content: `@${user.username} PozKes'te bir yorumda sizden bahsetti! vızzz!`,
            userId: targetUser.id,
            relatedUrl: `/pozkes#entry-${entryId}`
          }
        });
      }
    }

    await clearAllFeedAndSidebarCaches(user.id, entry.authorId !== user.id ? [entry.authorId] : undefined);
    revalidatePath("/pozkes");
    return { 
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
        likesCount: 0,
        hasLiked: false
      }
    };
  } catch (e) {
    return { error: "Yorum gönderilirken bir hata oluştu." };
  }
}

// Action: Like / Dislike a Comment
export async function likeCommentAction(commentId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) return { error: "Yorum bulunamadı." };

    // Check if like exists
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId: user.id }
      }
    });

    if (existingLike) {
      // Toggle off
      await prisma.commentLike.delete({
        where: { id: existingLike.id }
      });
    } else {
      // Toggle on
      await prisma.commentLike.create({
        data: {
          commentId,
          userId: user.id
        }
      });

      // Notify comment author
      if (comment.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            content: `@${user.username} PozKes'teki bir yorumunu beğendi! vızzz!`,
            userId: comment.authorId,
            relatedUrl: `/pozkes#entry-${comment.entryId}`
          }
        });
      }
    }

    await clearAllFeedAndSidebarCaches(user.id, comment.authorId !== user.id ? [comment.authorId] : undefined);
    revalidatePath("/pozkes");
    return { success: true };
  } catch (e) {
    return { error: "Yorum beğenilirken bir hata oluştu." };
  }
}

// Action: Delete a Comment
export async function deleteCommentAction(commentId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) return { error: "Yorum bulunamadı." };

    // Only comment author or admin can delete
    if (comment.authorId !== user.id && user.role !== "ADMIN") {
      return { error: "Bu işlemi gerçekleştirmek için yetkiniz yok." };
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    await clearAllFeedAndSidebarCaches(user.id, comment.authorId !== user.id ? [comment.authorId] : undefined);
    revalidatePath("/pozkes");
    return { success: true };
  } catch (e) {
    return { error: "Yorum silinirken bir hata oluştu." };
  }
}

// Action: Update Profile Avatar
export async function updateProfileAvatarAction(base64Image: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const savedAvatarUrl = await saveBase64Image(base64Image, "avatars");
    if (!savedAvatarUrl) {
      return { error: "Profil fotoğrafı kaydedilemedi, geçersiz veri." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: savedAvatarUrl }
    });

    await clearAllFeedAndSidebarCaches(user.id);
    revalidatePath(`/yazar/${user.username}`);
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { error: "Profil fotoğrafı güncellenirken bir hata oluştu." };
  }
}

// Action: Update Profile Info (displayName, Bio and Avatar Color)
export async function updateProfileInfoAction(displayName: string, bio: string, avatarColor: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanDisplayName = displayName.trim();

  if (cleanDisplayName.length < 3 || cleanDisplayName.length > 20) {
    return { error: "Görünen isim 3-20 karakter arasında olmalıdır." };
  }

  if (!/^[a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ\s]+$/.test(cleanDisplayName)) {
    return { error: "Görünen isim yalnızca harf, sayı, boşluk ve alt çizgi içerebilir." };
  }

  if (bio.trim().length > 160) {
    return { error: "Biyografi en fazla 160 karakter olabilir zzz." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: cleanDisplayName,
        bio: bio.trim(),
        avatarColor
      }
    });

    await clearAllFeedAndSidebarCaches(user.id);
    revalidatePath(`/yazar/${user.username}`);
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { error: "Profil bilgileri güncellenirken bir hata oluştu." };
  }
}

// Action: Delete Account
export async function deleteAccountAction() {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    // Check if account deletion is disabled
    try {
      const disableSelfDeletion = await redis.get("settings:disable_self_deletion");
      if (disableSelfDeletion === "true") {
        return { error: "Hesap silme işlemi yönetici tarafından geçici olarak devre dışı bırakılmıştır zzz." };
      }
    } catch (redisErr) {
      console.error("Redis get self deletion check error:", redisErr);
    }

    // Delete user (cascade will delete entries, likes, comments, etc.)
    await prisma.user.delete({
      where: { id: user.id }
    });

    // Clean up empty topics that have 0 entries left
    try {
      await prisma.topic.deleteMany({
        where: {
          entries: {
            none: {}
          }
        }
      });
    } catch (topicErr) {
      console.error("Failed to clean up empty topics:", topicErr);
    }

    // Clear cookie
    await clearSessionCookie();

    await clearAllFeedAndSidebarCaches(user.id);
    return { success: true };
  } catch (e) {
    return { error: "Hesap silinirken bir hata oluştu." };
  }
}

// Action: Create Poll Topic
export async function createPollTopicAction(title: string, question: string, options: string[]) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanTitle = title.trim();
  const cleanQuestion = question.trim();
  const cleanOptions = options.map(o => o.trim()).filter(Boolean);

  if (!cleanTitle || !cleanQuestion || cleanOptions.length < 2) {
    return { error: "Lütfen başlık, soru ve en az 2 seçeneği doldurun." };
  }

  try {
    const slug = await convertToSlug(cleanTitle);

    // Check if topic exists
    let existingTopic = await prisma.topic.findUnique({
      where: { slug }
    });

    if (existingTopic) {
      return { error: "Bu başlık zaten mevcut." };
    }

    // Create new topic with poll
    const newTopic = await prisma.topic.create({
      data: {
        title: cleanTitle,
        slug,
        createdById: user.id,
        poll: {
          create: {
            question: cleanQuestion,
            options: {
              create: cleanOptions.map(text => ({ text }))
            }
          }
        }
      }
    });

    await clearAllFeedAndSidebarCaches(user.id);

    // Publish global update to Redis for real-time sidebar & page updates
    try {
      await redis.publish("global:updates", JSON.stringify({ type: "NEW_TOPIC", topicId: newTopic.id, title: newTopic.title, slug: newTopic.slug }));
    } catch (redisErr) {
      console.error("Redis global publish error:", redisErr);
    }
    revalidatePath("/");
    revalidatePath(`/baslik/${slug}`);
    return { success: true, slug };
  } catch (e) {
    return { error: "Anketli başlık oluşturulurken bir hata oluştu." };
  }
}

// Action: Vote in Poll
export async function voteInPollAction(pollId: string, optionId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true,
        topic: true
      }
    });

    if (!poll) return { error: "Anket bulunamadı." };

    // Check if option belongs to this poll
    const optionExists = poll.options.some(o => o.id === optionId);
    if (!optionExists) return { error: "Geçersiz seçenek." };

    // Check if user already voted in this poll
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: { pollId, userId: user.id }
      }
    });

    if (existingVote) {
      if (existingVote.optionId === optionId) {
        // Toggle vote off (retract vote)
        await prisma.pollVote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Change vote
        await prisma.pollVote.update({
          where: { id: existingVote.id },
          data: { optionId }
        });
      }
    } else {
      // Create new vote
      await prisma.pollVote.create({
        data: {
          pollId,
          optionId,
          userId: user.id
        }
      });
    }

    // Revalidate the topic path
    await clearAllFeedAndSidebarCaches(user.id);
    revalidatePath(`/baslik/${poll.topic.slug}`);
    return { success: true };
  } catch (e) {
    return { error: "Oy kullanılırken bir hata oluştu." };
  }
}

// Action: Get Poll Voters
export async function getPollVotersAction(pollId: string) {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            votes: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
                }
              }
            }
          }
        }
      }
    });

    if (!poll) return { error: "Anket bulunamadı." };

    const formattedOptions = poll.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      voters: opt.votes.map(v => v.user)
    }));

    return { success: true, options: formattedOptions };
  } catch (e) {
    return { error: "Seçmen listesi alınırken bir hata oluştu." };
  }
}

// Action: Fetch More Topics for Sidebar
export async function getMoreTopicsAction(offset: number, limit: number = 35) {
  try {
    const topics = await prisma.topic.findMany({
      where: {
        slug: { not: "pozkes-galeri" }
      },
      include: {
        poll: {
          select: { id: true }
        },
        _count: {
          select: { entries: true }
        }
      },
      orderBy: {
        lastEntryAt: "desc"
      },
      skip: offset,
      take: limit
    });
    return { success: true, topics };
  } catch (e) {
    return { error: "Başlıklar yüklenirken bir hata oluştu." };
  }
}

// Action: Fetch More Entries for Homepage Feed
export async function getMoreEntriesAction(tab: string, offset: number, limit: number = 20) {
  const user = await getSessionUser();
  let entries: any[] = [];

  try {
    if (tab === "bugun") {
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
              createdAt: "desc"
            },
            take: 1,
            include: {
              author: {
                select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
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
              createdAt: "desc"
            },
            take: 1,
            include: {
              author: {
                select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
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
      let pageLimit = limit;
      if (offset === 0 && todayTopics.length > 0 && todayTopics.length < limit) {
        // Expand the first page limit to show at least 10 yesterday topics on home feed
        pageLimit = Math.max(limit, todayTopics.length + 10);
      }
      const paginatedTopics = combined.slice(offset, offset + pageLimit);

      entries = paginatedTopics
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
    } else if (tab === "gundem") {
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
                select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
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
            updatedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        skip: offset,
        take: limit
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
    } else if (tab === "pozkes") {
      entries = await prisma.entry.findMany({
        where: { imageUrl: { not: null } },
        include: {
          topic: {
            include: { poll: { select: { id: true } } }
          },
          author: {
            select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
          },
          likes: true
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit
      });
    } else if (tab === "takip") {
      if (user) {
        const follows = await prisma.follow.findMany({
          where: { followerId: user.id },
          select: { followingId: true }
        });
        const followingIds = follows.map(f => f.followingId);

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
                  select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
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
          skip: offset,
          take: limit
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
    } else if (tab === "begenilen") {
      const rawEntries = await prisma.entry.findMany({
        where: {
          topic: {
            slug: { not: "pozkes-galeri" }
          }
        },
        include: {
          topic: {
            include: { poll: { select: { id: true } } }
          },
          author: {
            select: { id: true, username: true, displayName: true, avatarColor: true, avatarUrl: true }
          },
          likes: true
        },
        orderBy: {
          likes: {
            _count: "desc"
          }
        },
        take: 150
      });
      const uniqueMap = new Map<string, any>();
      for (const entry of rawEntries) {
        if (!uniqueMap.has(entry.topicId)) {
          uniqueMap.set(entry.topicId, entry);
        }
      }
      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        const aLikes = a.likes.filter((l: any) => l.isLike).length;
        const bLikes = b.likes.filter((l: any) => l.isLike).length;
        return bLikes - aLikes;
      });
      entries = sorted.slice(offset, offset + limit);
    }

    const formatted = entries.map((entry) => {
      const likesCount = entry.likes.filter((l: any) => l.isLike).length;
      const dislikesCount = entry.likes.filter((l: any) => !l.isLike).length;
      const userLike = user ? entry.likes.find((l: any) => l.userId === user.id) : null;
      const userReaction = userLike ? (userLike.isLike ? ("LIKE" as const) : ("DISLIKE" as const)) : null;

      return {
        id: entry.id,
        content: entry.content,
        imageUrl: entry.imageUrl ? `/api/image/${entry.id}` : null,
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

    return { success: true, entries: formatted };
  } catch (e) {
    return { error: "Entry'ler yüklenirken bir hata oluştu zzz." };
  }
}

// Action: Fetch More PozKes Entries (With Comments)
export async function getMorePozKesAction(offset: number, limit: number = 10) {
  const user = await getSessionUser();
  try {
    const entries = await prisma.entry.findMany({
      where: {
        imageUrl: { not: null }
      },
      include: {
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
      skip: offset,
      take: limit
    });

    const formatted = entries.map((entry) => {
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
        imageUrl: entry.imageUrl ? `/api/image/${entry.id}` : null,
        createdAt: entry.createdAt,
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

    return { success: true, entries: formatted };
  } catch (e) {
    return { error: "Fotoğraflar yüklenirken bir hata oluştu zzz." };
  }
}

// Action: Fetch Single PozKes Entry (by ID)
export async function getSinglePozKesAction(entryId: string) {
  const user = await getSessionUser();
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
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
      }
    });

    if (!entry) {
      return { error: "Fotoğraf bulunamadı." };
    }

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

    const formatted = {
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

    return { success: true, entry: formatted };
  } catch (e) {
    return { error: "Fotoğraf yüklenirken bir hata oluştu." };
  }
}

// Action: Delete Entry
export async function deleteEntryAction(entryId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { topic: true }
    });

    if (!entry) return { error: "Entry bulunamadı." };

    // Only author or admin can delete
    if (entry.authorId !== user.id && user.role !== "ADMIN") {
      return { error: "Bu girdiyi silme yetkiniz yok." };
    }

    const topicId = entry.topicId;
    const slug = entry.topic.slug;

    // Delete physical image file from disk if entry has an uploaded photo
    if (entry.imageUrl) {
      await deleteImageFile(entry.imageUrl);
    }

    // Delete the entry
    await prisma.entry.delete({
      where: { id: entryId }
    });

    // Check if the topic has any other entries left
    const remainingCount = await prisma.entry.count({
      where: { topicId }
    });

    let topicDeleted = false;
    if (remainingCount === 0) {
      await prisma.topic.delete({
        where: { id: topicId }
      });
      topicDeleted = true;
    } else {
      // Recalculate the lastEntryAt based on the newest remaining entry
      const latestEntry = await prisma.entry.findFirst({
        where: { topicId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      if (latestEntry) {
        await prisma.topic.update({
          where: { id: topicId },
          data: { lastEntryAt: latestEntry.createdAt }
        });
      }
    }

    await clearAllFeedAndSidebarCaches(user.id);
    revalidatePath("/");
    revalidatePath(`/baslik/${slug}`);
    return { success: true, topicDeleted, slug };
  } catch (e) {
    return { error: "Girdi silinirken bir hata oluştu." };
  }
}

// Action: Edit Entry
export async function editEntryAction(entryId: string, newContent: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  const cleanContent = newContent.trim();
  if (!cleanContent) return { error: "İçerik boş olamaz." };
  if (cleanContent.length < 45) {
    return { error: "İçerik en az 45 karakter olmalıdır zzz." };
  }

  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
  if (linkRegex.test(cleanContent)) {
    const { allowed, score } = await userCanPostLinks(user.id, user.role);
    if (!allowed) {
      return { 
        error: `Link paylaşabilmek için en az 15. rütbe (Aerodinamik Sinek) olmanız gerekmektedir. Şu anki puanınız: ${score} (Gerekli: 930) zzz!` 
      };
    }
  }

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { topic: true }
    });

    if (!entry) return { error: "Entry bulunamadı." };

    // Only author or admin can edit
    if (entry.authorId !== user.id && user.role !== "ADMIN") {
      return { error: "Yalnızca kendi girdiğinizi düzenleyebilirsiniz." };
    }

    await prisma.entry.update({
      where: { id: entryId },
      data: { content: cleanContent }
    });

    await clearAllFeedAndSidebarCaches(user.id);
    revalidatePath(`/baslik/${entry.topic.slug}`);
    return { success: true };
  } catch (e) {
    return { error: "Girdi düzenlenirken bir hata oluştu." };
  }
}

// Action: Forgot Password
export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Lütfen geçerli bir e-posta adresi girin." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { error: "Bu e-posta adresine kayıtlı bir yazar bulunamadı zzz." };
    }

    // Generate reset token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    });

    // Create reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sozlukzzz.tr";
    const resetLink = `${appUrl}/sifre-sifirla?token=${token}`;

    // Send reset email
    await sendPasswordResetEmail(email, user.displayName || user.username, resetLink);

    return { success: true, message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi! zzz" };
  } catch (e) {
    return { error: "E-posta gönderilirken bir hata oluştu zzz." };
  }
}

// Action: Reset Password
export async function resetPasswordAction(prevState: any, formData: FormData) {
  const token = formData.get("token")?.toString().trim();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!token) {
    return { error: "Geçersiz veya süresi dolmuş sıfırlama kodu." };
  }

  if (!password || password.length < 6) {
    return { error: "Yeni şifre en az 6 karakter olmalıdır." };
  }

  if (password !== confirmPassword) {
    return { error: "Şifreler uyuşmuyor." };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return { error: "Sıfırlama bağlantısı geçersiz veya süresi dolmuş zzz." };
    }

    // Update user password and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { success: true };
  } catch (e) {
    return { error: "Şifre sıfırlanırken bir hata oluştu zzz." };
  }
}

// Action: Report Content (Entry, Comment, PozKes)
export async function reportAction(targetType: string, targetId: string, reason: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Şikayet etmek için giriş yapmalısınız zzz." };

  const cleanReason = reason.trim();
  if (!cleanReason) return { error: "Şikayet nedeni boş olamaz." };

  try {
    await prisma.report.create({
      data: {
        targetType,
        targetId,
        reason: cleanReason,
        reporterId: user.id
      }
    });

    return { success: true };
  } catch (e) {
    return { error: "Şikayet iletilirken bir hata oluştu zzz." };
  }
}

// Action: Resolve Report (Admin action to dismiss or delete content)
export async function resolveReportAction(reportId: string, actionType: "DISMISS" | "DELETE_CONTENT") {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Bu işlemi yapmaya yetkiniz yoktur zzz." };
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) return { error: "Şikayet bulunamadı." };

    if (actionType === "DELETE_CONTENT") {
      if (report.targetType === "ENTRY") {
        // Find if it was the only entry in a topic to delete topic as well
        const entry = await prisma.entry.findUnique({
          where: { id: report.targetId },
          include: { topic: { include: { _count: { select: { entries: true } } } } }
        });

        if (entry) {
          if (entry.topic._count.entries <= 1) {
            // Only entry, delete topic
            await prisma.topic.delete({
              where: { id: entry.topicId }
            });
          } else {
            // Delete entry only
            await prisma.entry.delete({
              where: { id: report.targetId }
            });
          }
        }
      } else if (report.targetType === "COMMENT") {
        await prisma.comment.delete({
          where: { id: report.targetId }
        });
      }
    }

    // Delete the report record
    await prisma.report.delete({
      where: { id: reportId }
    });

    revalidatePath("/yonetim");
    return { success: true };
  } catch (e) {
    console.error("Resolve report error:", e);
    return { error: "İşlem sırasında bir hata oluştu zzz." };
  }
}

// Action: Fetch topics dynamically for Sidebar based on active tab
export async function getDynamicSidebarTopicsAction(tab: string, offset: number = 0, limit: number = 35) {
  try {
    const user = await getSessionUser();
    const activeTab = tab || "bugun";

    // 1. Check Redis cache first (except for following tab, or cache with user id)
    const cacheKey = activeTab === "takip"
      ? (user ? `sidebar:takip:${user.id}:${offset}:${limit}` : "sidebar:takip:guest")
      : `sidebar:${activeTab}:${offset}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return { success: true, topics: JSON.parse(cached) };
      }
    } catch (redisErr) {
      console.error("Redis get sidebar error:", redisErr);
    }

    let formattedTopics: any[] = [];
    
    if (activeTab === "bugun") {
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
          poll: { select: { id: true } },
          _count: {
            select: {
              entries: {
                where: { createdAt: { gte: todayStart } }
              }
            }
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
          poll: { select: { id: true } },
          _count: {
            select: {
              entries: {
                where: { createdAt: { gte: yesterdayStart, lt: todayStart } }
              }
            }
          }
        },
        orderBy: {
          lastEntryAt: "desc"
        }
      });

      const mappedToday = todayTopics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries,
        lastEntryAt: t.lastEntryAt.toISOString(),
        isYesterday: false
      }));

      const mappedYesterday = yesterdayTopics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries,
        lastEntryAt: t.lastEntryAt.toISOString(),
        isYesterday: true
      }));

       const combined = [...mappedToday, ...mappedYesterday];
      let pageLimit = limit;
      if (offset === 0 && mappedToday.length > 0 && mappedToday.length < limit) {
        // Expand the first page limit to show at least 15 yesterday topics
        pageLimit = Math.max(limit, mappedToday.length + 15);
      }
      formattedTopics = combined.slice(offset, offset + pageLimit);
      
    } else if (activeTab === "gundem") {
      const topics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" }
        },
        include: {
          poll: { select: { id: true } },
          _count: { select: { entries: true } }
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
        skip: offset,
        take: limit
      });
      
      formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries,
        lastEntryAt: t.lastEntryAt.toISOString()
      }));
      
    } else if (activeTab === "takip") {
      if (!user) {
        return { success: true, topics: [] };
      }
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
      });
      const followingIds = follows.map(f => f.followingId);
      
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
          poll: { select: { id: true } },
          _count: { select: { entries: true } }
        },
        orderBy: {
          lastEntryAt: "desc"
        },
        skip: offset,
        take: limit
      });
      
      formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries,
        lastEntryAt: t.lastEntryAt.toISOString()
      }));
      
    } else if (activeTab === "begenilen") {
      const rawTopics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" }
        },
        include: {
          poll: { select: { id: true } },
          _count: { select: { entries: true } },
          entries: {
            include: {
              likes: true
            }
          }
        }
      });
      
      const sortedTopics = rawTopics.sort((a, b) => {
        const aMaxLikes = a.entries.reduce((max, entry) => {
          const likes = entry.likes.filter(l => l.isLike).length;
          return likes > max ? likes : max;
        }, 0);
        const bMaxLikes = b.entries.reduce((max, entry) => {
          const likes = entry.likes.filter(l => l.isLike).length;
          return likes > max ? likes : max;
        }, 0);
        return bMaxLikes - aMaxLikes;
      });
      
      const paginatedTopics = sortedTopics.slice(offset, offset + limit);
      
      formattedTopics = paginatedTopics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries,
        lastEntryAt: t.lastEntryAt.toISOString()
      }));
      
    } else if (activeTab === "goruntulenen") {
      const topics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" }
        },
        include: {
          poll: { select: { id: true } },
          _count: { select: { entries: true } }
        },
        orderBy: {
          viewCount: "desc"
        },
        skip: offset,
        take: limit
      });
      
      formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries,
        lastEntryAt: t.lastEntryAt.toISOString()
      }));
      
    } else {
      const topics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" }
        },
        include: {
          poll: { select: { id: true } },
          _count: { select: { entries: true } }
        },
        orderBy: {
          lastEntryAt: "desc"
        },
        skip: offset,
        take: limit
      });
      
      formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries,
        lastEntryAt: t.lastEntryAt.toISOString()
      }));
    }

    // Cache the result in Redis
    const cacheExpiry = activeTab === "takip" ? 15 : 45; // seconds
    try {
      await redis.set(cacheKey, JSON.stringify(formattedTopics), "EX", cacheExpiry);
    } catch (redisErr) {
      console.error("Redis set sidebar error:", redisErr);
    }

    return { success: true, topics: formattedTopics };
  } catch (e) {
    console.error("getDynamicSidebarTopicsAction error:", e);
    return { error: "Başlıklar yüklenirken bir hata oluştu." };
  }
}
// Action: Search topics or users for Autocomplete / Instant Search
export async function searchTopicsAction(query: string) {
  if (!query || query.trim().length < 1) {
    return { success: true, topics: [] };
  }
  const cleanQuery = query.trim();
  try {
    const isPostgres = process.env.DATABASE_URL?.startsWith("postgres");

    // Check if the query starts with @ to search for users
    if (cleanQuery.startsWith("@")) {
      const searchUsername = cleanQuery.substring(1).trim();
      if (searchUsername.length === 0) {
        return { success: true, topics: [] };
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              username: {
                contains: searchUsername,
                mode: isPostgres ? "insensitive" : undefined,
              }
            },
            {
              displayName: {
                contains: searchUsername,
                mode: isPostgres ? "insensitive" : undefined,
              }
            }
          ]
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarColor: true,
          avatarUrl: true,
          _count: {
            select: { entries: true }
          }
        },
        take: 8
      });

      const formattedUsers = users.map(u => ({
        id: u.id,
        title: u.displayName || `@${u.username}`,
        username: u.username,
        displayName: u.displayName,
        slug: `yazar/${u.username}`,
        url: `/yazar/${u.username}`,
        isUser: true,
        avatarColor: u.avatarColor,
        avatarUrl: u.avatarUrl,
        entryCount: u._count.entries,
        snippet: "Yazar Profili"
      }));

      return { success: true, topics: formattedUsers };
    }

    // Default Topic search
    const topics = await prisma.topic.findMany({
      where: {
        title: {
          contains: cleanQuery,
          mode: isPostgres ? "insensitive" : undefined,
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        entries: {
          take: 1,
          select: {
            content: true
          }
        },
        _count: {
          select: { entries: true }
        }
      },
      take: 8,
      orderBy: {
        entries: {
          _count: "desc"
        }
      }
    });

    const formatted = topics.map(t => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      url: `/baslik/${t.slug}`,
      isUser: false,
      entryCount: t._count.entries,
      snippet: t.entries[0]?.content ? t.entries[0].content.substring(0, 60) + "..." : ""
    }));

    return { success: true, topics: formatted };
  } catch (error) {
    console.error("searchTopicsAction error:", error);
    return { error: "Arama sırasında bir hata oluştu." };
  }
}

// --- ADMIN PANEL ACTIONS ---

export async function adminSearchUsersAction(query: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) return { success: true, users: [] };

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: cleanQuery, mode: "insensitive" } },
          { email: { contains: cleanQuery, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            entries: true,
            comments: true
          }
        }
      },
      take: 20
    });

    return { success: true, users };
  } catch (error) {
    console.error("adminSearchUsersAction error:", error);
    return { error: "Kullanıcılar aranırken bir hata oluştu." };
  }
}

export async function adminUpdateUserRoleAction(targetUserId: string, newRole: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  if (!["USER", "ADMIN", "BANNED"].includes(newRole)) {
    return { error: "Geçersiz rol." };
  }

  if (targetUserId === user.id) {
    return { error: "Kendi rolünüzü değiştiremezsiniz." };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole }
    });

    // Clear session cache in Redis to log them out or update their role immediately
    const sessionCacheKey = `user:session:${targetUserId}`;
    try {
      await redis.del(sessionCacheKey);
    } catch (e) {
      console.error("Redis session cache clear error:", e);
    }

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("adminUpdateUserRoleAction error:", error);
    return { error: "Kullanıcı rolü güncellenirken bir hata oluştu." };
  }
}

export async function adminSearchTopicsAction(query: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) return { success: true, topics: [] };

  try {
    const topics = await prisma.topic.findMany({
      where: {
        title: { contains: cleanQuery, mode: "insensitive" }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        _count: {
          select: { entries: true }
        }
      },
      take: 20,
      orderBy: {
        entries: { _count: "desc" }
      }
    });

    const formatted = topics.map(t => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      createdAt: t.createdAt,
      entryCount: t._count.entries
    }));

    return { success: true, topics: formatted };
  } catch (error) {
    console.error("adminSearchTopicsAction error:", error);
    return { error: "Başlıklar aranırken bir hata oluştu." };
  }
}

export async function adminRenameTopicAction(topicId: string, newTitle: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  const cleanTitle = newTitle.trim();
  if (!cleanTitle) {
    return { error: "Başlık adı boş olamaz." };
  }

  try {
    const existing = await prisma.topic.findFirst({
      where: {
        title: { equals: cleanTitle, mode: "insensitive" },
        id: { not: topicId }
      }
    });

    if (existing) {
      return { error: "Bu isimde başka bir başlık zaten mevcut." };
    }

    const newSlug = await convertToSlug(cleanTitle);

    const oldTopic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { slug: true }
    });

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: {
        title: cleanTitle,
        slug: newSlug
      }
    });

    if (oldTopic && oldTopic.slug !== newSlug) {
      try {
        await redis.set(`redirect:${oldTopic.slug}`, newSlug);
      } catch (redisErr) {
        console.error("Failed to save redirect in Redis:", redisErr);
      }
    }

    await clearAllFeedAndSidebarCaches();
    return { success: true, topic: updated };
  } catch (error) {
    console.error("adminRenameTopicAction error:", error);
    return { error: "Başlık düzenlenirken bir hata oluştu." };
  }
}

export async function adminMergeTopicsAction(sourceTopicId: string, targetTopicId: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  if (sourceTopicId === targetTopicId) {
    return { error: "Aynı başlığı kendisiyle birleştiremezsiniz." };
  }

  try {
    const sourceTopic = await prisma.topic.findUnique({ where: { id: sourceTopicId } });
    const targetTopic = await prisma.topic.findUnique({ where: { id: targetTopicId } });

    if (!sourceTopic || !targetTopic) {
      return { error: "Başlıklardan biri veya ikisi bulunamadı." };
    }

    // Move all entries from source to target topic
    await prisma.entry.updateMany({
      where: { topicId: sourceTopicId },
      data: { topicId: targetTopicId }
    });

    // Delete the source topic
    await prisma.topic.delete({
      where: { id: sourceTopicId }
    });

    // Save redirect in Redis
    try {
      await redis.set(`redirect:${sourceTopic.slug}`, targetTopic.slug);
    } catch (redisErr) {
      console.error("Failed to save merge redirect in Redis:", redisErr);
    }

    await clearAllFeedAndSidebarCaches();
    return { success: true };
  } catch (error) {
    console.error("adminMergeTopicsAction error:", error);
    return { error: "Başlıklar birleştirilirken bir hata oluştu." };
  }
}

export async function adminDeleteTopicAction(topicId: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  try {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      return { error: "Başlık bulunamadı." };
    }

    // Delete the topic (entries will cascade delete)
    await prisma.topic.delete({
      where: { id: topicId }
    });

    await clearAllFeedAndSidebarCaches();
    return { success: true };
  } catch (error) {
    console.error("adminDeleteTopicAction error:", error);
    return { error: "Başlık silinirken bir hata oluştu." };
  }
}

export async function adminGetSettingsAction() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  try {
    const disableSignups = await redis.get("settings:disable_signups");
    const disablePozkes = await redis.get("settings:disable_pozkes");
    const disableSelfDeletion = await redis.get("settings:disable_self_deletion");
    const xPixelId = await redis.get("settings:x_pixel_id");
    const xSignupEventId = await redis.get("settings:x_signup_event_id");

    return {
      success: true,
      disableSignups: disableSignups === "true",
      disablePozkes: disablePozkes === "true",
      disableSelfDeletion: disableSelfDeletion === "true",
      xPixelId: xPixelId || "",
      xSignupEventId: xSignupEventId || ""
    };
  } catch (error) {
    console.error("adminGetSettingsAction error:", error);
    return { error: "Ayarlar yüklenirken bir hata oluştu." };
  }
}

export async function adminUpdateSettingsAction(
  disableSignups: boolean,
  disablePozkes: boolean,
  disableSelfDeletion: boolean,
  xPixelId?: string,
  xSignupEventId?: string
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  try {
    await redis.set("settings:disable_signups", disableSignups ? "true" : "false");
    await redis.set("settings:disable_pozkes", disablePozkes ? "true" : "false");
    await redis.set("settings:disable_self_deletion", disableSelfDeletion ? "true" : "false");
    if (xPixelId !== undefined) {
      await redis.set("settings:x_pixel_id", xPixelId.trim());
    }
    if (xSignupEventId !== undefined) {
      await redis.set("settings:x_signup_event_id", xSignupEventId.trim());
    }

    return { success: true };
  } catch (error) {
    console.error("adminUpdateSettingsAction error:", error);
    return { error: "Ayarlar güncellenirken bir hata oluştu." };
  }
}

export async function adminGetStatsAction() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  let dbHealth = "OK";
  let redisHealth = "OK";

  // 1. Health checks
  try {
    await prisma.user.count();
  } catch (e) {
    dbHealth = "ERROR";
  }

  try {
    await redis.ping();
  } catch (e) {
    redisHealth = "ERROR";
  }

  // 2. Counts
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalTopics, todayEntries, todayComments] = await Promise.all([
      prisma.user.count(),
      prisma.topic.count(),
      prisma.entry.count({ where: { createdAt: { gte: today } } }),
      prisma.comment.count({ where: { createdAt: { gte: today } } })
    ]);

    return {
      success: true,
      health: {
        db: dbHealth,
        redis: redisHealth
      },
      stats: {
        totalUsers,
        totalTopics,
        todayEntries,
        todayComments
      }
    };
  } catch (error) {
    console.error("adminGetStatsAction error:", error);
    return { error: "İstatistikler yüklenirken bir hata oluştu." };
  }
}

// --- USER GIFT ACTIONS ---

export async function adminSendGiftAction(targetUserId: string, giftType: string, note?: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  const validGifts = [
    "SWEET", "KING", "SWATTER", "LIGHTNING", "STEEL",
    "MIDNIGHT", "WATERMELON", "TECH", "SOCIAL", "TREND",
    "AMBER", "ACHIEVEMENT", "HONOR", "AGENT", "ACADEMY"
  ];

  if (!validGifts.includes(giftType)) {
    return { error: "Geçersiz hediye türü." };
  }

  try {
    const newGift = await prisma.userGift.create({
      data: {
        giftType,
        note: note?.trim() || null,
        userId: targetUserId,
        givenById: user.id
      }
    });

    const giftNames: Record<string, string> = {
      SWEET: "Tatlı Sinek 🍬",
      KING: "Kral Sinek 👑",
      SWATTER: "Sinek Raketi 🎾",
      LIGHTNING: "Yıldırım Vızıltı ⚡",
      STEEL: "Çelik Kanat 🛡️",
      MIDNIGHT: "Gece Sinekleri ☕",
      WATERMELON: "Karpuz Dilimi 🍉",
      TECH: "Detektör Sinek 🔍",
      SOCIAL: "Röportajcı 🎤",
      TREND: "Alev Kanat 🔥",
      AMBER: "Kehribar Sinek 💎",
      ACHIEVEMENT: "Üstün Başarı Belgesi 📜",
      HONOR: "Sözlük Onur Belgesi 🎖️",
      AGENT: "Gizli Teşkilat Belgesi 🕵️‍♂️",
      ACADEMY: "Vızıltı Akademisi Diploması 🎓"
    };

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true }
    });

    const giftName = giftNames[giftType] || "bir hediye";
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "SYSTEM",
        content: `Tebrikler zzz! Yönetim size "${giftName}" takdim etti!`,
        relatedUrl: targetUser ? `/yazar/${targetUser.username}` : undefined
      }
    });

    // Delete Redis notification cache for target user
    try {
      await redis.del(`user:notifications:${targetUserId}`);
      await redis.del(`user:notifications:count:${targetUserId}`);
    } catch (e) {
      console.error("Redis notification cache clear error:", e);
    }

    return { success: true, gift: newGift };
  } catch (error) {
    console.error("adminSendGiftAction error:", error);
    return { error: "Hediye gönderilirken bir hata oluştu." };
  }
}

export async function adminRemoveGiftAction(userGiftId: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  try {
    await prisma.userGift.delete({
      where: { id: userGiftId }
    });
    return { success: true };
  } catch (error) {
    console.error("adminRemoveGiftAction error:", error);
    return { error: "Hediye geri alınırken bir hata oluştu." };
  }
}

export async function getUserGiftsAction(username: string) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        gifts: {
          include: {
            givenBy: {
              select: { username: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!targetUser) {
      return { error: "Kullanıcı bulunamadı." };
    }

    return { success: true, gifts: targetUser.gifts };
  } catch (error) {
    console.error("getUserGiftsAction error:", error);
    return { error: "Hediyeler yüklenirken bir hata oluştu." };
  }
}

export async function getEntryPageAction(entryId: string) {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { createdAt: true, topicId: true }
    });
    if (!entry) return { success: false, page: 1 };

    const beforeCount = await prisma.entry.count({
      where: {
        topicId: entry.topicId,
        createdAt: { lte: entry.createdAt }
      }
    });

    const page = Math.ceil(beforeCount / 10) || 1;
    return { success: true, page };
  } catch (err) {
    console.error("getEntryPageAction error:", err);
    return { success: false, page: 1 };
  }
}

// Action: Fetch all usernames for autocomplete mentions
export async function getAllUsernamesAction(): Promise<string[]> {
  try {
    const users = await prisma.user.findMany({
      select: { username: true },
      orderBy: { username: "asc" }
    });
    return users.map(u => u.username);
  } catch (err) {
    console.error("getAllUsernamesAction error:", err);
    return [];
  }
}

export async function setAvatarFromPozKesAction(photoUrl: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: photoUrl }
    });
    revalidatePath(`/yazar/${user.username}`);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Profil resmi güncellenemedi." };
  }
}

export async function addProfilePhotoAction(base64Image: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  if (!base64Image) return { error: "Lütfen bir görsel yükleyin." };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profilePhotos: true }
    });

    const currentPhotos = dbUser?.profilePhotos || [];
    if (currentPhotos.length >= 4) {
      return { error: "En fazla 4 adet ek vitrin fotoğrafı ekleyebilirsiniz." };
    }

    const savedImageUrl = await saveBase64Image(base64Image, "entries");
    if (!savedImageUrl) return { error: "Görsel kaydedilemedi." };

    const updatedPhotos = [...currentPhotos, savedImageUrl];

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        profilePhotos: updatedPhotos,
        ...(!dbUser?.profilePhotos || dbUser.profilePhotos.length === 0 ? {} : {})
      }
    });

    revalidatePath(`/yazar/${user.username}`);
    revalidatePath("/");
    return { success: true, photoUrl: savedImageUrl };
  } catch (err: any) {
    console.error("addProfilePhotoAction error:", err);
    return { error: err.message || "Profil fotoğrafı yüklenirken hata oluştu." };
  }
}

export async function removeProfilePhotoAction(photoUrl: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profilePhotos: true, avatarUrl: true }
    });

    const currentPhotos = dbUser?.profilePhotos || [];
    const updatedPhotos = currentPhotos.filter((p) => p !== photoUrl);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        profilePhotos: updatedPhotos,
        ...(dbUser?.avatarUrl === photoUrl ? { avatarUrl: updatedPhotos[0] || null } : {})
      }
    });

    revalidatePath(`/yazar/${user.username}`);
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Fotoğraf silinemedi." };
  }
}
