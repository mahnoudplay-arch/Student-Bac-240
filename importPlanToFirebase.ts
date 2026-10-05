import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export const firebaseConfig = {
  apiKey: "AIzaSyAQHuS-mgFNOX2NRGs2MOcbKtfOKC97_e4",
  authDomain: "bac-240.firebaseapp.com",
  projectId: "bac-240",
  storageBucket: "bac-240.firebasestorage.app",
  messagingSenderId: "773836224514",
  appId: "1:773836224514:web:4ff986e39336d6f4b10f1b"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function runImport() {
  console.log('🚀 بدء استيراد خطة أكاديمية التفوق (36 أسبوعاً) إلى Firebase Firestore...');
  
  const jsonPath = path.resolve(process.cwd(), 'excellence_academy_plan.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ ملف الخطة غير موجود:', jsonPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const planData = JSON.parse(rawData);

  // 1. Upload metadata
  console.log('📄 رفع ميتاداتا الخطة...');
  await setDoc(doc(db, 'studyPlans', 'bac240_official_2026'), JSON.parse(JSON.stringify({
    ...planData.metadata,
    updatedAt: new Date().toISOString()
  })), { merge: true });

  // 2. Upload weeks
  console.log(`📦 رفع ${planData.weeks.length} أسبوعاً إلى كولكشن planWeeks...`);
  let count = 0;
  for (const week of planData.weeks) {
    const weekDocRef = doc(db, 'planWeeks', week.id);
    const cleanWeek = JSON.parse(JSON.stringify({
      ...week,
      updatedAt: new Date().toISOString()
    }));
    await setDoc(weekDocRef, cleanWeek, { merge: true });
    count++;
    process.stdout.write(`✅ تم رفع الأسبوع ${week.weekIndex} (${week.monthName}) [${count}/${planData.weeks.length}]\n`);
  }

  console.log(`\n🎉 اكتمل الاستيراد بنجاح! تم رفع ${count} أسبوعاً إلى قاعدة البيانات.`);
  process.exit(0);
}

runImport().catch(err => {
  console.error('❌ فشل الاستيراد:', err);
  process.exit(1);
});
