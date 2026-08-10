import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';

export function AnnouncementPopupModal() {
  const { announcements } = useStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
          className="relative w-full max-w-md bg-[#0F111A] border border-gray-800/60 rounded-2xl shadow-2xl flex flex-col overflow-y-auto max-h-[90vh] scrollbar-hide"
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
                className="w-full h-auto max-h-[220px] sm:max-h-[400px] object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0F111A] to-transparent pointer-events-none" />
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 pb-5 sm:pb-8">
            {!activeAnnouncement.imageBase64 && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                <ShieldAlert size={20} className="text-primary sm:w-6 sm:h-6" />
              </div>
            )}
            
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">{activeAnnouncement.title}</h2>
            
            <div className="mb-5 sm:mb-8">
              <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap">
                {!isExpanded && activeAnnouncement.description.length > 150 
                  ? activeAnnouncement.description.slice(0, 150) + '...'
                  : !isExpanded && activeAnnouncement.description.split('\n').length > 4
                    ? activeAnnouncement.description.split('\n').slice(0, 4).join('\n') + '...'
                    : activeAnnouncement.description
                }
              </p>
              {(activeAnnouncement.description.length > 150 || activeAnnouncement.description.split('\n').length > 4) && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-bold mt-2 transition-colors"
                >
                  {isExpanded ? 'ย่อเนื้อหา' : 'แสดงเพิ่มเติม...'}
                </button>
              )}
            </div>

            {/* Acknowledge Button */}
            <button 
              onClick={handleAcknowledge}
              className="w-full bg-[#161925] border border-gray-800/60 hover:bg-[#1C1F2E] hover:border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShieldAlert size={18} className="text-blue-400 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-base sm:text-lg mb-0 sm:mb-0.5 leading-tight">{t('reseller.acknowledgeAnn')}</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">{t('reseller.acknowledgeDesc')}</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
