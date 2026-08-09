import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAnnouncementModal({ isOpen, onClose }: CreateAnnouncementModalProps) {
  const { addAnnouncement } = useStore();
  const { t } = useTranslation();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState(t('admin.annTypeClan'));
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title || !description) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    addAnnouncement({
      title,
      description,
      type,
      date,
      time,
      imageBase64,
      isActive: true, // Make it active by default
    });

    toast.success('สร้างประกาศสำเร็จ');
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setImageBase64(null);
    setType(t('admin.annTypeClan'));
    onClose();
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-lg bg-[#0F111A] border border-gray-800/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800/60 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{t('admin.createAnnouncementModalTitle')}</h2>
              <p className="text-sm text-gray-400">{t('admin.createAnnouncementModalDesc')}</p>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 rounded-xl bg-[#161925] text-gray-400 hover:text-white border border-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto scrollbar-hide flex flex-col gap-5">
            
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">{t('admin.annImageLabel')}</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-700/50 rounded-xl bg-[#161925] flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-[#1C1F2E] transition-all relative overflow-hidden group"
              >
                {imageBase64 ? (
                  <>
                    <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-sm font-bold">เปลี่ยนรูปภาพ</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-500 mb-3 group-hover:-translate-y-1 transition-transform" />
                    <span className="font-bold text-gray-300 text-sm">{t('admin.annImageUploadTitle')}</span>
                    <span className="text-xs text-gray-500 mt-1">{t('admin.annImageUploadDesc')}</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">{t('admin.annTitleLabel')}</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('admin.annTitlePlaceholder')}
                className="w-full bg-[#161925] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">{t('admin.annTypeLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[t('admin.annTypeClan'), t('admin.annTypeMeeting'), t('admin.annTypeWar')].map(tType => (
                  <button
                    key={tType}
                    onClick={() => setType(tType)}
                    className={`py-2 rounded-xl text-sm font-bold transition-all border ${
                      type === tType 
                        ? 'bg-[#FF2E5B]/10 border-[#FF2E5B]/40 text-[#FF2E5B]' 
                        : 'bg-[#161925] border-gray-800/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tType}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-white mb-2">{t('admin.annDescLabel')}</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('admin.annDescPlaceholder')}
                className="w-full bg-[#161925] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors h-24 resize-none"
              />
            </div>

            {/* Date / Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">{t('admin.annDateLabel')}</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#161925] border border-gray-800/60 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-gray-600 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <CalendarIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">{t('admin.annTimeLabel')}</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#161925] border border-gray-800/60 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-gray-600 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <ClockIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800/60 flex items-center justify-end gap-3 bg-[#0F111A]">
            <button 
              onClick={handleClose}
              className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
            >
              {t('admin.annCancelBtn')}
            </button>
            <button 
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl font-bold bg-[#FF2E5B] hover:bg-[#FF2E5B]/90 text-white transition-all shadow-[0_0_20px_rgba(255,46,91,0.4)]"
            >
              {t('admin.annSaveBtn')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
