import type { Member, WeekAssignment, Floor, Role } from "./types";

interface SlotDef {
  role: Role;
  floor: Floor | null; // null means all floors (vadrouille)
}

const SLOTS: { key: keyof Omit<WeekAssignment, "date">; def: SlotDef }[] = [
  { key: "balayeuseSousSol", def: { role: "balayeuse", floor: "sous-sol" } },
  { key: "balayeuseRezDeChaussee", def: { role: "balayeuse", floor: "rez-de-chaussee" } },
  { key: "balayeuse1erEtage", def: { role: "balayeuse", floor: "1er-etage" } },
  { key: "vadrouilleAvant", def: { role: "vadrouille-avant", floor: null } },
  { key: "vadrouilleArriere", def: { role: "vadrouille-arriere", floor: null } },
];

function hasReducedMobility(member: Member): boolean {
  return member.roleRestrictions.length > 0;
}

function canFillSlot(member: Member, slot: SlotDef): boolean {
  // Reduced mobility members can only do their allowed roles
  if (hasReducedMobility(member) && !member.roleRestrictions.includes(slot.role)) {
    return false;
  }

  // Balayeuse: members can ONLY clean their own floor
  if (slot.floor) {
    if (!member.floorRestrictions.includes(slot.floor)) {
      return false;
    }
  }

  // Vadrouille: only non-reduced-mobility members can do it (requires all floors)
  if (!slot.floor && hasReducedMobility(member)) {
    return false;
  }

  return true;
}

function getWeekDates(startMonth: number, startYear: number, endMonth: number, endYear: number, dayOfWeek: number): Date[] {
  const start = new Date(startYear, startMonth, 1);
  const end = new Date(endYear, endMonth + 1, 0);

  const first = new Date(start);
  while (first.getDay() !== dayOfWeek) {
    first.setDate(first.getDate() + 1);
  }

  const dates: Date[] = [];
  const current = new Date(first);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
}

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function generateSchedule(
  members: Member[],
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  dayOfWeek: number,
  initialCounts: Record<string, number> = {}
): { schedule: WeekAssignment[]; title: string; assignmentCounts: Record<string, number> } {
  const active = members.filter((m) => m.active);
  const dates = getWeekDates(startMonth, startYear, endMonth, endYear, dayOfWeek);

  // Start with historical counts, defaulting to 0 for members without history
  const assignmentCount: Record<string, number> = {};
  active.forEach((m) => (assignmentCount[m.id] = initialCounts[m.id] ?? 0));

  const weeks: WeekAssignment[] = [];

  for (const date of dates) {
    const assigned = new Set<string>();
    const week: Record<string, string> = { date: formatDate(date) };

    // Collect pairs (deduplicated)
    const pairedSets: Member[][] = [];
    const seenPairs = new Set<string>();
    for (const m of active) {
      if (m.pairedWith && !seenPairs.has(m.id)) {
        const partner = active.find((p) => p.id === m.pairedWith);
        if (partner) {
          seenPairs.add(m.id);
          seenPairs.add(partner.id);
          pairedSets.push([m, partner]);
        }
      }
    }

    // Sort slots: most constrained first (fewest eligible candidates)
    const slotOrder = [...SLOTS].sort((a, b) => {
      const aCandidates = active.filter((m) => canFillSlot(m, a.def)).length;
      const bCandidates = active.filter((m) => canFillSlot(m, b.def)).length;
      return aCandidates - bCandidates;
    });

    for (const { key, def } of slotOrder) {
      let candidates = active.filter(
        (m) => !assigned.has(m.id) && canFillSlot(m, def)
      );

      // If a paired member is already assigned, prioritize their partner
      for (const pair of pairedSets) {
        const [a, b] = pair;
        if (assigned.has(a.id) && !assigned.has(b.id) && candidates.some((c) => c.id === b.id)) {
          candidates = [b];
          break;
        }
        if (assigned.has(b.id) && !assigned.has(a.id) && candidates.some((c) => c.id === a.id)) {
          candidates = [a];
          break;
        }
      }

      // Sort: least assigned first
      candidates.sort((a, b) => {
        return assignmentCount[a.id] - assignmentCount[b.id];
      });

      if (candidates.length > 0) {
        const minCount = assignmentCount[candidates[0].id];
        const topCandidates = candidates.filter((c) => assignmentCount[c.id] === minCount);

        // Prefer paired members who need their partner assigned too
        const pairedCandidate = topCandidates.find((c) => {
          if (!c.pairedWith) return false;
          return !assigned.has(c.pairedWith) && !assigned.has(c.id);
        });

        const chosen = pairedCandidate || topCandidates[0];
        if (chosen) {
          week[key] = chosen.name;
          assigned.add(chosen.id);
          assignmentCount[chosen.id]++;
        } else {
          week[key] = "—";
        }
      } else {
        week[key] = "—";
      }
    }

    // Ensure paired members are both assigned
    for (const pair of pairedSets) {
      const [a, b] = pair;
      if (assigned.has(a.id) !== assigned.has(b.id)) {
        const missing = assigned.has(a.id) ? b : a;
        const present = assigned.has(a.id) ? a : b;

        for (const { key, def } of slotOrder) {
          const currentName = week[key];
          const currentMember = active.find((m) => m.name === currentName);
          if (
            currentMember &&
            !currentMember.pairedWith &&
            currentMember.id !== present.id &&
            canFillSlot(missing, def)
          ) {
            week[key] = missing.name;
            assigned.delete(currentMember.id);
            assigned.add(missing.id);
            assignmentCount[currentMember.id]--;
            assignmentCount[missing.id]++;
            break;
          }
        }
      }
    }

    weeks.push(week as unknown as WeekAssignment);
  }

  const titleStart = MONTH_NAMES_FR[startMonth];
  const titleEnd = MONTH_NAMES_FR[endMonth];
  const yearStr = startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;
  const title = `${titleStart} - ${titleEnd} ${yearStr}`;

  return { schedule: weeks, title, assignmentCounts: assignmentCount };
}
