import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="relative bg-gradient-to-b from-slate-950 to-slate-900 border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-black text-white">
                H
              </div>
              <span className="text-lg font-bold text-white">HRMS</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-xs">
              The modern HR platform built for teams of all sizes. Streamline every HR process in one place.
            </p>
            <div className="space-y-1.5 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@hrms.io</div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +1 (800) 123-4567</div>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> San Francisco, CA</div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Features', action: () => scrollTo('features') },
                { label: 'Pricing', action: () => scrollTo('pricing') },
                { label: 'Security', action: () => {} },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button onClick={action} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About', action: () => navigate('/about') },
                { label: 'Careers', action: () => {} },
                { label: 'Blog', action: () => {} },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button onClick={action} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((label) => (
                <li key={label}>
                  <button className="text-sm text-gray-500 hover:text-white transition-colors">{label}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">&copy; {currentYear} HRMS Technologies Inc. All rights reserved.</p>
          <p className="text-xs text-gray-600">Built with ❤️ for modern HR teams</p>
        </div>
      </div>
    </footer>
  );
}
