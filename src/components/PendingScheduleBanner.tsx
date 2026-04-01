import { useState } from "react";
import type { Member, SavedSchedule } from "../lib/types";
import { getMemberTasks } from "../lib/icsGenerator";
import { loadScheduleEmailMessage, loadScheduleEmailSubject } from "../lib/storage";
import { ScheduleTable } from "./ScheduleTable";

interface ApprovalResult {
  sentCount: number;
  failedCount: number;
  results: { memberName: string; success: boolean; error?: string }[];
}

interface Props {
  pendingSchedule: SavedSchedule;
  members: Member[];
  onApprove: (result: ApprovalResult) => void;
  onReject: () => void;
}

export function PendingScheduleBanner({ pendingSchedule, members, onApprove, onReject }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [sendResult, setSendResult] = useState<ApprovalResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleApprove = async () => {
    setApproving(true);
    setSendError(null);
    try {
      const [savedMessage, savedSubject] = await Promise.all([
        loadScheduleEmailMessage(),
        loadScheduleEmailSubject(),
      ]);

      const membersPayload = members
        .filter(m => m.active && m.email)
        .map(m => ({
          memberName: m.name,
          memberEmail: m.email,
          tasks: getMemberTasks(m.name, pendingSchedule.weeks).map(t => ({ date: t.date, task: t.task })),
        }))
        .filter(m => m.tasks.length > 0);

      const emailSubject = savedSubject ?? `Horaire de ménage - ${pendingSchedule.title}`;
      const customMessage = savedMessage ?? "Voici l'horaire de ménage pour les prochaines semaines. Vous trouverez ci-dessous vos tâches assignées ainsi qu'un fichier calendrier pour les ajouter facilement à votre téléphone.";

      const response = await fetch('/api/send-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleTitle: pendingSchedule.title,
          emailSubject,
          customMessage,
          members: membersPayload,
          testMode: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSendError(data.error ?? 'Erreur lors de l\'envoi');
        setApproving(false);
        return;
      }

      const result: ApprovalResult = {
        sentCount: data.summary.sent,
        failedCount: data.summary.failed,
        results: data.results,
      };
      setSendResult(result);
      onApprove(result);
    } catch {
      setSendError('Erreur de connexion');
    }
    setApproving(false);
  };

  return (
    <div className="border border-amber-400 bg-amber-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-500 mt-0.5">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-amber-900">Horaire en attente d'approbation</p>
            <p className="text-sm text-amber-700">
              {pendingSchedule.title} · {pendingSchedule.weeks.length} semaines
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-sm text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 cursor-pointer"
          >
            Aperçu
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          {!sendResult && (
            <>
              <button
                onClick={onReject}
                disabled={approving}
                className="text-sm border border-amber-400 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Rejeter
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="text-sm bg-orange-500 text-white hover:bg-orange-600 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {approving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Envoi...
                  </>
                ) : (
                  'Approuver et envoyer'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-2">
          <ScheduleTable title={pendingSchedule.title} weeks={pendingSchedule.weeks} />
        </div>
      )}

      {sendError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {sendError}
        </div>
      )}

      {sendResult && (
        <div className={`text-sm rounded-lg px-3 py-2 ${sendResult.failedCount === 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-100 border border-amber-300 text-amber-800'}`}>
          Envoi terminé — {sendResult.sentCount} envoyé{sendResult.sentCount !== 1 ? 's' : ''}
          {sendResult.failedCount > 0 && `, ${sendResult.failedCount} échec${sendResult.failedCount !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}
