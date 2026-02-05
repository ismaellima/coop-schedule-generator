export type Floor = "sous-sol" | "rez-de-chaussee" | "1er-etage";
export type Role = "balayeuse" | "vadrouille-avant" | "vadrouille-arriere";

export const ALL_FLOORS: Floor[] = ["sous-sol", "rez-de-chaussee", "1er-etage"];
export const ALL_ROLES: Role[] = ["balayeuse", "vadrouille-avant", "vadrouille-arriere"];

export const FLOOR_LABELS: Record<Floor, string> = {
  "sous-sol": "Sous-sol",
  "rez-de-chaussee": "Rez-de-chaussée & vitres de l'entrée",
  "1er-etage": "1er étage",
};

export const ROLE_LABELS: Record<Role, string> = {
  balayeuse: "Balayeuse",
  "vadrouille-avant": "Vadrouille avant",
  "vadrouille-arriere": "Vadrouille arrière",
};

export interface Member {
  id: string;
  name: string;
  email: string;              // for sending reminders
  floorRestrictions: Floor[]; // if non-empty, can ONLY work these floors
  roleRestrictions: Role[];   // if non-empty, can ONLY do these roles
  pairedWith: string | null;  // member ID — must be scheduled same week
  active: boolean;
}

export interface WeekAssignment {
  date: string;
  balayeuseSousSol: string;
  balayeuseRezDeChaussee: string;
  balayeuse1erEtage: string;
  vadrouilleAvant: string;
  vadrouilleArriere: string;
}

export interface Schedule {
  title: string;
  weeks: WeekAssignment[];
}

export interface SavedSchedule {
  id: string;
  title: string;
  weeks: WeekAssignment[];
  createdAt: string; // ISO date string
}

export interface ReminderLog {
  id: string;
  memberName: string;
  memberEmail: string;
  task: string;
  scheduledDate: string;
  sentAt: string; // ISO date string
  success: boolean;
  error?: string;
}
