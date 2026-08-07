import type { InputHTMLAttributes } from 'react';

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function NeonInput({ label, className = '', ...props }: NeonInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-gray-300 tracking-wide">
        {label}
      </label>
      <input
        className="w-full bg-[#111827] text-white border border-gray-700/50 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-300 placeholder:text-gray-500"
        {...props}
      />
    </div>
  );
}
