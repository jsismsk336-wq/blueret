import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Copy, Check, Clock, Activity, Search, RefreshCw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../components/ui/PinModal';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export function ResellerHistory() {
  const { currentReseller, keys, resetRequests = [], requestReset } = useStore();
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [resetKeyTarget, setResetKeyTarget] = useState<{id: string, keyString: string} | null>(null);

  const partner = currentReseller;
  if (!partner) return null;

  // Filter keys pulled by this reseller
  const myKeys = keys
    .filter(k => k.redeemedBy === partner.id)
    .sort((a, b) => (b.redeemedAt ?? 0) - (a.redeemedAt ?? 0));

  const searchTerm = search.trim().toLowerCase();
  let filteredKeys = myKeys.filter(k => 
    k.keyString.toLowerCase().includes(searchTerm) ||
    (k.hwid && k.hwid.toLowerCase().includes(searchTerm))
  );

  // Collapse identical keys into a single row when searching to avoid showing duplicates
  if (searchTerm) {
    const seen = new Set();
    filteredKeys = filteredKeys.filter(k => {
      const isDuplicate = seen.has(k.keyString);
      seen.add(k.keyString);
      return !isDuplicate;
    });
  }

  const handleCopy = (id: string, keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedId(id);
    toast.success(t('reseller.copySuccess'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetRequest = (keyId: string, keyString: string) => {
    requestReset(keyId, keyString);
    toast.success(t('reseller.resetSent'));
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
      <AnimatePresence>
        {resetKeyTarget && (
          <PinModal
            isOpen={!!resetKeyTarget}
            onClose={() => setResetKeyTarget(null)}
            title={t('reseller.resetConfirm')}
            subtitle={t('reseller.pinDesc', { key: resetKeyTarget.keyString })}
            correctPin="123456"
            onSuccess={() => {
              handleResetRequest(resetKeyTarget.id, resetKeyTarget.keyString);
              setResetKeyTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[400px] bg-gradient-to-tr from-purple-600/20 to-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[300px] bg-gradient-to-tl from-emerald-600/10 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <KeyRound size={12} className="text-purple-400" />
            <span className="text-xs font-bold text-purple-400">KEY HISTORY</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('reseller.history')}</h1>
          <p className="text-gray-400 text-sm">{t('reseller.historyDescKeys', { count: myKeys.length })}</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder={t('reseller.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161925] border border-gray-800/60 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
          />
        </div>
      </div>

      {myKeys.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center relative z-10"
        >
          <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">{t('reseller.noHistory')}</p>
          <p className="text-gray-600 text-sm mt-1">{t('reseller.noHistoryDesc')}</p>
        </motion.div>
      ) : filteredKeys.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center relative z-10"
        >
          <Search size={32} className="text-gray-600 mb-4" />
          <p className="text-gray-400 font-medium">{t('reseller.noSearchResult')}</p>
        </motion.div>
      ) : (
        <div className="relative z-10 space-y-3">
          {filteredKeys.map((key, index) => {
            const latestRequest = resetRequests
              .filter(r => r.keyId === key.id)
              .sort((a, b) => b.createdAt - a.createdAt)[0];
            
            const isPending = latestRequest?.status === 'pending';
            const isRejected = latestRequest?.status === 'rejected';
            const isApproved = latestRequest?.status === 'approved';

            let statusLabel = key.hwid ? t('reseller.used') : t('reseller.unused');
            let statusColor = key.hwid ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400';

            if (latestRequest) {
              if (isPending) {
                statusLabel = t('reseller.resetPending');
                statusColor = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse';
              } else if (isRejected) {
                statusLabel = t('reseller.resetRejected');
                statusColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
              } else if (isApproved && !key.hwid) {
                statusLabel = t('reseller.resetApproved');
                statusColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
              }
            }

            return (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-r from-[#181C29] to-[#12141D] border border-gray-700/40 hover:border-blue-500/30 hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-2.5 rounded-xl border ${
                    key.hwid
                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                      : 'bg-green-500/10 border-green-500/20 text-green-400'
                  }`}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <div className="font-mono font-bold font-num text-white text-sm tracking-wide">{key.keyString}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={11} />
                        <span className="font-num">{key.redeemedAt ? new Date(key.redeemedAt).toLocaleString('th-TH') : '-'}</span>
                      </span>
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        <span className="font-num">{Math.abs(key.durationDays)}</span> {key.durationDays < 0 ? 'Hour(s)' : t('reseller.day')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => !isPending && !isRejected && setResetKeyTarget({ id: key.id, keyString: key.keyString })}
                    disabled={isPending || isRejected}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      isPending
                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 cursor-not-allowed'
                        : isRejected
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gray-800 to-[#1C1F2E] hover:from-red-500/20 hover:to-orange-500/20 text-gray-300 hover:text-red-400 border border-gray-700/50 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    }`}
                  >
                    {isPending ? (
                      <><RefreshCw size={15} className="animate-spin" /> {t('reseller.waitingReset')}</>
                    ) : isRejected ? (
                      <><XCircle size={15} /> {t('reseller.rejected')}</>
                    ) : (
                      <><RefreshCw size={15} /> {t('reseller.requestReset')}</>
                    )}
                  </button>
                  <button
                    onClick={() => handleCopy(key.id, key.keyString)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      copiedId === key.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-gray-800 to-[#1C1F2E] hover:from-blue-500/20 hover:to-blue-600/20 text-gray-300 hover:text-blue-400 border border-gray-700/50 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    }`}
                  >
                    {copiedId === key.id ? <Check size={15} /> : <Copy size={15} />}
                    {copiedId === key.id ? t('reseller.copied') : t('reseller.copy')}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
