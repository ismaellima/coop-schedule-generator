import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Test email for development
const TEST_EMAIL = 'ismaeldf@gmail.com';

interface MemberSchedule {
  memberName: string;
  memberEmail: string;
  tasks: {
    date: string;
    task: string;
  }[];
}

interface ScheduleRequest {
  scheduleTitle: string;
  customMessage: string;
  members: MemberSchedule[];
  testMode?: boolean;
}

// ICS Generation functions
const MONTH_MAP: Record<string, number> = {
  "janvier": 0, "février": 1, "fevrier": 1, "mars": 2, "avril": 3,
  "mai": 4, "juin": 5, "juillet": 6, "août": 7, "aout": 7,
  "septembre": 8, "octobre": 9, "novembre": 10, "décembre": 11, "decembre": 11,
};

function parseDate(dateStr: string, defaultYear: number): Date | null {
  const match = dateStr.toLowerCase().match(/(\d+)\s+(\w+)/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = MONTH_MAP[match[2]];
  if (month === undefined) return null;
  return new Date(defaultYear, month, day);
}

function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function generateICS(memberName: string, tasks: { date: string; task: string }[]): string {
  const currentYear = new Date().getFullYear();
  const events = tasks
    .map((task, index) => {
      const date = parseDate(task.date, currentYear);
      if (!date) return null;
      const dateStr = formatICSDate(date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = formatICSDate(nextDay);
      const uid = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}@coop-montagne`;

      return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(new Date())}T000000Z
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${nextDayStr}
SUMMARY:${escapeICSText(`Ménage: ${task.task}`)}
DESCRIPTION:${escapeICSText(`Tâche de ménage pour ${memberName} - Coop au pied de la montagne`)}
LOCATION:Coop au pied de la montagne
STATUS:CONFIRMED
END:VEVENT`;
    })
    .filter(Boolean)
    .join("\n");

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Coop au pied de la montagne//Schedule Generator//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Horaire de ménage - ${memberName}
${events}
END:VCALENDAR`;
}

function formatTaskList(tasks: { date: string; task: string }[]): string {
  return tasks
    .map(t => `<li><strong>${t.date}</strong>: ${t.task}</li>`)
    .join('');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scheduleTitle, customMessage, members, testMode } = req.body as ScheduleRequest;

    const results: { memberName: string; success: boolean; error?: string }[] = [];

    for (const member of members) {
      // Skip members without email
      if (!member.memberEmail) {
        results.push({ memberName: member.memberName, success: false, error: 'Pas de courriel' });
        continue;
      }

      // Skip members without tasks
      if (member.tasks.length === 0) {
        continue; // Don't include in results - they just don't have tasks
      }

      const toEmail = testMode ? TEST_EMAIL : member.memberEmail;
      const icsContent = generateICS(member.memberName, member.tasks);
      const icsBuffer = Buffer.from(icsContent, 'utf-8');

      try {
        const { error } = await resend.emails.send({
          from: 'Comité d\'entretien <onboarding@resend.dev>',
          replyTo: 'entretiencoopmontagne@gmail.com',
          to: toEmail,
          subject: `Horaire de ménage - ${scheduleTitle}`,
          attachments: [
            {
              filename: `horaire-menage-${member.memberName.toLowerCase().replace(/\s+/g, '-')}.ics`,
              content: icsBuffer,
            },
          ],
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f97316;">Horaire de ménage - ${scheduleTitle}</h2>
              <p>Bonjour ${member.memberName},</p>

              ${customMessage ? `<p>${customMessage.replace(/\n/g, '<br>')}</p>` : ''}

              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold;">Vos tâches pour cette période:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  ${formatTaskList(member.tasks)}
                </ul>
              </div>

              <p style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 12px; margin: 20px 0;">
                <strong>📅 Fichier calendrier joint</strong><br>
                <span style="font-size: 14px; color: #666;">Ouvrez le fichier .ics joint pour ajouter vos tâches à votre calendrier (iPhone, Android, Google Calendar, Outlook).</span>
              </p>

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
          results.push({ memberName: member.memberName, success: false, error: error.message });
        } else {
          results.push({ memberName: member.memberName, success: true });
        }
      } catch (err) {
        results.push({ memberName: member.memberName, success: false, error: 'Erreur d\'envoi' });
      }

      // Small delay to avoid rate limiting
      if (!testMode) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      summary: { sent: successCount, failed: failCount },
      results,
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Failed to send emails' });
  }
}
