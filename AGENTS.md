<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database Environment Rules

- **Development/Local Database**: The local `.env` points to a cloud Supabase PostgreSQL database. Running local DB commands (`prisma db push` etc.) updates the Supabase dev instance.
- **Production/Live Database**: The production site runs on a Hetzner server (`23.88.37.81`) and uses a local PostgreSQL instance running inside a Docker container (`127.0.0.1:5432`).
- **Schema Migrations**: When schema changes are made to `prisma/schema.prisma`, you **MUST** run `npx prisma db push` BOTH locally (for Supabase dev) and remotely on the Hetzner server (for production) using the SSH helper `scratch/ssh_exec.js`.


# Next.js App Router ve Arayüz Geliştirme Kuralları

- **Ön Yükleme (Prefetch) ve Hız Kuralı:** Sayfa geçişlerinde takılma ve donma (FPS düşüşü) yaşanmaması için `<Link>` bileşenlerinde `prefetch={false}` kullanılmamalıdır (Next.js varsayılan prefetch davranışına bırakılmalıdır). Next.js dinamik rotalarda veritabanı sorgularını tetiklemeden sadece statik yükleyici şablonunu (`loading.tsx`) önden yükler, bu da geçişlerin 0ms hissettirmesini sağlar.
- **Yükleyici Sınırları (Loading Boundaries):** Dinamik rota klasörlerinin içindeki yükleyiciler (`[slug]/loading.tsx` vb.) yan geçişlerde tetiklenmeyebilir. Bu nedenle yükleyici dosyaları her zaman parent (üst) klasörde (`baslik/loading.tsx`, `yazar/loading.tsx` gibi) tutulmalıdır.
- **Kurukafa ve Sinek Yükleyici Tasarımları:** Başlıklar, yazar profilleri ve PozKes yükleyicileri için gri iskelet çizgileriyle birlikte dönen neon halkalı Kurukafa (`💀`) animasyonu kullanılmalıdır. Ana sayfa sekmeleri (`[tab]`) için dönen sinek (`🪰`) animasyonu kullanılmalıdır.
- **Yazı İçi Link Tasarımı (MentionText):** Entry ve yorumların içine eklenen normal linklerde harf bölünmesi (single-character wrap) olmaması için `break-words` CSS sınıfı kullanılmalıdır. 50 karakterden uzun link metinleri `truncateUrl` fonksiyonu ile `alanadi.com/yol-baslangici...` şeklinde otomatik olarak kısaltılmalı, asıl `href` ise eksiksiz bırakılmalıdır.
- **Bildirim Nokta Atışı Yönlendirmeleri:** Beğeni, bahsedilme ve yorum bildirimleri oluşturulurken, ilgili entry'nin konudaki oluşturulma sırasına (createdAt rank) göre sayfa numarası hesaplanmalı ve `relatedUrl` değeri mutlaka `/baslik/slug?p=SAYFA#entry-ID` formatında kaydedilmelidir.


