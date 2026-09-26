import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useStore } from './store/useStore.ts'

// ─── Cross-tab key sync via BroadcastChannel ───────────────────────────────
// When another tab redeems keys, this tab's store gets updated immediately
// so the same key can never be given to two different resellers
if (typeof BroadcastChannel !== 'undefined') {
  const channel = new BroadcastChannel('blueret-keys');
  channel.onmessage = (event) => {
    if (event.data?.type === 'KEYS_REDEEMED') {
      const redeemedIds: Set<string> = new Set(event.data.redeemedIds);
      const store = useStore.getState();
      // Mark redeemed keys as active in this tab's in-memory store
      useStore.setState({
        keys: store.keys.map(k =>
          redeemedIds.has(k.id)
            ? { ...k, status: 'active' as const, redeemedBy: event.data.partnerId, redeemedAt: event.data.timestamp }
            : k
        )
      });
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

