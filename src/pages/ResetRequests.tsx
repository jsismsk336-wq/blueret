import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, X, Bell, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function ResetRequests() {
  const { resetRequests = [], approveReset, rejectReset } = useStore();
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const filteredRequests = resetRequests.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="animate-in fade-in duration-500 relative">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[400px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <RefreshCw size={12} className="text-orange-400" />
            <span className="text-xs font-bold text-orange-400">RESET REQUESTS</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('admin.resetRequestsTitle')}</h1>
          <p className="text-gray-400 text-sm">{t('admin.resetRequestsDesc')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
            filter === 'pending'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-[#1C1F2E] text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          {t('admin.filterPending')} ({resetRequests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
            filter === 'approved'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-[#1C1F2E] text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          {t('admin.filterApproved')}
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
            filter === 'rejected'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-[#1C1F2E] text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          {t('admin.filterRejected')}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
            filter === 'all'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-[#1C1F2E] text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          {t('admin.filterAll')}
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center relative z-10"
        >
          <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
            <Bell size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">{t('admin.noRequests')}</p>
        </motion.div>
      ) : (
        <div className="relative z-10 space-y-3">
          <AnimatePresence>
            {filteredRequests.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#12141D] border border-gray-800/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl border ${
                    req.status === 'pending' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                    req.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {req.status === 'pending' ? <RefreshCw size={18} className="animate-spin-slow" /> :
                     req.status === 'approved' ? <Check size={18} /> : 
                     <X size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold font-num text-white text-sm tracking-wide">{req.keyString}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        req.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                        req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {req.status === 'pending' ? t('admin.filterPending') : 
                         req.status === 'approved' ? t('admin.filterApproved') : 
                         t('admin.filterRejected')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={11} />
                        <span className="font-num">{new Date(req.createdAt).toLocaleString(language === 'th' ? 'th-TH' : 'en-US')}</span>
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">
                        {t('admin.fromReseller')} <span className="text-primary font-medium">{req.resellerName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        approveReset(req.id);
                        toast.success(t('admin.approveSuccess', { key: req.keyString }));
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40 rounded-xl text-sm font-medium transition-all"
                    >
                      <Check size={16} /> {t('admin.approveBtn')}
                    </button>
                    <button
                      onClick={() => {
                        rejectReset(req.id);
                        toast.error(t('admin.rejectSuccess', { key: req.keyString }));
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl text-sm font-medium transition-all"
                    >
                      <X size={16} /> {t('admin.rejectBtn')}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
