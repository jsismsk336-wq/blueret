import type { ComponentProps, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GradientButtonProps extends Omit<ComponentProps<typeof motion.button>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  icon?: ReactNode;
}

export function GradientButton({ children, icon, className = '', ...props }: GradientButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-lg font-bold text-white shadow-lg transition-all duration-300 ${className}`}
      style={{
        background: 'linear-gradient(90deg, #4285F4 0%, #34A853 100%)',
      }}
      {...props}
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      {icon && <span className="z-10">{icon}</span>}
      <span className="z-10 tracking-wide">{children}</span>
    </motion.button>
  );
}
