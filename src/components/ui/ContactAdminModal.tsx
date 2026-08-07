import { motion } from 'framer-motion';
import { X, MessageSquare, Headset } from 'lucide-react';


interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactAdminModal({ isOpen, onClose }: ContactAdminModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="max-w-sm w-full bg-[#0a0a0a] border border-gray-800 rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-5 mt-2 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <Headset className="text-blue-500" size={24} />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">ติดต่อผู้ดูแลระบบ</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          เลือกช่องทางด้านล่างเพื่อสอบถามข้อมูล แจ้งปัญหา หรือขอความช่วยเหลือจากแอดมิน<br/>
          <span className="text-yellow-500/90 font-medium mt-1 inline-block">กรุณาอ่านที่ติดต่อที่จะเเจ้งให้ถูกด้วยนะคับบผม</span>
        </p>

        <div className="space-y-3">
          <a
            href="https://discord.gg/phdTuMR6DV"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#5865F2]/20 group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04-.01-.08-.05-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.03.03.03.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.02.02.05.03.08.02c1.71-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.03-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-bold mb-0.5 group-hover:text-[#5865F2] transition-colors">Discord Server</div>
              <div className="text-xs text-gray-400">ติดต่อเเจ้งปัญหาคีย์มีปัญหา</div>
            </div>
          </a>

          <a
            href="https://discord.gg/y9erNcNNab"
            onClick={() => {
              // Using specific developer discord link
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="text-white font-bold mb-0.5 group-hover:text-purple-400 transition-colors">ติดต่อคนทำระบบ</div>
              <div className="text-xs text-gray-400">เพื่อเเจ้งปัญหาคีย์ซ้ำหรือบัคๆต่างๆ</div>
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
