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
    const { redis } = require("@/lib/redis");
    const cached = await redis.get("settings:disable_self_deletion");
    disableSelfDeletion = cached === "true";
  } catch (err) {
    console.error("Failed to read self deletion setting:", err);
  }

  return (
    <SettingsClient user={user} disableSelfDeletion={disableSelfDeletion} />
  );
}
