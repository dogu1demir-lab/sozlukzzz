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

  // Convert date to Europe/Istanbul (UTC+3)
  const trDate = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  const year = trDate.getUTCFullYear();
  const month = trDate.getUTCMonth(); // 0-11
  const day = trDate.getUTCDate();
  const hours = String(trDate.getUTCHours()).padStart(2, "0");
  const minutes = String(trDate.getUTCMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}`;

  const now = new Date();
  const trNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const todayStart = Date.UTC(trNow.getUTCFullYear(), trNow.getUTCMonth(), trNow.getUTCDate());
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const targetStart = Date.UTC(year, month, day);

  if (targetStart === todayStart) {
    return `Bugün ${timeStr}`;
  }

  if (targetStart === yesterdayStart) {
    return `Dün ${timeStr}`;
  }

  const trMonths = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  return `${day} ${trMonths[month]} ${year} ${timeStr}`;
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
