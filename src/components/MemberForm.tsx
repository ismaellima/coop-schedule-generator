import { useState, useEffect } from "react";
import type { Member, Floor, UnavailablePeriod } from "../lib/types";
const uuid = () => crypto.randomUUID();

interface Props {
  member: Member | null;
  allMembers: Member[];
  onSave: (member: Member) => void;
  onCancel: () => void;
}

const FLOOR_OPTIONS: { value: Floor; label: string }[] = [
  { value: "sous-sol", label: "Sous-sol" },
  { value: "rez-de-chaussee", label: "Rez-de-chaussée" },
  { value: "1er-etage", label: "1er étage" },
];

export function MemberForm({ member, allMembers, onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [floor, setFloor] = useState<Floor>("rez-de-chaussee");
  const [reducedMobility, setReducedMobility] = useState(false);
  const [pairedWith, setPairedWith] = useState<string>("");
  const [unavailablePeriods, setUnavailablePeriods] = useState<UnavailablePeriod[]>([]);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email || "");
      setFloor(member.floorRestrictions[0] || "rez-de-chaussee");
      setReducedMobility(member.roleRestrictions.length > 0);
      setPairedWith(member.pairedWith || "");
      setUnavailablePeriods(member.unavailablePeriods || []);
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: member?.id || uuid(),
      name: name.trim(),
      email: email.trim(),
      floorRestrictions: [floor],
      roleRestrictions: reducedMobility ? ["balayeuse"] : [],
      pairedWith: pairedWith || null,
      active: true,
      unavailablePeriods,
    });
  };

  const otherMembers = allMembers.filter((m) => m.id !== member?.id);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-0 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900">
            {member ? "Modifier le membre" : "Ajouter un membre"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-orange-400 outline-none transition-colors text-gray-900 placeholder-gray-400"
            placeholder="Entrez le nom..."
            required
            autoFocus
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Courriel</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-orange-400 outline-none transition-colors text-gray-900 placeholder-gray-400"
            placeholder="exemple@email.com"
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Étage</label>
          <select
            value={floor}
            onChange={(e) => setFloor(e.target.value as Floor)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-orange-400 outline-none transition-colors text-gray-900 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%200%201%201.06%200L10%2011.94l3.72-3.72a.75.75%200%201%201%201.06%201.06l-4.25%204.25a.75.75%200%200%201-1.06%200L5.22%209.28a.75.75%200%200%201%200-1.06Z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem]"
          >
            {FLOOR_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Paired with */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Jumelé avec</label>
          <select
            value={pairedWith}
            onChange={(e) => setPairedWith(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-orange-400 outline-none transition-colors text-gray-900 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%200%201%201.06%200L10%2011.94l3.72-3.72a.75.75%200%201%201%201.06%201.06l-4.25%204.25a.75.75%200%200%201-1.06%200L5.22%209.28a.75.75%200%200%201%200-1.06Z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem]"
          >
            <option value="">Aucun</option>
            {otherMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Reduced mobility toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-semibold text-gray-800">Mobilité réduite</p>
            <p className="text-xs text-gray-400">Ne peut travailler que sur son étage</p>
          </div>
          <button
            type="button"
            onClick={() => setReducedMobility(!reducedMobility)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              reducedMobility ? "bg-orange-400" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                reducedMobility ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* Unavailable periods */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Périodes d'indisponibilité</p>
          {unavailablePeriods.length > 0 && (
            <div className="space-y-2 mb-3">
              {unavailablePeriods.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-700">{p.from} → {p.to}</span>
                  <button
                    type="button"
                    onClick={() => setUnavailablePeriods(unavailablePeriods.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-orange-400 outline-none transition-colors text-sm text-gray-900"
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                type="date"
                value={newTo}
                min={newFrom}
                onChange={(e) => setNewTo(e.target.value)}
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-orange-400 outline-none transition-colors text-sm text-gray-900"
              />
            </div>
            <button
              type="button"
              disabled={!newFrom || !newTo || newTo < newFrom}
              onClick={() => {
                setUnavailablePeriods([...unavailablePeriods, { from: newFrom, to: newTo }]);
                setNewFrom("");
                setNewTo("");
              }}
              className="w-full bg-orange-400 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-orange-500 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </div>

        </div>{/* end scrollable body */}

        {/* Buttons — fixed at bottom */}
        <div className="flex gap-3 justify-end px-8 py-5 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 px-6 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-orange-400 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-500 transition-colors"
          >
            {member ? "Sauvegarder" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
