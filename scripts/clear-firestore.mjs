/**
 * clear-firestore.mjs
 * Deletes ALL documents from: users, studentProgress, attempts
 * Run from project root: node scripts/clear-firestore.mjs
 */

import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyCKCPh6Dd2cWCC6hC8RUVzr4EdYQKWetyA',
  authDomain:        'shikshaflow-1196a.firebaseapp.com',
  projectId:         'shikshaflow-1196a',
  storageBucket:     'shikshaflow-1196a.firebasestorage.app',
  messagingSenderId: '294122120820',
  appId:             '1:294122120820:web:85aef4845c717d955cd321',
};

const app = initializeApp(firebaseConfig);
const db  = initializeFirestore(app, {});

const COLLECTIONS = ['users', 'studentProgress', 'attempts'];

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  if (snap.empty) {
    console.log(`  ✓ ${name} — already empty`);
    return 0;
  }
  const deletes = snap.docs.map(d => deleteDoc(doc(db, name, d.id)));
  await Promise.all(deletes);
  console.log(`  ✓ ${name} — deleted ${snap.docs.length} document(s)`);
  return snap.docs.length;
}

console.log('\n🗑  Clearing Firestore collections...\n');
let total = 0;
for (const col of COLLECTIONS) {
  total += await clearCollection(col);
}
console.log(`\n✅  Done — ${total} total document(s) removed from Firestore.\n`);
process.exit(0);
