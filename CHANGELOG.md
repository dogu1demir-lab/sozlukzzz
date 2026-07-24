# sözlükzzz — Değişiklik Günlüğü (Changelog)

Projede son yapılan hata düzeltmeleri, performans iyileştirmeleri ve kullanıcı deneyimi (UX) güncellemeleri aşağıda listelenmiştir.

## [2.0.2] - 2026-07-24

### 📸 Profil Stalksss PozKes Sekmesi İsimlendirme Güncellemesi (`stalksss-tab-rename-pozkes`)
1. **Stalksss Sekmelerindeki 'Fotoğraflar' Butonu 'PozKes' Olarak Yeniden İsimlendirildi**
   * **Açıklama:** Kullanıcı profillerindeki 5'li "Profil Resimleri" vitrini ile kavram kargaşası oluşmaması için Stalksss sekmelerindeki 3. sekme butonu `PozKes (4)` olarak güncellendi.
   * **Kod Referansı:** [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [2.0.1] - 2026-07-24

### 🗑️ Fiziksel Görsel Dosyası Kalıntısız Silme Sistemi (`image-file-unlink-cleanup`)
1. **Silinen PozKes Gönderilerinin Sunucu Diskindeki Görsel Dosyaları Otomatik Siliniyor**
   * **Açıklama:** PozKes gönderisi veya fotoğraflı entry silindiğinde veritabanı kayıtlarının temizlenmesine ek olarak `deleteImageFile` fonksiyonu ile sunucu diskinde (`public/uploads/entries/...`) biriken fiziksel `.webp` görsel dosyaları da kalıntısız silinir.
   * **Kod Referansı:** [upload.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/lib/upload.ts), [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts)

---

## [2.0.0] - 2026-07-24

### 🗑️ Admin & Yazar PozKes Kalıntısız Silme Butonu (`pozkes-admin-author-delete-button`)
1. **PozKes Kartlarına Yönetici ve Yazar Çöp Kutusu Simgesi Eklendi**
   * **Açıklama:** Yöneticilerin (Admin) ve fotoğrafı paylaşan yazarın PozKes gönderisini kalıntısız bir şekilde sistemden silebilmesi için kart başlığına onay mekanizmalı kırmızı `Trash2` (🗑️) çöp kutusu ikonu eklendi. Gönderi silindiğinde yorumları, beğenileri, şikayetleri ve ilgili veri bağları temizlenir.
   * **Kod Referansı:** [PozKesCard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesCard.tsx), [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts)

---

## [1.9.8] - 2026-07-24

### 📸 Profil Vitrin Tanıtım Sloganı Güncellemesi (`profile-showcase-slogan-update`)
1. **Profil Sayfası Fotoğraf Vitrinine Enerjik Davet Metni Eklendi**
   * **Açıklama:** Kullanıcının kendi profilinde fotoğrafları boşken gösterilen boş durum mesajı *"Henüz profil fotoğrafı yüklemediniz. Aşağıdaki + butonundan hemen 5 adet profil resmini ekle, çatlasınlar! 📸"* olarak güncellendi.
   * **Kod Referansı:** [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.9.7] - 2026-07-24

### 📸 PozKes Sayfası Doğrudan Fotoğraf Paylaşım Kutusu (`pozkes-direct-upload-box`)
1. **PozKes Akışının En Tepesine Fotoğraf Yükleme Paneli Eklendi**
   * **Açıklama:** Kullanıcıların PozKes sayfasındayken başka yere gitmeden anında fotoğraf yükleyebilmesi için `/pozkes` sayfasının en tepesine görsel önizlemeli, açıklama metinli ve hızlı gönderimli `PozKesUploadBox` bileşeni yerleştirildi. Giriş yapmamış kullanıcılar için şık giriş davet kartı gösterilir.
   * **Kod Referansı:** [PozKesUploadBox.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesUploadBox.tsx), [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/pozkes/page.tsx)

---

## [1.9.6] - 2026-07-24

### 🚀 PozKes Eski Fotoğraf Hedefleme ve Canlı Çekim Düzeltmesi (`pozkes-historical-hash-redirector`)
1. **Eski PozKes Fotoğraflarına Uçulduğunda Otomatik İçerik Çekimi Eklendi**
   * **Açıklama:** Geçmiş tarihlerde (örn. 26 Haziran) paylaşılan PozKes fotoğraflarına `/pozkes#entry-ID` adresi üzerinden uçulduğunda, ilk 7 en yeni fotoğraflık akışta yer almadığı için sayfa başında kalma sorunu çözüldü. `getSinglePozKesAction` sunucu aksiyonu ve `PozKesHashRedirector` istemci bileşeni ile hedeflenen eski fotoğraf anında çekilip akışın tepesine eklenir ve odağa alınır.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts), [PozKesHashRedirector.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesHashRedirector.tsx), [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/pozkes/page.tsx)

