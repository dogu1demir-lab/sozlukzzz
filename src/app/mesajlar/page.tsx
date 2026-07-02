import React from "react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SendMessageForm from "@/components/SendMessageForm";
import ChatScrollAnchor from "@/components/ChatScrollAnchor";
import { formatDate } from "@/lib/utils";
import { Mail, Send, User, MessageSquare, PlusCircle, AlertCircle, ArrowLeft } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import ClearConversationButton from "@/components/ClearConversationButton";

export const revalidate = 0; // Fresh messages every time

interface PageProps {
  searchParams: Promise<{ u?: string }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const { u } = await searchParams;
  const user = await getSessionUser();

  // 1. Redirect if not logged in
  if (!user) {
    redirect("/giris");
  }

  // 2. Fetch all messages in which the user is sender or receiver
  const allMessages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id }
      ]
    },
    include: {
      sender: {
        select: { id: true, username: true, avatarColor: true, avatarUrl: true }
      },
      receiver: {
        select: { id: true, username: true, avatarColor: true, avatarUrl: true }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // 3. Extract unique chat partners and their last messages
  const conversationsMap = new Map<string, {
    username: string;
    avatarColor: string;
    avatarUrl: string | null;
    lastMessage: string;
    lastMessageDate: Date;
    unreadCount: number;
  }>();

  for (const msg of allMessages) {
    const isUserSender = msg.senderId === user.id;
    const partner = isUserSender ? msg.receiver : msg.sender;

    if (!conversationsMap.has(partner.id)) {
      conversationsMap.set(partner.id, {
        username: partner.username,
        avatarColor: partner.avatarColor,
        avatarUrl: partner.avatarUrl,
        lastMessage: msg.content,
        lastMessageDate: msg.createdAt,
        unreadCount: 0
      });
    }

    // Increment unread count if received and unread
    if (!isUserSender && !msg.isRead) {
      const conv = conversationsMap.get(partner.id)!;
      conv.unreadCount += 1;
    }
  }

  const conversations = Array.from(conversationsMap.values()).sort(
    (a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
  );

  // 4. If active chat partner username (u) is selected, query messages
  let activePartner: any = null;
  let chatMessages: any[] = [];

  if (u) {
    activePartner = await prisma.user.findUnique({
      where: { username: u },
      select: { id: true, username: true, avatarColor: true, avatarUrl: true }
    });

    if (activePartner && activePartner.id !== user.id) {
      // Mark all incoming messages from this partner as read
      await prisma.message.updateMany({
        where: {
          senderId: activePartner.id,
          receiverId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      // Fetch messages between them
      chatMessages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: activePartner.id },
            { senderId: activePartner.id, receiverId: user.id }
          ]
        },
        orderBy: {
          createdAt: "asc"
        }
      });
    }
  }

  return (
    <div className="flex h-[550px] md:h-[620px] max-h-[calc(100dvh-130px)] rounded-2xl border border-zinc-900 overflow-hidden bg-zinc-950/20 shadow-2xl animate-in fade-in duration-300">
      
      {/* Left Column: Conversations List */}
      <div className={`w-full md:w-80 shrink-0 border-r border-zinc-900 bg-zinc-950/60 flex flex-col ${u ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-lime-400" />
            <span>gelen kutusu</span>
          </h2>
        </div>

        {/* Conversation List Scrollable */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-555 italic px-4">
              Mesaj geçmişiniz bulunmuyor. Yeni bir sohbet başlatmak için bir yazarın profiline gidip mesaj atabilirsiniz zzz.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = u === conv.username;
              return (
                <Link
                  key={conv.username}
                  href={`/mesajlar?u=${conv.username}`}
                  prefetch={false}
                  className={`flex items-start gap-3 p-4 transition-colors hover:bg-zinc-900/50 ${
                    isActive ? "bg-zinc-900/80" : ""
                  }`}
                >
                  {conv.avatarUrl ? (
                    <img
                      src={conv.avatarUrl}
                      alt={conv.username}
                      className="w-9 h-9 rounded-full object-cover border border-white/5 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black border border-white/5 shrink-0"
                      style={{ backgroundColor: conv.avatarColor }}
                    >
                      {conv.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-xs ${isActive ? "text-white font-bold" : "text-zinc-200 font-semibold"}`}>
                        @{conv.username}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(conv.lastMessageDate).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Istanbul"
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-lime-500 text-[10px] font-bold text-black">
                      {conv.unreadCount}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Window */}
      <div className={`flex-1 flex-col bg-zinc-950/40 ${u ? "flex" : "hidden md:flex"}`}>
        {activePartner ? (
          <>
            {/* Active Conversation Header */}
            <div className="p-3 border-b border-zinc-900 flex items-center gap-2 bg-zinc-950/60">
              {/* Back Button on Mobile */}
              <Link 
                href="/mesajlar" 
                prefetch={false}
                className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </Link>
              {activePartner.avatarUrl ? (
                <img
                  src={activePartner.avatarUrl}
                  alt={activePartner.username}
                  className="w-8.5 h-8.5 rounded-full object-cover border border-white/5 shrink-0"
                />
              ) : (
                <div
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-black border border-white/5 shrink-0"
                  style={{ backgroundColor: activePartner.avatarColor }}
                >
                  {activePartner.username.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white truncate">
                  @{activePartner.username} ile sohbet
                </h3>
                <span className="text-[9px] text-zinc-500 block">vızzz zzz</span>
              </div>
              <ClearConversationButton partnerUsername={activePartner.username} />
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-zinc-950/10">
              {(() => {
                let lastDateString = "";
                return chatMessages.map((msg) => {
                  const msgDate = new Date(msg.createdAt);
                  const dateString = msgDate.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  });
                  
                  let showDateDivider = false;
                  if (dateString !== lastDateString) {
                    showDateDivider = true;
                    lastDateString = dateString;
                  }

                  const getRelativeDateLabel = () => {
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    
                    const isSameDay = (d1: Date, d2: Date) =>
                      d1.getDate() === d2.getDate() &&
                      d1.getMonth() === d2.getMonth() &&
                      d1.getFullYear() === d2.getFullYear();

                    if (isSameDay(msgDate, today)) return "Bugün";
                    if (isSameDay(msgDate, yesterday)) return "Dün";
                    return dateString;
                  };

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateDivider && (
                        <div className="flex justify-center my-2 select-none shrink-0">
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-900/40">
                            {getRelativeDateLabel()}
                          </span>
                        </div>
                      )}
                      <MessageBubble msg={msg} currentUserId={user.id} />
                    </React.Fragment>
                  );
                });
              })()}
              <ChatScrollAnchor messageCount={chatMessages.length} />
            </div>

            {/* Send Message Form */}
            <SendMessageForm receiverUsername={activePartner.username} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/10">
            <MessageSquare className="h-12 w-12 text-zinc-700 mb-4 animate-pulse" />
            <h3 className="text-base font-bold text-white">Sohbet Seçin</h3>
            <p className="text-sm text-zinc-500 max-w-sm mt-2">
              Soldaki listeden yazar seçerek mesajlaşmaya başlayabilirsiniz veya bir yazarın profiline gidip &quot;Mesaj Gönder&quot; butonunu kullanabilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
