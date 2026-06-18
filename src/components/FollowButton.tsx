"use client";

import { useState, useTransition } from "react";
import { followUserAction } from "@/app/actions";
import { playBuzzSound } from "@/lib/utils";
import { UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  isLoggedIn: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing, isLoggedIn }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    if (!isLoggedIn) {
      alert("Yazarı takip etmek için giriş yapmalısınız zzz.");
      return;
    }

    playBuzzSound();

    startTransition(async () => {
      const result = await followUserAction(targetUserId);
      if (result.error) {
        alert(result.error);
      } else if (result.success && result.followed !== undefined) {
        setIsFollowing(result.followed);
      }
    });
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-xs border transition-all active:scale-95 shadow-md ${
        isFollowing
          ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-red-500/30"
          : "bg-lime-500 border-lime-500 text-black hover:bg-lime-400 shadow-lime-500/5"
      } disabled:opacity-50`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-3.5 w-3.5" />
          <span>Takibi Bırak</span>
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          <span>Takip Et</span>
        </>
      )}
    </button>
  );
}