---

## [1.9.5] - 2026-07-24

### 🎯 Stalksss Girdiler Sekmesi Nokta Atışı Entry Linki (`stalksss-entries-tab-anchor-fix`)
1. **Profildeki Girdiler Listesindeki Başlık Linkleri İlgili Entry'ye Bağlandı**
   * **Açıklama:** Stalksss -> Girdiler sekmesindeki başlık linkleri önceden sadece genel `/baslik/slug` sayfasına yönlendiği için yazarın yazdığı spesifik entry konumuna uçmuyordu. Linkler `/baslik/slug#entry-ID` formatına geçirildi ve tarihler `formatDate` akıllı formatına bağlandı.
   * **Kod Referansı:** [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.9.4] - 2026-07-24

### 📌 PozKes Kartlarına Konu Etiketi Entegrasyonu (`pozkes-card-topic-tag-badge`)
1. **PozKes Akışındaki Kartlara Ait Olduğu Konu Etiketi Eklendi**
   * **Açıklama:** PozKes akışında yer alan fotoğraflı kartların üst bilgisine, fotoğrafın yazıldığı orijinal konu adı (örn: `📌 fatih Altaylı'nın haluk levent yazısı`) tıklanabilir estetik bir rozet etiket olarak eklendi.
   * **Kod Referansı:** [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/pozkes/page.tsx), [PozKesCard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesCard.tsx)

---

## [1.9.3] - 2026-07-24

### 🔗 Profil Fotoğraflar Sekmesi Dinamik Yönlendirme Düzeltmesi (`stalksss-photos-tab-dynamic-routing-fix`)
1. **Profil Fotoğraflar Sekmesindeki Normal Konu Görselleri İlgili Başlığına Bağlandı**
   * **Açıklama:** Stalksss -> Fotoğraflar sekmesinde daha önce tüm görseller sabit `/pozkes#entry-ID` adresine yönlendiği için normal başlıklara (örn: "fatih Altaylı'nın haluk levent yazısı") ait fotoğraflar yanlış yere gidiyordu. Görselin ait olduğu konunun slug'ına göre dinamik rota hesaplaması eklendi (`/baslik/slug#entry-ID`).
   * **Kod Referansı:** [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.9.2] - 2026-07-24

### 🎯 Profil Yorumları ve PozKes Link Temizliği (`stalksss-comments-link-and-text-cleanup`)
1. **Profil Yorumlar Sekmesindeki Metin ve PozKes Yönlendirmeleri Netleştirildi**
   * **Açıklama:** Stalksss altındaki yorumlar listesinde yer alan karmaşık `"pozkes galeri başlığındaki gönderiye vızıldadı"` metni, PozKes fotoğrafları için `"PozKes Fotoğrafı için yorum yaptı"` olarak sadeleştirildi. Linkler doğrudan PozKes akışına (`/pozkes#entry-ID`) bağlandı. Tarihler `formatDate` yapısına alındı.
   * **Kod Referansı:** [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.9.1] - 2026-07-24

### 🖼️ Dedicated Profil Fotoğrafları Vitrini (`dedicated-5-profile-photos-showcase`)
1. **Profil Fotoğrafları (5 Slot) PozKes Akışından Tamamen Ayrıştırıldı**
   * **Açıklama:** Prisma şemasına `User.profilePhotos` alanı eklendi (`db push` alındı). Profil sayfasındaki 5 fotoğraflık alan artık PozKes (Kadraj) akışından bağımsız, yalnızca kullanıcının yüklediği 5 profil fotoğrafını barındırır. Fotoğraf ekleme ve silme aksiyonları eklendi.
   * **Kod Referansı:** [schema.prisma](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/prisma/schema.prisma), [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts), [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.9.0] - 2026-07-24

### 🔄 Profil Resmi ve PozKes Kadraj Bütünleşmesi (`unified-avatar-and-pozkes-showcase`)
1. **Profil Resmi ile PozKes Kadraj Fotoğrafları Birleştirildi**
   * **Açıklama:** PozKes yüklemeleri otomatik olarak yazarın avatarına eşitlendi. Ayrıca profil sayfasındaki üst daire avatarı yazarın ilk Kadraj fotoğrafını otomatik gösterir hale getirildi. 5'li Kadraj vitrinindeki her fotoğrafa "Profil Resmi Yap 🖼️" ikonu eklenerek tek tıkla avatar güncelleme imkanı sağlandı.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts), [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.8.9] - 2026-07-24

