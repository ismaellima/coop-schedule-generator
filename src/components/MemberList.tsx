import type { Member, Floor } from "../lib/types";
import { ALL_FLOORS } from "../lib/types";

interface Props {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

const FLOOR_DOT_COLOR: Record<Floor, string> = {
  "sous-sol": "bg-teal-500",
  "rez-de-chaussee": "bg-green-500",
  "1er-etage": "bg-orange-500",
};

const FLOOR_BADGE_STYLE: Record<Floor, string> = {
  "sous-sol": "bg-teal-100 text-teal-800",
  "rez-de-chaussee": "bg-green-100 text-green-800",
  "1er-etage": "bg-orange-100 text-orange-800",
};

const FLOOR_SHORT: Record<Floor, string> = {
  "sous-sol": "Sous-sol",
  "rez-de-chaussee": "Rez-de-chaussée",
  "1er-etage": "1er étage",
};

function getAssignedFloor(m: Member): Floor {
  if (m.floorRestrictions.length === 1) return m.floorRestrictions[0];
  if (m.floorRestrictions.length > 1) return m.floorRestrictions[0];
  return "rez-de-chaussee"; // default group for unrestricted members
}

function PersonIcon() {
  return (
    <svg className="w-8 h-8 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MemberList({ members, onEdit, onDelete, isAdmin = false }: Props) {
  if (members.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-lg">Aucun membre ajouté.</p>
      </div>
    );
  }

  // Group members by their primary floor
  const grouped: Record<Floor, Member[]> = {
    "sous-sol": [],
    "rez-de-chaussee": [],
    "1er-etage": [],
  };
  for (const m of members) {
    grouped[getAssignedFloor(m)].push(m);
  }

  return (
    <div className="space-y-8">
      {ALL_FLOORS.map((floor) => {
        const group = grouped[floor];
        if (group.length === 0) return null;
        return (
          <div key={floor}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${FLOOR_DOT_COLOR[floor]}`} />
              <span className="font-semibold text-gray-700">{FLOOR_SHORT[floor]}</span>
              <span className="text-gray-400">({group.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.map((m) => {
                const hasPair = !!m.pairedWith;
                const hasReducedMobility = m.roleRestrictions.length > 0;
                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 ${
                      hasPair ? "border-l-4 border-l-orange-400" : ""
                    } ${!m.active ? "opacity-50" : ""}`}
                  >
                    <PersonIcon />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 truncate">{m.name}</span>
                        {hasReducedMobility && (
                          <span className="text-orange-500" title="A des restrictions">
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FLOOR_BADGE_STYLE[getAssignedFloor(m)]}`}>
                          {FLOOR_SHORT[getAssignedFloor(m)]}
                        </span>
                        <span className="text-xs text-gray-400">0 tâches assignées</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 text-gray-400">
                        <button onClick={() => onEdit(m)} className="hover:text-gray-600 transition-colors" title="Modifier">
                          <EditIcon />
                        </button>
                        <button onClick={() => onDelete(m.id)} className="hover:text-red-500 transition-colors" title="Supprimer">
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
