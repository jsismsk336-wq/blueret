import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZ8diiXPpwWbaL1vwpoLtCvub--jvPIQ0",
  authDomain: "blueret-db.firebaseapp.com",
  projectId: "blueret-db",
  storageBucket: "blueret-db.firebasestorage.app",
  messagingSenderId: "564353405412",
  appId: "1:564353405412:web:87a227461e4132760577f1",
  measurementId: "G-PXKM2B69L6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { token, days, qty } = req.method === 'POST' ? req.body : req.query;

    if (!token || !days) {
      return res.status(400).json({ status: 'error', message: 'Missing parameters (token, days)' });
    }

    const durationDays = parseInt(days);
    const quantity = parseInt(qty) || 1;

    if (quantity < 1 || quantity > 50) {
      return res.status(400).json({ status: 'error', message: 'Quantity must be between 1 and 50' });
    }

    // 1. Authenticate Partner via API Token
    const partnersSnap = await getDocs(collection(db, 'partners'));
    let partner: any = null;
    let partnerId = '';

    partnersSnap.forEach((doc) => {
      const p = doc.data();
      if (p.apiToken === token) {
        partner = p;
        partnerId = doc.id;
      }
    });

    if (!partner) {
      return res.status(401).json({ status: 'error', message: 'Invalid API Token' });
    }
    
    if (partner.status === 'suspended') {
      return res.status(403).json({ status: 'error', message: 'Account is suspended' });
    }

    // 2. Get packages to find cost
    const pkgSnap = await getDoc(doc(db, 'packages', durationDays.toString()));
    if (!pkgSnap.exists()) {
      return res.status(400).json({ status: 'error', message: `Package not found for ${durationDays} days` });
    }
    
    const pkg = pkgSnap.data();
    const unitCost = partner.customPrices?.[durationDays] ?? pkg.cost;
    
    // 3. Find available keys in stock
    const keysSnap = await getDocs(collection(db, 'keys'));
    const candidateKeys: any[] = [];
    keysSnap.forEach(d => {
      const k = d.data();
      if (k.durationDays === durationDays && k.status === 'unused') {
        candidateKeys.push({ id: d.id, ...k });
      }
    });

    if (candidateKeys.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No keys in stock' });
    }

    const affordableQty = Math.floor(partner.balance / unitCost);
    const targetQty = Math.min(quantity, affordableQty, candidateKeys.length);

    if (targetQty <= 0) {
      return res.status(400).json({ status: 'error', message: 'Insufficient balance or stock' });
    }

    // 4. Batch update
    const verifiedKeys = candidateKeys.slice(0, targetQty);
    const totalCost = unitCost * targetQty;

    // Double check balance (Anti race condition)
    const pRef = doc(db, 'partners', partnerId);
    const pSnap = await getDoc(pRef);
    if (!pSnap.exists() || (pSnap.data() as any).balance < totalCost) {
       return res.status(400).json({ status: 'error', message: 'Insufficient balance (Race Condition Prevented)' });
    }

    const batch = writeBatch(db);
    batch.set(pRef, { balance: (pSnap.data() as any).balance - totalCost }, { merge: true });

    const now = Date.now();
    const redeemedKeys: string[] = [];

    for (const k of verifiedKeys) {
      const keyRef = doc(db, 'keys', k.id);
      batch.set(keyRef, {
        status: 'active',
        redeemedBy: partnerId,
        redeemedAt: now
      }, { merge: true });
      redeemedKeys.push(k.keyString);
    }

    await batch.commit();

    return res.status(200).json({
      status: 'success',
      keys: redeemedKeys,
      message: `Successfully pulled ${targetQty} key(s)`,
      remaining_balance: (pSnap.data() as any).balance - totalCost
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal server error: ' + error.message });
  }
}