### 📸 Profil PozKes Kadrajı (5 Fotoğraflı İnteraktif Vitrin Galerisi) (`profile-pozkes-5-photo-showcase`)
1. **Yazar Profillerine 5 Fotoğraflı İnteraktif Kadraj Vitrini Entegre Edildi**
   * **Açıklama:** Yazar profillerindeki (`/yazar/username`) PozKes kadrajı, üstte büyük canlı hero fotoğrafı ve altında 5'li interaktif mini thumbnail şeridi olarak yeniden tasarlandı. Ziyaretçiler 5 mini fotoğrafa tıklayarak ana kadraj fotoğrafını değiştirebilir. Yazar profil sahibi için ise boş slotlar doğrudan "+ Foto Ekle" butonuna dönüşür.
   * **Kod Referansı:** [ProfileDashboard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/ProfileDashboard.tsx)

---

## [1.8.8] - 2026-07-24

### 🧹 Otomatik Bildirim Temizliği & Cron Job Entegrasyonu (`automatic-notification-cron-cleanup`)
1. **30 Günden Eski Okunmuş Bildirimleri Gece Otomatik Temizleyen Cron Endpoint'i Kuruldu**
   * **Açıklama:** `/api/cron` servisi güncellenerek güvenli gizli anahtar (CRON_SECRET) ile korundu. Her gece 03:00'te veritabanındaki 30 günü geçmiş bildirimleri otomatik silen sistem ve Hetzner Linux crontab görevi aktifleştirildi.
   * **Kod Referansı:** [route.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/api/cron/route.ts)

---

## [1.8.7] - 2026-07-24

### 🔔 Bildirim Kutusu Akıllı Tarih Entegrasyonu (`notification-popover-smart-date`)
1. **Bildirim Zili Açılır Penceresine Akıllı Tarih Gösterimi Eklendi**
   * **Açıklama:** Bildirim popover listesindeki ham tarih gösterimi `formatDate` yardımcısı ile değiştirilerek `Bugün 13:28`, `Dün 14:20` ve `24 Temmuz 2026 13:28` yapısına kavuşturuldu.
   * **Kod Referansı:** [Header.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/Header.tsx)

---

## [1.8.6] - 2026-07-24

### 📌 Konu Başlığı Görünürlük ve Hizalama Düzeltmesi (`topic-title-scroll-margin-visibility`)
1. **Konu Başlıklarının Sayfa Kaymasında Ekranda Görünür Kalması Sağlandı**
   * **Açıklama:** Yeni konu açıldığında veya ilk entry'ye kaydırıldığında sayfanın en tepesine kayma kuralı getirildi. Diğer yorumlara uçulduğunda ise `scroll-margin-top: 110px` uygulanarak konu başlığının ekrandan kaçması engellendi.
   * **Kod Referansı:** [globals.css](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/globals.css), [HashRedirector.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/HashRedirector.tsx)

---

## [1.8.5] - 2026-07-24

### 🎯 Bildirim Nokta Atışı Yönlendirme Düzeltmesi (`mention-notification-pinpoint-page-routing`)
1. **Bahsedilme Bildirimlerine Tam Sayfa Numarası ve İlgili Yorum Çapa Adresi eklendi**
   * **Açıklama:** Var olan bir konuda bahsedilme (`@kullanici`) bildirimi oluşturulurken entry'nin kaçıncı sayfaya düştüğü hesaplanarak `relatedUrl` adresi `/baslik/slug?p=SAYFA#entry-ID` şeklinde nokta atışı yönlendirilecek şekilde güncellendi.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts)

---

## [1.8.4] - 2026-07-23

### 🎨 PozKes Kart Başlığı Hizalama ve Tarih Hizalama Düzeltmesi (`pozkes-header-flex-alignment`)
1. **PozKes Başlığında Tarih Etiketinin Yazar Adının Yanına Hizalanması Sağlandı**
   * **Açıklama:** `.kd-card-header` sınıfına `display: flex`, `justify-content: space-between` ve `whitespace-nowrap` kuralları eklenerek tarihin yazar adının sağ tarafında tam hizalı durması sağlandı, alt satıra kayma problemi giderildi.
   * **Kod Referansı:** [globals.css](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/globals.css), [PozKesCard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesCard.tsx)

---

