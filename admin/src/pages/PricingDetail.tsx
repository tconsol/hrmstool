import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Star, Zap, Shield, Users, Clock, TrendingUp, BarChart3, FileText, CreditCard, Award, Bell, FolderOpen, CalendarDays } from 'lucide-react';
import LandingNavbar from '../components/Landing/LandingNavbar';

const pricingData = {
  starter: {
    name: 'Starter',
    price: '$99',
    period: '/month',
    annualPrice: '$79',
    description: 'Everything a small business needs to get HR off the ground.',
    tagline: 'Perfect for teams of up to 50 people',
    popular: false,
    cta: 'Start 14-Day Free Trial',
    gradient: 'from-blue-600 to-blue-400',
    glow: 'shadow-blue-500/20',
    modules: [
      {
        icon: Users,
        title: 'Employee Management',
        features: [
          'Up to 50 employee profiles',
          'Basic personal & work information',
          'Department & designation assignment',
          'Employee status tracking (active/inactive)',
          'Profile photo uploads',
        ],
      },
      {
        icon: Clock,
        title: 'Attendance',
        features: [
          'Daily attendance marking',
          'Monthly attendance reports',
          'Basic absence tracking',
          'Clock-in / Clock-out logs',
        ],
      },
      {
        icon: FileText,
        title: 'Leave Management',
        features: [
          'Standard leave types (sick, casual, annual)',
          'Leave application & approval',
          'Leave balance visibility',
          'Email notifications on approval',
        ],
      },
      {
        icon: BarChart3,
        title: 'Reports',
        features: [
          'Headcount report',
          'Monthly attendance summary',
          'Leave usage summary',
          'Export to CSV',
        ],
      },
      {
        icon: Shield,
        title: 'Security & Access',
        features: [
          'Role-based access (HR & Employee)',
          'Secure login with JWT',
          'Data encryption at rest',
          '5GB document storage',
        ],
      },
      {
        icon: Bell,
        title: 'Support',
        features: [
          'Email support',
          'Documentation access',
          '24–48 hour response time',
          'Onboarding guide',
        ],
      },
    ],
    notIncluded: [
      'Payroll processing',
      'Performance tracking',
      'Training management',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
    ],
  },
  professional: {
    name: 'Professional',
    price: '$299',
    period: '/month',
    annualPrice: '$249',
    description: 'The complete HR suite for scale-ups and growing companies.',
    tagline: 'For teams of up to 500 people',
    popular: true,
    cta: 'Start 14-Day Free Trial',
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/20',
    modules: [
      {
        icon: Users,
        title: 'Employee Management',
        features: [
          'Up to 500 employee profiles',
          'Advanced profile with custom fields',
          'Multi-department org structure',
          'Employee documents repository',
          'Onboarding & offboarding workflows',
          'Org chart visualization',
        ],
      },
      {
        icon: Clock,
        title: 'Attendance & Shifts',
        features: [
          'Real-time attendance with timestamps',
          'Multiple shift scheduling',
          'Overtime & hour tracking',
          'Attendance analytics dashboard',
          'Bulk attendance import',
        ],
      },
      {
        icon: FileText,
        title: 'Leave Management',
        features: [
          'Custom leave policy builder',
          'Multi-level approval chains',
          'Automatic balance accrual',
          'Leave encashment support',
          'Calendar view for team leaves',
        ],
      },
      {
        icon: TrendingUp,
        title: 'Payroll',
        features: [
          'Automated monthly payroll runs',
          'Salary component configuration',
          'Tax deduction calculation',
          'Detailed payslip generation (PDF)',
          'Bulk payroll processing',
          'Expense reimbursement integration',
        ],
      },
      {
        icon: Award,
        title: 'Performance & Training',
        features: [
          'Employee performance tracking',
          'Training program management',
          'Skills & certification tracking',
          'Development plan builder',
        ],
      },
      {
        icon: BarChart3,
        title: 'Analytics',
        features: [
          'Executive HR dashboard',
          'Attrition & headcount trends',
          'Payroll cost analytics',
          'Attendance heatmaps',
          'Custom report builder',
          'Scheduled email reports',
        ],
      },
      {
        icon: FolderOpen,
        title: 'Document Management',
        features: [
          '100GB cloud storage',
          'Employee document upload & access',
          'Policy document distribution',
          'Expiry alerts for certifications',
        ],
      },
      {
        icon: Bell,
        title: 'Notifications',
        features: [
          'Real-time WebSocket notifications',
          'Announcement broadcasts',
          'Leave/payroll event alerts',
          'Custom notification rules',
        ],
      },
      {
        icon: Shield,
        title: 'Support',
        features: [
          'Priority email + phone support',
          '4–8 hour response SLA',
          'Dedicated onboarding session',
          'Monthly check-in call',
        ],
      },
    ],
    notIncluded: [
      'Unlimited employees',
      'Custom API integrations',
      'SSO / SAML support',
      'On-premise deployment',
      'Dedicated account manager',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    annualPrice: 'Custom',
    description: 'Unlimited scale, full customization, and white-glove support.',
    tagline: 'Unlimited employees · Unlimited modules',
    popular: false,
    cta: 'Request a Demo',
    gradient: 'from-purple-600 to-pink-500',
    glow: 'shadow-purple-500/20',
    modules: [
      {
        icon: Users,
        title: 'Employee Management',
        features: [
          'Unlimited employee profiles',
          'Full custom field support',
          'Hierarchical org structure',
          'Contract & document management',
          'Background verification integration',
          'Employee self-service portal',
        ],
      },
      {
        icon: Clock,
        title: 'Attendance & Scheduling',
        features: [
          'Biometric device integration',
          'GPS-based attendance',
          'Multi-location support',
          'Shift auto-assignment engine',
          'Overtime management & approval',
          'Real-time workforce scheduling',
        ],
      },
      {
        icon: TrendingUp,
        title: 'Payroll & Finance',
        features: [
          'Multi-currency payroll',
          'Tax compliance (multiple regions)',
          'Statutory deductions automation',
          'Full expense management platform',
          'Reimbursement workflow AI routing',
          'ERP / accounting system sync',
        ],
      },
      {
        icon: BarChart3,
        title: 'Advanced Analytics',
        features: [
          'Predictive attrition analytics',
          'BI dashboard with drill-down',
          'Custom KPI builder',
          'Data warehouse export (BigQuery, S3)',
          'Scheduled stakeholder reports',
          'White-label report branding',
        ],
      },
      {
        icon: Zap,
        title: 'Integrations & API',
        features: [
          'Full REST API access',
          'Webhook event subscriptions',
          'SSO (SAML, OAuth2, Google)',
          'Slack, Teams, Jira integrations',
          'Custom middleware support',
          'Partner ecosystem access',
        ],
      },
      {
        icon: Shield,
        title: 'Security & Compliance',
        features: [
          'SOC 2 Type II certified',
          'GDPR & data residency options',
          'IP whitelisting & MFA',
          'Advanced audit trail',
          'Role + attribute-based access',
          'Pen-test reports on request',
        ],
      },
      {
        icon: CalendarDays,
        title: 'Operations',
        features: [
          'Asset tracking & lifecycle',
          'Facilities & space management',
          'Vendor & contractor management',
          'Company-wide announcement system',
          'Policy acknowledgement tracking',
        ],
      },
      {
        icon: Award,
        title: 'Support & Success',
        features: [
          'Dedicated Customer Success Manager',
          '24/7 priority support (phone, chat, email)',
          '99.99% uptime SLA',
          'Custom onboarding & training',
          'Quarterly executive business reviews',
          'Early access to new features',
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
