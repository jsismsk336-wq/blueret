import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Megaphone, Trash2, Power, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import { CreateAnnouncementModal } from '../components/ui/CreateAnnouncementModal';

export function Announcements() {
  const { announcements, toggleAnnouncementActive, deleteAnnouncement } = useStore();
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('admin.announcementsTitle')}</h1>
          <p className="text-gray-400 text-sm">{t('admin.announcementsDesc')}</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(66,133,244,0.3)] flex items-center gap-2"
        >
          <Plus size={18} />
          <span>{t('admin.createNewAnnouncement')}</span>
        </button>
      </div>

      <div className="bg-[#161925] border border-gray-800/60 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800/60 flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Megaphone size={18} className="text-primary" />
            {t('admin.announcementHistory')}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1C1F2E] text-gray-400 text-xs tracking-wider border-b border-gray-800/60">
              <tr>
                <th className="px-6 py-4 font-medium">{t('admin.annTitleLabel')} / {t('admin.annTypeLabel')}</th>
                <th className="px-6 py-4 font-medium text-center">{t('admin.annImageLabel')}</th>
                <th className="px-6 py-4 font-medium text-center">{t('admin.annDateLabel')} / {t('admin.annTimeLabel')}</th>
                <th className="px-6 py-4 font-medium text-center">{t('admin.statusCol')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('admin.actionCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              <AnimatePresence>
                {announcements.map((ann, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                    key={ann.id} 
                    className="hover:bg-[#1C1F2E]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-200 text-base">{ann.title}</span>
                        <span className="text-xs text-primary font-medium mt-1">{ann.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ann.imageBase64 ? (
                        <div className="inline-flex w-16 h-10 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                          <img src={ann.imageBase64} alt={ann.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="inline-flex w-16 h-10 bg-gray-800/50 rounded-lg border border-gray-700/50 items-center justify-center text-gray-600">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Calendar size={12} className="text-gray-500" />
                          <span className="font-num text-xs">{ann.date || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                          <Clock size={12} className="text-gray-500" />
                          <span className="font-num text-[10px]">{ann.time || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        ann.isActive 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                          : 'bg-gray-800/50 text-gray-400 border-gray-700'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${ann.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                        {ann.isActive ? t('admin.annActive') : t('admin.annInactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            toggleAnnouncementActive(ann.id);
                            if (!ann.isActive) toast.success(t('admin.annActive'));
                          }}
                          className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-medium flex items-center gap-1.5 ${
                            ann.isActive
                              ? 'border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                              : 'border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                        >
                          <Power size={14} />
                          {ann.isActive ? t('admin.annTurnOff') : t('admin.annTurnOn')}
                        </button>
                        <button 
                          onClick={() => {
                            deleteAnnouncement(ann.id);
                            toast.success(t('admin.annDelete'));
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium flex items-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          {t('admin.deleteBtn')}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {announcements.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#1C1F2E] flex items-center justify-center mb-4 text-gray-500">
                <Megaphone size={24} />
              </div>
              <h3 className="text-gray-400 font-medium">{t('admin.noAnnouncements')}</h3>
            </div>
          )}
        </div>
      </div>
      
      <CreateAnnouncementModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
