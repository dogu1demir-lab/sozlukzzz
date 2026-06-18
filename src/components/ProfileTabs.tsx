"use client";

import { useState } from "react";
import { BookOpen, Camera, Users, Award } from "lucide-react";
import { playBuzzSound } from "@/lib/utils";

interface ProfileTabsProps {
  isSelf: boolean;
  entriesCount: number;
  followersCount: number;
  followingCount: number;
  entriesView: React.ReactNode;
  uploadFormView: React.ReactNode;
  followersView: React.ReactNode;
  followingView: React.ReactNode;
}

export default function ProfileTabs({
  isSelf,
  entriesCount,
  followersCount,
  followingCount,
  entriesView,
  uploadFormView,
  followersView,
  followingView,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"entries" | "sen" | "followers" | "following">("entries");

  const handleTabChange = (tab: "entries" | "sen" | "followers" | "following") => {
    setActiveTab(tab);
    playBuzzSound();
  };

  return (
    <div className="space-y-6">
      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-zinc-900 pb-px overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange("entries")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
            activeTab === "entries"
              ? "border-lime-500 text-lime-400 font-extrabold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Girdiler ({entriesCount})</span>
        </button>

        {isSelf && (
          <button
            onClick={() => handleTabChange("sen")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
              activeTab === "sen"
                ? "border-lime-500 text-lime-400 font-extrabold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="text-lime-400">Sen / Fotoğraf Paylaş</span>
          </button>
        )}

        <button
          onClick={() => handleTabChange("followers")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
            activeTab === "followers"
              ? "border-lime-500 text-lime-400 font-extrabold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Takipçiler ({followersCount})</span>
        </button>

        <button
          onClick={() => handleTabChange("following")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
            activeTab === "following"
              ? "border-lime-500 text-lime-400 font-extrabold"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Takip Edilenler ({followingCount})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="animate-in fade-in duration-200">
        {activeTab === "entries" && entriesView}
        {activeTab === "sen" && isSelf && uploadFormView}
        {activeTab === "followers" && followersView}
        {activeTab === "following" && followingView}
      </div>
    </div>
  );
}
