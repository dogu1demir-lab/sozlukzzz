"use server";

import { prisma } from "@/lib/db";
import { getSessionUser, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/mail";

// Helper: Hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
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
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!username || !password || username.length < 3 || password.length < 6) {
    return { error: "Kullanıcı adı en az 3, şifre en az 6 karakter olmalıdır." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Lütfen geçerli bir e-posta adresi girin." };
  }

  // Check alphanumeric username
  if (!/^[a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+$/.test(username)) {
    return { error: "Kullanıcı adı yalnızca harf, sayı ve alt çizgi içerebilir." };
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
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
        passwordHash: hashPassword(password),
        email: email,
        avatarColor: randomColor,
      }
    });

    // Send a beautifully styled welcome email
    try {
      if (email) {
        await sendWelcomeEmail(email, username);
      }
    } catch (mailError) {
      console.error("Welcome email sending failed:", mailError);
    }

    await setSessionCookie(user.id);
    return { success: true };
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
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });

    if (!user || user.passwordHash !== hashPassword(password)) {
      return { error: "Kullanıcı adı veya şifre hatalı." };
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

  try {
    const slug = await convertToSlug(cleanTitle);

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
          imageUrl: imageUrl || null
        }
      });

      // Parse mentions and create notifications
      const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
      const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
      
      for (const username of mentionedUsernames) {
        if (username.toLowerCase() === user.username.toLowerCase()) continue;
        const targetUser = await prisma.user.findUnique({
          where: { username }
        });
        if (targetUser) {
          await prisma.notification.create({
            data: {
              type: "REPLY",
              content: `@${user.username} bir entry'de sizden bahsetti! vızzz!`,
              userId: targetUser.id,
              relatedUrl: `/baslik/${slug}#entry-${entry.id}`
            }
          });
        }
      }
      
      revalidatePath(`/baslik/${slug}`);
      return { success: true, slug, entryId: entry.id };
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
            imageUrl: imageUrl || null
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
    
    for (const username of mentionedUsernames) {
      if (username.toLowerCase() === user.username.toLowerCase()) continue;
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

    revalidatePath("/");
    revalidatePath(`/baslik/${slug}`);
    return { success: true, slug, entryId };
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

    // Parse mentions and create notifications
    const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
    const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
    const uniqueMentions = Array.from(new Set(mentionedUsernames));

    for (const username of uniqueMentions) {
      if (username.toLowerCase() === user.username.toLowerCase()) continue;
      const targetUser = await prisma.user.findUnique({
        where: { username }
      });
      if (targetUser) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            content: `@${user.username} bir entry'de sizden bahsetti! vızzz!`,
            userId: targetUser.id,
            relatedUrl: `/baslik/${topic.slug}#entry-${entry.id}`
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
          relatedUrl: `/baslik/${topic.slug}#entry-${entry.id}`
        }
      });
    }

    revalidatePath(`/baslik/${topic.slug}`);
    return { success: true, entryId: entry.id };
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
        await prisma.notification.create({
          data: {
            type: "LIKE",
            content: `@${user.username} bir entry'nizi beğendi! vızzz!`,
            userId: entry.authorId,
            relatedUrl: `/baslik/${entry.topic.slug}#entry-${entry.id}`
          }
        });
      }
    }

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

  try {
    const receiver = await prisma.user.findUnique({
      where: { username: receiverUsername }
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

    revalidatePath(`/mesajlar`);
    return { success: true };
  } catch (e) {
    return { error: "Mesaj gönderilirken bir hata oluştu." };
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

  const cleanTitle = title.trim() || "pozkes galeri";
  const cleanContent = content.trim();

  if (!cleanContent) {
    return { error: "Açıklama boş olamaz." };
  }

  if (!base64Image) {
    return { error: "Lütfen bir görsel yükleyin." };
  }

  try {
    const slug = await convertToSlug(cleanTitle);

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
        imageUrl: base64Image,
        topicId: topic.id,
        authorId: user.id
      }
    });

    // Parse mentions and create notifications
    const mentionRegex = /@([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)/g;
    const mentionedUsernames = [...cleanContent.matchAll(mentionRegex)].map(m => m[1]);
    
    for (const username of mentionedUsernames) {
      if (username.toLowerCase() === user.username.toLowerCase()) continue;
      const targetUser = await prisma.user.findUnique({
        where: { username }
      });
      if (targetUser) {
        await prisma.notification.create({
          data: {
            type: "REPLY",
            content: `@${user.username} PozKes'te sizden bahsetti! vızzz!`,
            userId: targetUser.id,
            relatedUrl: `/baslik/${slug}#entry-${entry.id}`
          }
        });
      }
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
    
    for (const username of mentionedUsernames) {
      if (username.toLowerCase() === user.username.toLowerCase()) continue;
      if (username.toLowerCase() === entry.author.username.toLowerCase()) continue; // already notified above
      
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

    revalidatePath("/pozkes");
    return { success: true };
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
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: base64Image }
    });

    revalidatePath(`/yazar/${user.username}`);
    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return { error: "Profil fotoğrafı güncellenirken bir hata oluştu." };
  }
}

