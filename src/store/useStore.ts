import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateCsrfToken, validateCsrfToken, acquireRedeemLock, releaseRedeemLock } from '../utils/security';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, onSnapshot, collection, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CryptoJS from 'crypto-js';
import { sendDiscordLog, COLORS } from '../utils/discord';

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

export interface Partner {
  id: string;
  username: string;
  password: string;
  role: string;
  balance: number;
  status: 'active' | 'suspended';
  customPrices?: Record<number, number>;
  apiToken?: string;
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

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  imageBase64: string | null;
  isActive: boolean;
  createdAt: number;
}

export interface WebhookConfig {
  url: string;
  enabled: boolean;
}

export interface WebhooksState {
  adminLogs: WebhookConfig;
  resellerLogs: WebhookConfig;
  systemLogs: WebhookConfig;
}

interface AdminState {
  adminBalance: number;
  globalLogoUrl: string | null;
  apiEndpoint: string | null;
  apiToken: string | null;
  adminPasswordHash: string | null;
  partners: Partner[];
  keys: LicenseKey[];
  packages: Package[];
  resetRequests: ResetRequest[];
  announcements: Announcement[];
  webhooks: WebhooksState;
  currentAdmin: boolean;
  currentReseller: Partner | null;

  // Auth
  login: (username: string, password: string) => 'admin' | 'reseller' | 'error';
  logoutAdmin: () => void;
  logoutReseller: () => void;

  // System Settings
  updateGlobalLogo: (base64: string | null) => void;
  updateApiSettings: (endpoint: string, token: string) => void;
  updateWebhook: (type: keyof WebhooksState, config: WebhookConfig) => void;
  updateAdminPassword: (currentPass: string, newPass: string) => boolean;

  // Partner CRUD
  addPartner: (username: string, password: string) => void;
  updatePartnerBalance: (id: string, amount: number) => void;
  updatePartnerPassword: (id: string, newPassword: string) => void;
  togglePartnerStatus: (id: string) => void;
  deletePartner: (id: string) => void;
  updatePartnerCustomPrices: (id: string, customPrices: Record<number, number>) => void;
  resetPartnerApiToken: (id: string) => void;

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

  // Announcement management (admin)
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  toggleAnnouncementActive: (id: string) => void;
  deleteAnnouncement: (id: string) => void;

  // Reseller action - requires CSRF token
  redeemKey: (durationDays: number, quantity: number, csrfToken: string) => Promise<LicenseKey[] | 'no_stock' | 'no_credit' | 'csrf_error' | 'locked' | 'partial'>;
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
  { id: '1', username: 'Seeyou', password: '123456', role: 'พาร์ทเนอร์พอร์ตทัล', balance: 100.0, status: 'active', customPrices: {} },
  { id: '2', username: 'devlucky', password: '123456', role: 'พาร์ทเนอร์พอร์ตทัล', balance: 90000000000000000, status: 'active', customPrices: {} },
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
      globalLogoUrl: null,
      apiEndpoint: "",
      apiToken: "",
      adminPasswordHash: null,
      partners: [],
      keys: [],
      packages: [],
      resetRequests: [],
      announcements: [],
      webhooks: {
        adminLogs: { url: '', enabled: false },
        resellerLogs: { url: '', enabled: false },
        systemLogs: { url: '', enabled: false },
      },
      currentAdmin: false,
      currentReseller: null,

