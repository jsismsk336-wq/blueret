import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateCsrfToken, validateCsrfToken, acquireRedeemLock, releaseRedeemLock } from '../utils/security';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Partner {
  id: string;
  username: string;
  password: string;
  role: string;
  balance: number;
  status: 'active' | 'suspended';
}

export interface LicenseKey {
  id: string;
  keyString: string;
  durationDays: number;
  createdAt: number;
  status: 'unused' | 'active';
  hwid: string | null;
  createdBy: string;
  redeemedBy: string | null;
  redeemedAt: number | null;
}

export interface Package {
  days: number;
  label: string;
  cost: number;
}

export interface ResetRequest {
  id: string;
  keyId: string;
  keyString: string;
  resellerId: string;
  resellerName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

interface AdminState {
  adminBalance: number;
  partners: Partner[];
  keys: LicenseKey[];
  packages: Package[];
  resetRequests: ResetRequest[];
  currentAdmin: boolean;
  currentReseller: Partner | null;

  // Auth
  login: (username: string, password: string) => 'admin' | 'reseller' | 'error';
  logoutAdmin: () => void;
  logoutReseller: () => void;

  // Partner CRUD
  addPartner: (username: string, password: string) => void;
  updatePartnerBalance: (id: string, amount: number) => void;
  updatePartnerPassword: (id: string, newPassword: string) => void;
  togglePartnerStatus: (id: string) => void;
  deletePartner: (id: string) => void;

  // Key management (admin)
  generateKey: (durationDays: number, cost: number, creator: string, amount?: number) => boolean;
  importKeys: (durationDays: number, importedKeys: string[], creator: string) => void;
  resetHwid: (id: string) => void;
  deleteKey: (id: string) => void;
  deleteAllKeys: () => void;
  clearStockByDuration: (durationDays: number) => void;

  // Reset Requests Management
  requestReset: (keyId: string, keyString: string) => void;
  approveReset: (requestId: string) => void;
  rejectReset: (requestId: string) => void;

  // Package management (admin)
  updatePackageCost: (days: number, newCost: number) => void;
  addPackage: (pkg: Package) => void;
  deletePackage: (days: number) => void;

  // Reseller action - requires CSRF token
  redeemKey: (durationDays: number, quantity: number, csrfToken: string) => LicenseKey[] | 'no_stock' | 'no_credit' | 'csrf_error' | 'locked' | 'partial';
}

const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const initialPartners: Partner[] = [
  { id: '1', username: 'Seeyou', password: '123456', role: 'พาร์ทเนอร์พอร์ตทัล', balance: 100.0, status: 'active' },
  { id: '2', username: 'devlucky', password: '123456', role: 'พาร์ทเนอร์พอร์ตทัล', balance: 90000000000000000, status: 'active' },
];

const initialKeys: LicenseKey[] = [
  {
    id: 'k1',
    keyString: 'BLUERET-WYJJAS-YNZJB',
    durationDays: 30,
    createdAt: Date.now() - 1000000,
    status: 'active',
    hwid: 'LUCKY-RE2P****YH',
    createdBy: 'devlucky',
    redeemedBy: null,
    redeemedAt: null,
  }
];

const initialPackages: Package[] = [
  { days: 1, label: '1 Day', cost: 10 },
  { days: 3, label: '3 Days', cost: 25 },
  { days: 7, label: '7 Days', cost: 50 },
  { days: 30, label: '30 Days', cost: 150 },
];

export const useStore = create<AdminState>()(
  persist(
    (set, get) => ({
      adminBalance: 90000000000000000,
      partners: [],
      keys: [],
      packages: [],
      resetRequests: [],
      currentAdmin: false,
      currentReseller: null,

      // ─── AUTH ───────────────────────────────────────────────────────────────
      login: (username, password) => {
        if (username === 'admin' && password === 'admin1234') {
          set({ currentAdmin: true });
          generateCsrfToken();
          return 'admin';
        }
        const { partners } = get();
        const safeUser = username.trim().toLowerCase();
        const safePass = password.trim();
        const partner = partners.find(p => p.username.trim().toLowerCase() === safeUser && p.password === safePass);
        if (partner) {
          if (partner.status === 'suspended') return 'error';
          set({ currentReseller: partner });
          generateCsrfToken();
          return 'reseller';
        }
        return 'error';
      },

      logoutAdmin: () => {
        set({ currentAdmin: false });
        generateCsrfToken();
      },

      logoutReseller: () => {
        set({ currentReseller: null });
        generateCsrfToken();
      },

      // ─── PARTNER CRUD ────────────────────────────────────────────────────────
      addPartner: (username, password) => {
        const { partners } = get();
        const newPartner: Partner = {
          id: Math.random().toString(36).substring(2, 11),
          username,
          password,
          role: 'พาร์ทเนอร์พอร์ตทัล',
          balance: 0,
          status: 'active',
        };
        set({ partners: [...partners, newPartner] });
        setDoc(doc(db, 'partners', newPartner.id), newPartner);
      },

      updatePartnerBalance: (id, amount) => {
        const { partners } = get();
        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, balance: amount } : p
          )
        });
        setDoc(doc(db, 'partners', id), { balance: amount }, { merge: true });
      },

