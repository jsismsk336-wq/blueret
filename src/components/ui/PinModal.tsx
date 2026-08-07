import { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  correctPin?: string;
}

export function PinModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "ยืนยันการล้างคีย์ทั้งหมด", 
  subtitle = "กรอก PIN 6 หลักเพื่อยืนยันการล้างคีย์",
  correctPin = "429999"
}: PinModalProps) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '', '', '']);
      setError(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    // Use only the last typed character
    const val = value.slice(-1);
    
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);

    // Auto-advance
    if (val !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check complete
    if (newPin.every(p => p !== '')) {
      const code = newPin.join('');
      if (code === correctPin) {
        onSuccess();
        onClose();
      } else {
        setError(true);
        toast.error('PIN ไม่ถูกต้อง');
        setTimeout(() => {
          setPin(['', '', '', '', '', '']);
          setError(false);
          inputRefs.current[0]?.focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: error ? [-10, 10, -10, 10, 0] : 0 }}
        transition={{ duration: error ? 0.4 : 0.2 }}
        className="max-w-md w-full bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden"
      >
        <div className="w-16 h-16 bg-[#161925] border border-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <Lock className="text-red-500" size={28} />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-8 text-center">{subtitle}</p>

        <div className="flex gap-2 sm:gap-3 mb-8">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-num rounded-xl bg-[#0f111a] text-white border transition-all outline-none focus:scale-105 ${
                error 
                  ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] text-red-500' 
                  : digit 
                    ? 'border-primary/50 shadow-[0_0_10px_rgba(66,133,244,0.2)] text-primary' 
                    : 'border-gray-800/60 focus:border-primary'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-6">กรอกครบ 6 หลัก ระบบจะยืนยันอัตโนมัติ</p>

        <button 
          onClick={onClose}
          className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          ยกเลิก (CANCEL)
        </button>
      </motion.div>
    </div>
  );
}
