# sözlükzzz — Değişiklik Günlüğü (Changelog)

Projede son yapılan hata düzeltmeleri, performans iyileştirmeleri ve kullanıcı deneyimi (UX) güncellemeleri aşağıda listelenmiştir.

## [1.7.2] - 2026-07-11

### 🚀 Yeni Başlık & Çakışan Yönlendirme Düzeltmesi & Sol Menü Aktif Başlık Vurgusu
1. **Yeni Başlık Açınca & Çakışan Yönlendirmelerde Nokta Atışı Uçma (`create-topic-target-redirect`)**
   * **Açıklama:** `/yeni` kısmından başlık açıldığında (veya zaten var olan bir başlığa çakışma nedeniyle yorum eklendiğinde) kullanıcı artık doğrudan kendi yazdığı yorumun sayfasına (`?p=X`) uçuyor, sayfada o konuma kayıyor ve yeşil parlama efekti (`#entry-Y`) tetikleniyor.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts), [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/yeni/page.tsx)
2. **Sol Menü Aktif Başlık Vurgusu (`sidebar-active-topic-highlight`)**
   * **Açıklama:** Yazarın şu an okumakta olduğu başlık sol menü listesinde göz yormayan hafif yeşilimsi şeffaf bir arka plan (`bg-lime-950/15`), yeşil neon kenarlık ve sol tarafta şık yeşil bir çizgi vurgusuyla parlatıldı.
   * **Kod Referansı:** [SidebarContent.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarContent.tsx)

---

## [1.7.1] - 2026-07-11

### 🚀 Çakışan Başlık Açma Talebi Real-Time Düzeltmesi (`duplicate-topic-realtime-fix`)
1. **Mevcut Başlığa Entry Dönüşümü İçin Real-Time Tetikleme Eklendi**
   * **Açıklama:** Kullanıcı var olan bir başlığı fark etmeden yeniden açmaya çalıştığında, sistem bu başlığın altına yeni bir yorum (entry) ekler. Ancak bu işlem esnasında başlığın `lastEntryAt` tarihi güncellenmediği ve Redis'e `NEW_ENTRY` sinyali gönderilmediği için başlık sekmelerde yukarı fırlamıyordu ve anlık alev efekti tetiklenmiyordu. Bu iki hayati adım `if (topic)` çakışma bloğuna eklenerek sorun çözüldü.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts) (createTopicAndEntryAction)

---

## [1.7.0] - 2026-07-03

### 🚀 Profil Sayfası Kadraj Görsel Yükleme Modali (`profile-upload-modal`)
1. **window.prompt Değişimi & Şık Önizleme Arayüzü**
   * **Açıklama:** Profil sayfasındaki kadraj görseli yükleme alanındaki tarayıcı prompt'u kaldırılarak yerine karanlık glassmorphic tema ile tam uyumlu, görsel önizlemeli ve açıklama yazma alanına sahip özel bir modal bileşeni eklendi.
   * **Kod Referansı:** [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.6.0] - 2026-07-03

### 🚀 Sol Menü Real-Time Kilidi & "Daha Fazla" Akıllı Filtresi
1. **Sol Menü Kilitlenme Hatası Düzeltildi (`sidebar-realtime-lock-fix`)**
   * **Açıklama:** Bugün sekmesinde dünün konularının eklenmesiyle listenin ilk yüklemede 30 sınırı aşması (örneğin 45 başlık) sebebiyle, sistemin kullanıcıyı "Daha Fazla"ya tıklamış varsayıp real-time güncellemeleri kilitlemesi sorunu çözüldü.
   * **Çözüm:** Liste uzunluğu karşılaştırması yerine, sadece kullanıcı "Daha Fazla" butonuna bastığında tetiklenen `hasLoadedMore` durum bayrağı eklendi.
   * **Kod Referansı:** [SidebarContent.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarContent.tsx)

---

## [1.5.1] - 2026-07-03

### 🚀 Nginx Gzip Compression Tünel Kilidi Çözümü
1. **SSE Tüneli İçin Gzip Devre Dışı Bırakıldı (`gzip-off-realtime`)**
   * **Açıklama:** Nginx'in veri sıkıştırma (`gzip on`) filtresinin, SSE anlık mesajlarını sıkıştırmak için ara belleğe alarak geciktirmesi engellendi. `/api/messages/stream` Nginx konum bloğuna `gzip off;` kuralı eklenerek tüm ara bellek sıkıştırma gecikmeleri kaldırıldı.
   * **Kod/Sunucu Referansı:** Nginx sites-available/sozlukzzz konfigürasyonu güncellendi ve yeniden yüklendi.

---

## [1.5.0] - 2026-07-03

### 🚀 Nginx Real-time SSE Buffering Çözümü
1. **Nginx SSE Akışı Tam Eşzamanlılaştırma (`nginx-sse-unbuffering`)**
   * **Açıklama:** Yeni açılan başlıkların ve entry'lerin arkadaş/diğer kullanıcıların ekranına sayfayı yenilemeden anında (real-time) düşmesini engelleyen Nginx proxy buffering problemi kökten çözüldü. Nginx yapılandırma dosyasına `/api/messages/stream` SSE adresi için `proxy_buffering off`, `proxy_cache off` ve `chunked_transfer_encoding on` kuralları eklendi.
   * **Kod/Sunucu Referansı:** Nginx sites-available/sozlukzzz konfigürasyonu güncellendi ve yeniden yüklendi.

