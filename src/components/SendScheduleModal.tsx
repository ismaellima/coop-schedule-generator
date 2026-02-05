import { useState, useMemo, useEffect } from "react";
import type { Member, WeekAssignment } from "../lib/types";
import { getMemberTasks } from "../lib/icsGenerator";
import { loadScheduleEmailMessage, saveScheduleEmailMessage } from "../lib/storage";

interface Props {
  scheduleTitle: string;
  weeks: WeekAssignment[];
  members: Member[];
  onClose: () => void;
}

interface SendResult {
  memberName: string;
  success: boolean;
  error?: string;
}

const DEFAULT_MESSAGE = "Voici l'horaire de ménage pour les prochaines semaines. Vous trouverez ci-dessous vos tâches assignées ainsi qu'un fichier calendrier pour les ajouter facilement à votre téléphone.";

export function SendScheduleModal({ scheduleTitle, weeks, members, onClose }: Props) {
  const [customMessage, setCustomMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [summary, setSummary] = useState<{ sent: number; failed: number } | null>(null);

  // Load saved message on mount
  useEffect(() => {
    loadScheduleEmailMessage().then((saved) => {
      if (saved) {
        setCustomMessage(saved);
      }
    });
  }, []);

  // Get members with their tasks
  const membersWithTasks = useMemo(() => {
    return members
      .filter(m => m.active && m.email)
      .map(m => ({
        memberName: m.name,
        memberEmail: m.email,
        tasks: getMemberTasks(m.name, weeks).map(t => ({ date: t.date, task: t.task })),
      }))
      .filter(m => m.tasks.length > 0);
  }, [members, weeks]);

  // Track selected members (all selected by default)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(() =>
    new Set(membersWithTasks.map(m => m.memberEmail))
  );

  const selectedMembers = membersWithTasks.filter(m => selectedEmails.has(m.memberEmail));

  const toggleMember = (email: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedEmails(new Set(membersWithTasks.map(m => m.memberEmail)));
  };

  const deselectAll = () => {
    setSelectedEmails(new Set());
  };

  const handleSend = async () => {
    setSending(true);
    setResults(null);
    setSummary(null);

    try {
      const response = await fetch('/api/send-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleTitle,
          customMessage,
          members: selectedMembers,
          testMode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
        setSummary(data.summary);
        // Save the custom message for next time
        await saveScheduleEmailMessage(customMessage);
      } else {
        setResults([{ memberName: 'Erreur', success: false, error: data.error }]);
      }
    } catch (error) {
      setResults([{ memberName: 'Erreur', success: false, error: 'Erreur de connexion' }]);
    }

    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Envoyer l'horaire aux membres</h3>
            <p className="text-sm text-gray-500">{scheduleTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Message input */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Message personnalisé
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-orange-400 outline-none transition-colors text-gray-900 placeholder-gray-400 resize-none"
              placeholder="Écrivez un message pour accompagner l'horaire..."
            />
          </div>

          {/* Preview with checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-800">
                Destinataires ({selectedMembers.length} / {membersWithTasks.length} sélectionnés)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Tout sélectionner
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Membre</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Tâches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {membersWithTasks.map((m) => (
                    <tr
                      key={m.memberEmail}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedEmails.has(m.memberEmail) ? '' : 'opacity-50'
                      }`}
                      onClick={() => toggleMember(m.memberEmail)}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(m.memberEmail)}
                          onChange={() => toggleMember(m.memberEmail)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{m.memberName}</div>
                        <div className="text-xs text-gray-400">{m.memberEmail}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {m.tasks.map(t => t.date).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test mode toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-amber-50 rounded-xl border border-amber-200">
            <div>
              <p className="text-sm font-semibold text-amber-800">Mode test</p>
              <p className="text-xs text-amber-600">
                {testMode
                  ? `${selectedMembers.length} email(s) seront envoyés à ismaeldf@gmail.com`
                  : `Les emails seront envoyés aux ${selectedMembers.length} membres sélectionnés`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTestMode(!testMode)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                testMode ? "bg-amber-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  testMode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {summary && (
                <div className={`p-4 rounded-xl ${
                  summary.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <p className={`font-semibold ${summary.failed === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                    {testMode ? 'Test terminé!' : 'Envoi terminé!'}
                  </p>
                  <p className={`text-sm ${summary.failed === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {summary.sent} envoyé{summary.sent > 1 ? 's' : ''} avec succès
                    {summary.failed > 0 && `, ${summary.failed} échec${summary.failed > 1 ? 's' : ''}`}
                  </p>
                </div>
              )}

              {results.some(r => !r.success) && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
                    Erreurs
                  </div>
                  <div className="divide-y divide-red-100">
                    {results.filter(r => !r.success).map((r, i) => (
                      <div key={i} className="px-4 py-2 text-sm">
                        <span className="font-medium text-gray-900">{r.memberName}</span>
                        <span className="text-red-600 ml-2">{r.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="border border-gray-300 px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedMembers.length === 0}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              testMode
                ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50'
                : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
            }`}
          >
            {sending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Envoi en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {testMode ? `Envoyer ${selectedMembers.length} test(s)` : `Envoyer à ${selectedMembers.length} membres`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
