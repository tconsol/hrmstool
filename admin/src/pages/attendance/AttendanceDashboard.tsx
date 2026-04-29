import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CalendarCheck, Search, Filter, Clock, LogOut } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ProcessCheckoutModal from '../../components/ui/ProcessCheckoutModal';
import Select from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';
import DatePicker from '../../components/ui/DatePicker';

const fmtHours = (h: number) => {
  if (!h && h !== 0) return '-';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0 && mins === 0) return '0h';
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const AttendanceDashboard = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();
  const isHR = user?.role === 'hr';

  // Manual mark state
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showProcessCheckoutModal, setShowProcessCheckoutModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [markForm, setMarkForm] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: '',
  });

  useEffect(() => {
    fetchAttendance();
  }, [date, statusFilter]);

  // Live real-time updates: when someone checks in/out, update table without refresh
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const handleAttendanceUpdate = (e: Event) => {
      const payload = (e as CustomEvent).detail;
      const record = payload?.record;
      if (!record) return;
      if (date !== todayStr) return;
      if (statusFilter && record.status !== statusFilter) return;

      setAttendance((prev) => {
        const idx = prev.findIndex((r) => r._id === record._id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = record;
          return updated;
        }
        return [record, ...prev];
      });
    };

    window.addEventListener('hrms:attendance_update', handleAttendanceUpdate);
    return () => window.removeEventListener('hrms:attendance_update', handleAttendanceUpdate);
  }, [date, statusFilter]);

  // Polling fallback: auto-refresh attendance every 15s when viewing today's date
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (date !== todayStr) return; // only poll for today

    const poll = setInterval(() => {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      api.get(`/attendance/all?${params.toString()}`)
        .then(({ data }) => setAttendance(data.attendance))
        .catch(() => {});
    }, 15000);

    return () => clearInterval(poll);
  }, [date, statusFilter]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');

      const { data } = await api.get(`/attendance/all?${params.toString()}`);
      setAttendance(data.attendance);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees?limit=100');
      setEmployees(data.employees);
    } catch (error) {    }
  };

  const handleMarkAttendance = async () => {
    try {
      await api.post('/attendance/mark', markForm);
      toast.success('Attendance marked');
      setShowMarkModal(false);
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return 'badge-success';
      case 'late': return 'badge-warning';
      case 'absent': return 'badge-danger';
      case 'half-day': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-dark-400 text-sm mt-1">Monitor employee attendance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchEmployees();
              setShowProcessCheckoutModal(true);
            }}
            className="btn-primary flex items-center gap-2"
            style={{ display: isHR ? undefined : 'none' }}
          >
            <LogOut size={18} />
            Process Checkout
          </button>
          <button
            onClick={() => {
              fetchEmployees();
              setShowMarkModal(true);
            }}
            className="btn-primary flex items-center gap-2"
            style={{ display: isHR ? undefined : 'none' }}
          >
            <CalendarCheck size={18} />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <DatePicker
            value={date}
            onChange={setDate}
            className="w-full sm:w-48"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Status"
            options={[
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' },
              { value: 'half-day', label: 'Half Day' },
            ]}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      {/* Table */}
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
                  <th>Employee</th>
                  <th className="hidden md:table-cell">Department</th>
                  <th>Check In</th>
                  <th className="hidden sm:table-cell">Check Out</th>
                  <th className="hidden md:table-cell">Work Mode</th>
                  <th className="hidden lg:table-cell">Work Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record: any) => (
                  <tr key={record._id}>
                    <td>
                      <div>
                        <p className="font-medium text-white">{record.user?.name || 'N/A'}</p>
                        <p className="text-xs text-dark-400">{record.user?.employeeId}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">{typeof record.user?.department === 'object' && record.user?.department ? (record.user.department as any).name : (record.user?.department || 'N/A')}</td>
                    <td>
                      {record.checkIn
                        ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="hidden sm:table-cell">
                      {record.checkOut
                        ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="hidden md:table-cell">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: (record.checkInMode ?? record.workMode) === 'remote' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: (record.checkInMode ?? record.workMode) === 'remote' ? '#2563eb' : '#059669'
                        }}
                      >
                        {(record.checkInMode ?? record.workMode) === 'remote' ? '🏠 Remote' : '🏢 Office'}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">{record.workHours ? fmtHours(record.workHours) : '-'}</td>
                    <td>
                      <span className={getStatusBadge(record.status)}>{record.status}</span>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-dark-500">
                      No attendance records for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <Modal onClose={() => setShowMarkModal(false)}>
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">Mark Attendance</h3>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Employee</label>
              <Select
                value={markForm.userId}
                onChange={(v) => setMarkForm({ ...markForm, userId: v })}
                placeholder="Select Employee"
                options={employees.map((emp: any) => ({
                  value: emp._id,
                  label: `${emp.name} (${emp.employeeId})`,
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Date</label>
              <DatePicker
                value={markForm.date}
                onChange={(val) => setMarkForm({ ...markForm, date: val })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Status</label>
              <Select
                value={markForm.status}
                onChange={(v) => setMarkForm({ ...markForm, status: v })}
                options={[
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'half-day', label: 'Half Day' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Notes</label>
              <input
                value={markForm.notes}
                onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })}
                className="input-dark"
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowMarkModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleMarkAttendance}
                disabled={!markForm.userId}
                className="btn-primary"
              >
                Mark
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Process Checkout Modal */}
      <ProcessCheckoutModal
        isOpen={showProcessCheckoutModal}
        onClose={() => setShowProcessCheckoutModal(false)}
        onSuccess={fetchAttendance}
        employees={employees}
      />
    </div>
  );
};

export default AttendanceDashboard;
