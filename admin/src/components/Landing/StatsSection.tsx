const stats = [
  { value: '500+', label: 'Companies', sub: 'Across 20+ industries' },
  { value: '50K+', label: 'Employees Managed', sub: 'Active on the platform' },
  { value: '99.9%', label: 'Uptime SLA', sub: 'Enterprise reliability' },
  { value: '4.9★', label: 'Customer Rating', sub: 'Based on 2,000+ reviews' },
];

export default function StatsSection() {
  return (
    <section className="py-16 px-6 border-y border-white/5">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-1">
              {s.value}
            </div>
            <div className="text-sm font-semibold text-white mb-0.5">{s.label}</div>
            <div className="text-xs text-gray-500">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
