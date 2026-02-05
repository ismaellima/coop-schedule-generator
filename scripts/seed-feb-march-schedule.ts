// One-time script to seed the February-March 2026 schedule
// Run with: npx tsx scripts/seed-feb-march-schedule.ts

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyttP2UBo-jjKCw9v1zHQn2eXJFnQKCBU",
  authDomain: "schedule-generator-aplm.firebaseapp.com",
  projectId: "schedule-generator-aplm",
  storageBucket: "schedule-generator-aplm.firebasestorage.app",
  messagingSenderId: "388695173466",
  appId: "1:388695173466:web:db0071cff086db1479eb63"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const febMarchSchedule = {
  id: "feb-march-2026-official",
  title: "Février - Mars 2026",
  createdAt: new Date().toISOString(),
  weeks: [
    {
      date: "7 février",
      balayeuseSousSol: "Isabelle",
      balayeuseRezDeChaussee: "Nathalie",
      balayeuse1erEtage: "Octavio",
      vadrouilleAvant: "Alain",
      vadrouilleArriere: "Marie-Josée H.",
    },
    {
      date: "14 février",
      balayeuseSousSol: "Marie M.",
      balayeuseRezDeChaussee: "Fabio",
      balayeuse1erEtage: "Johanne",
      vadrouilleAvant: "Anderson",
      vadrouilleArriere: "Daniel R.",
    },
    {
      date: "21 février",
      balayeuseSousSol: "Richard C.",
      balayeuseRezDeChaussee: "Sarah",
      balayeuse1erEtage: "Ève",
      vadrouilleAvant: "Jade",
      vadrouilleArriere: "Daniel P.",
    },
    {
      date: "28 février",
      balayeuseSousSol: "Marie-Josée H.",
      balayeuseRezDeChaussee: "Vivianne",
      balayeuse1erEtage: "Richard F.",
      vadrouilleAvant: "Marie-Eve",
      vadrouilleArriere: "Parker",
    },
    {
      date: "7 mars",
      balayeuseSousSol: "Isabelle",
      balayeuseRezDeChaussee: "Ismael",
      balayeuse1erEtage: "Alexis",
      vadrouilleAvant: "Filipe",
      vadrouilleArriere: "Octavio",
    },
    {
      date: "14 mars",
      balayeuseSousSol: "Louise",
      balayeuseRezDeChaussee: "Daniel P.",
      balayeuse1erEtage: "Mireille",
      vadrouilleAvant: "Parker",
      vadrouilleArriere: "Richard C.",
    },
    {
      date: "21 mars",
      balayeuseSousSol: "Nathalie",
      balayeuseRezDeChaussee: "Cathy",
      balayeuse1erEtage: "Filipe",
      vadrouilleAvant: "Marie M.",
      vadrouilleArriere: "Johanne",
    },
  ],
};

async function seed() {
  console.log("Adding February-March 2026 schedule to Firebase...");
  await setDoc(doc(db, "schedules", febMarchSchedule.id), febMarchSchedule);
  console.log("Done! Schedule added successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
