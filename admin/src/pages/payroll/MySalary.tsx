import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Download, Wallet, TrendingUp, FileText, Calendar, ChevronDown, Printer } from 'lucide-react';

const MySalary = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const yearMenuRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  // Close year menu on click outside
  useEffect(() => {
    if (!yearMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (yearMenuRef.current && !yearMenuRef.current.contains(e.target as Node)) {
        setYearMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [yearMenuOpen]);

  useEffect(() => {
    fetchPayrolls();
  }, [year]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/payroll/my?year=${year}`);
      setPayrolls(data);
    } catch {
      toast.error('Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, month: number, yr: number, bw: boolean) => {
    const key = `${id}-${bw}`;
    setDownloading(key);
    try {
      const response = await api.get(`/payroll/payslip/${id}?bw=${bw}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${getMonthName(month)}_${yr}${bw ? '_bw' : ''}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Payslip downloaded (${bw ? 'B&W' : 'Color'})`);
    } catch {
      toast.error('Failed to download payslip');
    } finally {
      setDownloading(null);
    }
  };

  const getMonthName = (m: number) =>
    new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

  const statusConfig: Record<string, { label: string; cls: string }> = {
    paid:    { label: 'Paid',    cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    pending: { label: 'Pending', cls: 'bg-amber-500/15  text-amber-400  border border-amber-500/30'  },
    hold:    { label: 'On Hold', cls: 'bg-red-500/15    text-red-400    border border-red-500/30'    },
  };

  const latest   = payrolls[0];
  const totalNet = payrolls.reduce((s, p) => s + (p.netSalary || 0), 0);
  const avgNet   = payrolls.length ? Math.round(totalNet / payrolls.length) : 0;
  const yearOpts = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Salary</h1>
          <p className="text-dark-400 text-sm mt-0.5">View salary details and download payslips</p>
        </div>
        <div className="relative" ref={yearMenuRef}>
          <button
            onClick={() => setYearMenuOpen(!yearMenuOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-700 hover:border-dark-600 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Calendar size={15} className="text-dark-400" />
            {year}
            <ChevronDown size={14} className={`text-dark-400 transition-transform ${yearMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {yearMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="max-h-64 overflow-y-auto">
                {yearOpts.map(y => (
                  <button
                    key={y}
                    onClick={() => {
                      setYear(y);
                      setYearMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      y === year
                        ? 'bg-brand-600/20 text-brand-400 border-l-2 border-brand-500'
                        : 'text-dark-200 hover:bg-dark-700/40 text-white'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Latest Salary Spotlight */}
      {latest && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-dark-800/50 border border-brand-500/20 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-1">Latest Salary</p>
              <h2 className="text-xl font-bold text-white">{getMonthName(latest.month)} {latest.year}</h2>
              <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 ${statusConfig[latest.paymentStatus]?.cls ?? 'bg-dark-700 text-dark-300'}`}>
                {statusConfig[latest.paymentStatus]?.label ?? latest.paymentStatus}
              </span>
            </div>
            <div className="text-right">
              <p className="text-dark-400 text-xs">Net Salary</p>
              <p className="text-4xl font-extrabold text-white mt-1">Rs.{latest.netSalary?.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Base Salary',     value: `Rs.${latest.baseSalary?.toLocaleString()}`,         color: 'text-white'       },
              { label: 'Bonuses',         value: `+Rs.${latest.totalBonuses?.toLocaleString()}`,      color: 'text-emerald-400' },
              { label: 'Leave Deduction', value: `-Rs.${latest.deductions?.leave?.toLocaleString()}`, color: 'text-red-400'     },
              { label: 'Tax',             value: `-Rs.${latest.deductions?.tax?.toLocaleString()}`,   color: 'text-amber-400'   },
            ].map(item => (
              <div key={item.label} className="bg-dark-900/50 rounded-xl p-3 border border-dark-700/40">
                <p className="text-dark-400 text-xs mb-1">{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleDownload(latest._id, latest.month, latest.year, false)}
              disabled={!!downloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading === `${latest._id}-false`
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Download size={15} />}
              Color Payslip
            </button>
            <button
              onClick={() => handleDownload(latest._id, latest.month, latest.year, true)}
              disabled={!!downloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading === `${latest._id}-true`
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Printer size={15} />}
              B&amp;W Payslip
            </button>
          </div>
        </div>
      )}

      {/* YTD Summary */}
      {payrolls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Wallet size={18} className="text-brand-400" />,   bg: 'bg-brand-500/10',   label: `Total Earned (${year})`, value: `Rs.${totalNet.toLocaleString()}` },
            { icon: <TrendingUp size={18} className="text-emerald-400" />, bg: 'bg-emerald-500/10', label: 'Monthly Average',          value: `Rs.${avgNet.toLocaleString()}`   },
            { icon: <FileText size={18} className="text-amber-400" />,  bg: 'bg-amber-500/10',   label: 'Payslips Available',        value: String(payrolls.length)           },
          ].map(card => (
            <div key={card.label} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-dark-400 text-xs">{card.label}</p>
                <p className="text-white font-semibold text-lg leading-tight">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700/50">
            <h3 className="text-sm font-semibold text-white">Salary History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left   text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">Month</th>
                  <th className="text-right  text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">Base Salary</th>
                  <th className="text-right  text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap hidden sm:table-cell">Deductions</th>
                  <th className="text-right  text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap hidden md:table-cell">Bonuses</th>
                  <th className="text-right  text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">Net Salary</th>
                  <th className="text-center text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">Status</th>
                  <th className="text-center text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {payrolls.map((p: any, idx: number) => (
                  <tr key={p._id} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {idx === 0 && (
                          <span className="text-[10px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-full px-1.5 py-0.5 leading-tight whitespace-nowrap">
                            Latest
                          </span>
                        )}
                        <span className="text-white text-sm font-medium whitespace-nowrap">
                          {getMonthName(p.month)} {p.year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-dark-300 whitespace-nowrap">Rs.{p.baseSalary?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm text-red-400 whitespace-nowrap hidden sm:table-cell">-Rs.{p.totalDeductions?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm text-emerald-400 whitespace-nowrap hidden md:table-cell">+Rs.{p.totalBonuses?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-white font-semibold text-sm">Rs.{p.netSalary?.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusConfig[p.paymentStatus]?.cls ?? 'bg-dark-700 text-dark-300'}`}>
                        {statusConfig[p.paymentStatus]?.label ?? p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownload(p._id, p.month, p.year, false)}
                          disabled={!!downloading}
                          title="Color PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-600/80 hover:bg-brand-500 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {downloading === `${p._id}-false`
                            ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            : <Download size={11} />}
                          Color
                        </button>
                        <button
                          onClick={() => handleDownload(p._id, p.month, p.year, true)}
                          disabled={!!downloading}
                          title="B&W PDF"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 border border-dark-500/60 text-dark-200 hover:text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {downloading === `${p._id}-true`
                            ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            : <Printer size={11} />}
                          B&amp;W
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Wallet size={32} className="mx-auto mb-3 text-dark-600" />
                      <p className="text-dark-500 text-sm">No salary records found for {year}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySalary;
