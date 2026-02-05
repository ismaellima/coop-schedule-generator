// Add remaining email addresses
// Run with: npx tsx scripts/add-remaining-emails.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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

const emailMap: Record<string, string> = {
  "Alexis": "renard.gere@gmail.com",
  "Ismael": "ismaeldf@gmail.com",
};

async function addEmails() {
  console.log("Fetching members from Firebase...");

  const snapshot = await getDocs(collection(db, "members"));
  const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  for (const member of members) {
    const name = (member as any).name;
    const email = emailMap[name];

    if (email) {
      console.log(`✓ ${name} → ${email}`);
      await updateDoc(doc(db, "members", member.id), { email });
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

addEmails().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
