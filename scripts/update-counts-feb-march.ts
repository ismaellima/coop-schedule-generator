// Update assignment counts based on February-March 2026 schedule
// Run with: npx tsx scripts/update-counts-feb-march.ts

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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

// All assignments from Feb-March 2026 schedule
const assignments = [
  // 7 février
  "Isabelle", "Nathalie", "Octavio", "Alain", "Marie-Josée H.",
  // 14 février
  "Marie M.", "Fabio", "Johanne", "Anderson", "Daniel R.",
  // 21 février
  "Richard C.", "Sarah", "Ève", "Jade", "Daniel P.",
  // 28 février
  "Marie-Josée H.", "Vivianne", "Richard F.", "Marie-Eve", "Parker",
  // 7 mars
  "Isabelle", "Ismael", "Alexis", "Filipe", "Octavio",
  // 14 mars
  "Louise", "Daniel P.", "Mireille", "Parker", "Richard C.",
  // 21 mars
  "Nathalie", "Cathy", "Filipe", "Marie M.", "Johanne",
];

async function updateCounts() {
  console.log("Fetching current assignment counts...");

  const docRef = doc(db, "settings", "assignmentCounts");
  const docSnap = await getDoc(docRef);

  let counts: Record<string, number> = {};
  if (docSnap.exists()) {
    counts = docSnap.data().counts || {};
  }

  console.log("Current counts:", counts);

  // Add counts from Feb-March schedule
  for (const name of assignments) {
    counts[name] = (counts[name] || 0) + 1;
  }

  console.log("Updated counts:", counts);

  await setDoc(docRef, { counts });
  console.log("Done! Assignment counts updated.");
  process.exit(0);
}

updateCounts().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
