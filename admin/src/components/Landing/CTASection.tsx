import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative">
        {/* Glow card */}
        <div className="relative rounded-3xl border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-purple-600/20" />
          <div className="absolute inset-0 bg-[#080C14]/60" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          <div className="relative z-10 py-20 px-8 text-center">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">Get Started Today</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
              Ready to transform<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">your HR workflow?</span>
            </h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto">
              Join 500+ companies using HRMS to save time, reduce errors, and build happier teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-semibold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 rounded-xl font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
              >
                Sign In to Dashboard
              </button>
            </div>
            <p className="text-gray-600 text-sm mt-8">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
