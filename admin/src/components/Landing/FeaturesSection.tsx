import { Users, Clock, FileText, TrendingUp, BarChart3, Shield, Zap, FolderOpen, CreditCard, CalendarDays, Bell, Award } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Employee Management',
    description: 'Full lifecycle management — onboard, update, offboard. Rich profiles with docs, history, and org charts.',
    color: 'blue',
  },
  {
    icon: Clock,
    title: 'Attendance Tracking',
    description: 'Real-time clock-in/out, shift scheduling, overtime calculation, and geo-location support.',
    color: 'cyan',
  },
  {
    icon: FileText,
    title: 'Leave Management',
    description: 'Custom leave policies, multi-level approval workflows, auto balance deduction, and accruals.',
    color: 'violet',
  },
  {
    icon: TrendingUp,
    title: 'Payroll Processing',
    description: 'Automated salary runs, tax computation, payslip generation, and expense reimbursements.',
    color: 'green',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Interactive dashboards with headcount, turnover, cost, and attendance analytics.',
    color: 'orange',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Granular permissions per module. Super Admin, HR, Manager, and Employee roles.',
    color: 'red',
  },
  {
    icon: CalendarDays,
    title: 'Company Calendar',
    description: 'Shared holiday calendar, team events, and schedule visibility for the whole org.',
    color: 'pink',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Real-time alerts for approvals, payroll, announcements, and policy changes via WebSocket.',
    color: 'yellow',
  },
  {
    icon: Award,
    title: 'Training & Development',
    description: 'Track training programs, certifications, skills, and employee growth plans.',
    color: 'cyan',
  },
  {
    icon: FolderOpen,
    title: 'Document Management',
    description: 'Secure cloud storage for contracts, IDs, policies, and employee-specific files.',
    color: 'blue',
  },
  {
    icon: CreditCard,
    title: 'Expense Management',
    description: 'Submit, approve, and track expense claims with receipt uploads and category breakdown.',
    color: 'violet',
  },
  {
    icon: Zap,
    title: 'Asset Tracking',
    description: 'Assign and track company assets per employee with warranty and purchase history.',
    color: 'green',
  },
];

const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   glow: 'group-hover:shadow-blue-500/20' },
  cyan:   { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   glow: 'group-hover:shadow-cyan-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'group-hover:shadow-violet-500/20' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  glow: 'group-hover:shadow-green-500/20' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'group-hover:shadow-orange-500/20' },
  red:    { bg: 'bg-red-500/10',    text: 'text-red-400',    glow: 'group-hover:shadow-red-500/20' },
  pink:   { bg: 'bg-pink-500/10',   text: 'text-pink-400',   glow: 'group-hover:shadow-pink-500/20' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'group-hover:shadow-yellow-500/20' },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-blue-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3">Capabilities</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 sm:mb-4">
            Everything HR needs,<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">nothing it doesn't</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            A complete suite of tools built for how modern teams actually work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const c = colorMap[feature.color] ?? colorMap.blue;
            return (
              <div
                key={i}
                className={`group relative p-4 sm:p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 hover:shadow-xl ${c.glow} h-full`}
              >
                <div className={`inline-flex p-2.5 rounded-xl ${c.bg} mb-3 sm:mb-4`}>
                  <Icon className={`w-4 sm:w-5 h-4 sm:h-5 ${c.text}`} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-1.5">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