// Action: Update Profile Info (Bio and Avatar Color)
export async function updateProfileInfoAction(bio: string, avatarColor: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Giriş yapmanız gerekmektedir." };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: bio.trim(),
        avatarColor
      }
    });

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
    // Delete user (cascade will delete entries, likes, comments, etc.)
    await prisma.user.delete({
      where: { id: user.id }
    });

    // Clear cookie
    await clearSessionCookie();

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
                  select: { id: true, username: true, avatarColor: true, avatarUrl: true }
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
        updatedAt: "desc"
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
          updatedAt: "desc"
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
    } else if (tab === "gundem") {
      const topics = await prisma.topic.findMany({
        where: {
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
        orderBy: {
          updatedAt: "desc"
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
    } else if (tab === "pozkes") {
      entries = await prisma.entry.findMany({
        where: { imageUrl: { not: null } },
        include: {
          topic: {
            include: { poll: { select: { id: true } } }
          },
          author: {
            select: { id: true, username: true, avatarColor: true, avatarUrl: true }
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
        include: {
          topic: {
            include: { poll: { select: { id: true } } }
          },
          author: {
            select: { id: true, username: true, avatarColor: true, avatarUrl: true }
          },
          likes: true
        },
        orderBy: { createdAt: "desc" },
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
        imageUrl: entry.imageUrl,
        createdAt: entry.createdAt,
        topic: entry.topic,
        author: entry.author,
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
          select: { id: true, username: true, avatarColor: true, avatarUrl: true }
        },
        likes: true,
        comments: {
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
          author: comment.author,
          likesCount,
          hasLiked
        };
      });

      return {
        id: entry.id,
        content: entry.content,
        imageUrl: entry.imageUrl!,
        createdAt: entry.createdAt,
        author: entry.author,
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
    }

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

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: { topic: true }
    });

    if (!entry) return { error: "Entry bulunamadı." };

    // Only author can edit
    if (entry.authorId !== user.id) {
      return { error: "Yalnızca kendi girdiğinizi düzenleyebilirsiniz." };
    }

    await prisma.entry.update({
      where: { id: entryId },
      data: { content: cleanContent }
    });

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
    await sendPasswordResetEmail(email, user.username, resetLink);

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
    
    // Normalize tab name
    const activeTab = tab || "bugun";
    
    if (activeTab === "bugun") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const topics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" },
          entries: {
            some: {
              createdAt: { gte: todayStart }
            }
          }
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
          updatedAt: "desc"
        },
        skip: offset,
        take: limit
      });
      
      const formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries
      }));
      
      return { success: true, topics: formattedTopics };
      
    } else if (activeTab === "gundem") {
      const topics = await prisma.topic.findMany({
        where: {
          slug: { not: "pozkes-galeri" }
        },
        include: {
          poll: { select: { id: true } },
          _count: { select: { entries: true } }
        },
        orderBy: {
          entries: {
            _count: "desc"
          }
        },
        skip: offset,
        take: limit
      });
      
      const formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries
      }));
      
      return { success: true, topics: formattedTopics };
      
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
          updatedAt: "desc"
        },
        skip: offset,
        take: limit
      });
      
      const formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries
      }));
      
      return { success: true, topics: formattedTopics };
      
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
      
      const formattedTopics = paginatedTopics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries
      }));
      
      return { success: true, topics: formattedTopics };
      
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
      
      const formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries
      }));
      
      return { success: true, topics: formattedTopics };
      
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
          updatedAt: "desc"
        },
        skip: offset,
        take: limit
      });
      
      const formattedTopics = topics.map(t => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        poll: t.poll,
        entryCount: t._count.entries
      }));
      
      return { success: true, topics: formattedTopics };
    }
  } catch (e) {
    console.error("getDynamicSidebarTopicsAction error:", e);
    return { error: "Başlıklar yüklenirken bir hata oluştu." };
  }
}







