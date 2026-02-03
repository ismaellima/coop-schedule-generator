import type { WeekAssignment } from "../lib/types";

interface Props {
  title: string;
  weeks: WeekAssignment[];
}

const FLOOR_KEYS = ["sous-sol", "rez-de-chaussee", "1er-etage"] as const;

const FLOOR_LABELS_SHORT: Record<string, string[]> = {
  "sous-sol": ["Sous-sol"],
  "rez-de-chaussee": ["Rez de chaussée &", "vitres de l'entrée"],
  "1er-etage": ["1er étage"],
};

const BALAYEUSE_KEY: Record<string, keyof WeekAssignment> = {
  "sous-sol": "balayeuseSousSol",
  "rez-de-chaussee": "balayeuseRezDeChaussee",
  "1er-etage": "balayeuse1erEtage",
};

export function ScheduleTable({ title, weeks }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b-2 border-orange-400">
        <h2 className="text-xl font-bold text-center text-gray-900">Horaire de ménage</h2>
        <p className="text-center text-gray-500 mt-1">{title}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-b border-r border-gray-300 px-3 py-3 text-center font-semibold text-gray-700 w-[12%]">
                Date
              </th>
              <th className="border-b border-r border-gray-300 px-3 py-3 text-center font-semibold text-gray-700 w-[22%]">
                Étage
              </th>
              <th className="border-b border-r border-gray-300 px-3 py-3 text-center font-semibold text-gray-700 w-[24%]">
                Balayeuse
              </th>
              <th className="border-b border-r border-gray-300 px-3 py-3 text-center font-semibold text-gray-700 w-[21%]">
                Vadrouille avant
              </th>
              <th className="border-b border-gray-300 px-3 py-3 text-center font-semibold text-gray-700 w-[21%]">
                Vadrouille arrière
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => {
              const isLastWeek = wi === weeks.length - 1;
              return FLOOR_KEYS.map((floor, fi) => {
                const isLastFloor = fi === FLOOR_KEYS.length - 1;
                return (
                  <tr
                    key={`${wi}-${fi}`}
                    className={`${!isLastFloor ? "border-b border-gray-100" : !isLastWeek ? "border-b border-gray-300" : ""}`}
                  >
                    {/* Date - merged cell */}
                    {fi === 0 && (
                      <td
                        className={`border-r border-gray-200 px-3 py-2 text-center align-middle font-semibold text-gray-900 ${!isLastWeek ? "border-b border-gray-300" : ""}`}
                        rowSpan={3}
                      >
                        {week.date}
                      </td>
                    )}

                    {/* Floor */}
                    <td className="border-r border-gray-200 px-3 py-1.5 text-gray-600">
                      {FLOOR_LABELS_SHORT[floor].map((line, i) => (
                        <div key={i} className="text-xs leading-tight">
                          {line}
                        </div>
                      ))}
                    </td>

                    {/* Balayeuse */}
                    <td className="border-r border-gray-200 px-3 py-1.5 text-center text-gray-900">
                      {week[BALAYEUSE_KEY[floor]]}
                    </td>

                    {/* Vadrouille avant - merged cell */}
                    {fi === 0 && (
                      <td
                        className={`border-r border-gray-200 px-3 py-2 text-center align-middle text-gray-900 ${!isLastWeek ? "border-b border-gray-300" : ""}`}
                        rowSpan={3}
                      >
                        {week.vadrouilleAvant}
                      </td>
                    )}

                    {/* Vadrouille arrière - merged cell */}
                    {fi === 0 && (
                      <td
                        className={`px-3 py-2 text-center align-middle text-gray-900 ${!isLastWeek ? "border-b border-gray-300" : ""}`}
                        rowSpan={3}
                      >
                        {week.vadrouilleArriere}
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
