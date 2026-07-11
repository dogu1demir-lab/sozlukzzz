export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 space-y-4 animate-in fade-in duration-300">
      {/* Container for the pulsing fly and spinning neon ring */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer spinning neon lime border */}
        <div className="absolute inset-0 rounded-full border-2 border-zinc-900 border-t-lime-500 animate-spin" style={{ animationDuration: "0.8s" }}></div>
        
        {/* Inner glow circle */}
        <div className="absolute inset-1 rounded-full bg-lime-500/5 blur-sm animate-pulse"></div>
        
        {/* Pulsing fly emoji in the center */}
        <div className="text-2xl select-none animate-bounce" style={{ animationDuration: "1.5s" }} role="img" aria-label="fly">
          🪰
        </div>
      </div>
      
      {/* Subtitle with a soft pulsing neon text */}
      <p className="text-[11px] font-extrabold text-lime-500/80 tracking-wider uppercase animate-pulse select-none">
        vızıldanıyor zzz...
      </p>
    </div>
  );
}