---

## [1.4.0] - 2026-07-03

### 🚀 Full-Screen Uçuş Portalı & Acil Çıkış Kapısı (Escape Hatch)
1. **Şık Full-Screen Geçiş Ekranları (`flying-portal-overlay`)**
   * **Açıklama:** Yorum gönderme ve PozKes yükleme sonrasında 1600ms'lik yönlendirme gecikmesi esnasında ekrandaki buton deformasyonunu önlemek ve şık bir geçiş hissi vermek amacıyla full-screen koyu cam (backdrop-blur) portal katmanı eklendi. Yorumlar için `🐝` (arı), PozKes için `📸` (kamera) animasyonlu simgeleri ve özelleştirilmiş başlıklar eklendi.
   * **Kod Referansı:** [AddEntryForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/AddEntryForm.tsx), [PozKesUploadForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesUploadForm.tsx)

2. **3 Saniyelik Acil Kurtarma Sistemi (`escape-hatch`)**
   * **Açıklama:** Geçiş esnasında bağlantının kopması veya yönlendirmenin kilitlenmesi riskine karşı, 3 saniye sonra portalın altında "zorla yenile" veya "iptal et" (formu sıfırlayıp geri dönme) seçenekleri sunan acil çıkış kapısı entegre edildi.
   * **Kod Referansı:** [AddEntryForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/AddEntryForm.tsx), [PozKesUploadForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesUploadForm.tsx)

3. **Next.js Revalidation Bellek Koruması (`window-is-uculuyor`)**
   * **Açıklama:** Yorum yapıldığında Next.js'in sayfayı sunucu tarafında tazeleyip (`revalidatePath`) Suspense bileşenini unmount etmesi nedeniyle silinen yönlendirme durumları, `window.isUculuyor` küresel bayrağı ile korunarak formun sıfırlanması engellendi.

---

## [1.3.0] - 2026-07-03

### 🚀 Mobil Uyumlu Yönlendirme & Ses Güvencesi (Kurşun Geçirmez Model)
1. **Geleneksel Tarayıcı Yönlendirmesine Geçiş (`window-location-href`)**
   * **Açıklama:** Yorum gönderme (`AddEntryForm`), yeni konu açma (`yeni/page.tsx`) ve PozKes yükleme (`PozKesUploadForm`) sonrasındaki yönlendirmeler, Next.js SPA yönlendiricisinin mobil cihazlarda (iOS Safari / Android Chrome) yaptığı sayfa kilitlemelerini kökten çözmek için `window.location.href` yapısına geçirildi.
   * **Kod Referansı:** [AddEntryForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/AddEntryForm.tsx), [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/yeni/page.tsx), [PozKesUploadForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesUploadForm.tsx)

2. **Ses ve Konfeti Gecikmesi (`audio-confetti-delay`)**
   * **Açıklama:** Yönlendirme tam sayfa yenilemeyle yapıldığı için bildirim sesi (`/eylemhareket.mp3`) ve konfeti efektlerinin yarıda kesilmesini engellemek amacıyla, sayfa geçişleri tetiklenmeden önce 350ms'lik bir yapay gecikme (`setTimeout`) tanımlandı. Sesler ve görsel efektler artık kesintisiz çalmaktadır.

---

## [1.2.0] - 2026-07-03

### 🚀 UX & Yönlendirme İyileştirmeleri
1. **Entry Yazarı & Mobil Yönlendirme Düzeltmesi (`router-push-freeze`)**
   * **Açıklama:** Entry formu gönderildiğinde, Next.js istemci tarafındaki sayfa geçişlerinin (`router.push`) yavaş mobil bağlantılarda veya Safari mobil motorlarında takılmasını engellemek için `startTransition` sarmalayıcısı kaldırıldı. Redirection artık anında ve kilitlenmesiz başlar.
   * **Kod Referansı:** [AddEntryForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/AddEntryForm.tsx)

2. **Nokta Atışı Odaklanma Güvencesi (`HashRedirector-fallback`)**
   * **Açıklama:** Hedeflenen yorum zaten güncel sayfada çizilmiş olsa bile, Next.js'in asenkron DOM render gecikmelerini bertaraf etmek amacıyla `HashRedirector` bileşenine 100ms gecikmeli bir yumuşak kaydırma (`scrollIntoView`) yedekleme mekanizması eklendi.
   * **Kod Referansı:** [HashRedirector.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/HashRedirector.tsx)

3. **Entry Silme Sonrası Tarih Güncelleme Zekası (`lastEntryAt-recalculation`)**
   * **Açıklama:** Çok entry'li bir konuda yazarlar kendi entry'lerini sildiklerinde, o konunun Bugün/Dün sekmelerindeki sıralamasını bozmamak ve sol menüde `0` adet entry ile kalmasını engellemek için, başlığın son entry yazılma tarihi (`lastEntryAt`) kalan en güncel entry'nin tarihine geriye dönük olarak yeniden hesaplanarak güncellenmesi sağlandı.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts)

