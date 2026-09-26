import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface InteractiveLogoProps {
  src: string;
  alt: string;
  color?: string; // Hex color for glow
}

export function InteractiveLogo({ src, alt, color = '#ffffff' }: InteractiveLogoProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for the 3D rotation
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  // Map mouse position to rotation angle (-15 to 15 degrees)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['15deg', '-15deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-15deg', '15deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Calculate mouse position relative to center of element (-0.5 to 0.5)
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="relative w-full aspect-square perspective-1000 group cursor-pointer"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Background glass container */}
      <div className="absolute inset-0 rounded-2xl glass-panel flex items-center justify-center p-8 overflow-hidden transition-all duration-500 group-hover:border-white/20">
        
        {/* Animated Glow Effect behind logo */}
        <motion.div 
          className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-2xl"
          style={{
            background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`
          }}
        />

        {/* Neon Stroke effect (border light) */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 20px ${color}30, 0 0 20px ${color}20`
          }}
        />

        {/* Logo Image */}
        <motion.img
          src={src}
          alt={alt}
          style={{ transform: 'translateZ(50px)' }}
          className="w-full h-full object-contain filter drop-shadow-2xl z-10"
        />
      </div>
    </motion.div>
  );
}
