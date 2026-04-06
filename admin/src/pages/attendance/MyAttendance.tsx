import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CalendarCheck, LogIn, LogOut, Clock } from 'lucide-react';
import Select from '../../components/ui/Select';

const fmtHours = (h: number) => {
  if (!h && h !== 0) return '-';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0 && mins === 0) return '0h';
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

const useElapsed = (checkIn: string | null, checkOut: string | null) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!checkIn || checkOut) { setElapsed(''); return; }
    const update = () => {
      const diff = Date.now() - new Date(checkIn).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setElapsed(`${hrs}h ${mins}m`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [checkIn, checkOut]);
  return elapsed;
};

const MyAttendance = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    fetchAttendance();
    fetchTodayStatus();
  }, [month, year]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/my?month=${month}&year=${year}`);
      setAttendance(data);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const { data } = await api.get('/attendance/today');
      setTodayStatus(data);
    } catch (error) {
      console.error('Failed to fetch today status');
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-in');
      toast.success('Checked in!');
      fetchTodayStatus();
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Checked out!');
      fetchTodayStatus();
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Check-out failed');
    } finally {
      setCheckingIn(false);
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

  const hasCheckedIn = todayStatus?.checkIn;
  const hasCheckedOut = todayStatus?.checkOut;
  const liveElapsed = useElapsed(todayStatus?.checkIn, todayStatus?.checkOut);

  const summary = {
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    halfDay: attendance.filter(a => a.status === 'half-day').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Attendance</h1>
        <p className="text-dark-400 text-sm mt-1">Track your attendance records</p>
      </div>

      {/* Check-in/out Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CalendarCheck size={20} className="text-brand-400" />
              Today
            </h3>
            <p className="text-sm text-dark-400 mt-1">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {hasCheckedIn && (
              <p className="text-xs text-dark-400 mt-1">
                In: {new Date(todayStatus.checkIn).toLocaleTimeString()}
                {hasCheckedOut && ` • Out: ${new Date(todayStatus.checkOut).toLocaleTimeString()}`}
                {hasCheckedOut && todayStatus.workHours > 0 && ` • ${fmtHours(todayStatus.workHours)}`}
                {!hasCheckedOut && liveElapsed && (
                  <span className="inline-flex items-center gap-1 ml-2 text-brand-400 animate-pulse">
                    <Clock size={12} /> {liveElapsed} elapsed
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {!hasCheckedIn ? (
              <button onClick={handleCheckIn} disabled={checkingIn} className="btn-success flex items-center gap-2">
                {checkingIn ? (
                  <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                ) : <LogIn size={18} />}
                Check In
              </button>
            ) : !hasCheckedOut ? (
              <button onClick={handleCheckOut} disabled={checkingIn} className="btn-danger flex items-center gap-2">
                {checkingIn ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : <LogOut size={18} />}
                Check Out
              </button>
            ) : (
              <span className="badge-success px-4 py-2">Day Complete ✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card items-center">
          <p className="text-2xl font-bold text-emerald-400">{summary.present}</p>
          <p className="text-xs text-dark-400">Present</p>
        </div>
        <div className="stat-card items-center">
          <p className="text-2xl font-bold text-amber-400">{summary.late}</p>
          <p className="text-xs text-dark-400">Late</p>
        </div>
        <div className="stat-card items-center">
          <p className="text-2xl font-bold text-red-400">{summary.absent}</p>
          <p className="text-xs text-dark-400">Absent</p>
        </div>
        <div className="stat-card items-center">
          <p className="text-2xl font-bold text-blue-400">{summary.halfDay}</p>
          <p className="text-xs text-dark-400">Half Day</p>
        </div>
      </div>

      {/* Month/Year Filter */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <Select
            value={String(month)}
            onChange={(v) => setMonth(Number(v))}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
            }))}
            className="w-40"
          />
          <Select
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            options={Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => ({
              value: String(y),
              label: String(y),
            }))}
            className="w-32"
          />
        </div>
      </div>

      {/* Attendance Table */}
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
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th className="hidden sm:table-cell">Work Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record: any) => (
                  <tr key={record._id}>
                    <td className="text-white">
                      {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td>
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="hidden sm:table-cell">{record.workHours ? fmtHours(record.workHours) : '-'}</td>
                    <td><span className={getStatusBadge(record.status)}>{record.status}</span></td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-dark-500">No records for this month</td>
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

export default MyAttendance;
