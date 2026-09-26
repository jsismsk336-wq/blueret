import { Link } from 'react-router-dom';
import { Shirt, Search, Menu } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <Shirt className="h-8 w-8 text-white group-hover:text-gray-300 transition-colors" />
              <span className="font-bold text-2xl tracking-tighter text-white">
                KICK<span className="text-gray-400">SHOW</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link to="/jerseys" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Jerseys
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="text-gray-300 hover:text-white p-2">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
