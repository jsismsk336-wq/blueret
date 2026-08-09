import { useStore } from '../store/useStore';
import { Megaphone, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

export function ResellerAnnouncements() {
  const { announcements } = useStore();
  const { t } = useTranslation();

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('reseller.announcements')}</h1>
        <p className="text-gray-400 text-sm">ประวัติประกาศและการแจ้งเตือนทั้งหมดจากแอดมิน</p>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {announcements.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0F111A] border border-gray-800/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                <Megaphone size={32} className="text-gray-500" />
              </div>
              <p className="text-gray-400">{t('admin.noAnnouncements')}</p>
            </motion.div>
          ) : (
            announcements.map((ann, index) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-[#0F111A] border rounded-2xl p-6 relative overflow-hidden ${
                  ann.isActive ? 'border-primary/50 shadow-[0_0_15px_rgba(66,133,244,0.1)]' : 'border-gray-800/60 opacity-70'
                }`}
              >
                {/* Active indicator */}
                {ann.isActive && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
                )}

                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  {/* Image (if any) */}
                  {ann.imageBase64 ? (
                    <div className="w-full md:w-64 h-48 rounded-xl bg-black/40 overflow-hidden shrink-0 border border-gray-800/60">
                      <img src={ann.imageBase64} alt={ann.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full md:w-64 h-48 rounded-xl bg-[#161925] border border-gray-800/60 flex flex-col items-center justify-center shrink-0">
                      <ImageIcon size={32} className="text-gray-600 mb-2" />
                      <span className="text-gray-500 text-sm">ไม่มีรูปภาพ</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-white">{ann.title}</h3>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold mt-2 ${
                          ann.type === t('admin.annTypeClan') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          ann.type === t('admin.annTypeMeeting') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {ann.type}
                        </span>
                      </div>
                      {ann.isActive && (
                        <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold whitespace-nowrap">
                          {t('admin.annActive')}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-4 whitespace-pre-wrap flex-1">{ann.description}</p>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mt-auto">
                      {ann.date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(ann.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                      {ann.time && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          {ann.time} น.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