## [1.8.3] - 2026-07-23

### 📅 Akıllı Göreli Tarih Biçimlendirmesi ("Bugün", "Dün" Etiketleri) (`smart-relative-date-labels`)
1. **Tüm Sitede ve PozKes Kartlarında Akıllı Tarih Etiketleri Entegre Edildi**
   * **Açıklama:** `formatDate` yardımcısı geliştirilerek bugün yazılan içerikler için `Bugün 12:39`, dün yazılan içerikler için `Dün 14:20`, daha eski içerikler için ise `23 Temmuz 2026 12:39` yapısı aktifleştirildi. Ayrıca PozKes kartlarının üst başlıklarına da bu akıllı tarih etiketi eklendi.
   * **Kod Referansı:** [utils.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/lib/utils.ts), [EntryBlock.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/EntryBlock.tsx), [FeedLoadMore.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/FeedLoadMore.tsx), [PozKesCard.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/PozKesCard.tsx)

---

## [1.8.2] - 2026-07-23

### 📅 Tarih Biçimlendirme Standardı Güncellemesi (`turkish-named-date-formatting`)
1. **Feed ve Genel Tarih Biçimi "23 Temmuz 2026 12:39" Formatına Geçirildi**
   * **Açıklama:** Sitenin genelinde ve ana sayfa akışında kullanılan `formatDate` yardımcısı, rakamsal format yerine konu sayfalarındaki gibi estetik Türkçe ay adlarını içeren `23 Temmuz 2026 12:39` yapısına dönüştürüldü.
   * **Kod Referansı:** [utils.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/lib/utils.ts)

---

## [1.8.1] - 2026-07-23

### ⚡ Bugün Akışı Canlı En Yeni Yorum Sıralaması (`today-feed-latest-entry-ordering`)
1. **Bugün Sekmesinde En Son Yazılan Yorumun ve Yazarın Gösterilmesi Sağlandı**
   * **Açıklama:** Ana sayfadaki `Bugün` sekmesi akışının canlı bir sohbet akışı hissi vermesi için, her konu kartının altında konunun ilk yazısı yerine en son yazılan taze entry ve en son yazan yazarın bilgisi gösterilecek şekilde `createdAt: "desc"` güncellemesi yapıldı. Diğer sekmeler (`Gündem`, `Beğenilenler` vb.) ve konu detay sayfaları konu bütünlüğünü korumak adına aynı bırakıldı.
   * **Kod Referansı:** [page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/[tab]/page.tsx), [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts)

---

## [1.8.0] - 2026-07-16

### 💬 Yorum/Entry Giriş Uyarısı Güncellemesi (`add-entry-login-notice-update`)
1. **Misafir Kullanıcı Giriş Paneli Metni ve Buton Yönlendirmeleri Güncellendi**
   * **Açıklama:** Yorum girmek isteyen misafir kullanıcılara gösterilen giriş/kayıt uyarısındaki "vızıldamak" ifadesi "entry girmek" olarak sadeleştirildi ve yazar alımlarının başladığına dair aciliyet uyarısı eklendi.
   * **Kod Referansı:** [AddEntryForm.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/AddEntryForm.tsx)

---

## [1.7.9] - 2026-07-16

### 📢 Giriş Bannerı Tanıtım Metni Güncellemesi (`intro-banner-text-update`)
1. **Kaydolmaya Yönlendiren Acil Tanıtım Metni Entegre Edildi**
   * **Açıklama:** Ana sayfadaki karşılama bannerı metni, kullanıcıyı daha hızlı kayıt olmaya teşvik edecek, yazar alımlarının başladığı ve kapıların kapanmak üzere olduğu hissini uyandıracak bir Call-to-Action metni ile güncellendi.
   * **Kod Referansı:** [IntroBanner.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/IntroBanner.tsx)

---

## [1.7.8] - 2026-07-15

### 🔗 Entry İçi Link Kısaltma ve Kelime Bölme Düzeltmesi (`link-truncation-and-wrapping-fix`)
1. **Çirkin Harf Bölünmeleri Engellendi ve break-words CSS Yapısına Geçildi**
   * **Açıklama:** Entry içerisine eklenen normal bağlantıların (URL) satır sonlarında harf harf bölünerek (break-all) çirkin şekilde tek karakterlerin alt satıra düşmesi engellendi. CSS yapısı `break-words` olarak güncellendi.
   * **Kod Referansı:** [MentionText.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/MentionText.tsx)
