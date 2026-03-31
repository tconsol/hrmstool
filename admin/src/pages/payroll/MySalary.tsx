import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Download, Wallet } from 'lucide-react';

const MySalary = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    fetchPayrolls();
  }, [year]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/payroll/my?year=${year}`);
      setPayrolls(data);
    } catch (error) {
      toast.error('Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, month: number, yr: number) => {
    try {
      const response = await api.get(`/payroll/payslip/${id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip_${month}_${yr}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Payslip downloaded!');
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1).toLocaleString('default', { month: 'long' });
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'hold': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Salary</h1>
        <p className="text-dark-400 text-sm mt-1">View salary details and download payslips</p>
      </div>

      {/* Latest Salary Card */}
      {payrolls[0] && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet size={20} className="text-brand-400" />
            Latest Salary - {getMonthName(payrolls[0].month)} {payrolls[0].year}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-dark-400">Base Salary</p>
              <p className="text-xl font-bold text-white">₹{payrolls[0].baseSalary?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Deductions</p>
              <p className="text-xl font-bold text-red-400">-₹{payrolls[0].totalDeductions?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Bonuses</p>
              <p className="text-xl font-bold text-emerald-400">+₹{payrolls[0].totalBonuses?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Net Salary</p>
              <p className="text-xl font-bold text-brand-400">₹{payrolls[0].netSalary?.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-dark-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-dark-400">
              <p>Leave Deduction: ₹{payrolls[0].deductions?.leave?.toLocaleString()}</p>
              <p>Tax: ₹{payrolls[0].deductions?.tax?.toLocaleString()}</p>
            </div>
            <button
              onClick={() => handleDownload(payrolls[0]._id, payrolls[0].month, payrolls[0].year)}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              Download Payslip
            </button>
          </div>
        </div>
      )}

      {/* Year Filter */}
      <div className="glass-card p-4">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-dark w-32">
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Salary History */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Base Salary</th>
                  <th className="hidden sm:table-cell">Deductions</th>
                  <th className="hidden md:table-cell">Bonuses</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Payslip</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p: any) => (
                  <tr key={p._id}>
                    <td className="font-medium text-white">{getMonthName(p.month)} {p.year}</td>
                    <td>₹{p.baseSalary?.toLocaleString()}</td>
                    <td className="hidden sm:table-cell text-red-400">-₹{p.totalDeductions?.toLocaleString()}</td>
                    <td className="hidden md:table-cell text-emerald-400">+₹{p.totalBonuses?.toLocaleString()}</td>
                    <td className="font-semibold text-white">₹{p.netSalary?.toLocaleString()}</td>
                    <td>
                      <span className={getPaymentBadge(p.paymentStatus)}>{p.paymentStatus}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDownload(p._id, p.month, p.year)}
                        className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-brand-400 transition-colors"
                        title="Download Payslip"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-dark-500">
                      No salary records for {year}
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
