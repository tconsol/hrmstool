import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavigation = (id: string) => {
    const element = document.getElementById(id);
    
    // If element exists on current page, scroll to it
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Otherwise navigate to home and then scroll
      navigate('/', { replace: false });
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
    setIsOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#080C14]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            {/* Logo */}
            <button
              onClick={() => {
                if (location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  navigate('/');
                }
              }}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/40">
                  H
                </div>
                <div className="absolute -inset-1 bg-blue-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">HR</span>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">MS</span>
              </span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'Features', action: () => handleNavigation('features') },
                { label: 'Pricing', action: () => handleNavigation('pricing') },
                { label: 'About', action: () => navigate('/about') },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavigation('pricing')}
                className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-2 text-xs sm:text-sm text-gray-300 hover:text-white border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-all whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Slide Menu */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-[#080C14] border-r border-white/10 z-40 md:hidden transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-white/10">
          <span className="text-lg font-bold text-white">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-4 space-y-1 px-3">
          <button
            onClick={() => handleNavigation('features')}
            className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => handleNavigation('pricing')}
            className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => {
              navigate('/about');
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            About
          </button>
        </div>

        {/* Menu CTA Button */}
        <div className="px-3 pt-4 border-t border-white/10">
          <button
            onClick={() => {
              handleNavigation('pricing');
              setIsOpen(false);
            }}
            className="w-full py-3 text-sm bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all text-white"
          >
            Get Started
          </button>
        </div>
      </div>
    </>
  );
}
