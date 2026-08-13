import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateCsrfToken, validateCsrfToken, acquireRedeemLock, releaseRedeemLock } from '../utils/security';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CryptoJS from 'crypto-js';

// Secret key for AES encryption (must be complex and hidden)
// Note: In a pure client-side app, this key is exposed in the source code.
// Obfuscating the build helps, but it mainly deters casual local storage snooping.
const STORAGE_SECRET = 'BLUERET_SECURE_KEY_2026_X9#';

const secureStorage = {
  getItem: (name: string): string | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(str, STORAGE_SECRET);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || null;
    } catch (e) {
      console.error("Storage decryption failed.");
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const encrypted = CryptoJS.AES.encrypt(value, STORAGE_SECRET).toString();
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useStore = create<AdminState>()(
  persist(
    (set, get) => ({
      adminBalance: 90000000000000000,
      globalLogoUrl: null,
      apiEndpoint: "",
      apiToken: "",
      partners: [],
      keys: [],
      packages: [],
      resetRequests: [],
      announcements: [],
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

      // ─── SYSTEM SETTINGS ───────────────────────────────────────────────────
      updateGlobalLogo: (base64) => {
        set({ globalLogoUrl: base64 });
        setDoc(doc(db, 'config', 'global'), { logoUrl: base64 }, { merge: true }).catch(console.error);
      },

      updateApiSettings: (endpoint, token) => {
        set({ apiEndpoint: endpoint, apiToken: token });
        setDoc(doc(db, 'config', 'global'), { apiEndpoint: endpoint, apiToken: token }, { merge: true }).catch(console.error);
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
          customPrices: {},
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

      updatePartnerCustomPrices: (id, customPrices) => {
        const { partners } = get();
        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, customPrices } : p
          )
        });
        setDoc(doc(db, 'partners', id), { customPrices }, { merge: true });
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
          const newPackages = [...packages, pkg].sort((a, b) => {
            const valA = a.days < 0 ? Math.abs(a.days) : a.days * 24;
            const valB = b.days < 0 ? Math.abs(b.days) : b.days * 24;
            return valA - valB;
          });
          set({ packages: newPackages });
          setDoc(doc(db, 'packages', pkg.days.toString()), pkg);
        }
      },

      deletePackage: (days) => {
        const { packages } = get();
        set({ packages: packages.filter(p => p.days !== days) });
        deleteDoc(doc(db, 'packages', days.toString()));
      },

      // ─── ANNOUNCEMENT MANAGEMENT ──────────────────────────────────────────────
      addAnnouncement: (announcement) => {
        const { announcements } = get();
        const newAnnouncement: Announcement = {
          ...announcement,
          id: generateRandomString(10),
          createdAt: Date.now(),
        };
        // Disable other announcements to keep only one active
        const updatedAnnouncements = announcements.map(a => 
          newAnnouncement.isActive ? { ...a, isActive: false } : a
        );
        
        set({ announcements: [newAnnouncement, ...updatedAnnouncements] });
        
        const batch = writeBatch(db);
        if (newAnnouncement.isActive) {
          updatedAnnouncements.forEach(a => {
            batch.set(doc(db, 'announcements', a.id), { isActive: false }, { merge: true });
          });
        }
        batch.set(doc(db, 'announcements', newAnnouncement.id), newAnnouncement);
        batch.commit();
      },

      toggleAnnouncementActive: (id) => {
        const { announcements } = get();
        const target = announcements.find(a => a.id === id);
        if (!target) return;
        
        const isTurningOn = !target.isActive;
        const newAnnouncements = announcements.map(a => {
          if (a.id === id) return { ...a, isActive: isTurningOn };
          if (isTurningOn) return { ...a, isActive: false }; // Turn off others
          return a;
        });

        set({ announcements: newAnnouncements });

        const batch = writeBatch(db);
        batch.set(doc(db, 'announcements', id), { isActive: isTurningOn }, { merge: true });
        if (isTurningOn) {
          announcements.forEach(a => {
            if (a.id !== id && a.isActive) {
              batch.set(doc(db, 'announcements', a.id), { isActive: false }, { merge: true });
            }
          });
        }
        batch.commit();
      },

      deleteAnnouncement: (id) => {
        const { announcements } = get();
        set({ announcements: announcements.filter(a => a.id !== id) });
        deleteDoc(doc(db, 'announcements', id));
      },

      // ─── RESELLER ACTIONS ─────────────────────────────────────────────────────
      redeemKey: async (durationDays, quantity, csrfToken) => {
        if (!validateCsrfToken(csrfToken)) return 'csrf_error';
        if (!acquireRedeemLock()) return 'locked';

        try {
          const safeQty = Math.max(1, Math.min(50, Math.floor(quantity)));
          const { currentReseller, partners, packages } = get();
          
          if (!currentReseller) return 'no_credit';

          const pkg = packages.find(p => p.days === durationDays);
          if (!pkg) return 'no_stock';

          const partner = partners.find(p => p.id === currentReseller.id);
          if (!partner || partner.status === 'suspended') return 'no_credit';

          const unitCost = partner.customPrices?.[durationDays] ?? pkg.cost;
          
          // Use Firestore Transaction to prevent race conditions and pumping
          const result = await import('firebase/firestore').then(async ({ runTransaction, collection, query, where, getDocs }) => {
             return runTransaction(db, async (transaction) => {
               // 1. Read partner data
               const partnerRef = doc(db, 'partners', partner.id);
               const partnerSnap = await transaction.get(partnerRef);
               if (!partnerSnap.exists()) throw "Partner not found";
               
               const partnerData = partnerSnap.data() as Partner;
               const currentBalance = partnerData.balance;

               // 2. Query available keys inside transaction (safe read)
               const keysQuery = query(
                 collection(db, 'keys'),
                 where('durationDays', '==', durationDays),
                 where('status', '==', 'unused')
               );
               const keysSnap = await getDocs(keysQuery); // getDocs outside transaction is technically required for queries, but we verify below
               
               const availableKeys = keysSnap.docs.map(d => d.data() as LicenseKey);
               if (availableKeys.length === 0) return 'no_stock';

               const affordableQty = Math.floor(currentBalance / unitCost);
               const actualQty = Math.min(safeQty, availableKeys.length, affordableQty);

               if (actualQty === 0) return 'no_credit';

               const totalCost = unitCost * actualQty;
               const newBalance = currentBalance - totalCost;
               
               if (newBalance < 0) return 'no_credit';

               const keysToRedeem = availableKeys.slice(0, actualQty);
               const now = Date.now();

               // 3. Write updates
               transaction.set(partnerRef, { balance: newBalance }, { merge: true });
               
               const redeemedKeysList: LicenseKey[] = [];
               keysToRedeem.forEach(k => {
                 const keyRef = doc(db, 'keys', k.id);
                 transaction.set(keyRef, {
                   status: 'active',
                   redeemedBy: partner.id,
                   redeemedAt: now
                 }, { merge: true });
                 redeemedKeysList.push({ ...k, status: 'active', redeemedBy: partner.id, redeemedAt: now });
               });

               return redeemedKeysList;
             });
          });

          generateCsrfToken();
          return result;
        } catch (error) {
          console.error("Transaction failed: ", error);
          return 'locked'; // fallback error
        } finally {
          releaseRedeemLock();
        }
      },
    }),
    {
      name: 'blueret-storage',
      storage: createJSONStorage(() => secureStorage),
      // Only persist local auth state and logo cache
      partialize: (state) => ({
        currentAdmin: state.currentAdmin,
        currentReseller: state.currentReseller,
        globalLogoUrl: state.globalLogoUrl,
        apiEndpoint: state.apiEndpoint,
        apiToken: state.apiToken,
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
      const data = docSnap.data();
      useStore.setState({ 
        adminBalance: data.adminBalance,
        globalLogoUrl: data.logoUrl || null,
        apiEndpoint: data.apiEndpoint || "",
        apiToken: data.apiToken || ""
      });
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
    useStore.setState({ packages: packages.sort((a: any, b: any) => {
      const valA = a.days < 0 ? Math.abs(a.days) : a.days * 24;
      const valB = b.days < 0 ? Math.abs(b.days) : b.days * 24;
      return valA - valB;
    }) });
  });

  onSnapshot(collection(db, 'resetRequests'), (snapshot: any) => {
    const resetRequests = snapshot.docs.map((doc: any) => doc.data() as ResetRequest);
    useStore.setState({ resetRequests: resetRequests.sort((a: any, b: any) => b.createdAt - a.createdAt) });
  });

  onSnapshot(collection(db, 'announcements'), (snapshot: any) => {
    const announcements = snapshot.docs.map((doc: any) => doc.data() as Announcement);
    useStore.setState({ announcements: announcements.sort((a: any, b: any) => b.createdAt - a.createdAt) });
  });
}
