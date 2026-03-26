import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface NotifyParams {
  journalistName: string;
  paperType: string;
  title: string;
  hebdoNumber: string;
  driveFolderUrl: string;
  signCount: number;
}

export async function notifyDelivery(params: NotifyParams) {
  const recipients = [
    process.env.NOTIFY_EMAIL_ALMA,
    process.env.NOTIFY_EMAIL_DENIS,
  ].filter(Boolean).join(', ');

  if (!recipients) {
    console.warn('No notification recipients configured');
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #E50914; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Rolling Stone Hebdo</h1>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Nouveau papier livr&eacute;</p>
      </div>

      <div style="padding: 24px; background: #f9f9f9;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333; width: 140px;">Journaliste</td>
            <td style="padding: 8px 0; color: #555;">${params.journalistName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Type de papier</td>
            <td style="padding: 8px 0; color: #555;">${params.paperType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Titre</td>
            <td style="padding: 8px 0; color: #555;">${params.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Hebdo</td>
            <td style="padding: 8px 0; color: #555;">${params.hebdoNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Signes</td>
            <td style="padding: 8px 0; color: #555;">${params.signCount.toLocaleString('fr-FR')}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${params.driveFolderUrl}"
             style="display: inline-block; background: #E50914; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Ouvrir dans Google Drive
          </a>
        </div>
      </div>

      <div style="padding: 12px; text-align: center; color: #999; font-size: 12px;">
        RS Hebdo Delivery Platform
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"RS Hebdo" <${process.env.SMTP_USER}>`,
      to: recipients,
      subject: `[${params.hebdoNumber}] ${params.paperType} — ${params.title} (${params.journalistName})`,
      html,
    });
    console.log(`Notification sent for: ${params.title}`);
  } catch (error) {
    console.error('Failed to send notification email:', error);
    // Don't throw - delivery shouldn't fail because of email
  }
}
