import { useStore } from '../../store/useStore';

export function NeonLogo({ className = '' }: { className?: string }) {
  const { globalLogoUrl } = useStore();
  const text = " BLUERET • BLUERET • BLUERET • ";
  const chars = text.split('');

  return (
    <div className={`relative flex items-center justify-center perspective-[600px] w-36 h-36 ${className}`}>
      {/* 3D Spinning Text */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin-3d preserve-3d z-0">
        {chars.map((char, i) => {
          const rotation = (360 / chars.length) * i;
          return (
            <span
              key={i}
              className="absolute text-blue-400 text-[11px] font-bold uppercase drop-shadow-[0_0_5px_rgba(66,133,244,0.8)]"
              style={{
                transform: `rotateY(${rotation}deg) translateZ(60px)`,
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
        className="h-20 w-auto max-w-[80px] object-contain relative z-10 drop-shadow-[0_0_15px_rgba(66,133,244,0.4)]" 
      />
    </div>
  );
}
