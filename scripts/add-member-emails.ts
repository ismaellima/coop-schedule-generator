// Add email addresses to members
// Run with: npx tsx scripts/add-member-emails.ts

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

// Map member names to emails
const emailMap: Record<string, string> = {
  "Anderson": "abordim@gmail.com",
  "Ève": "eve.deshaies@gmail.com",
  "Johanne": "jzenga@videotron.ca",
  "Marie M.": "martineau81@gmail.com",
  "Vivianne": "rondeauviviane@gmail.com",
  "Jade": "jade_lavoie@hotmail.com",
  "Richard C.": "richard.courville@icloud.com",
  "Nathalie": "nathalieschneider@hotmail.ca",
  "Marie-Eve": "Marie-Eve125@hotmail.com",
  "Daniel P.": "danpard78@gmail.com",
  "Parker": "parker.x.mah@gmail.com",
  "Daniel R.": "dani.riopel@gmail.com",
  "Filipe": "filipe11dacosta@msn.com",
  "Louise": "loubarrette@icloud.com",
  "Mireille": "mdeschamps@crosemont.qc.ca",
  "Fabio": "whysasse@gmail.com",
  "Richard F.": "rfortin1506@yahoo.ca",
  "Isabelle": "isabeau1969@icloud.com",
  "Alain": "alain05@sympatico.ca",
  "Sarah": "sarah.elola12@gmail.com",
  "Marie-Josée H.": "marie.j.houle@gmail.com",
  "Octavio": "octavioruestsantes@gmail.com",
  "Cathy": "kathy.carlen@gmail.com",
};

async function addEmails() {
  console.log("Fetching members from Firebase...");

  const snapshot = await getDocs(collection(db, "members"));
  const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log(`Found ${members.length} members\n`);

  let updated = 0;
  let notFound: string[] = [];

  for (const member of members) {
    const name = (member as any).name;
    const email = emailMap[name];

    if (email) {
      console.log(`✓ ${name} → ${email}`);
      await updateDoc(doc(db, "members", member.id), { email });
      updated++;
    } else {
      notFound.push(name);
    }
  }

  console.log(`\n${updated} members updated with email addresses.`);

  if (notFound.length > 0) {
    console.log(`\nMembers without email in the list:`);
    notFound.forEach(name => console.log(`  - ${name}`));
  }

  // Check for emails that didn't match any member
  const memberNames = new Set(members.map((m: any) => m.name));
  const unmatchedEmails = Object.keys(emailMap).filter(name => !memberNames.has(name));

  if (unmatchedEmails.length > 0) {
    console.log(`\nEmails provided that didn't match any member:`);
    unmatchedEmails.forEach(name => console.log(`  - ${name}: ${emailMap[name]}`));
  }

  process.exit(0);
}

addEmails().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