      updatePartnerPassword: (id, newPassword) => {
        const { partners } = get();
        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, password: newPassword } : p
          )
        });
        setDoc(doc(db, 'partners', id), { password: newPassword }, { merge: true });
      },

      togglePartnerStatus: (id) => {
        const { partners } = get();
        const partner = partners.find(p => p.id === id);
        if (!partner) return;
        const newStatus = partner.status === 'active' ? 'suspended' : 'active';
        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, status: newStatus } : p
          )
        });
        setDoc(doc(db, 'partners', id), { status: newStatus }, { merge: true });
      },

      deletePartner: (id) => {
        const { partners } = get();
        set({ partners: partners.filter(p => p.id !== id) });
        deleteDoc(doc(db, 'partners', id));
      },

      // ─── KEY MANAGEMENT ──────────────────────────────────────────────────────
      generateKey: (durationDays, cost, creator, amount = 1) => {
        const { adminBalance, keys } = get();
        const totalCost = cost * amount;

        if (adminBalance < totalCost) return false;

        const newKeys: LicenseKey[] = Array.from({ length: amount }).map(() => ({
          id: generateRandomString(8),
          keyString: `BLUERET-${generateRandomString(4)}-${generateRandomString(4)}-${generateRandomString(4)}`,
          durationDays,
          createdAt: Date.now(),
          status: 'unused' as const,
          hwid: null,
          createdBy: creator,
          redeemedBy: null,
          redeemedAt: null,
        }));

        const newBalance = adminBalance - totalCost;
        set({
          adminBalance: newBalance,
          keys: [...newKeys, ...keys],
        });

        const batch = writeBatch(db);
        batch.set(doc(db, 'config', 'global'), { adminBalance: newBalance }, { merge: true });
        newKeys.forEach(k => {
          batch.set(doc(db, 'keys', k.id), k);
        });
        batch.commit();

        return true;
      },

      importKeys: (durationDays, importedKeys, creator) => {
        const { keys } = get();
        const newKeys: LicenseKey[] = importedKeys.map(keyString => ({
          id: generateRandomString(8),
          keyString,
          durationDays,
          createdAt: Date.now(),
          status: 'unused' as const,
          hwid: null,
          createdBy: creator,
          redeemedBy: null,
          redeemedAt: null,
        }));

        set({ keys: [...newKeys, ...keys] });
        
        const batch = writeBatch(db);
        newKeys.forEach(k => {
          batch.set(doc(db, 'keys', k.id), k);
        });
        batch.commit();
      },

      resetHwid: (id) => {
        const { keys } = get();
        set({
          keys: keys.map(k => k.id === id ? { ...k, hwid: null, status: 'unused' as const } : k),
        });
        setDoc(doc(db, 'keys', id), { hwid: null, status: 'unused' }, { merge: true });
      },

      deleteKey: (id) => {
        const { keys } = get();
        set({ keys: keys.filter(k => k.id !== id) });
        deleteDoc(doc(db, 'keys', id));
      },

      deleteAllKeys: () => {
        const { keys } = get();
        set({ keys: [] });
        const batch = writeBatch(db);
        keys.forEach(k => {
          batch.delete(doc(db, 'keys', k.id));
        });
        batch.commit();
      },

      clearStockByDuration: (durationDays) => {
        const { keys } = get();
        const keysToRemove = keys.filter(k => k.durationDays === durationDays && k.status === 'unused');
        set({ keys: keys.filter(k => !(k.durationDays === durationDays && k.status === 'unused')) });
        
        const batch = writeBatch(db);
        keysToRemove.forEach(k => {
          batch.delete(doc(db, 'keys', k.id));
        });
        batch.commit();
      },

      // ─── RESET REQUESTS MANAGEMENT ───────────────────────────────────────────
      requestReset: (keyId, keyString) => {
        const { currentReseller, resetRequests } = get();
        if (!currentReseller) return;
        
        if (resetRequests.some(r => r.keyId === keyId && r.status === 'pending')) {
          return;
        }

        const newRequest: ResetRequest = {
          id: generateRandomString(10),
          keyId,
          keyString,
          resellerId: currentReseller.id,
          resellerName: currentReseller.username,
          status: 'pending',
          createdAt: Date.now(),
        };

        set({ resetRequests: [newRequest, ...resetRequests] });
        setDoc(doc(db, 'resetRequests', newRequest.id), newRequest);
      },

      approveReset: (requestId) => {
        const { resetRequests, keys } = get();
        const request = resetRequests.find(r => r.id === requestId);
        
        if (request && request.status === 'pending') {
          const newKeys = keys.map(k => 
            k.id === request.keyId ? { ...k, hwid: null } : k
          );
          const newRequests = resetRequests.map(r =>
            r.id === requestId ? { ...r, status: 'approved' as const } : r
          );

          set({ keys: newKeys, resetRequests: newRequests });
          
          const batch = writeBatch(db);
          batch.set(doc(db, 'keys', request.keyId), { hwid: null }, { merge: true });
          batch.set(doc(db, 'resetRequests', requestId), { status: 'approved' }, { merge: true });
          batch.commit();
        }
      },

      rejectReset: (requestId) => {
        const { resetRequests } = get();
        set({
          resetRequests: resetRequests.map(r =>
            r.id === requestId ? { ...r, status: 'rejected' as const } : r
          )
        });
        setDoc(doc(db, 'resetRequests', requestId), { status: 'rejected' }, { merge: true });
      },

      // ─── PACKAGE MANAGEMENT ──────────────────────────────────────────────────
      updatePackageCost: (days, newCost) => {
        const { packages } = get();
        set({
          packages: packages.map(pkg =>
            pkg.days === days ? { ...pkg, cost: newCost } : pkg
          )
        });
        setDoc(doc(db, 'packages', days.toString()), { cost: newCost }, { merge: true });
      },

      addPackage: (pkg) => {
        const { packages } = get();
        if (!packages.find(p => p.days === pkg.days)) {
          const newPackages = [...packages, pkg].sort((a, b) => a.days - b.days);
          set({ packages: newPackages });
          setDoc(doc(db, 'packages', pkg.days.toString()), pkg);
        }
      },

      deletePackage: (days) => {
        const { packages } = get();
        set({ packages: packages.filter(p => p.days !== days) });
        deleteDoc(doc(db, 'packages', days.toString()));
      },

      // ─── RESELLER ACTIONS ─────────────────────────────────────────────────────
      redeemKey: (durationDays, quantity, csrfToken) => {
        if (!validateCsrfToken(csrfToken)) return 'csrf_error';
        if (!acquireRedeemLock()) return 'locked';

        try {
          const safeQty = Math.max(1, Math.min(50, Math.floor(quantity)));
          const { currentReseller, keys, partners, packages } = get();
          
          if (!currentReseller) return 'no_credit';

          const pkg = packages.find(p => p.days === durationDays);
          if (!pkg) return 'no_stock';

          const partner = partners.find(p => p.id === currentReseller.id);
          if (!partner || partner.status === 'suspended') return 'no_credit';

          const availableKeys = keys.filter(k => k.durationDays === durationDays && k.status === 'unused');
          if (availableKeys.length === 0) return 'no_stock';

          const affordableQty = Math.floor(partner.balance / pkg.cost);
          const actualQty = Math.min(safeQty, availableKeys.length, affordableQty);

          if (actualQty === 0) return 'no_credit';

          const totalCost = pkg.cost * actualQty;
          const newBalance = partner.balance - totalCost;
          if (newBalance < 0) return 'no_credit';

          const keysToRedeem = availableKeys.slice(0, actualQty);
          const redeemedIds = new Set(keysToRedeem.map(k => k.id));
          const now = Date.now();

          set({
            partners: partners.map(p =>
              p.id === partner.id ? { ...p, balance: newBalance } : p
            ),
            keys: keys.map(k =>
              redeemedIds.has(k.id)
                ? { ...k, status: 'active' as const, redeemedBy: partner.id, redeemedAt: now }
                : k
            ),
            currentReseller: { ...partner, balance: newBalance },
          });

          const batch = writeBatch(db);
          batch.set(doc(db, 'partners', partner.id), { balance: newBalance }, { merge: true });
          keysToRedeem.forEach(k => {
            batch.set(doc(db, 'keys', k.id), {
              status: 'active',
              redeemedBy: partner.id,
              redeemedAt: now
            }, { merge: true });
          });
          batch.commit();

          generateCsrfToken();

          return keysToRedeem.map(k => ({ ...k, status: 'active' as const, redeemedBy: partner.id, redeemedAt: now }));
        } finally {
          releaseRedeemLock();
        }
      },
    }),
    {
      name: 'blueret-storage',
      // Only persist local auth state
      partialize: (state) => ({
        currentAdmin: state.currentAdmin,
        currentReseller: state.currentReseller,
      }),
    }
  )
);

