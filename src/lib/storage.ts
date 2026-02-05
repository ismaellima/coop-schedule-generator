import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import type { Member, SavedSchedule, ReminderLog } from "./types";

// Collections
const MEMBERS_COLLECTION = "members";
const SCHEDULES_COLLECTION = "schedules";
const SETTINGS_COLLECTION = "settings";
const REMINDERS_COLLECTION = "reminders";

// Members
export async function loadMembers(): Promise<Member[]> {
  const snapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
}

export async function saveMembers(members: Member[]): Promise<void> {
  // Get existing members to find which ones to delete
  const existingSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
  const existingIds = new Set(existingSnapshot.docs.map(d => d.id));
  const newIds = new Set(members.map(m => m.id));

  // Delete members that are no longer in the list
  for (const id of existingIds) {
    if (!newIds.has(id)) {
      await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
    }
  }

  // Save all current members
  for (const member of members) {
    await setDoc(doc(db, MEMBERS_COLLECTION, member.id), member);
  }
}

export function subscribeToMembers(callback: (members: Member[]) => void): Unsubscribe {
  return onSnapshot(collection(db, MEMBERS_COLLECTION), (snapshot) => {
    const members = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
    callback(members);
  });
}

// Schedules
export async function loadSchedules(): Promise<SavedSchedule[]> {
  const snapshot = await getDocs(collection(db, SCHEDULES_COLLECTION));
  const schedules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedSchedule));
  // Sort by createdAt descending (newest first)
  return schedules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveSchedule(schedule: SavedSchedule): Promise<void> {
  await setDoc(doc(db, SCHEDULES_COLLECTION, schedule.id), schedule);
}

export async function deleteSchedule(id: string): Promise<void> {
  await deleteDoc(doc(db, SCHEDULES_COLLECTION, id));
}

export function subscribeToSchedules(callback: (schedules: SavedSchedule[]) => void): Unsubscribe {
  return onSnapshot(collection(db, SCHEDULES_COLLECTION), (snapshot) => {
    const schedules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedSchedule));
    // Sort by createdAt descending (newest first)
    schedules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(schedules);
  });
}

// Assignment counts
export async function loadAssignmentCounts(): Promise<Record<string, number>> {
  const snapshot = await getDocs(collection(db, SETTINGS_COLLECTION));
  const settingsDoc = snapshot.docs.find(d => d.id === "assignmentCounts");
  if (settingsDoc) {
    return settingsDoc.data().counts as Record<string, number>;
  }
  return {};
}

export async function saveAssignmentCounts(counts: Record<string, number>): Promise<void> {
  await setDoc(doc(db, SETTINGS_COLLECTION, "assignmentCounts"), { counts });
}

// Email reminders setting
export async function loadEmailRemindersEnabled(): Promise<boolean> {
  const snapshot = await getDocs(collection(db, SETTINGS_COLLECTION));
  const settingsDoc = snapshot.docs.find(d => d.id === "emailReminders");
  if (settingsDoc) {
    return settingsDoc.data().enabled as boolean;
  }
  return false; // Default to disabled
}

export async function saveEmailRemindersEnabled(enabled: boolean): Promise<void> {
  await setDoc(doc(db, SETTINGS_COLLECTION, "emailReminders"), { enabled });
}

export function subscribeToEmailReminders(callback: (enabled: boolean) => void): Unsubscribe {
  return onSnapshot(doc(db, SETTINGS_COLLECTION, "emailReminders"), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data().enabled as boolean);
    } else {
      callback(false);
    }
  });
}

// Reminder logs
export async function saveReminderLog(log: ReminderLog): Promise<void> {
  await setDoc(doc(db, REMINDERS_COLLECTION, log.id), log);
}

export function subscribeToReminderLogs(callback: (logs: ReminderLog[]) => void): Unsubscribe {
  return onSnapshot(collection(db, REMINDERS_COLLECTION), (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ReminderLog));
    // Sort by sentAt descending (newest first)
    logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    callback(logs);
  });
}
