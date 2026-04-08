import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, Shield, Zap, Heart, Target, Globe, Award, Clock } from 'lucide-react';
import LandingNavbar from '../components/Landing/LandingNavbar';
import Footer from '../components/Landing/Footer';

const values = [
  {
    icon: Heart,
    title: 'People First',
    description: 'We build every feature with the end user in mind HR managers, employees, and executives alike. If it doesn\'t simplify their day, we rethink it.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    icon: Shield,
    title: 'Privacy & Trust',
    description: 'Employee data is sensitive. We treat security and compliance not as a feature but as a foundation encrypted at rest, audited at every step.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Move Fast',
    description: 'HR teams can\'t wait for clunky processes. We ship improvements continuously based on real feedback from the teams using our platform daily.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Globe,
    title: 'Built to Scale',
    description: 'Whether you manage 10 or 10,000 employees, the platform grows with you. Every module is designed to handle enterprise-level volume.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
];

const milestones = [
  { year: '2021', title: 'Founded', description: 'Started with a mission to fix the broken HR software market.' },
  { year: '2022', title: 'First 50 Customers', description: 'Launched core modules: employees, attendance, and leave.' },
  { year: '2023', title: 'Payroll Launch', description: 'Added automated payroll, tax computation, and payslip generation.' },
  { year: '2024', title: '500+ Companies', description: 'Scaled to 500+ organizations across 20+ industries.' },
  { year: '2025', title: 'Enterprise Tier', description: 'Launched API, SSO, biometric integration, and dedicated SLAs.' },
  { year: '2026', title: 'Global Expansion', description: 'Multi-region data residency, multi-currency payroll, and more.' },
];

const team = [
  { name: 'Arjun Sharma', role: 'CEO & Co-Founder', avatar: 'AS', color: 'from-blue-500 to-cyan-400', bio: '12 years in HR Tech. Former VP Engineering at PeopleOps.' },
  { name: 'Priya Nair', role: 'CTO & Co-Founder', avatar: 'PN', color: 'from-violet-500 to-purple-400', bio: 'Built enterprise SaaS at scale. Ex-Principal Engineer at Workday.' },
  { name: 'David Chen', role: 'Head of Product', avatar: 'DC', color: 'from-cyan-500 to-teal-400', bio: 'User obsessed. Previously PM Lead at BambooHR and Gusto.' },
  { name: 'Aisha Patel', role: 'Head of Customer Success', avatar: 'AP', color: 'from-pink-500 to-rose-400', bio: 'Onboarded 300+ companies. Driven by customer outcomes, not tickets.' },
];

const stats = [
  { icon: Users, value: '500+', label: 'Companies', color: 'text-blue-400' },
  { icon: Globe, value: '20+', label: 'Industries', color: 'text-cyan-400' },
  { icon: Award, value: '50K+', label: 'Employees Managed', color: 'text-violet-400' },
  { icon: Clock, value: '4 yrs', label: 'In Business', color: 'text-green-400' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080C14] text-white">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <LandingNavbar />

      <div className="relative z-10">
        {/* — Hero — */}
        <section className="pt-28 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6 text-center">
          <div className="absolute top-32 sm:top-40 left-1/2 -translate-x-1/2 w-[400px] sm:w-[700px] h-[250px] sm:h-[400px] bg-blue-600/8 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10">
            <p className="text-blue-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3 sm:mb-4">Our Story</p>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4 sm:mb-6 leading-tight sm:leading-none">
              We're building<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                the HR OS
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 leading-relaxed">
              HRMS was born from frustration. We watched HR teams juggle spreadsheets, old enterprise tools, and broken workflows. We decided to build something better modern, intuitive, and built for real teams.
            </p>
          </div>
        </section>

        {/* — Stats band — */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 border-y border-white/5">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <Icon className={`w-5 sm:w-6 h-5 sm:h-6 ${s.color} mx-auto mb-2 sm:mb-3`} />
                  <div className={`text-2xl sm:text-3xl md:text-4xl font-black ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{s.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* — Mission — */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div>
              <p className="text-blue-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3 sm:mb-4">Our Mission</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight">
                Make HR work for<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  people, not against them
                </span>
              </h2>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-4 sm:mb-6">
                Traditional HR software was built for compliance officers, not humans. We believe every employee deserves a seamless experience — from their first day to their last, and everything in between.
              </p>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Our platform combines automation, real-time data, and thoughtful design to give HR teams back their most valuable resource: time. Time to focus on your people, not your paperwork.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                  >
                    <div className={`inline-flex p-2 rounded-xl ${v.bg} mb-3`}>
                      <Icon className={`w-5 h-5 ${v.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{v.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* — Timeline — */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-blue-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3">Our Journey</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">How we got here</h2>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-cyan-500/30 to-transparent" />

              <div className="space-y-10">
                {milestones.map((m, i) => (
                  <div
                    key={m.year}
                    className={`relative flex items-start gap-4 sm:gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    {/* Dot */}
                    <div className="absolute left-2 sm:left-4 md:left-1/2 -translate-x-1/2 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 border-2 border-[#080C14] z-10" />

                    {/* Year label */}
                    <div className={`hidden md:block w-1/2 ${i % 2 === 0 ? 'text-right pr-8 md:pr-12' : 'pl-8 md:pl-12'}`}>
                      <span className="text-2xl sm:text-3xl font-black text-white/20">{m.year}</span>
                    </div>

                    {/* Content */}
                    <div className={`pl-12 sm:pl-16 md:pl-0 md:w-1/2 ${i % 2 === 0 ? 'md:pl-12' : 'md:pr-12'}`}>
                      <div className="p-4 sm:p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                        <div className="text-xs text-blue-400 font-semibold mb-1 md:hidden">{m.year}</div>
                        <h3 className="text-sm sm:text-base font-bold text-white mb-1">{m.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{m.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* — Team — */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-14">
              <p className="text-blue-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3">Team</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4">The people behind HRMS</h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
                A small, experienced team obsessed with building software that HR teams actually love using.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {team.map((member) => (
                <div
                  key={member.name}
                  className="p-4 sm:p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-center"
                >
                  <div className={`w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-lg sm:text-xl font-black text-white mx-auto mb-3 sm:mb-4 shadow-lg`}>
                    {member.avatar}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-xs text-blue-400 mb-2">{member.role}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* — CTA — */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
              Ready to join us?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 sm:mb-10">
              Start transforming how you manage HR today. Join 500+ companies already on the platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg sm:rounded-xl font-semibold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => { navigate('/'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 300); }}
                className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
              >
                View Pricing
              </button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
