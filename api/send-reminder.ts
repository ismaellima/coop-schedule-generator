import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Test email for development
const TEST_EMAIL = 'ismaeldf@gmail.com';

interface ReminderRequest {
  memberName: string;
  memberEmail: string;
  task: string;
  date: string;
  testMode?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { memberName, memberEmail, task, date, testMode } = req.body as ReminderRequest;

    // In test mode, always send to test email
    const toEmail = testMode ? TEST_EMAIL : memberEmail;

    const { data, error } = await resend.emails.send({
      from: 'Comité d\'entretien <onboarding@resend.dev>',
      to: toEmail,
      subject: `Rappel: Ménage ce samedi ${date}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Rappel de ménage</h2>
          <p>Bonjour ${memberName},</p>
          <p>Ceci est un rappel que vous êtes assigné(e) au ménage ce <strong>samedi ${date}</strong>.</p>
          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Votre tâche:</p>
            <p style="margin: 8px 0 0 0; font-size: 18px;">${task}</p>
          </div>
          <p>Merci de votre collaboration!</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #666; font-size: 12px;">
            Coop au pied de la montagne — Comité d'entretien
          </p>
          ${testMode ? '<p style="color: #f97316; font-size: 12px;"><strong>MODE TEST</strong> - Cet email a été envoyé à l\'adresse de test.</p>' : ''}
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id, sentTo: toEmail });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
