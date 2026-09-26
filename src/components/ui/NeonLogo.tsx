import { useStore } from '../../store/useStore';

export function NeonLogo({ className = '', size = 'sm' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) {
  const { globalLogoUrl } = useStore();
  const text = " BLUERET • BLUERET • BLUERET • ";
  const chars = text.split('');

  const config = {
    sm: {
      container: 'w-16 h-16',
      radius: '28px',
      text: 'text-[6px]',
      img: 'h-8 max-w-[32px]',
      perspective: 'perspective-[300px]'
    },
    md: {
      container: 'w-24 h-24',
      radius: '40px',
      text: 'text-[9px]',
      img: 'h-12 max-w-[48px]',
      perspective: 'perspective-[400px]'
    },
    lg: {
      container: 'w-36 h-36',
      radius: '60px',
      text: 'text-[11px]',
      img: 'h-20 max-w-[80px]',
      perspective: 'perspective-[600px]'
    }
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${config.perspective} ${config.container} ${className}`}>
      {/* 3D Spinning Text */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin-3d preserve-3d z-0">
        {chars.map((char, i) => {
          const rotation = (360 / chars.length) * i;
          return (
            <span
              key={i}
              className={`absolute text-blue-400 ${config.text} font-bold uppercase drop-shadow-[0_0_5px_rgba(66,133,244,0.8)]`}
              style={{
                transform: `rotateY(${rotation}deg) translateZ(${config.radius})`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
      
      {/* Center Logo */}
      <img 
        src={globalLogoUrl || "/logo.png"} 
        alt="BLUERET Logo" 
        className={`${config.img} object-contain relative z-10 drop-shadow-[0_0_15px_rgba(66,133,244,0.4)]`} 
      />
    </div>
  );
}
