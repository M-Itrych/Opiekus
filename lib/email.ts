import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  // W trybie deweloperskim (localhost) logujemy email zamiast wysyłać
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('=== EMAIL (Development Mode) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('===============================');
    return;
  }

  // Konfiguracja SMTP z zmiennych środowiskowych
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.dawid150.mikr.dev',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true dla portu 465, false dla innych
    auth: {
      user: process.env.SMTP_USER || 'dawid150',
      pass: process.env.SMTP_PASSWORD || 'h32N44gu3F',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Opiekus" <${process.env.SMTP_USER || 'dawid150'}@${process.env.SMTP_HOST || 'dawid150.mikr.dev'}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Nie udało się wysłać emaila');
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, userName?: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Resetowanie hasła</h1>
        </div>
        <p>Witaj${userName ? ` ${userName}` : ''},</p>
        <p>Otrzymaliśmy prośbę o resetowanie hasła do Twojego konta w systemie Opiekus.</p>
        <p>Kliknij poniższy przycisk, aby zresetować hasło:</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Resetuj hasło</a>
        </div>
        <p>Lub skopiuj i wklej poniższy link do przeglądarki:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p><strong>Link jest ważny przez 1 godzinę.</strong></p>
        <p>Jeśli nie prosiłeś o resetowanie hasła, zignoruj tę wiadomość.</p>
        <div class="footer">
          <p>To jest automatyczna wiadomość, prosimy nie odpowiadać na ten email.</p>
          <p>&copy; ${new Date().getFullYear()} Opiekus - System zarządzania przedszkolem</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Resetowanie hasła - Opiekus',
    html,
  });
}

