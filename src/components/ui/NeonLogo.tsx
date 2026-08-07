export function NeonLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img src="/logo.png" alt="BLUERET Logo" className="h-16 w-auto object-contain" />
    </div>
  );
}
