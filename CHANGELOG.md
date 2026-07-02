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

4. **Kullanıcı Adı veya E-posta ile Giriş Desteği**
   * **Açıklama:** Yazarların üye olurken Türkçe/İngilizce karakter farklarını unutabilmesi (örn: `tuğce` vs `tuğçe`) ve giriş yaparken zorlanmasını engellemek amacıyla, giriş formuna hem kullanıcı adı hem de e-posta ile giriş desteği eklendi. Arayüz placeholder'ı `"kullanıcı adı veya e-posta"` olarak güncellendi.
   * **Kod Referansı:** [giris/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/giris/page.tsx) & [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts)

### 🐛 Hata Düzeltmeleri
1. **Tüm Gönderi ve Form Yönlendirme Askılarının Giderilmesi (Standartlaştırma)**
   * **Sorun:** Yeni konu açma sayfasındaki kilitlenme çözülmüştü; ancak benzer şekilde **Yorum/Entry Yazma Formu** ve **PozKes Fotoğraf Yükleme Formu** da asenkron veri gönderme işlemlerini doğrudan `startTransition` içinde yürüttüğü ve peşine `router.refresh()` çakışması yaşadığı için ara sıra `"Gönderiliyor..."` aşamasında takılı kalabiliyordu.
   * **Çözüm:** Tüm formlar (`AddEntryForm`, `PozKesUploadForm`) yeni kararlı standardımıza geçirildi:
     * Asenkron API çağrısı `startTransition` dışına alındı.
     * Sadece yönlendirme (`router.push`) / sayfa güncelleme (`router.refresh`) işlemleri `startTransition` içerisine dahil edildi.
     * Form gönderildikten sonra oluşan geçici arayüz kilitlenmeleri ve geçiş kesintileri tamamen engellendi.
   * **Kod Referansı:** [yeni/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/yeni/page.tsx), [AddEntryForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/AddEntryForm.tsx), [PozKesUploadForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesUploadForm.tsx)

2. **Gereksiz PM2 Log Dosyası Şişmesinin Engellenmesi**
   * **Sorun:** Her ana sayfa besleme (feed) yüklenmesinde sunucuda `[PERF]` etiketli performans günlük yazıları (`console.log`) çalıştırılıyordu. Bu durum, sunucu diskinin uzun vadede gereksiz log kayıtlarıyla dolma riski taşıyordu.
   * **Çözüm:** Üretim (production) kodlarındaki tüm tekrarlayan `[PERF]` log yazma işlemleri temizlendi. PM2 loglarının temiz ve hafif kalması sağlandı.
   * **Kod Referansı:** [[tab]/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/%5Btab%5D/page.tsx)

3. **Boşluksuz Harf Dizilerinden Kaynaklanan Arayüz Taşmalarının Çözülmesi**
   * **Sorun:** Boşluk bırakılmadan girilen uzun harf blokları (`wwww...` veya `3333...` gibi) tarayıcı tarafından tek parça kelime kabul ediliyordu. `span` etiketleri varsayılan olarak `inline` davrandığından, arayüze eklenen `break-words` kuralları çalışmıyor ve sol menüdeki başlık metni sağa kayarak entry sayısı rozetinin üstünü kapatıyordu.
   * **Çözüm:** 
     * Sol menüdeki başlık ve yükleme metinleri (`SidebarContent.tsx`, `SidebarLoadMore.tsx`) ile ana akış tab listelerindeki başlık span'lerine **`break-words break-all block min-w-0`** sınıfları eklendi.
     * `span` etiketleri blok elemana dönüştürülerek, sınırları aşan uzun metinlerin hece bazında otomatik alt satıra kırılarak taşması tamamen engellendi.
   * **Kod Referansı:** [SidebarContent.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarContent.tsx), [SidebarLoadMore.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarLoadMore.tsx), [[tab]/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/%5Btab%5D/page.tsx), [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)
