export function playBuzzSound(force = false, soundPath = "/vizildi.mp3") {
  if (typeof window === "undefined") return;
  if (!force && localStorage.getItem("buzzMuted") === "true") return;
  try {
    const audio = new Audio(soundPath);
    audio.volume = 0.25; // set moderate volume to not annoy the user
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Safe fallback for autoplay/policy block
      });
    }
  } catch (e) {
    // browser auto-play policy block fallback
  }
}


export function formatDate(date: Date | string): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = new Date();

  // Convert both dates to Europe/Istanbul time (UTC+3) to ensure day boundary checks are exact
  const turkeyNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const turkeyDate = new Date(d.getTime() + 3 * 60 * 60 * 1000);

  const todayStart = new Date(
    Date.UTC(
      turkeyNow.getUTCFullYear(),
      turkeyNow.getUTCMonth(),
      turkeyNow.getUTCDate(),
      0, 0, 0, 0
    )
  );

  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const targetDayStart = new Date(
    Date.UTC(
      turkeyDate.getUTCFullYear(),
      turkeyDate.getUTCMonth(),
      turkeyDate.getUTCDate(),
      0, 0, 0, 0
    )
  ).getTime();

  const hoursMinutes = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul"
  });

  if (targetDayStart === todayStart.getTime()) {
    return `Bugün ${hoursMinutes}`;
  }

  if (targetDayStart === yesterdayStart.getTime()) {
    return `Dün ${hoursMinutes}`;
  }

  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul"
  });
}

export function cleanUsernameHandle(input: string): string {
  let slug = input.trim().toLowerCase();
  const turkishChars: { [key: string]: string } = {
    'ı': 'i', 'ş': 's', 'ç': 'c', 'ğ': 'g', 'ü': 'u', 'ö': 'o',
    'â': 'a', 'î': 'i', 'û': 'u'
  };
  for (const char in turkishChars) {
    slug = slug.replaceAll(char, turkishChars[char]);
  }
  return slug.replace(/[^a-z0-9_]/g, "");
}
