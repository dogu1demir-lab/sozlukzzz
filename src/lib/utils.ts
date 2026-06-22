export function playBuzzSound(force = false, soundPath = "/vizildi.mp3") {
  if (typeof window === "undefined") return;
  if (!force && localStorage.getItem("buzzMuted") === "true") return;
  try {
    const audio = new Audio(soundPath);
    audio.volume = 0.25; // set moderate volume to not annoy the user
    audio.play();
  } catch (e) {
    // browser auto-play policy block fallback
  }
}


export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul"
  });
}
