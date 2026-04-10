/**
 * Service de notification email via Resend.
 * https://resend.com
 */

/** Escape HTML special characters to prevent injection in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Validate URL protocol (only http/https allowed) */
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
    return '#';
  } catch {
    return '#';
  }
}

export interface NotifyParams {
  journalistName: string;
  paperType: string;
  title: string;
  hebdoNumber: string;
  driveFolderUrl: string;
  signCount: number;
}

export async function notifyDelivery(params: NotifyParams) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'RS Hebdo <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — email notification skipped');
    return;
  }

  const recipients = [
    process.env.NOTIFY_EMAIL_ALMA,
    process.env.NOTIFY_EMAIL_DENIS,
  ].filter(Boolean) as string[];

  if (recipients.length === 0) {
    console.warn('No notification recipients configured');
    return;
  }

  const safeJournalist = escapeHtml(params.journalistName);
  const safePaperType = escapeHtml(params.paperType);
  const safeTitle = escapeHtml(params.title);
  const safeHebdo = escapeHtml(params.hebdoNumber);
  const safeFolderUrl = sanitizeUrl(params.driveFolderUrl);

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
            <td style="padding: 8px 0; color: #555;">${safeJournalist}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Type de papier</td>
            <td style="padding: 8px 0; color: #555;">${safePaperType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Titre</td>
            <td style="padding: 8px 0; color: #555;">${safeTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Hebdo</td>
            <td style="padding: 8px 0; color: #555;">${safeHebdo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">Signes</td>
            <td style="padding: 8px 0; color: #555;">${params.signCount.toLocaleString('fr-FR')}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${safeFolderUrl}"
             style="display: inline-block; background: #E50914; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Ouvrir dans Dropbox
          </a>
        </div>
      </div>

      <div style="padding: 12px; text-align: center; color: #999; font-size: 12px;">
        RS Hebdo Delivery Platform
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject: `[${safeHebdo}] ${safePaperType} — ${safeTitle} (${safeJournalist})`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return;
    }

    console.log(`Notification sent for: ${params.title}`);
  } catch (error) {
    console.error('Failed to send notification email:', error);
    // Don't throw - delivery shouldn't fail because of email
  }
}
