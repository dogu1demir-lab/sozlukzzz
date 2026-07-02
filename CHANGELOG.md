# sözlükzzz — Değişiklik Günlüğü (Changelog)

Projede son yapılan hata düzeltmeleri, performans iyileştirmeleri ve kullanıcı deneyimi (UX) güncellemeleri aşağıda listelenmiştir.

---

## [1.1.0] - 2026-07-02

### 🚀 Yeni Özellikler & UX İyileştirmeleri
1. **Canlı Sol Menü Güncellemesi (`sidebar-refresh`)**
   * **Açıklama:** Sitede yeni bir konu açıldığında veya bir yoruma yeni entry girildiğinde, sol menü artık sayfa yenilenmesini veya polling süresini beklemeden **anında** güncellenir.
   * **Önbellek Koruyucu:** Kullanıcı "daha fazla vızzz" butonuna basarak eski sayfaları açtıysa, sol menünün anlık güncellenerek sayfayı 1. sayfaya sıfırlaması engellendi (`if (topicsLengthRef.current > initialLimit) return` kontrolü).
   * **Kod Referansı:** [SidebarContent.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarContent.tsx) & [RealtimeGlobalListener.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/RealtimeGlobalListener.tsx)

2. **Tarayıcı Bildirimlerine Tıklayarak Yönlendirme (Nokta Atışı)**
   * **Açıklama:** Ekrana düşen yerel tarayıcı bildirimlerine tıklandığında sekme otomatik olarak öne odaklanır (`window.focus()`) ve ilgili sayfaya yönlendirir.
   * **Özel Mesaj Bildirimi:** Tıklandığında doğrudan mesajı atan yazarın mesajlaşma penceresini açar (`/mesajlar?u=yazar`).
   * **Yeni Başlık Bildirimi:** Tıklandığında doğrudan o başlığın içerisine yönlendirir (`/baslik/slug`).
   * **Kod Referansı:** [RealtimeGlobalListener.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/RealtimeGlobalListener.tsx) & [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts) (NEW_TOPIC event payload'una `slug` dahil edildi).

3. **Paylaşım Butonları ve Nokta Atışı Giriş Linkleri**
   * **Açıklama:** "Linki Kopyala", "WhatsApp" ve "Twitter (X)" paylaşım butonları artık paylaşılan yoruma özel benzersiz `#entry-entryID` bağlantısı oluşturur.
   * **Sayfalama Zekası:** Eğer paylaşılan entry başka bir sayfada ise, sistem otomatik olarak doğru sayfaya (`?p=sayfa#entry-entryID`) yönlendirir ve tarayıcı ekranını o entry'nin üstüne kaydırır.
   * **Kod Referansı:** [ReactionButtons.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ReactionButtons.tsx) & [HashRedirector.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/HashRedirector.tsx)

### 🐛 Hata Düzeltmeleri
1. **Yeni Konu/Anket Açma Yönlendirme Askısı Çözüldü**
   * **Sorun:** Yeni konu açıldığında form gönderildikten sonra sayfa yönlenmeyip `"Paylaşılıyor..."` butonunda kilitli kalıyordu.
   * **Çözüm:** İstemci tarafı SPA (Single Page Application) akışını ve sayfa yenilenmeden yumuşak geçiş hissini korumak için resmi Next.js/React standardına geçildi. Rota yönlendirmesi (`router.push()`), React'in asenkron UI geçişlerini yöneten **`startTransition`** sarmalayıcısı içine alındı. Önbellek çakışmalarını tetikleyen anlık `router.refresh()` ve yönlendirme sırasında origin sayfanın re-render olmasına sebep olan state güncellemeleri kaldırılarak kilitlenme tamamen giderildi. Artık mobil ve masaüstü tarayıcılarda sayfa yenilenmeden, konfeti ve ses efektleriyle akıcı şekilde çalışıyor.
   * **Kod Referansı:** [yeni/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/yeni/page.tsx)

2. **Gereksiz PM2 Log Dosyası Şişmesinin Engellenmesi**
   * **Sorun:** Her ana sayfa besleme (feed) yüklenmesinde sunucuda `[PERF]` etiketli performans günlük yazıları (`console.log`) çalıştırılıyordu. Bu durum, sunucu diskinin uzun vadede gereksiz log kayıtlarıyla dolma riski taşıyordu.
   * **Çözüm:** Üretim (production) kodlarındaki tüm tekrarlayan `[PERF]` log yazma işlemleri temizlendi. PM2 loglarının temiz ve hafif kalması sağlandı.
   * **Kod Referansı:** [[tab]/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/%5Btab%5D/page.tsx)
