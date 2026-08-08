import { seedFirestoreData } from './seedService';

async function run() {
  console.log('Seeding Cloud Firestore for project shikshaflow-1196a...');
  const success = await seedFirestoreData();
  if (success) {
    console.log('✅ SUCCESS: 32 Questions, 5 Students, and Progress profiles seeded into Cloud Firestore!');
  } else {
    console.log('⚠️ Seeding saved to local cache fallback.');
  }
  const proc = (globalThis as any).process;
  if (proc) proc.exit(0);
}

run();
