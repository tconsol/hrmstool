import { X, CheckCircle } from 'lucide-react';

interface SubscriptionModalProps {
  tier: {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    color: string;
  } | undefined;
  onClose: () => void;
}

const detailedFeatures: Record<string, Record<string, string[]>> = {
  starter: {
    'Employee Management': [
      'Up to 50 employees',
      'Basic profile management',
      'Department organization',
      'Simple designation tracking',
    ],
    'Attendance & Leaves': [
      'Basic attendance tracking',
      'Leave request system',
      'Limited leave policies',
      'Basic leave balance',
    ],
    'Reports & Analytics': [
      'Basic employee reports',
      'Attendance summary',
      'Leave statistics',
    ],
    'Support': ['Email support', 'Standard response time (24-48h)'],
    'Storage': ['5GB cloud storage'],
  },
  professional: {
    'Employee Management': [
      'Up to 500 employees',
      'Advanced profile management',
      'Multi-department support',
      'Flexible designations & roles',
      'Employee documents storage',
      'Customizable org structure',
    ],
    'Attendance & Leaves': [
      'Real-time attendance tracking',
      'Biometric integration ready',
      'Advanced leave policies',
      'Leave balance management',
      'Attendance reports',
      'Shift management',
    ],
    'Payroll & Salary': [
      'Automated payroll processing',
      'Detailed salary slips',
      'Tax calculations',
      'Salary component management',
      'Bulk payroll processing',
    ],
    'Performance & Training': [
      'Performance tracking',
      'Training management',
      'Employee development plans',
      'Skills tracking',
    ],
    'Reports & Analytics': [
      'Advanced analytics dashboard',
      'Custom reports',
      'Attendance analytics',
      'Payroll reports',
      'Performance insights',
    ],
    'Support': [
      'Priority email support',
      'Phone support (limited)',
      'Faster response time (4-8h)',
    ],
    'Storage': ['100GB cloud storage'],
  },
  enterprise: {
    'Employee Management': [
      'Unlimited employees',
      'Full customization',
      'Advanced org structure',
      'Document management system',
      'Records management',
      'Contract management',
    ],
    'Attendance & Leaves': [
      'Advanced attendance tracking',
      'Biometric integration',
      'GPS location tracking',
      'Custom leave policies',
      'Multi-location support',
      'Shift scheduling',
      'Overtime management',
    ],
    'Payroll & Salary': [
      'Complete payroll automation',
      'Multi-currency support',
      'Tax compliance (multiple regions)',
      'Custom salary structures',
      'Expense management',
      'Reimbursement automation',
    ],
    'Performance & Development': [
      'Advanced performance management',
      'Training & development platform',
      'Career path planning',
      'Skills assessment',
      'Learning management system',
    ],
    'Reports & Analytics': [
      'Advanced BI dashboard',
      'Custom report builder',
      'Predictive analytics',
      'Data export capabilities',
      'White-label reports',
    ],
    'Integration & API': [
      'Custom API access',
      'Third-party integrations',
      'Webhook support',
      'SSO integration',
    ],
    'Security & Compliance': [
      'Advanced security features',
      '2FA & encryption',
      'Audit logs & tracking',
      'Role-based access control',
      'Compliance certifications',
      'Data residency options',
    ],
    'Support': [
      '24/7 dedicated support',
      'Dedicated account manager',
      'Phone + chat support',
      'SLA guarantee',
      'Custom onboarding',
      'Regular business reviews',
    ],
    'Storage': ['Unlimited cloud storage'],
  },
};

export default function SubscriptionModal({
  tier,
  onClose,
}: SubscriptionModalProps) {
  if (!tier) return null;

  const features = detailedFeatures[tier.id] || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className={`sticky top-0 p-6 border-b border-slate-700 bg-gradient-to-r ${tier.color} relative`}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-4xl font-bold mb-2">{tier.name}</h2>
          <p className="text-white/90">{tier.description}</p>
          <div className="mt-4">
            <span className="text-5xl font-bold">{tier.price}</span>
            <span className="text-white/80 ml-2">{tier.period}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(features).map(([category, items]: [string, string[]]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-3">
                  {category}
                </h3>
                <div className="space-y-3">
                  {items.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 pt-8 border-t border-slate-700 flex gap-4">
            <button
              className={`flex-1 py-4 px-6 bg-gradient-to-r ${tier.color} rounded-lg font-semibold hover:shadow-lg transition-all`}
            >
              {tier.cta}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-slate-800 border border-slate-700 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
