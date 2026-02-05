// Remove all duplicate members - keep originals only
// Run with: npx tsx scripts/remove-all-duplicates.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";

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

async function removeDuplicates() {
  console.log("Fetching members from Firebase...\n");

  const snapshot = await getDocs(collection(db, "members"));
  const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  console.log(`Total members found: ${members.length}\n`);

  // Group members by name
  const byName: Record<string, any[]> = {};
  for (const member of members) {
    const name = member.name;
    if (!byName[name]) byName[name] = [];
    byName[name].push(member);
  }

  // Find duplicates
  const duplicateNames = Object.keys(byName).filter(name => byName[name].length > 1);

  if (duplicateNames.length === 0) {
    console.log("No duplicates found!");
    process.exit(0);
  }

  console.log(`Found ${duplicateNames.length} members with duplicates:\n`);

  let deletedCount = 0;

  for (const name of duplicateNames) {
    const entries = byName[name];
    console.log(`${name}: ${entries.length} entries`);

    // Keep the one with pairedWith if exists, otherwise keep first one
    const toKeep = entries.find(m => m.pairedWith) || entries[0];
    const toDelete = entries.filter(m => m.id !== toKeep.id);

    console.log(`  Keeping: ${toKeep.id} (email: ${toKeep.email || 'none'})`);

    for (const dup of toDelete) {
      console.log(`  Deleting: ${dup.id}`);
      await deleteDoc(doc(db, "members", dup.id));
      deletedCount++;
    }
    console.log();
  }

  console.log(`\nDeleted ${deletedCount} duplicate members.`);

  // Verify final count
  const finalSnapshot = await getDocs(collection(db, "members"));
  console.log(`Final member count: ${finalSnapshot.docs.length}`);

  process.exit(0);
}

removeDuplicates().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
