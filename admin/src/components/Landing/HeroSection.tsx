import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* Radial glow behind hero text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full filter blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center pt-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-8 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-300 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          Trusted by 500+ companies worldwide
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-none mb-8">
          <span className="block text-white">Manage Your</span>
          <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
            People Smarter
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The all-in-one HRMS platform that automates payroll, tracks attendance, manages leaves, and empowers your team all from a single dashboard.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-20 px-2">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-semibold text-base sm:text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 whitespace-nowrap"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg border border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20 transition-all duration-200 whitespace-nowrap"
          >
            <Play className="w-4 h-4" />
            See Pricing
          </button>
        </div>

        {/* Dashboard mockup glow card */}
        <div className="relative mx-auto max-w-4xl -mx-6 sm:mx-auto px-2 sm:px-0">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-purple-600/20 rounded-2xl blur-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden p-4 sm:p-6">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 h-6 bg-white/5 rounded-md flex items-center px-3">
                <span className="text-xs text-gray-500">app.hrms.io/dashboard</span>
              </div>
            </div>
            {/* Fake dashboard grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
              {[
                { label: 'Employees', val: '248', color: 'from-blue-600/30 to-blue-500/10' },
                { label: 'Present Today', val: '196', color: 'from-green-600/30 to-green-500/10' },
                { label: 'On Leave', val: '14', color: 'from-orange-600/30 to-orange-500/10' },
                { label: 'Open Positions', val: '7', color: 'from-purple-600/30 to-purple-500/10' },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} border border-white/5 rounded-lg sm:rounded-xl p-2 sm:p-4`}>
                  <div className="text-xs text-gray-400 mb-1 line-clamp-1">{s.label}</div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{s.val}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="sm:col-span-2 bg-white/[0.03] border border-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 h-24 sm:h-28 flex items-end gap-1">
                {[40, 65, 50, 80, 70, 90, 75, 85, 60, 95, 80, 72].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-blue-500/80 to-cyan-400/40 rounded-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 h-24 sm:h-28">
                <div className="text-xs text-gray-400 mb-2">Payroll</div>
                <div className="text-lg font-bold text-white">$124,500</div>
                <div className="mt-2 text-xs text-green-400">↑ 8.2% this month</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
