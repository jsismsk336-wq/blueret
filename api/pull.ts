import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, writeBatch, runTransaction, query, where, limit } from 'firebase/firestore';

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
    
    // 3. Find available keys in stock (Using query limit to prevent quota exhaustion)
    const affordableQty = Math.floor(partner.balance / unitCost);
    const maxPossibleQty = Math.min(quantity, affordableQty);
    
    if (maxPossibleQty <= 0) {
      return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
    }

    const keysRef = collection(db, 'keys');
    const q = query(keysRef, where('durationDays', '==', durationDays), where('status', '==', 'unused'), limit(maxPossibleQty + 5));
    const keysSnap = await getDocs(q);
    
    const candidateKeys: any[] = [];
    keysSnap.forEach(d => {
      candidateKeys.push({ id: d.id, ...d.data() });
    });

    if (candidateKeys.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No keys in stock' });
    }

    const targetQty = Math.min(maxPossibleQty, candidateKeys.length);

    if (targetQty <= 0) {
      return res.status(400).json({ status: 'error', message: 'Insufficient balance or stock' });
    }

    // 4. Transaction update (Bullet-proof Anti-Race Condition)
    const pRef = doc(db, 'partners', partnerId);
    let redeemedKeys: string[] = [];
    let remainingBalance = 0;

    await runTransaction(db, async (transaction) => {
      // Re-read partner balance inside transaction
      const pSnap = await transaction.get(pRef);
      if (!pSnap.exists()) throw new Error("Partner not found");
      
      const currentBalance = (pSnap.data() as any).balance;
      
      // Re-read keys inside transaction to ensure they haven't been taken
      const verifiedKeys: any[] = [];
      for (const candidate of candidateKeys) {
        if (verifiedKeys.length >= targetQty) break;
        const keyRef = doc(db, 'keys', candidate.id);
        const kSnap = await transaction.get(keyRef);
        if (kSnap.exists() && (kSnap.data() as any).status === 'unused') {
          verifiedKeys.push({ id: candidate.id, keyString: (kSnap.data() as any).keyString });
        }
      }

      if (verifiedKeys.length === 0) {
        throw new Error("No keys available in stock (Race Condition Prevented)");
      }

      const actualQty = verifiedKeys.length;
      const totalCost = unitCost * actualQty;

      if (currentBalance < totalCost) {
        throw new Error("Insufficient balance");
      }

      const newBalance = currentBalance - totalCost;
      remainingBalance = newBalance;
      transaction.set(pRef, { balance: newBalance }, { merge: true });

      const now = Date.now();
      for (const k of verifiedKeys) {
        const keyRef = doc(db, 'keys', k.id);
        transaction.set(keyRef, {
          status: 'active',
          redeemedBy: partnerId,
          redeemedAt: now
        }, { merge: true });
        redeemedKeys.push(k.keyString);
      }
    });

    return res.status(200).json({
      status: 'success',
      keys: redeemedKeys,
      message: `Successfully pulled ${redeemedKeys.length} key(s)`,
      remaining_balance: remainingBalance
    });

  } catch (error: any) {
    console.error(error);
    const msg = error.message || 'Internal server error';
    const statusCode = msg.includes("Insufficient balance") || msg.includes("No keys") ? 400 : 500;
    return res.status(statusCode).json({ status: 'error', message: msg });
  }
}
