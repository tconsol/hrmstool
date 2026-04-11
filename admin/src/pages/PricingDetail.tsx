import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Star, Zap, Shield, Users, Clock, TrendingUp, BarChart3, FileText, CreditCard, Award, Bell, FolderOpen, CalendarDays } from 'lucide-react';
import LandingNavbar from '../components/Landing/LandingNavbar';

const pricingData = {
  starter: {
    name: 'Starter',
    price: '₹4,999',
    period: '/month',
    annualPrice: '₹3,999',
    description: 'Everything a small business needs to get HR off the ground.',
    tagline: 'Perfect for small teams getting started',
    popular: false,
    cta: 'Start 14-Day Free Trial',
    gradient: 'from-blue-600 to-blue-400',
    glow: 'shadow-blue-500/20',
    modules: [
      {
        icon: Users,
        title: 'Employee Management',
        features: [
          'Basic employee profiles',
          'Department assignment',
          'Designation management',
          'Employee status tracking',
          'Profile photo uploads',
        ],
      },
      {
        icon: Clock,
        title: 'Attendance & Shifts',
        features: [
          'Daily attendance marking',
          'Monthly attendance reports',
          'Shift management',
          'Absence tracking',
        ],
      },
      {
        icon: FileText,
        title: 'Leave Management',
        features: [
          'Standard leave types',
          'Leave application & approval',
          'Leave balance visibility',
          'Holiday calendar',
        ],
      },
      {
        icon: BarChart3,
        title: 'Dashboard & Analysis',
        features: [
          'Basic dashboard',
          'Attendance reports',
          'Leave usage summary',
          'Export to CSV',
        ],
      },
      {
        icon: Bell,
        title: 'Notifications & Support',
        features: [
          'Email notifications',
          'Dashboard alerts',
          'Email support',
          'Documentation access',
        ],
      },
    ],
    notIncluded: [
      'Payroll processing',
      'Training management',
      'Asset management',
      'Expense tracking',
      'Advanced analytics',
      'API access',
    ],
  },
  professional: {
    name: 'Professional',
    price: '₹14,999',
    period: '/month',
    annualPrice: '₹11,999',
    description: 'The complete HR suite for scale-ups and growing companies.',
    tagline: 'For growing organizations needing advanced features',
    popular: true,
    cta: 'Start 14-Day Free Trial',
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/20',
    modules: [
      {
        icon: Users,
        title: 'Employee Management',
        features: [
          'Advanced employee profiles',
          'Multi-department org structure',
          'Designation management',
          'Document repository',
          'Onboarding workflows',
        ],
      },
      {
        icon: Clock,
        title: 'Attendance & Shifts',
        features: [
          'Real-time attendance tracking',
          'Multiple shift scheduling',
          'Overtime tracking',
          'Attendance analytics',
          'Shift management',
        ],
      },
      {
        icon: FileText,
        title: 'Leave Management',
        features: [
          'Custom leave policies',
          'Multi-level approvals',
          'Automatic balance accrual',
          'Leave encashment support',
        ],
      },
      {
        icon: TrendingUp,
        title: 'Payroll Processing',
        features: [
          'Automated payroll runs',
          'Salary component configuration',
          'Tax deduction calculation',
          'Payslip generation (PDF)',
          'Expense tracking & reimbursement',
        ],
      },
      {
        icon: Award,
        title: 'Training & Development',
        features: [
          'Training program management',
          'Skills tracking',
          'Certification management',
          'Development plans',
        ],
      },
      {
        icon: BarChart3,
        title: 'Advanced Analytics',
        features: [
          'Executive dashboard',
          'Payroll analytics',
          'Attendance heatmaps',
          'Custom reports',
          'Scheduled email reports',
        ],
      },
      {
        icon: FolderOpen,
        title: 'Document & Asset Management',
        features: [
          'Cloud document storage',
          'Asset tracking',
          'Expiry alerts',
          'Document distribution',
        ],
      },
      {
        icon: Bell,
        title: 'Notifications & Calendar',
        features: [
          'Real-time notifications',
          'Announcement system',
          'Calendar events',
          'Leave/payroll alerts',
        ],
      },
      {
        icon: Shield,
        title: 'Support',
        features: [
          'Priority email support',
          '4–8 hour response SLA',
          'Dedicated onboarding',
          'Monthly check-in call',
        ],
      },
    ],
    notIncluded: [
      'All 18 features',
      'Custom API integrations',
      'SSO / SAML support',
      'Organization management',
      'Super admin panel',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    annualPrice: 'Custom',
    description: 'Unlimited scale, full customization, and white-glove support.',
    tagline: 'All 18 features · Unlimited employees · Full organization management',
    popular: false,
    cta: 'Request a Demo',
    gradient: 'from-purple-600 to-pink-500',
    glow: 'shadow-purple-500/20',
    modules: [
      {
        icon: Users,
        title: 'Complete Employee Management',
        features: [
          'Unlimited employee profiles',
          'Complete org hierarchy',
          'Department management',
          'Designation management',
          'Employee document repository',
          'Onboarding workflows',
        ],
      },
      {
        icon: Clock,
        title: 'Attendance & Shifts',
        features: [
          'Real-time attendance tracking',
          'Biometric device integration',
          'Multiple shift scheduling',
          'Overtime management',
          'Attendance analytics',
        ],
      },
      {
        icon: TrendingUp,
        title: 'Comprehensive Payroll',
        features: [
          'Automated payroll processing',
          'Tax compliance',
          'Salary component customization',
          'Payslip generation',
          'Expense tracking & reimbursement',
        ],
      },
      {
        icon: FileText,
        title: 'Leave & Holiday Management',
        features: [
          'Custom leave policies',
          'Multi-level approval chains',
          'Holiday calendar management',
          'Leave encashment',
          'Calendar event scheduling',
        ],
      },
      {
        icon: Award,
        title: 'Training & Performance',
        features: [
          'Training program management',
          'Skills & certification tracking',
          'Development plans',
          'Performance management',
        ],
      },
      {
        icon: BarChart3,
        title: 'Advanced Analytics & Reports',
        features: [
          'Executive dashboard',
          'Custom report builder',
          'Attrition analytics',
          'Payroll analytics',
          'Attendance insights',
        ],
      },
      {
        icon: FolderOpen,
        title: 'Asset & Document Management',
        features: [
          'Asset tracking & lifecycle',
          'Document management',
          'Unlimited cloud storage',
          'Expiry notifications',
        ],
      },
      {
        icon: Bell,
        title: 'Announcements & Notifications',
        features: [
          'Company-wide announcements',
          'Real-time notifications',
          'Custom notification rules',
          'Auto-escalation workflows',
        ],
      },
      {
        icon: Shield,
        title: 'Organization & Security',
        features: [
          'Organization management',
          'Super Admin panel',
          'Role-based access control',
          'Advanced security & SSO',
          'Audit trail',
        ],
      },
      {
        icon: Zap,
        title: 'Integrations & API',
        features: [
          'Full REST API access',
          'Webhook event subscriptions',
          'Custom integrations',
          'SSO (SAML, OAuth2)',
          'Third-party tool sync',
        ],
      },
      {
        icon: Clock,
        title: 'Support & Success',
        features: [
          'Dedicated account manager',
          '24/7 priority support',
          '99.99% uptime SLA',
          'Custom training & onboarding',
          'Quarterly business reviews',
        ],
      },
    ],
    notIncluded: [],
  },
};

type TierId = keyof typeof pricingData;

export default function PricingDetail() {
  const { tierId } = useParams<{ tierId: string }>();
  const navigate = useNavigate();

  const tier = tierId && tierId in pricingData ? pricingData[tierId as TierId] : null;

  if (!tier) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Plan not found.</p>
          <button onClick={() => navigate('/')} className="text-blue-400 hover:underline">Back to Home</button>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-10 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Pricing
        </button>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-14">
          <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-10`} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              {tier.popular && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-full mb-4">
                  <Star className="w-3 h-3" />
                  Most Popular
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{tier.name} Plan</h1>
              <p className="text-gray-400 text-lg mb-2">{tier.description}</p>
              <p className="text-sm text-gray-500">{tier.tagline}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-6xl font-black text-white">{tier.price}</div>
              <div className="text-gray-500 text-sm mt-1">{tier.period}</div>
              {tier.annualPrice !== tier.price && tier.annualPrice !== 'Custom' && (
                <div className="text-green-400 text-sm mt-2">Save with annual: {tier.annualPrice}/mo</div>
              )}
              <button
                className={`mt-6 px-8 py-3.5 bg-gradient-to-r ${tier.gradient} text-white font-semibold rounded-xl shadow-xl ${tier.glow} hover:scale-105 transition-all`}
              >
                {tier.cta}
              </button>
            </div>
          </div>
        </div>

        {/* Module breakdown */}
        <h2 className="text-2xl font-black text-white mb-8">
          What's included in <span className={`bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>{tier.name}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {tier.modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white">{mod.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {mod.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Not included */}
        {tier.notIncluded.length > 0 && (
          <div className="mb-14">
            <h3 className="text-lg font-bold text-gray-400 mb-4">Not included in {tier.name}</h3>
            <div className="flex flex-wrap gap-3">
              {tier.notIncluded.map((item) => (
                <span key={item} className="px-4 py-2 rounded-lg border border-white/5 text-sm text-gray-600 bg-white/[0.01]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compare all plans CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div>
            <p className="text-white font-semibold mb-1">Need to compare all plans?</p>
            <p className="text-sm text-gray-500">See a side-by-side breakdown of all features and limits.</p>
          </div>
          <button
            onClick={() => { navigate('/'); setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
            className="flex-shrink-0 px-6 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-white/5 transition-all font-medium"
          >
            View All Plans
          </button>
        </div>
      </div>
    </div>
  );
}
