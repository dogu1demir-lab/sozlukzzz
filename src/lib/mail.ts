import nodemailer from "nodemailer";

// Create nodemailer transporter using Güzel Hosting SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.guzel.net.tr",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "yonetim@sozlukzzz.tr",
    pass: process.env.SMTP_PASS || "q3t2bi2K1I",
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

/**
 * Sends a password reset email using a beautifully designed HTML template.
 */
export async function sendPasswordResetEmail(to: string, username: string, resetLink: string) {
  const mailOptions = {
    from: `"sözlükzzz" <${process.env.SMTP_USER || "yonetim@sozlukzzz.tr"}>`,
    to,
    subject: "sözlükzzz - Şifre Sıfırlama Talebi 🪰",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>sözlükzzz - Şifre Sıfırlama</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #090d16;
            color: #e2e8f0;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          }
          .logo {
            font-size: 32px;
            text-align: center;
            margin-bottom: 24px;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            text-align: center;
            margin-bottom: 16px;
          }
          .highlight {
            color: #84cc16; /* Lime-500 */
          }
          .text {
            font-size: 14px;
            line-height: 24px;
            color: #94a3b8;
            margin-bottom: 24px;
            text-align: center;
          }
          .btn-container {
            text-align: center;
            margin-bottom: 24px;
          }
          .btn {
            display: inline-block;
            background-color: #84cc16;
            color: #020617 !important;
            font-weight: 800;
            font-size: 14px;
            padding: 12px 32px;
            border-radius: 9999px;
            text-decoration: none;
            box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
            transition: all 0.2s ease;
          }
          .btn:hover {
            background-color: #a3e635;
          }
          .footer {
            font-size: 11px;
            color: #475569;
            text-align: center;
            border-top: 1px solid #1e293b;
            padding-top: 16px;
            margin-top: 24px;
          }
          .warning {
            font-size: 12px;
            color: #64748b;
            background-color: rgba(254, 240, 138, 0.05);
            border: 1px solid rgba(254, 240, 138, 0.1);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🪰</div>
          <h1 class="title">sözlükzzz'de <span class="highlight">şifre sıfırlama</span></h1>
          
          <p class="text">
            Merhaba <strong>@${username}</strong>,<br>
            sözlükzzz hesabının şifresini sıfırlamak için bir talepte bulundun zzz. Aşağıdaki butona tıklayarak şifreni yenileyebilirsin.
          </p>
          
          <div class="btn-container">
            <a href="${resetLink}" class="btn" target="_blank">Şifremi Sıfırla</a>
          </div>
          
          <div class="warning">
            <strong>Not:</strong> Bu link 1 saat boyunca geçerlidir. Şifre sıfırlama talebinde bulunmadıysanız bu e-postayı güvenle yok sayabilirsiniz.
          </div>
          
          <div class="footer">
            sözlükzzz • fikirlerini özgürce vızıldat zzz.<br>
            Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Sends a welcome email to a new user.
 */
export async function sendWelcomeEmail(to: string, username: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sozlukzzz.tr";
  const mailOptions = {
    from: `"sözlükzzz" <${process.env.SMTP_USER || "yonetim@sozlukzzz.tr"}>`,
    to,
    subject: "sözlükzzz'e hoş geldin! 🪰",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>sözlükzzz'e Hoş Geldin</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #090d16;
            color: #e2e8f0;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
          }
          .container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          }
          .logo {
            font-size: 32px;
            text-align: center;
            margin-bottom: 24px;
          }
          .title {
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            text-align: center;
            margin-bottom: 16px;
          }
          .highlight {
            color: #84cc16; /* Lime-500 */
          }
          .text {
            font-size: 14px;
            line-height: 24px;
            color: #94a3b8;
            margin-bottom: 24px;
            text-align: center;
          }
          .rank-box {
            background-color: rgba(132, 204, 22, 0.05);
            border: 1px dashed rgba(132, 204, 22, 0.2);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #cbd5e1;
            text-align: left;
            line-height: 20px;
          }
          .btn-container {
            text-align: center;
            margin-bottom: 24px;
          }
          .btn {
            display: inline-block;
            background-color: #84cc16;
            color: #020617 !important;
            font-weight: 800;
            font-size: 14px;
            padding: 12px 32px;
            border-radius: 9999px;
            text-decoration: none;
            box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
          }
          .footer {
            font-size: 11px;
            color: #475569;
            text-align: center;
            border-top: 1px solid #1e293b;
            padding-top: 16px;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🪰</div>
          <h1 class="title">aramıza <span class="highlight">hoş geldin!</span></h1>
          
          <p class="text">
            Merhaba <strong>@${username}</strong>,<br>
            sözlükzzz ailesine başarıyla katıldın zzz! Fikirlerini, yorumlarını ve vızıltılarını özgürce paylaşmaya hemen başlayabilirsin.
          </p>
          
          <div class="rank-box">
            <strong>🥚 Sinek Rütben: Sinek Yumurtası</strong><br>
            Şu an rütben en başlangıç seviyesinde. Vızıltı (entry) girdikçe, yorum yaptıkça ve beğeniler kazandıkça sineğin yumurtadan çıkıp büyüyecek ve <strong>Sonsuz Vızıltı</strong> rütbesine kadar yükselecektir!<br><br>
            <strong>📈 Puan Formülü:</strong><br>
            • Entry Girişi: <strong>+10 Puan</strong><br>
            • Yorum Yapma: <strong>+5 Puan</strong><br>
            • Beğeni Kazanma: <strong>+3 Puan</strong>
          </div>
          
          <div class="btn-container">
            <a href="${appUrl}" class="btn" target="_blank">Vızıldamaya Başla!</a>
          </div>
          
          <div class="footer">
            sözlükzzz • fikirlerini özgürce vızıldat zzz.<br>
            Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}
