import { useNavigate } from 'react-router-dom';
import { CheckCircle, Star, ArrowRight } from 'lucide-react';

const subscriptionTiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹4,999',
    period: '/month',
    description: 'Perfect for small businesses getting started.',
    popular: false,
    features: [
      'Basic Employee Management',
      'Attendance Tracking',
      'Leave Management',
      'Holiday Calendar',
      'Department Management',
      'Shift Management',
      'Basic Dashboard',
      'Notifications',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    color: 'blue',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '₹14,999',
    period: '/month',
    description: 'For growing teams that need more power.',
    popular: true,
    features: [
      'All Starter features',
      'Advanced Payroll Processing',
      'Training Management',
      'Designation Management',
      'Asset Management',
      'Document Management',
      'Expense Tracking',
      'Calendar Events',
      'Advanced Analytics',
      'Priority Support',
    ],
    cta: 'Start Free Trial',
    color: 'cyan',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Unlimited scale for large organizations.',
    popular: false,
    features: [
      'All 18 platform features',
      'Announcements & Communications',
      'Organization Management',
      'Super Admin Panel',
      'Advanced Security & SSO',
      'Dedicated Account Manager',
      '24/7 Priority Support',
      'Custom Integrations & API',
      'SLA Guarantee',
      'Advanced Onboarding & Training',
    ],
    cta: 'Request Demo',
    color: 'purple',
  },
];

const colorStyles: Record<string, { border: string; glow: string; button: string; badge: string }> = {
  blue:   { border: 'border-blue-500/30',   glow: 'hover:shadow-blue-500/10',   button: 'bg-blue-600 hover:bg-blue-500',                             badge: '' },
  cyan:   { border: 'border-cyan-500/50',    glow: 'hover:shadow-cyan-500/20',   button: 'bg-gradient-to-r from-cyan-500 to-blue-600',              badge: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
  purple: { border: 'border-purple-500/30', glow: 'hover:shadow-purple-500/10', button: 'bg-gradient-to-r from-purple-600 to-pink-500',            badge: '' },
};

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-28 px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 px-2">
          <p className="text-blue-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 sm:mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {subscriptionTiers.map((tier) => {
            const s = colorStyles[tier.color];
            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border ${
                  tier.popular ? s.border : 'border-white/5'
                } bg-white/[0.02] hover:bg-white/[0.04] hover:shadow-xl ${s.glow} transition-all duration-300`}
              >
                {tier.popular && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold text-white rounded-full ${s.badge} flex items-center gap-1.5 shadow-lg`}>
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                    <p className="text-sm text-gray-500">{tier.description}</p>
                  </div>

                  <div className="mb-7">
                    <span className="text-5xl font-black text-white">{tier.price}</span>
                    <span className="text-gray-500 ml-2 text-sm">{tier.period}</span>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-400">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3">
                    {/* View full details — full page link */}
                    <button
                      onClick={() => navigate(`/pricing/${tier.id}`)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/5 hover:border-blue-500/40 transition-all group"
                    >
                      View full details
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Primary CTA */}
                    <button
                      className={`w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] shadow-lg ${s.button}`}
                    >
                      {tier.cta}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise note */}
        <p className="text-center text-sm text-gray-600 mt-10">
          Need a custom plan?{' '}
          <button className="text-blue-400 hover:text-blue-300 transition-colors">Contact our sales team →</button>
        </p>
      </div>
    </section>
  );
}