      // ─── AUTH ───────────────────────────────────────────────────────────────
      login: (username, password) => {
        if (username === 'admin') {
          const { adminPasswordHash } = get();
          const inputHash = CryptoJS.SHA256(password).toString();
          
          if (adminPasswordHash) {
            if (inputHash === adminPasswordHash) {
              set({ currentAdmin: true });
              generateCsrfToken();
              return 'admin';
            }
          } else {
            if (password === 'admin1234') {
              set({ currentAdmin: true });
              generateCsrfToken();
              return 'admin';
            }
          }
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

      updateWebhook: (type, config) => {
        const { webhooks } = get();
        const newWebhooks = { ...webhooks, [type]: config };
        set({ webhooks: newWebhooks });
        setDoc(doc(db, 'config', 'webhooks'), newWebhooks, { merge: true }).catch(console.error);
      },

      updateAdminPassword: (currentPass, newPass) => {
        const { adminPasswordHash, webhooks } = get();
        const currentInputHash = CryptoJS.SHA256(currentPass).toString();
        
        if (adminPasswordHash) {
          if (currentInputHash !== adminPasswordHash) return false;
        } else {
          if (currentPass !== 'admin1234') return false;
        }

        const newHash = CryptoJS.SHA256(newPass).toString();
        set({ adminPasswordHash: newHash });
        setDoc(doc(db, 'config', 'global'), { adminPasswordHash: newHash }, { merge: true }).catch(console.error);
        
        if (webhooks.adminLogs?.enabled && webhooks.adminLogs.url) {
          sendDiscordLog(webhooks.adminLogs.url, {
            embeds: [{
              title: "🔐 เปลี่ยนรหัสผ่านหลักสำเร็จ",
              description: `รหัสผ่านเข้าหลังบ้านของแอดมินถูกเปลี่ยนแปลงเรียบร้อยแล้ว`,
              color: COLORS.WARNING,
              timestamp: new Date().toISOString()
            }]
          });
        }
        return true;
      },

      // ─── PARTNER CRUD ────────────────────────────────────────────────────────
      addPartner: (username, password) => {
        const { partners, webhooks } = get();
        const newPartner: Partner = {
          id: Math.random().toString(36).substring(2, 11),
          username,
          password,
          role: 'พาร์ทเนอร์พอร์ตทัล',
          balance: 0,
          status: 'active',
          customPrices: {},
          apiToken: 'sk_live_' + generateRandomString(24),
        };
        set({ partners: [...partners, newPartner] });
        setDoc(doc(db, 'partners', newPartner.id), newPartner);

        if (webhooks.adminLogs?.enabled && webhooks.adminLogs.url) {
          sendDiscordLog(webhooks.adminLogs.url, {
            embeds: [{
              title: "✅ เพิ่มตัวแทนใหม่",
              description: `เพิ่มตัวแทน **${username}** เข้าสู่ระบบแล้ว`,
              color: COLORS.SUCCESS,
              timestamp: new Date().toISOString()
            }]
          });
        }
      },

      updatePartnerBalance: (id, amount) => {
        const { partners, webhooks } = get();
        const partner = partners.find(p => p.id === id);
        if (!partner) return;

        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, balance: amount } : p
          )
        });
        setDoc(doc(db, 'partners', id), { balance: amount }, { merge: true });

        if (webhooks.adminLogs?.enabled && webhooks.adminLogs.url && partner.balance !== amount) {
          sendDiscordLog(webhooks.adminLogs.url, {
            embeds: [{
              title: "💰 ปรับเครดิตตัวแทน",
              description: `ปรับเครดิตตัวแทน **${partner.username}**`,
              color: COLORS.INFO,
              fields: [
                { name: "จากเดิม", value: `${partner.balance}`, inline: true },
                { name: "ใหม่", value: `${amount}`, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }
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

      resetPartnerApiToken: (id) => {
        const { partners } = get();
        const newToken = 'sk_live_' + generateRandomString(24);
        set({
          partners: partners.map(p =>
            p.id === id ? { ...p, apiToken: newToken } : p
          )
        });
        setDoc(doc(db, 'partners', id), { apiToken: newToken }, { merge: true });
      },

      // ─── KEY MANAGEMENT ──────────────────────────────────────────────────────
      generateKey: (durationDays, cost, creator, amount = 1) => {
        const { adminBalance, keys, webhooks } = get();
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

        if (webhooks.adminLogs?.enabled && webhooks.adminLogs.url) {
          sendDiscordLog(webhooks.adminLogs.url, {
            embeds: [{
              title: "🔑 สร้างคีย์ใหม่",
              description: `สร้างคีย์อายุ **${durationDays} วัน** จำนวน **${amount} คีย์**`,
              color: COLORS.SUCCESS,
              fields: [
                { name: "ผู้สร้าง", value: creator, inline: true },
                { name: "เครดิตรวมที่หัก", value: `${totalCost}`, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }

        return true;
      },

      importKeys: (durationDays, importedKeys, creator) => {
        const { keys, webhooks } = get();
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

        if (webhooks.adminLogs?.enabled && webhooks.adminLogs.url) {
          sendDiscordLog(webhooks.adminLogs.url, {
            embeds: [{
              title: "📥 นำเข้าคีย์สำเร็จ",
              description: `นำเข้าคีย์อายุ **${durationDays} วัน** จำนวน **${importedKeys.length} คีย์**`,
              color: COLORS.INFO,
              fields: [
                { name: "ผู้ทำรายการ", value: creator, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }
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
        const { currentReseller, resetRequests, webhooks } = get();
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

        if (webhooks.resellerLogs?.enabled && webhooks.resellerLogs.url) {
          sendDiscordLog(webhooks.resellerLogs.url, {
            embeds: [{
              title: "🔄 ส่งคำขอรีเซ็ตคีย์ (HWID)",
              description: `ตัวแทน **${currentReseller.username}** ได้ส่งคำขอรีเซ็ตคีย์`,
              color: COLORS.WARNING,
              fields: [
                { name: "คีย์", value: `\`${keyString}\``, inline: false }
              ],
              timestamp: new Date().toISOString()
            }]
          });
        }
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
          const { currentReseller, partners, packages, keys } = get();
          
          if (!currentReseller) return 'no_credit';

          const pkg = packages.find(p => p.days === durationDays);
          if (!pkg) return 'no_stock';

          const partner = partners.find(p => p.id === currentReseller.id);
          if (!partner || partner.status === 'suspended') return 'no_credit';

          const unitCost = partner.customPrices?.[durationDays] ?? pkg.cost;
          
          // Find candidates from local state (avoids composite index requirement)
          const candidateKeys = keys.filter(k => k.durationDays === durationDays && k.status === 'unused');
          if (candidateKeys.length === 0) return 'no_stock';

          const affordableQty = Math.floor(partner.balance / unitCost);
          const targetQty = Math.min(safeQty, affordableQty, candidateKeys.length);
          if (targetQty === 0) return 'no_credit';

          let result;
          try {
            // Use Firestore Transaction to prevent race conditions and pumping
            result = await runTransaction(db, async (transaction) => {
              // 1. Read partner data
              const partnerRef = doc(db, 'partners', partner.id);
              const partnerSnap = await transaction.get(partnerRef);
              if (!partnerSnap.exists()) throw "Partner not found";
              
              const partnerData = partnerSnap.data() as Partner;
              const currentBalance = partnerData.balance;

              // 2. Verify candidate keys are still unused
              const currentAffordableQty = Math.floor(currentBalance / unitCost);
              const currentTargetQty = Math.min(safeQty, currentAffordableQty, candidateKeys.length);
              
              if (currentTargetQty === 0) return 'no_credit';

              const verifiedKeys: LicenseKey[] = [];
              
              // Read keys one by one up to currentTargetQty.
              for (const candidate of candidateKeys) {
                 if (verifiedKeys.length >= currentTargetQty) break;
                 
                 const keyRef = doc(db, 'keys', candidate.id);
                 const keySnap = await transaction.get(keyRef);
                 
                 if (keySnap.exists()) {
                   const keyData = keySnap.data() as LicenseKey;
                   if (keyData.status === 'unused') {
                      verifiedKeys.push(keyData);
                   }
                 }
              }

              if (verifiedKeys.length === 0) return 'no_stock_race';

              // 3. Write updates
              const actualQty = verifiedKeys.length;
              const totalCost = unitCost * actualQty;
              const newBalance = currentBalance - totalCost;

              transaction.set(partnerRef, { balance: newBalance }, { merge: true });
              
              const now = Date.now();
              const redeemedKeysList: LicenseKey[] = [];
              
              verifiedKeys.forEach(k => {
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
          } catch (error: any) {
            console.error("Transaction failed: ", error);
            
            // Fallback: Non-transactional batch update
            try {
              const verifiedKeys: LicenseKey[] = [];
              for (const candidate of candidateKeys) {
                if (verifiedKeys.length >= targetQty) break;
                const keyRef = doc(db, 'keys', candidate.id);
                const keySnap = await getDoc(keyRef);
                if (keySnap.exists()) {
                  const keyData = keySnap.data() as LicenseKey;
                  if (keyData.status === 'unused') {
                    verifiedKeys.push(keyData);
                  }
                }
              }

              if (verifiedKeys.length === 0) return 'no_stock_race';

              const actualQty = verifiedKeys.length;
              const totalCost = unitCost * actualQty;

              const partnerRef = doc(db, 'partners', partner.id);
              const partnerSnap = await getDoc(partnerRef);
              if (!partnerSnap.exists()) return 'locked';
              
              const pData = partnerSnap.data() as Partner;
              if (pData.balance < totalCost) return 'no_credit';

              const batch = writeBatch(db);
              batch.set(partnerRef, { balance: pData.balance - totalCost }, { merge: true });

              const now = Date.now();
              const redeemedKeysList: LicenseKey[] = [];

              verifiedKeys.forEach(k => {
                const keyRef = doc(db, 'keys', k.id);
                batch.set(keyRef, {
                  status: 'active',
                  redeemedBy: partner.id,
                  redeemedAt: now
                }, { merge: true });
                redeemedKeysList.push({ ...k, status: 'active', redeemedBy: partner.id, redeemedAt: now });
              });

              await batch.commit();
              result = redeemedKeysList;
            } catch (fallbackError: any) {
              console.error("Fallback failed: ", fallbackError);
              return `transaction_error:${fallbackError?.message || 'unknown'}`;
            }
          }

          if (result === 'no_stock_race') return 'no_stock';

          if (Array.isArray(result) && result.length > 0) {
            const { webhooks } = get();
            if (webhooks.resellerLogs?.enabled && webhooks.resellerLogs.url) {
              const actualQty = result.length;
              sendDiscordLog(webhooks.resellerLogs.url, {
                embeds: [{
                  title: "🛒 ดึงคีย์สำเร็จ",
                  description: `ตัวแทน **${partner.username}** ได้ดึงคีย์ใหม่`,
                  color: COLORS.SUCCESS,
                  fields: [
                    { name: "แพ็กเกจ", value: `${durationDays} วัน`, inline: true },
                    { name: "จำนวน", value: `${actualQty} คีย์`, inline: true },
                    { name: "เครดิตที่ใช้", value: `${unitCost * actualQty}`, inline: true }
                  ],
                  timestamp: new Date().toISOString()
                }]
              });
            }
          }

          generateCsrfToken();
          return result;
        } catch (error: any) {
          console.error("Main block failed: ", error);
          return `transaction_error:${error?.message || 'unknown'}`;
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
    
    batch.set(doc(db, 'config', 'webhooks'), {
      adminLogs: { url: '', enabled: false },
      resellerLogs: { url: '', enabled: false },
      systemLogs: { url: '', enabled: false }
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
        apiToken: data.apiToken || "",
        adminPasswordHash: data.adminPasswordHash || null
      });
    }
  });

  onSnapshot(doc(db, 'config', 'webhooks'), (docSnap: any) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as WebhooksState;
      useStore.setState({ webhooks: data });
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
