import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateCsrfToken, validateCsrfToken, acquireRedeemLock, releaseRedeemLock } from '../utils/security';

// BroadcastChannel for cross-tab key sync
const _channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('blueret-keys') : null;

// Helper: read freshest keys directly from localStorage (bypasses in-memory state)
function getFreshKeysFromStorage(): LicenseKey[] | null {
  try {
    const raw = localStorage.getItem('blueret-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.keys ?? null;
  } catch {
    return null;
  }
}

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
  redeemedBy: string | null;   // partner id who pulled this key
  redeemedAt: number | null;   // timestamp when pulled
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
  currentUser: Partner | 'admin' | null;

  // Auth
  login: (username: string, password: string) => 'admin' | 'reseller' | 'error';
  logout: () => void;

  // Partner CRUD
  addPartner: (username: string, password: string) => void;
  updatePartnerBalance: (id: string, amount: number) => void;
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
      partners: initialPartners,
      keys: initialKeys,
      packages: initialPackages,
      resetRequests: [],
      currentUser: null,

      // ─── AUTH ───────────────────────────────────────────────────────────────
      login: (username, password) => {
        // Check admin
        if (username === 'admin' && password === 'admin1234') {
          set({ currentUser: 'admin' });
          generateCsrfToken(); // generate fresh token on login
          return 'admin';
        }
        // Check partners
        const { partners } = get();
        const partner = partners.find(p => p.username === username && p.password === password);
        if (partner) {
          if (partner.status === 'suspended') return 'error';
          set({ currentUser: partner });
          generateCsrfToken(); // generate fresh token on login
          return 'reseller';
        }
        return 'error';
      },

      logout: () => {
        set({ currentUser: null });
        generateCsrfToken(); // rotate token on logout
      },

      // ─── PARTNER CRUD ────────────────────────────────────────────────────────
      addPartner: (username, password) => {
        const { partners } = get();
        const newPartner: Partner = {
          id: Math.random().toString(36).substr(2, 9),
          username,
          password,
          role: 'พาร์ทเนอร์พอร์ตทัล',
          balance: 0,
          status: 'active',
        };
        set({ partners: [...partners, newPartner] });
      },

      updatePartnerBalance: (id, amount) => {
        const { partners } = get();
        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, balance: amount } : p
          )
        });
      },

      togglePartnerStatus: (id) => {
        const { partners } = get();
        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, status: p.status === 'active' ? 'suspended' : 'active' } : p
          )
        });
      },

      deletePartner: (id) => {
        const { partners } = get();
        set({ partners: partners.filter(p => p.id !== id) });
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

        set({
          adminBalance: adminBalance - totalCost,
          keys: [...newKeys, ...keys],
        });
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
      },

      resetHwid: (id) => {
        const { keys } = get();
        set({
          keys: keys.map(k => k.id === id ? { ...k, hwid: null, status: 'unused' as const } : k),
        });
      },

      deleteKey: (id) => {
        const { keys } = get();
        set({ keys: keys.filter(k => k.id !== id) });
      },

      deleteAllKeys: () => {
        set({ keys: [] });
      },

      clearStockByDuration: (durationDays) => {
        const { keys } = get();
        set({ keys: keys.filter(k => !(k.durationDays === durationDays && k.status === 'unused')) });
      },

      // ─── RESET REQUESTS MANAGEMENT ───────────────────────────────────────────
      requestReset: (keyId, keyString) => {
        const { currentUser, resetRequests } = get();
        if (!currentUser || currentUser === 'admin') return;
        
        // Prevent duplicate pending requests for the same key
        if (resetRequests.some(r => r.keyId === keyId && r.status === 'pending')) {
          return;
        }

        const newRequest: ResetRequest = {
          id: generateRandomString(10),
          keyId,
          keyString,
          resellerId: currentUser.id,
          resellerName: currentUser.username,
          status: 'pending',
          createdAt: Date.now(),
        };

        set({ resetRequests: [newRequest, ...resetRequests] });
      },

      approveReset: (requestId) => {
        const { resetRequests, keys } = get();
        const request = resetRequests.find(r => r.id === requestId);
        
        if (request && request.status === 'pending') {
          // Reset the HWID
          const newKeys = keys.map(k => 
            k.id === request.keyId ? { ...k, hwid: null, status: 'unused' as const } : k
          );
          
          // Update request status
          const newRequests = resetRequests.map(r =>
            r.id === requestId ? { ...r, status: 'approved' as const } : r
          );

          set({ keys: newKeys, resetRequests: newRequests });
        }
      },

      rejectReset: (requestId) => {
        const { resetRequests } = get();
        set({
          resetRequests: resetRequests.map(r =>
            r.id === requestId ? { ...r, status: 'rejected' as const } : r
          )
        });
      },

      // ─── PACKAGE MANAGEMENT ──────────────────────────────────────────────────
      updatePackageCost: (days, newCost) => {
        const { packages } = get();
        set({
          packages: packages.map(pkg =>
            pkg.days === days ? { ...pkg, cost: newCost } : pkg
          )
        });
      },

      addPackage: (pkg) => {
        const { packages } = get();
        if (!packages.find(p => p.days === pkg.days)) {
          const newPackages = [...packages, pkg].sort((a, b) => a.days - b.days);
          set({ packages: newPackages });
        }
      },

      deletePackage: (days) => {
        const { packages } = get();
        set({ packages: packages.filter(p => p.days !== days) });
      },

      // ─── RESELLER ACTIONS ─────────────────────────────────────────────────────
      redeemKey: (durationDays, quantity, csrfToken) => {
        // 1. CSRF validation
        if (!validateCsrfToken(csrfToken)) return 'csrf_error';

        // 2. Mutex lock - prevent race conditions / double-tap
        if (!acquireRedeemLock()) return 'locked';

        try {
          const safeQty = Math.max(1, Math.min(50, Math.floor(quantity)));

          // 3. *** CROSS-TAB PROTECTION ***
          // Re-read keys directly from localStorage to see changes made by OTHER tabs/resellers
          const freshKeys = getFreshKeysFromStorage();

          // Merge fresh keys into in-memory store so we work with absolute latest state
          if (freshKeys) {
            set((state) => ({ ...state, keys: freshKeys }));
          }

          // Now read the updated in-memory state
          const { currentUser, keys, partners, packages } = get();
          if (!currentUser || currentUser === 'admin') return 'no_credit';

          const pkg = packages.find(p => p.days === durationDays);
          if (!pkg) return 'no_stock';

          const partner = partners.find(p => p.id === currentUser.id);
          if (!partner || partner.status === 'suspended') return 'no_credit';

          // 4. Check stock using FRESH keys from localStorage
          const availableKeys = keys.filter(k => k.durationDays === durationDays && k.status === 'unused');
          if (availableKeys.length === 0) return 'no_stock';

          // 5. Calculate how many we can actually redeem
          const affordableQty = Math.floor(partner.balance / pkg.cost);
          const actualQty = Math.min(safeQty, availableKeys.length, affordableQty);

          if (actualQty === 0) return 'no_credit';

          const totalCost = pkg.cost * actualQty;
          const newBalance = partner.balance - totalCost;
          if (newBalance < 0) return 'no_credit';

          const keysToRedeem = availableKeys.slice(0, actualQty);
          const redeemedIds = new Set(keysToRedeem.map(k => k.id));
          const now = Date.now();

          // 6. Atomic single set() — all or nothing, writes to localStorage immediately
          set({
            partners: partners.map(p =>
              p.id === partner.id ? { ...p, balance: newBalance } : p
            ),
            keys: keys.map(k =>
              redeemedIds.has(k.id)
                ? { ...k, status: 'active' as const, redeemedBy: partner.id, redeemedAt: now }
                : k
            ),
            currentUser: { ...partner, balance: newBalance },
          });

          // 7. Broadcast redeemed key IDs to ALL other open tabs immediately
          _channel?.postMessage({
            type: 'KEYS_REDEEMED',
            redeemedIds: [...redeemedIds],
            partnerId: partner.id,
            timestamp: now,
          });

          // 8. Rotate CSRF token
          generateCsrfToken();

          return keysToRedeem.map(k => ({ ...k, status: 'active' as const, redeemedBy: partner.id, redeemedAt: now }));
        } finally {
          releaseRedeemLock();
        }
      },
    }),
    {
      name: 'blueret-storage',
      partialize: (state) => ({
        partners: state.partners,
        keys: state.keys,
        packages: state.packages,
        resetRequests: state.resetRequests,
        adminBalance: state.adminBalance,
        currentUser: state.currentUser, // เซฟเซสชั่นเพื่อให้รีเฟรชแล้วไม่หลุด
      }),
    }
  )
);
