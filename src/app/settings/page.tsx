import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
      avatarColor: true,
      avatarUrl: true,
      bio: true,
      role: true
    }
  });

  if (!user) {
    redirect("/giris");
  }

  return (
    <SettingsClient user={user} />
  );
}
