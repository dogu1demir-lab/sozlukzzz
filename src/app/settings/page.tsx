import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { cookies } from "next/headers";
import SettingsClient from "./SettingsClient";

export const revalidate = 0;

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/giris");
  }

  // Fetch full user details from DB (specifically bio)
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarColor: true,
      avatarUrl: true,
      bio: true,
      role: true
    }
  });

  if (!user) {
    redirect("/giris");
  }

  let disableSelfDeletion = false;
  try {
    const cached = await redis.get("settings:disable_self_deletion");
    disableSelfDeletion = cached === "true";
  } catch (err) {
    console.error("Failed to read self deletion setting:", err);
  }

  // Kullanıcının tema tercihi (çerez); seçici kartın aktif durumunu SSR'da doğru basmak için
  let initialTheme = "varsayilan";
  try {
    const cookieStore = await cookies();
    const cookieTheme = cookieStore.get("tema")?.value;
    if (cookieTheme && ["varsayilan", "dark", "nova", "aydinlik"].includes(cookieTheme)) {
      initialTheme = cookieTheme;
    }
  } catch (err) {
    console.error("Failed to read theme cookie:", err);
  }

  return (
    <SettingsClient user={user} disableSelfDeletion={disableSelfDeletion} initialTheme={initialTheme} />
  );
}
