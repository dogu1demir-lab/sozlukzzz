"use client";

import { playBuzzSound } from "@/lib/utils";
import Link from "next/link";
import { X } from "lucide-react";

interface ManifestoModalProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

/** Sözlük Manifestosu modalı — IntroBanner ve Ayarlar'da ortak kullanılır. */
export default function ManifestoModal({ open, onClose, isLoggedIn }: ManifestoModalProps) {
  if (!open) return null;

  const close = () => {
    playBuzzSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-7 shadow-2xl overflow-hidden animate-in scale-in duration-300">

        {/* Modal Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4 shrink-0">
          <span className="text-2xl select-none">📜</span>
          <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wider">
            Sözlükzzz <span className="text-lime-400">Manifestosu</span>
          </h2>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-1 text-xs md:text-sm text-zinc-350 space-y-4 leading-relaxed font-medium">
          <p className="text-zinc-500 italic text-[11px]">
            Y ve Z kuşaklarını teknoloji, yapay zeka ve ortak savunma bilinciyle birleştiren yeni dünya düzeni bildirisi... zzz
          </p>

          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span className="text-lime-400">🪰</span> Sineklerin Yeni Dünya Düzeni: Büyük Vızıltı Manifestosu
            </h3>
            <p>
              Eski dünyanın sağ-sol kavgaları, soğuk savaş artığı ideolojileri ve sınırları artık geçmişin tozlu sayfalarında kaldı. Bizler, teknolojinin kucağına doğmuş Y kuşağı ve yapay zekanın sınırsızlığıyla büyüyen Z kuşağı olarak, geçmişin yapay bölünmelerini reddediyoruz.
            </p>
            <p>
              Yeni dünya düzeninde ne sağ var ne sol; sadece bağlantıda olanlar ve bizi susturmaya çalışanlar var. Bizler <strong>sözlükzzz</strong> yazarlarıyız. Bizler internetin sinekleriyiz.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-lime-400">
              1. Sürü Kanunu: Birimiz Hepimiz İçin
            </h4>
            <p>
              Tek bir sinek zayıftır, kolayca savuşturulabilir. Ancak binlerce sinek bir araya geldiğinde bir <strong>sürü</strong> olur. Bir vızıltı, sağır edici bir uğultuya dönüşür.
            </p>
            <p>
              İnternette, sosyal medyada veya dünyanın herhangi bir dijital mecrasında birimize bir saldırı yapıldığında, hepimiz oraya yığılarız. Düşman ne kadar büyük olursa olsun; binlerce sineğin aynı anda hedefe odaklanmasıyla hiçbir güç baş edemez.
            </p>
            <p>
              Yapay zekanın rehberliğinde, teknolojinin kalkanıyla birbirimizi savunuruz. Sürüden tek bir sineğin bile haksız yere ezilmesine izin vermeyiz.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-lime-400">
              2. Vızıldama Özgürlüğü
            </h4>
            <p>
              Bizi susturmak isteyenler, cam fanusların arkasından dünyayı yönetmeye çalışanlardır. Ama bilmedikleri bir şey var: Sinekler açık pencerelerden, en küçük çatlaklardan sızar. Biz her yerdeyiz. Fikirlerimizle, mizahımızla, zekamızla ve inatçı vızıltımızla buradayız.
            </p>
            <p className="font-bold text-white italic pt-2">
              &quot;Biz sözlükzzz&apos;üz. Biz sinekleriz. Bir araya gelir, yığılır ve fırtınayı başlatırız zzz!&quot;
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-900 flex justify-between items-center gap-4 shrink-0">
          {!isLoggedIn ? (
            <Link
              href="/kaydol"
              onClick={close}
              className="inline-flex items-center gap-1 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black text-xs font-extrabold rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Manifestoyu İmzala & Katıl 🪰
            </Link>
          ) : (
            <div />
          )}
          <button
            onClick={close}
            className="px-5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-white rounded-lg transition-colors active:scale-95 shrink-0"
          >
            Vızıldayarak Kapat zzz
          </button>
        </div>

      </div>
    </div>
  );
}
