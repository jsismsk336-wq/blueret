/**
 * Security utilities for BLUERET frontend
 */

// ─── CSRF Token (in-memory, regenerated per session) ─────────────────────────
let _csrfToken: string | null = null;

export function generateCsrfToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  _csrfToken = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  return _csrfToken;
}

export function getCsrfToken(): string | null {
  return _csrfToken;
}

export function validateCsrfToken(token: string): boolean {
  return token === _csrfToken && _csrfToken !== null;
}

export function clearCsrfToken(): void {
  _csrfToken = null;
}

// ─── Login Rate Limiting ───────────────────────────────────────────────────────
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

interface LoginRecord {
  attempts: number;
  lockedUntil: number | null;
}

const loginRecords = new Map<string, LoginRecord>();

export function checkLoginAllowed(username: string): { allowed: boolean; remainingMs: number } {
  const record = loginRecords.get(username.toLowerCase()) ?? { attempts: 0, lockedUntil: null };
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return { allowed: false, remainingMs: record.lockedUntil - Date.now() };
  }
  return { allowed: true, remainingMs: 0 };
}

export function recordLoginFailure(username: string): { locked: boolean; attemptsLeft: number } {
  const key = username.toLowerCase();
  const record = loginRecords.get(key) ?? { attempts: 0, lockedUntil: null };

  // Reset if previous lockout expired
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    record.attempts = 0;
    record.lockedUntil = null;
  }

  record.attempts += 1;

  if (record.attempts >= LOGIN_MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
    loginRecords.set(key, record);
    return { locked: true, attemptsLeft: 0 };
  }

  loginRecords.set(key, record);
  return { locked: false, attemptsLeft: LOGIN_MAX_ATTEMPTS - record.attempts };
}

export function recordLoginSuccess(username: string): void {
  loginRecords.delete(username.toLowerCase());
}

export function formatLockoutTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${minutes} นาที`;
}

// ─── Redeem Mutex (prevent double-tap / race condition) ───────────────────────
let _isRedeeming = false;

export function acquireRedeemLock(): boolean {
  if (_isRedeeming) return false;
  _isRedeeming = true;
  return true;
}

export function releaseRedeemLock(): void {
  _isRedeeming = false;
}

// ─── Key obfuscation for display ─────────────────────────────────────────────
export function obfuscateKey(key: string): string {
  // Show first segment + obfuscate middle + show last 4 chars
  const parts = key.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-****-****-${parts[parts.length - 1]}`;
  }
  return key.substring(0, 8) + '****';
}

// ─── Context menu / DevTools deterrence ───────────────────────────────────────
export function initSecurityHardening(): () => void {
  const handleContextMenu = (e: MouseEvent) => e.preventDefault();

  const handleKeyDown = (e: KeyboardEvent) => {
    // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('keydown', handleKeyDown);

  // Cleanup function
  return () => {
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyDown);
  };
}

// ─── Anti-bot login delay ─────────────────────────────────────────────────────
export async function loginDelay(isSuccess: boolean): Promise<void> {
  // Always add a base delay, more on failure (timing attack prevention)
  const baseMs = 400;
  const extraMs = isSuccess ? 0 : Math.floor(Math.random() * 300) + 200;
  await new Promise(r => setTimeout(r, baseMs + extraMs));
}
