import { Shirt } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-surface border-t border-white/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shirt className="h-6 w-6 text-gray-500" />
            <span className="font-bold text-xl tracking-tighter text-gray-400">
              KICK<span className="text-gray-600">SHOW</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} KickShow Gallery. All rights reserved. Designed for fans.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Instagram</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
