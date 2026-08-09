import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';

export function AnnouncementPopupModal() {
  const { announcements } = useStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Find the active announcement (if multiple are active for some reason, pick the newest)
  const activeAnnouncement = announcements.find(a => a.isActive);

  useEffect(() => {
    if (activeAnnouncement) {
      // Check localStorage to see if this specific announcement ID has been seen
      const hasSeen = localStorage.getItem(`seen_announcement_${activeAnnouncement.id}`);
      if (!hasSeen) {
        setIsOpen(true);
      }
    }
  }, [activeAnnouncement]);

  const handleAcknowledge = () => {
    if (activeAnnouncement) {
      localStorage.setItem(`seen_announcement_${activeAnnouncement.id}`, 'true');
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || !activeAnnouncement) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0F111A] border border-gray-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Close button absolute top right */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/50 backdrop-blur-md text-gray-300 hover:text-white border border-gray-700/50 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Image */}
          {activeAnnouncement.imageBase64 && (
            <div className="w-full relative flex items-center justify-center bg-black/40">
              <img 
                src={activeAnnouncement.imageBase64} 
                alt={activeAnnouncement.title} 
                className="w-full h-auto max-h-[300px] sm:max-h-[400px] object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0F111A] to-transparent pointer-events-none" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 pb-8">
            {!activeAnnouncement.imageBase64 && (
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <ShieldAlert size={24} className="text-primary" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-white mb-2">{activeAnnouncement.title}</h2>
            <p className="text-gray-300 mb-8 whitespace-pre-wrap">{activeAnnouncement.description}</p>

            {/* Acknowledge Button */}
            <button 
              onClick={handleAcknowledge}
              className="w-full bg-[#161925] border border-gray-800/60 hover:bg-[#1C1F2E] hover:border-gray-700 rounded-2xl p-4 flex items-center gap-4 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShieldAlert size={20} className="text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-lg mb-0.5">{t('reseller.acknowledgeAnn')}</h3>
                <p className="text-xs text-gray-500 font-medium">{t('reseller.acknowledgeDesc')}</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
