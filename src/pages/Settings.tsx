import { useState, useRef } from 'react';
import { Lock, ImagePlus, X, Save, Link as LinkIcon, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';

export function Settings() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { globalLogoUrl, updateGlobalLogo, apiEndpoint, apiToken, updateApiSettings } = useStore();
  const [logoPreview, setLogoPreview] = useState<string | null>(globalLogoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localApiEndpoint, setLocalApiEndpoint] = useState(apiEndpoint || '');
  const [localApiToken, setLocalApiToken] = useState(apiToken || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('admin.passwordMismatch'));
      return;
    }
    toast.success(t('admin.passwordChangedSuccess'));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setLogoPreview(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = () => {
    updateGlobalLogo(logoPreview);
    toast.success(t('admin.logoSavedSuccess'));
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    updateGlobalLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success(t('admin.logoRemovedSuccess'));
  };

  const handleSaveApi = () => {
    updateApiSettings(localApiEndpoint, localApiToken);
    toast.success('บันทึกการตั้งค่า API สำเร็จ');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('admin.settingsTitle')}</h1>
        <p className="text-gray-400 text-sm">{t('admin.settingsDesc')}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161925] border border-gray-800/60 rounded-2xl p-6 max-w-xl">
        <div className="flex items-center gap-2 text-white font-medium mb-6">
          <Lock size={18} className="text-primary" />
          <span>{t('admin.changePasswordTitle')}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">{t('admin.currentPassword')}</label>
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('admin.currentPasswordPlaceholder')} 
              className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">{t('admin.newPassword')}</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('admin.newPasswordPlaceholder')} 
              className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">{t('admin.confirmPassword')}</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('admin.confirmPasswordPlaceholder')} 
              className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <button 
            type="submit"
            className="mt-2 w-full bg-primary hover:bg-primary/90 text-white font-medium py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(123,97,255,0.3)]"
          >
            {t('admin.confirmChangeBtn')}
          </button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#161925] border border-gray-800/60 rounded-2xl p-6 max-w-xl mt-8">
        <div className="flex items-center gap-2 text-white font-medium mb-6">
          <ImagePlus size={18} className="text-primary" />
          <span>{t('admin.logoSettingsTitle')}</span>
        </div>
        
        <p className="text-sm text-gray-400 mb-6">{t('admin.logoSettingsDesc')}</p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Logo Preview */}
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-700 bg-[#0F111A] flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <img src="/logo.png" alt="Default Logo" className="w-full h-full object-contain p-2 opacity-50" />
              )}
            </div>
            
            {/* Controls */}
            <div className="flex flex-col gap-3 w-full">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#2A2E3D] hover:bg-[#34384B] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ImagePlus size={16} />
                {t('admin.uploadLogoBtn')}
              </button>
              
              {logoPreview && (
                <button 
                  onClick={handleRemoveLogo}
                  className="text-red-400 hover:text-red-300 text-sm font-medium py-2 px-4 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  {t('admin.removeLogoBtn')}
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800/60">
            <button 
              onClick={handleSaveLogo}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(123,97,255,0.2)] flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {t('admin.saveLogoBtn')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* API Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#161925] border border-gray-800/60 rounded-2xl p-6 max-w-xl mt-8">
        <div className="flex items-center gap-2 text-white font-medium mb-6">
          <LinkIcon size={18} className="text-primary" />
          <span>ตั้งค่าการเชื่อมต่อ API (ดึงคีย์)</span>
        </div>
        
        <p className="text-sm text-gray-400 mb-6">ใช้สำหรับเชื่อมต่อเพื่อกดดึงคีย์จากแผงหลักเข้าสต็อกอัตโนมัติ</p>

        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">API Endpoint URL</label>
            <input 
              type="url" 
              value={localApiEndpoint}
              onChange={(e) => setLocalApiEndpoint(e.target.value)}
              placeholder="https://nwtr.dev/meowt/api/genkey.php" 
              className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">API Token</label>
            <div className="relative">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="password" 
                value={localApiToken}
                onChange={(e) => setLocalApiToken(e.target.value)}
                placeholder="mtk_xxxxxxxxxxxxxxxx" 
                className="w-full bg-[#0F111A] border border-gray-800/60 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800/60 mt-2">
            <button 
              onClick={handleSaveApi}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(123,97,255,0.2)] flex items-center justify-center gap-2"
            >
              <Save size={18} />
              บันทึกการตั้งค่า API
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