2. **Uzun Linkler İçin Otomatik Şık Kısaltma (Truncation) Eklendi**
   * **Açıklama:** `truncateUrl` adında yeni bir istemci tarafı yardımcısı eklendi. Gözü yoran uzun URL'lerin şema (`https://`) ve `www.` bölümleri temizlendi ve 50 karakterden uzun linkler `alanadi.com/yol-baslangici...` şeklinde estetik olarak kısaltıldı.
   * **Kod Referansı:** [MentionText.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/MentionText.tsx)

---

## [1.7.7] - 2026-07-12

### 🔔 Bildirim Nokta Atışı Yönlendirme Düzeltmesi (`notification-page-anchoring-fix`)
1. **Beğeni, Bahsedilme ve Yorum Bildirimlerinde Sayfa Parametresi Entegre Edildi**
   * **Açıklama:** Kullanıcıların aldığı bildirimlere tıklandığında, ilgili entry eğer konunun 2. veya daha sonraki sayfalarında ise doğrudan doğru sayfaya (`?p=X#entry-Y`) nokta atışı gitmesini engelleyen hata giderildi. Bildirimler oluşturulurken entry'nin konudaki sırasına (createdAt rank) göre sayfa sayısı hesaplanıp linke otomatik olarak eklendi.
   * **Kod Referansı:** [actions.ts](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/actions.ts) (`createEntryAction`, `likeEntryAction`, `createPozKesAction`)

---

## [1.7.6] - 2026-07-12

### 💀 Eğlenceli Yükleme İkonları: İskelet Kafalı Dönen Yükleyiciler (`skull-loading-spinners`)
1. **İskelet Ekranlara Dönen Kurukafa İkonları Eklendi**
   * **Açıklama:** Kullanıcının talebi doğrultusunda, sayfa iskeletlerinin (yer tutucuların) uygun noktalarına neon yeşil dönen halka ortasında kurukafa (`💀`) loading animasyonları yerleştirildi.
   * **Kod Referansı:** [loading.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/baslik/loading.tsx) (Başlık), [loading.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/yazar/loading.tsx) (Yazar), [loading.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/pozkes/loading.tsx) (PozKes)

---

## [1.7.5] - 2026-07-12

### 🚀 Next.js Önbellek & İskelet Yükleyici Yönlendirme Düzeltmeleri (`loading-boundary-routing-fix`)
1. **Yükleyici İskelet Kodlarının Ön Yükleme (Prefetch) Özelliği Etkinleştirildi**
   * **Açıklama:** Sitedeki tüm önemli başlık ve yazar yönlendirme linklerindeki `prefetch={false}` özellikleri kaldırıldı. Next.js artık arka planda statik iskelet bileşeni kodlarını (`loading.tsx`) önden yüklüyor. Böylece bir linke tıklandığı an iskelet ekran **0. milisaniyede anında** ekrana geliyor.
   * **Kod Referansı:** [SidebarContent.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/components/SidebarContent.tsx), [[tab]/page.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/[tab]/page.tsx)
2. **Yükleyici Dizin Mimarisi Düzeltildi**
   * **Açıklama:** Dinamik alt dizinlerdeki (`[slug]` ve `[username]`) yükleyiciler, yan yönlendirmeler sırasında tetiklenmediği için üst dizinlere taşındı (`src/app/baslik/loading.tsx` ve `src/app/yazar/loading.tsx`). Genel dönen sinek animasyonu ise sadece ana sayfa tabları için `src/app/[tab]/loading.tsx` konumuna taşındı.
   * **Kod Referansı:** `src/app/baslik/loading.tsx`, `src/app/yazar/loading.tsx`, `src/app/[tab]/loading.tsx`

---

## [1.7.3] - 2026-07-11

### 🚀 Google Arama SEO Sadeleştirmesi & Küresel Marka Başlığı Güncellemesi
1. **Küresel Marka Adı "sözlükzzz" Olarak Güncellendi (`seo-brand-title-cleanup`)**
   * **Açıklama:** Google'ın marka adını ana sayfa başlığından belirlemesi ve tüm arama sonuçlarında (başlıklarda da) "vızzz!" ekini göstermesi nedeniyle, `layout.tsx` üzerindeki varsayılan başlık "sözlükzzz" olarak sadeleştirildi. Böylece arama motorlarındaki başlıklar "sahte satılık ev ilanıyla kapora dolandırıcılığı - sözlükzzz" şeklinde son derece temiz ve kurumsal görünecek.
   * **Kod Referansı:** [layout.tsx](file:///C:/Users/DO%C4%9EU/Desktop/sozlukzzz/src/app/layout.tsx)

---

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
