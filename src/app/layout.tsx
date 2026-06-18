import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.sozlukzzz.tr"),
  title: "sözlükzzz — vızzz!",
  description: "Türkiye'nin en aktif sinek sever sözlüğü. Sinekler, vızıltılar, aerodinamik harikalar ve hayata dair her şey!",
  openGraph: {
    title: "sözlükzzz — vızzz!",
    description: "Türkiye'nin en aktif sinek sever sözlüğü. Sinekler, vızıltılar, aerodinamik harikalar ve hayata dair her şey!",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "sözlükzzz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "sözlükzzz — vızzz!",
    description: "Türkiye'nin en aktif sinek sever sözlüğü. Sinekler, vızıltılar, aerodinamik harikalar ve hayata dair her şey!",
    images: ["/og-image.jpg"],
  },
};

export const revalidate = 0; // Ensure layout fetches fresh user/notif data

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  
  let notifications: any[] = [];
  let unreadNotificationsCount = 0;

  if (user) {
    notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    
    unreadNotificationsCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    });
  }

  return (
    <html lang="tr" className="h-full dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-lime-500 selection:text-black antialiased`}
      >
        <Header 
          user={user} 
          unreadNotificationsCount={unreadNotificationsCount} 
          notifications={notifications} 
        />
        <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row">
          {/* Left Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 min-w-0 border-r border-zinc-900 bg-zinc-950 p-2 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
