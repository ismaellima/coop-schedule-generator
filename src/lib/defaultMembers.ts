import type { Member, Floor } from "./types";
const uuid = () => crypto.randomUUID();

function m(name: string, floor: Floor, overrides?: Partial<Member>): Member {
  return {
    id: uuid(),
    name,
    floorRestrictions: [floor],
    roleRestrictions: [],
    pairedWith: null,
    active: true,
    ...overrides,
  };
}

export function getDefaultMembers(): Member[] {
  const louise = m("Louise", "sous-sol");
  const richardC = m("Richard C.", "sous-sol");
  louise.pairedWith = richardC.id;
  richardC.pairedWith = louise.id;

  const vivianne = m("Vivianne", "rez-de-chaussee", {
    roleRestrictions: ["balayeuse"],
  });

  return [
    // Sous-sol (8)
    m("Isabelle", "sous-sol"),
    m("Nathalie", "sous-sol"),
    m("Marie M.", "sous-sol"),
    richardC,
    m("Marie-Josée H.", "sous-sol"),
    m("Alexis", "sous-sol"),
    louise,
    m("Jade", "sous-sol"),
    // Rez-de-chaussée (7)
    m("Sarah", "rez-de-chaussee"),
    vivianne,
    m("Ismael", "rez-de-chaussee"),
    m("Daniel P.", "rez-de-chaussee"),
    m("Alain", "rez-de-chaussee"),
    m("Marie-Eve", "rez-de-chaussee"),
    m("Parker", "rez-de-chaussee"),
    // 1er étage (10)
    m("Octavio", "1er-etage"),
    m("Fabio", "1er-etage"),
    m("Johanne", "1er-etage"),
    m("Ève", "1er-etage"),
    m("Richard F.", "1er-etage"),
    m("Mireille", "1er-etage"),
    m("Cathy", "1er-etage"),
    m("Filipe", "1er-etage"),
    m("Anderson", "1er-etage"),
    m("Daniel R.", "1er-etage"),
  ];
}
