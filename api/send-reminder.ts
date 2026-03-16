import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

    const info = await transporter.sendMail({
      from: `Comité d'entretien <${process.env.GMAIL_USER}>`,
      replyTo: 'entretiencoopmontagne@gmail.com',
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
          <table style="border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle; padding-right: 14px;">
                <img src="https://coop-schedule-generator.vercel.app/coop-building.png" alt="Coop au pied de la montagne" style="height: 52px; width: 52px; object-fit: cover; border-radius: 8px; display: block;" />
              </td>
              <td style="vertical-align: middle; padding-right: 14px;">
                <div style="width: 2px; height: 44px; background-color: #f97316; border-radius: 2px;"></div>
              </td>
              <td style="vertical-align: middle;">
                <div style="font-weight: 700; font-size: 14px; color: #1a1a1a; margin-bottom: 3px;">Coop au pied de la montagne</div>
                <div style="font-size: 12px; color: #888;">Comité d'entretien</div>
              </td>
            </tr>
          </table>
          ${testMode ? '<p style="color: #f97316; font-size: 12px;"><strong>MODE TEST</strong> - Cet email a été envoyé à l\'adresse de test.</p>' : ''}
        </div>
      `,
    });

    return res.status(200).json({ success: true, id: info.messageId, sentTo: toEmail });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
