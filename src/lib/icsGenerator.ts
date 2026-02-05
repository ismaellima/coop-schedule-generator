// ICS Calendar file generator
import type { WeekAssignment } from "./types";

interface CalendarEvent {
  date: string; // e.g., "7 février"
  task: string; // e.g., "Balayeuse - Sous-sol"
  year: number;
}

// Map French month names to month numbers (0-indexed)
const MONTH_MAP: Record<string, number> = {
  "janvier": 0,
  "février": 1,
  "fevrier": 1,
  "mars": 2,
  "avril": 3,
  "mai": 4,
  "juin": 5,
  "juillet": 6,
  "août": 7,
  "aout": 7,
  "septembre": 8,
  "octobre": 9,
  "novembre": 10,
  "décembre": 11,
  "decembre": 11,
};

function parseDate(dateStr: string, defaultYear: number): Date | null {
  // Parse dates like "7 février" or "14 mars"
  const match = dateStr.toLowerCase().match(/(\d+)\s+(\w+)/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthName = match[2];
  const month = MONTH_MAP[monthName];

  if (month === undefined) return null;

  return new Date(defaultYear, month, day);
}

function formatICSDate(date: Date): string {
  // Format as YYYYMMDD for all-day events
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@coop-montagne`;
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function getMemberTasks(
  memberName: string,
  weeks: WeekAssignment[]
): CalendarEvent[] {
  const tasks: CalendarEvent[] = [];
  const currentYear = new Date().getFullYear();

  for (const week of weeks) {
    // Check each role
    if (week.balayeuseSousSol === memberName) {
      tasks.push({ date: week.date, task: "Balayeuse - Sous-sol", year: currentYear });
    }
    if (week.balayeuseRezDeChaussee === memberName) {
      tasks.push({ date: week.date, task: "Balayeuse - Rez-de-chaussée", year: currentYear });
    }
    if (week.balayeuse1erEtage === memberName) {
      tasks.push({ date: week.date, task: "Balayeuse - 1er étage", year: currentYear });
    }
    if (week.vadrouilleAvant === memberName) {
      tasks.push({ date: week.date, task: "Vadrouille avant (tous les étages)", year: currentYear });
    }
    if (week.vadrouilleArriere === memberName) {
      tasks.push({ date: week.date, task: "Vadrouille arrière (tous les étages)", year: currentYear });
    }
  }

  return tasks;
}

export function generateICS(memberName: string, tasks: CalendarEvent[]): string {
  const events = tasks
    .map((task) => {
      const date = parseDate(task.date, task.year);
      if (!date) return null;

      const dateStr = formatICSDate(date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = formatICSDate(nextDay);

      return `BEGIN:VEVENT
UID:${generateUID()}
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

export function generateICSDataUrl(memberName: string, tasks: CalendarEvent[]): string {
  const icsContent = generateICS(memberName, tasks);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
}