4. **Kusursuz Kelime Kaydırma Yapısı (`break-words`)**
   * **Açıklama:** Sol menüdeki (Vızıldayanlar/Dünküler) başlıklar alt satıra geçerken kelimelerin ortasından anlamsızca bölünmesi (`break-all`) sorunu düzeltildi. Başlıklar artık dil kurallarına uygun şekilde, kelimeleri bütün halinde tutarak alt satıra kayar (`break-words`).
   * **Kod Referansı:** [SidebarContent.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarContent.tsx), [SidebarLoadMore.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarLoadMore.tsx), [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/%5Btab%5D/page.tsx)

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

4. **Kullanıcı Adı veya E-posta ile Giriş Desteği & İki Arayüz Kutulu Kayıt Sistemi**
   * **Açıklama:** Yazarların üye olurken Türkçe/İngilizce karakter farklarını unutabilmesini engellemek amacıyla hem kullanıcı adı hem de e-posta ile giriş desteği sunuldu. Kayıt olma sayfası (`kaydol/page.tsx`) iki ayrı kutuya ayrıldı:
     1. **Görünen İsim (Display Name):** Türkçe karakter ve boşluk serbest (Örn: `Şehriban Gaaç`, `Tuğçe`). Sitede yazarın bu şık ismi görünür.
     2. **Kullanıcı Adı (Handle):** Sadece küçük İngilizce harfler, sayılar ve alt çizgi içerebilir (Örn: `sehribangaaac`, `tugce`). Bu yazarın profil linki ve bahsetme etiketidir.
   * **Akıllı Giriş:** Eski Türkçe karakterli kullanıcı adına sahip yazarlar, sisteme eski isimleriyle (`tuğçe` gibi) yazarak girseler bile kod arka planda bunu otomatik İngilizce formata (`tugce`) çevirerek sorunsuzca giriş yaptırır.
   * **Kod Referansı:** [giris/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/giris/page.tsx), [kaydol/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/kaydol/page.tsx) & [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts)

5. **Türkçe Karakter ve Profil Rotaları Sağlamlaştırma (Robust Sanitization)**
   * **Açıklama:** Arama motorları veya manuel girişler üzerinden gelen Türkçe karakterli profil linkleri (`/yazar/tuğçe`) ve profil resimleri (`/api/yazar-image/tuğçe`) otomatik temizlenerek doğru İngilizce handle (`tugce`) ile eşleştirilir. 404 hataları tamamen engellenmiştir.
   * **Kod Referansı:** [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/yazar/%5Busername%5D/page.tsx), [route.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/api/yazar-image/%5Busername%5D/route.ts), [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/mesajlar/page.tsx)

6. **Akıllı Bahsetme (Mention) ve Bildirim Çözümleme**
   * **Açıklama:** Entry ve PozKes yorumlarında kullanıcılar eski alışkanlıklarıyla Türkçe karakterli etiket yazsa dahi (Örn: `@tuğçe`), motor bunu arka planda otomatik temizleyerek `tugce` kullanıcısına yönlendirir ve bildirimi anında ulaştırır.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts), [MentionText.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/MentionText.tsx)

7. **Zincirleme Silme (Cascade Delete) ve Hesap Silme Mimarisi**
   * **Açıklama:** Veritabanındaki ilişkiler `onDelete: Cascade` ile güçlendirildi. Bir yazar silindiğinde veya entry silindiğinde tüm alt yorumlar, beğeniler, özel mesajlar ve bildirimler otomatik temizlenir. Yazar silindikten sonra boş kalan kovan başlıklar (`none: {}`) sistem tarafından otomatik olarak temizlenerek veri kirliliği önlenir.
   * **Kod Referansı:** [schema.prisma](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/prisma/schema.prisma) & [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts) (deleteAccountAction)

### 🐛 Hata Düzeltmeleri
1. **Yeni Başlık Açma Yönlendirme Askılarının Net Çözümü (SPA Yönlendirmesi)**
   * **Sorun:** Yeni konu açma (`yeni/page.tsx`) formunda gönderim sonrası yönlendirme (`router.push`) işlemi React `startTransition` içerisine dahil edildiğinde, Next.js hedef dynamic sayfa verisini sunucudan çekip derleyene kadar arayüzü geçici donduruyor (transition kilidi) ve kullanıcının sayfada asılı kalmasına yol açıyordu.
   * **Çözüm:** `yeni/page.tsx` içerisindeki `startTransition` ve `setTimeout` yapıları tamamen kaldırıldı. Form başarıyla gönderildiği anda Next.js'in standart `router.push` yönlendiricisi direkt tetiklendi. Böylece sayfa dondurulmadan konfeti ve ses efekti (`eylemhareket.mp3`) kesintisiz çalıyor ve Next.js arka planda anında yumuşak bir SPA yönlendirmesi yapıyor.
   * **Kod Referansı:** [yeni/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/yeni/page.tsx)

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
