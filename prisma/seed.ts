import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  if (url.startsWith('file:')) {
    const filePath = url.replace('file:', '');
    // Resolve relative path to project root
    const absolutePath = path.resolve(process.cwd(), filePath);
    url = `file:${absolutePath}`;
  }
  return url;
};

const adapter = new PrismaBetterSqlite3({
  url: getDatabaseUrl(),
});
const prisma = new PrismaClient({ adapter });

import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log('Veritabanı temizleniyor...');
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.entry.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Kullanıcılar oluşturuluyor...');
  const passwordHash = hashPassword('sifre123');

  const admin = await prisma.user.create({
    data: {
      username: 'osman',
      passwordHash,
      role: 'ADMIN',
      avatarColor: '#14b8a6', // Teal
    },
  });

  const user1 = await prisma.user.create({
    data: {
      username: 'sinek_krali',
      passwordHash,
      role: 'USER',
      avatarColor: '#f97316', // Orange
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'karasinek',
      passwordHash,
      role: 'USER',
      avatarColor: '#a855f7', // Purple
    },
  });

  console.log('Başlıklar ve Entry\'ler oluşturuluyor...');

  const topicsData = [
    {
      title: 'sözlükzzz',
      slug: 'sozlukzzz',
      entries: [
        {
          content: 'sineklere ve sinek sevenlere adanmış, arka planda vızzz seslerinin yükseldiği, kütük gibi takılmayan, yağ gibi akan yeni nesil sözlük platformumuz. hayırlı uğurlu olsun zzz.',
          authorId: admin.id,
        },
        {
          content: 'yılanların tahtını sallamaya gelen, sinek vızıltısıyla uykuları açan nefis sözlük projesi.',
          authorId: user1.id,
        },
      ],
    },
    {
      title: 'kara sineklerin uçuş hızı',
      slug: 'kara-sineklerin-ucus-hizi',
      entries: [
        {
          content: 'kara sinekler (musca domestica) saniyede ortalama 200 kez kanat çırparlar ve saatte yaklaşık 8 km hıza ulaşabilirler. havada yaptıkları ani manevralar ise muazzam bir aerodinamik harikasıdır.',
          authorId: user1.id,
        },
        {
          content: 'tam çorba içerken tabağa pike yapma hızları ise ışık hızına yakındır zzz.',
          authorId: user2.id,
        },
      ],
    },
    {
      title: 'vızzz',
      slug: 'vizzz',
      entries: [
        {
          content: 'sözlüğümüzün resmi ses efekti. her entry girişinde, beğenide ve bildirimde kulağımızın pasını silecek tatlı vızıltı.',
          authorId: admin.id,
        },
      ],
    },
    {
      title: 'en sevdiginiz sinek turu',
      slug: 'en-sevdiginiz-sinek-turu',
      entries: [
        {
          content: 'benimki net olarak meyve sineği. muz kabuğunun üstünde kendi halinde takılıyor, kimseye zararı yok, ısırma huyu yok. efendi gibi takılıyor hayvancağız.',
          authorId: user2.id,
        },
        {
          content: 'kesinlikle sivrisinek değil. yaz gecelerinin baş düşmanı, uyutmayan, kulağının dibinde beste yapan mikrop yaratık.',
          authorId: user1.id,
        },
      ],
    },
    {
      title: 'pozkes galeri',
      slug: 'pozkes-galeri',
      entries: [
        {
          content: 'sözlükzzz ün ilk fotoğraf akışı! işte doğanın en karizmatik uçuş ustası olan kara sineğin makro çekimi. vızzz!',
          authorId: admin.id,
          imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
        },
        {
          content: 'ben de kadraja bir tatlı arı pozu bırakayım o zaman. polen toplarken yakaladım.',
          authorId: user1.id,
          imageUrl: 'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?w=600&auto=format&fit=crop&q=80',
        },
      ],
    },
  ];

  for (const topicInfo of topicsData) {
    const topic = await prisma.topic.create({
      data: {
        title: topicInfo.title,
        slug: topicInfo.slug,
        createdById: admin.id,
        viewCount: Math.floor(Math.random() * 500) + 50, // Seed some random views
      },
    });

    for (const entryInfo of topicInfo.entries) {
      await prisma.entry.create({
        data: {
          content: entryInfo.content,
          imageUrl: (entryInfo as any).imageUrl || null,
          topicId: topic.id,
          authorId: entryInfo.authorId,
        },
      });
    }
  }

  console.log('Takip ilişkileri oluşturuluyor...');
  // sinek_krali (user1) follows osman (admin)
  await prisma.follow.create({
    data: {
      followerId: user1.id,
      followingId: admin.id,
    },
  });

  // karasinek (user2) follows sinek_krali (user1)
  await prisma.follow.create({
    data: {
      followerId: user2.id,
      followingId: user1.id,
    },
  });


  console.log('Örnek mesajlar ve bildirimler oluşturuluyor...');
  await prisma.message.create({
    data: {
      content: 'selam dostum, sözlükzzz e hoş geldin! vızzz!',
      senderId: admin.id,
      receiverId: user1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      type: 'SYSTEM',
      content: 'sözlükzzz e katıldığınız için teşekkürler! vızıldamaya başlayabilirsiniz.',
      userId: user1.id,
      relatedUrl: '/baslik/sozlukzzz',
    },
  });

  console.log('Veritabanı başarıyla örneklendirildi (seeded)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