export async function initFirebaseSync() {
  const globalConfigRef = doc(db, 'config', 'global');
  const globalConfigSnap = await getDoc(globalConfigRef);

  if (!globalConfigSnap.exists()) {
    const batch = writeBatch(db);
    batch.set(globalConfigRef, { adminBalance: 90000000000000000 });
    
    initialPartners.forEach(p => {
      batch.set(doc(db, 'partners', p.id), p);
    });
    
    initialKeys.forEach(k => {
      batch.set(doc(db, 'keys', k.id), k);
    });
    
    initialPackages.forEach(p => {
      batch.set(doc(db, 'packages', p.days.toString()), p);
    });
    
    await batch.commit();
  }

  onSnapshot(globalConfigRef, (docSnap: any) => {
    if (docSnap.exists()) {
      useStore.setState({ adminBalance: docSnap.data().adminBalance });
    }
  });

  onSnapshot(collection(db, 'partners'), (snapshot: any) => {
    const partners = snapshot.docs.map((doc: any) => doc.data() as Partner);
    useStore.setState({ partners });
  });

  onSnapshot(collection(db, 'keys'), (snapshot: any) => {
    const keys = snapshot.docs.map((doc: any) => doc.data() as LicenseKey);
    useStore.setState({ keys });
  });

  onSnapshot(collection(db, 'packages'), (snapshot: any) => {
    const packages = snapshot.docs.map((doc: any) => doc.data() as Package);
    useStore.setState({ packages: packages.sort((a: any, b: any) => a.days - b.days) });
  });

  onSnapshot(collection(db, 'resetRequests'), (snapshot: any) => {
    const resetRequests = snapshot.docs.map((doc: any) => doc.data() as ResetRequest);
    useStore.setState({ resetRequests: resetRequests.sort((a: any, b: any) => b.createdAt - a.createdAt) });
  });
}
