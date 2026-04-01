import type { Member, SavedSchedule, Floor } from "../lib/types";

const MONTH_MAP: Record<string, number> = {
  "janvier": 0, "février": 1, "fevrier": 1, "mars": 2, "avril": 3,
  "mai": 4, "juin": 5, "juillet": 6, "août": 7, "aout": 7,
  "septembre": 8, "octobre": 9, "novembre": 10, "décembre": 11, "decembre": 11,
};

const SLOT_LABELS: Record<string, string> = {
  balayeuseSousSol: "Balayeuse – Sous-sol",
  balayeuseRezDeChaussee: "Balayeuse – Rez-de-chaussée",
  balayeuse1erEtage: "Balayeuse – 1er étage",
  vadrouilleAvant: "Vadrouille avant",
  vadrouilleArriere: "Vadrouille arrière",
};

const FLOOR_LABEL: Record<Floor, string> = {
  "sous-sol": "Sous-sol",
  "rez-de-chaussee": "Rez-de-chaussée",
  "1er-etage": "1er étage",
};

function parseFrenchDate(dateStr: string, year: number): Date | null {
  const parts = dateStr.trim().split(/[\s\u00a0\u202f]+/);
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTH_MAP[parts[1].toLowerCase()];
  if (isNaN(day) || month === undefined) return null;
  return new Date(year, month, day);
}

interface UpcomingTask {
  date: string;
  parsedDate: Date;
  taskLabel: string;
  scheduleTitle: string;
}

function getUpcomingTasks(member: Member, schedules: SavedSchedule[]): UpcomingTask[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tasks: UpcomingTask[] = [];

  for (const schedule of schedules) {
    const year = new Date(schedule.createdAt).getFullYear();
    for (const week of schedule.weeks) {
      const parsedDate = parseFrenchDate(week.date, year);
      if (!parsedDate || parsedDate < today) continue;

      const slots: { key: string; value: string }[] = [
        { key: "balayeuseSousSol", value: week.balayeuseSousSol },
        { key: "balayeuseRezDeChaussee", value: week.balayeuseRezDeChaussee },
        { key: "balayeuse1erEtage", value: week.balayeuse1erEtage },
        { key: "vadrouilleAvant", value: week.vadrouilleAvant },
        { key: "vadrouilleArriere", value: week.vadrouilleArriere },
      ];

      for (const { key, value } of slots) {
        if (value === member.name) {
          tasks.push({
            date: week.date,
            parsedDate,
            taskLabel: SLOT_LABELS[key],
            scheduleTitle: schedule.title,
          });
        }
      }
    }
  }

  return tasks.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
}

interface Props {
  member: Member;
  allMembers: Member[];
  schedules: SavedSchedule[];
  isAdmin: boolean;
  onEdit: () => void;
  onClose: () => void;
}

export function MemberDetailModal({ member, allMembers, schedules, isAdmin, onEdit, onClose }: Props) {
  const upcomingTasks = getUpcomingTasks(member, schedules);
  const pairedMember = member.pairedWith ? allMembers.find((m) => m.id === member.pairedWith) : null;
  const floor = (member.floorRestrictions[0] || "rez-de-chaussee") as Floor;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              {!member.active && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactif</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{member.email || "Aucun courriel"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-orange-500 border border-gray-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Modifier
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Étage</p>
              <p className="text-sm font-medium text-gray-800">{FLOOR_LABEL[floor]}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Mobilité</p>
              <p className="text-sm font-medium text-gray-800">
                {member.roleRestrictions.length > 0 ? "Réduite" : "Normale"}
              </p>
            </div>
            {pairedMember && (
              <div className="bg-orange-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-orange-400 mb-1">Jumelé avec</p>
                <p className="text-sm font-medium text-orange-700">{pairedMember.name}</p>
              </div>
            )}
          </div>

          {/* Upcoming tasks */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Tâches à venir ({upcomingTasks.length})
            </h4>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune tâche à venir</p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{task.taskLabel}</p>
                      <p className="text-xs text-gray-400 truncate">{task.scheduleTitle}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg flex-shrink-0 capitalize">
                      {task.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
