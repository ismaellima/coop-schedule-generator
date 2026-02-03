import { useState, useEffect, useCallback } from "react";
import type { Member, WeekAssignment, SavedSchedule } from "./lib/types";
import {
  loadMembers,
  saveMembers,
  subscribeToMembers,
  subscribeToSchedules,
  saveSchedule,
  deleteSchedule,
  loadAssignmentCounts,
  saveAssignmentCounts
} from "./lib/storage";
import { getDefaultMembers } from "./lib/defaultMembers";
import { generateSchedule } from "./lib/generator";
import { MemberList } from "./components/MemberList";
import { MemberForm } from "./components/MemberForm";
import { ScheduleTable } from "./components/ScheduleTable";

type View = "schedule" | "members";

const ADMIN_PASSWORD = "aupieddelamontagne";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: new Date(2026, i).toLocaleDateString("fr-CA", { month: "long" }),
}));

const DURATION_OPTIONS = [
  { value: 4, label: "4 semaines (1 mois)" },
  { value: 8, label: "8 semaines (2 mois)" },
  { value: 12, label: "12 semaines (3 mois)" },
];

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

function PasswordModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("coop-admin", "true");
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
      >
        <h3 className="text-lg font-bold text-gray-900">Mode administrateur</h3>
        <p className="text-sm text-gray-500">Entrez le mot de passe pour modifier les données.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-colors ${
            error ? "border-red-400" : "border-gray-200 focus:border-orange-400"
          }`}
          placeholder="Mot de passe"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">Mot de passe incorrect</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 px-5 py-2 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-orange-500 text-white px-5 py-2 rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Connexion
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("schedule");
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("coop-admin") === "true");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  const now = new Date();
  const [startMonth, setStartMonth] = useState(now.getMonth());
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [schedule, setSchedule] = useState<WeekAssignment[] | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});

  // Initial load and real-time subscriptions
  useEffect(() => {
    let unsubMembers: (() => void) | undefined;
    let unsubSchedules: (() => void) | undefined;

    async function init() {
      // Load initial data
      const [loadedMembers, loadedCounts] = await Promise.all([
        loadMembers(),
        loadAssignmentCounts()
      ]);

      // If no members exist, initialize with defaults
      if (loadedMembers.length === 0) {
        const defaults = getDefaultMembers();
        await saveMembers(defaults);
        setMembers(defaults);
      } else {
        setMembers(loadedMembers);
      }

      setAssignmentCounts(loadedCounts);
      setLoading(false);

      // Subscribe to real-time updates
      unsubMembers = subscribeToMembers((updated) => {
        setMembers(updated);
      });

      unsubSchedules = subscribeToSchedules((updated) => {
        setSavedSchedules(updated);
      });
    }

    init();

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubMembers) unsubMembers();
      if (unsubSchedules) unsubSchedules();
    };
  }, []);

  const persist = useCallback(async (updated: Member[]) => {
    setMembers(updated);
    await saveMembers(updated);
  }, []);

  const handleSave = async (member: Member) => {
    const exists = members.find((m) => m.id === member.id);
    let updated: Member[];
    if (exists) {
      updated = members.map((m) => (m.id === member.id ? member : m));
    } else {
      updated = [...members, member];
    }
    if (member.pairedWith) {
      updated = updated.map((m) =>
        m.id === member.pairedWith ? { ...m, pairedWith: member.id } : m
      );
    }
    await persist(updated);
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    const updated = members
      .filter((m) => m.id !== id)
      .map((m) => (m.pairedWith === id ? { ...m, pairedWith: null } : m));
    await persist(updated);
  };

  const handleGenerate = async () => {
    const endMonth = (startMonth + Math.floor(durationWeeks / 4) - 1) % 12;
    const endYear = startMonth + Math.floor(durationWeeks / 4) - 1 >= 12 ? startYear + 1 : startYear;
    const result = generateSchedule(members, startMonth, startYear, endMonth, endYear, 6, assignmentCounts);
    setSchedule(result.schedule);
    setScheduleTitle(result.title);
    setSelectedScheduleId(null);

    // Save updated assignment counts
    setAssignmentCounts(result.assignmentCounts);
    await saveAssignmentCounts(result.assignmentCounts);

    // Save schedule to Firebase
    const newSchedule: SavedSchedule = {
      id: crypto.randomUUID(),
      title: result.title,
      weeks: result.schedule,
      createdAt: new Date().toISOString(),
    };
    await saveSchedule(newSchedule);
  };

  const handleSelectSchedule = (saved: SavedSchedule) => {
    setSchedule(saved.weeks);
    setScheduleTitle(saved.title);
    setSelectedScheduleId(saved.id);
  };

  const handleDeleteSchedule = async (id: string) => {
    await deleteSchedule(id);
    if (selectedScheduleId === id) {
      setSchedule(null);
      setScheduleTitle("");
      setSelectedScheduleId(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!schedule) return;
    const { pdf } = await import("@react-pdf/renderer");
    const { SchedulePDF } = await import("./components/SchedulePDF");
    const blob = await pdf(<SchedulePDF title={scheduleTitle} weeks={schedule} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `horaire-menage-${scheduleTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: 'Ismael (Test)',
          memberEmail: 'ismaeldf@gmail.com',
          task: 'Balayeuse - Rez-de-chaussée',
          date: '8 février',
          testMode: true,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setTestEmailStatus('Email envoyé avec succès!');
      } else {
        setTestEmailStatus(`Erreur: ${data.error}`);
      }
    } catch (error) {
      setTestEmailStatus('Erreur de connexion');
    }
    setSendingTestEmail(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const activeCount = members.filter((m) => m.active).length;
  const weekCount = schedule?.length ?? 0;
  const taskCount = weekCount * 5;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Coop au pied de la montagne</h1>
              <p className="text-xs text-gray-400">Générateur d'horaires de ménage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("schedule")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                  view === "schedule" ? "bg-white text-gray-900 shadow-sm" : "bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Horaire
              </button>
              <button
                onClick={() => setView("members")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                  view === "members" ? "bg-white text-gray-900 shadow-sm" : "bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Membres
              </button>
            </nav>
            {isAdmin ? (
              <button
                onClick={() => { sessionStorage.removeItem("coop-admin"); setIsAdmin(false); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Admin
              </button>
            ) : (
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {view === "schedule" && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                  <p className="text-sm text-gray-500">Membres actifs</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-teal-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{weekCount}</p>
                  <p className="text-sm text-gray-500">Semaines planifiées</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{taskCount}</p>
                  <p className="text-sm text-gray-500">Tâches assignées</p>
                </div>
              </div>
            </div>

            {/* Generator card - only for admin */}
            {isAdmin && (
              <div className="bg-white rounded-xl border-2 border-dashed border-orange-300 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h2 className="text-lg font-semibold text-orange-600">Générer un horaire</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(+e.target.value)}
                        className="flex-1 outline-none bg-transparent"
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={startYear}
                        onChange={(e) => setStartYear(+e.target.value)}
                        className="w-16 outline-none bg-transparent text-right"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                    <select
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(+e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none"
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Générer l'horaire
                </button>
              </div>
            )}

            {/* Schedule result or empty state */}
            {schedule ? (
              <div className="space-y-4">
                <ScheduleTable title={scheduleTitle} weeks={schedule} />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Télécharger PDF
                  </button>
                  {isAdmin && (
                    <button
                      onClick={handleSendTestEmail}
                      disabled={sendingTestEmail}
                      className="bg-teal-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {sendingTestEmail ? 'Envoi...' : 'Tester email rappel'}
                    </button>
                  )}
                </div>
                {testEmailStatus && (
                  <p className={`text-sm ${testEmailStatus.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
                    {testEmailStatus}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700">Aucun horaire généré</p>
                <p className="text-sm text-gray-400 mt-1">
                  Utilisez le générateur ci-dessus pour créer un nouvel horaire de ménage.
                </p>
              </div>
            )}

            {/* Saved schedules */}
            {savedSchedules.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Horaires sauvegardés ({savedSchedules.length})
                </h3>
                <div className="space-y-2">
                  {savedSchedules.map((saved) => (
                    <div
                      key={saved.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        selectedScheduleId === saved.id
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <button
                        onClick={() => handleSelectSchedule(saved)}
                        className="flex-1 text-left flex items-center gap-3"
                      >
                        <CalendarIcon className={`w-5 h-5 ${selectedScheduleId === saved.id ? "text-orange-500" : "text-gray-400"}`} />
                        <div>
                          <p className={`font-medium ${selectedScheduleId === saved.id ? "text-orange-700" : "text-gray-900"}`}>
                            {saved.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {saved.weeks.length} semaines - Créé le {new Date(saved.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteSchedule(saved.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === "members" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Gestion des membres ({members.length})
              </h2>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditing(null);
                    setShowForm(true);
                  }}
                  className="bg-orange-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  Ajouter un membre
                </button>
              )}
            </div>
            <MemberList
              members={members}
              onEdit={(m) => {
                setEditing(m);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </main>

      {showForm && (
        <MemberForm
          member={editing}
          allMembers={members}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          onSuccess={() => { setIsAdmin(true); setShowPasswordModal(false); }}
          onCancel={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}
