// Fix duplicate Louise - keep original, remove duplicate
// Run with: npx tsx scripts/fix-duplicate-louise.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

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

async function fixDuplicates() {
  console.log("Fetching members from Firebase...\n");

  const snapshot = await getDocs(collection(db, "members"));
  const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  // Find all Louise entries
  const louiseMembers = members.filter(m => m.name === "Louise");

  console.log(`Found ${louiseMembers.length} Louise entries:`);
  louiseMembers.forEach((m, i) => {
    console.log(`  ${i + 1}. ID: ${m.id}`);
    console.log(`     Email: ${m.email || '(none)'}`);
    console.log(`     Floor: ${m.floorRestrictions?.join(', ')}`);
    console.log(`     Paired with: ${m.pairedWith || '(none)'}`);
    console.log();
  });

  if (louiseMembers.length > 1) {
    // Keep the one that has pairedWith set (the original), delete the other
    const original = louiseMembers.find(m => m.pairedWith);
    const duplicate = louiseMembers.find(m => !m.pairedWith) || louiseMembers[1];

    if (original && duplicate && original.id !== duplicate.id) {
      console.log(`Keeping: ${original.id} (has pairing with Richard C.)`);
      console.log(`Deleting: ${duplicate.id}`);

      // Make sure original has the correct email
      await updateDoc(doc(db, "members", original.id), {
        email: "loubarrette@icloud.com"
      });
      console.log(`Updated original Louise with email: loubarrette@icloud.com`);

      // Delete duplicate
      await deleteDoc(doc(db, "members", duplicate.id));
      console.log(`Deleted duplicate Louise`);
    } else {
      console.log("Could not determine which is original vs duplicate.");
      console.log("Keeping first one, deleting second...");

      await updateDoc(doc(db, "members", louiseMembers[0].id), {
        email: "loubarrette@icloud.com"
      });
      await deleteDoc(doc(db, "members", louiseMembers[1].id));
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

fixDuplicates().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
