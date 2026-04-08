const testimonials = [
  {
    quote: 'HRMS completely transformed how we manage our 300+ employees. Payroll that used to take 3 days now takes 20 minutes.',
    name: 'Sarah Mitchell',
    role: 'Head of HR',
    company: 'TechNova Inc.',
    avatar: 'SM',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    quote: "The attendance tracking and leave management modules are exactly what we needed. Our employees love the self-service portal.",
    name: 'Raj Patel',
    role: 'Operations Manager',
    company: 'BuildCorp',
    avatar: 'RP',
    color: 'from-violet-500 to-purple-400',
  },
  {
    quote: 'Setting up departments, roles, and access controls was seamless. The analytics dashboard gives us real-time visibility we never had before.',
    name: 'Emily Johnson',
    role: 'CEO',
    company: 'GrowthLabs',
    avatar: 'EJ',
    color: 'from-cyan-500 to-teal-400',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Loved by HR teams everywhere
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative p-7 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              {/* Quote mark */}
              <div className="text-5xl text-blue-500/20 font-serif leading-none mb-4">"</div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-sm font-bold text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
