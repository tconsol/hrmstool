import { useState, useEffect } from 'react';
import api from '../../services/api';
import { getCurrentLocation } from '../../services/geolocation';
import toast from 'react-hot-toast';
import {
  CalendarCheck,
  CalendarOff,
  Wallet,
  Clock,
  LogIn,
  LogOut,
  AlertCircle,
  Building2,
  Wifi,
} from 'lucide-react';
import type { EmployeeDashboard as EmployeeDashData } from '../../types';
import Modal from '../../components/ui/Modal';

const useElapsed = (checkIn: string | null | undefined, checkOut: string | null | undefined) => {
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

const EmployeeDashboard = () => {
  const [data, setData] = useState<EmployeeDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMode, setCheckInMode] = useState<'office' | 'remote'>('office');
  const [locationError, setLocationError] = useState<{ message: string; locations: any[] } | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data: dashData } = await api.get('/dashboard/employee');
      setData(dashData);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call hooks before any early returns
  const liveElapsed = useElapsed(data?.todayAttendance?.checkIn, data?.todayAttendance?.checkOut);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const body: any = { checkInMode };
      if (checkInMode === 'office') {
        toast.loading('Getting your location...', { id: 'location-fetch' });
        const location = await getCurrentLocation();
        if (location) {
          body.latitude = location.latitude;
          body.longitude = location.longitude;
        }
        toast.dismiss('location-fetch');
      }
      await api.post('/attendance/check-in', body);
      toast.success('Checked in successfully!');
      fetchDashboard();
    } catch (error: any) {
      toast.dismiss('location-fetch');
      // If location error, show Modal instead of toast
      if (error.response?.data?.isLocationError) {
        setLocationError({
          message: error.response.data.message,
          locations: error.response.data.officeLocations || [],
        });
      } else {
        toast.error(error.response?.data?.error || 'Check-in failed');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Checked out successfully!');
      fetchDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Check-out failed');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasCheckedIn = data?.todayAttendance?.checkIn;
  const hasCheckedOut = data?.todayAttendance?.checkOut;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
        <p className="text-dark-400 text-sm mt-1">Your daily overview</p>
      </div>

      {/* Attendance Action Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock size={20} className="text-brand-400" />
              Today's Attendance
            </h3>
            <p className="text-sm text-dark-400 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {hasCheckedIn && (
              <p className="text-xs text-dark-400 mt-2">
                Check-in: {new Date(data!.todayAttendance!.checkIn!).toLocaleTimeString()}
                {hasCheckedOut &&
                  ` • Check-out: ${new Date(data!.todayAttendance!.checkOut!).toLocaleTimeString()}`}
                {!hasCheckedOut && liveElapsed && (
                  <span className="inline-flex items-center gap-1 ml-2 text-brand-400 animate-pulse">
                    <Clock size={12} /> {liveElapsed} elapsed
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center">
            {!hasCheckedIn && (
              <div className="flex rounded-lg border border-dark-600 overflow-hidden mr-1">
                <button
                  onClick={() => setCheckInMode('office')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                    checkInMode === 'office'
                      ? 'bg-brand-500 text-white'
                      : 'bg-dark-700 text-dark-400 hover:text-white'
                  }`}
                >
                  <Building2 size={14} /> In Office
                </button>
                <button
                  onClick={() => setCheckInMode('remote')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                    checkInMode === 'remote'
                      ? 'bg-brand-500 text-white'
                      : 'bg-dark-700 text-dark-400 hover:text-white'
                  }`}
                >
                  <Wifi size={14} /> Remote
                </button>
              </div>
            )}
            {!hasCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="btn-success flex items-center gap-2"
              >
                {checkingIn ? (
                  <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                Check In
              </button>
            ) : !hasCheckedOut ? (
              <button
                onClick={handleCheckOut}
                disabled={checkingIn}
                className="btn-danger flex items-center gap-2"
              >
                {checkingIn ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                ) : (
                  <LogOut size={18} />
                )}
                Check Out
              </button>
            ) : (
              <span className="badge-success px-4 py-2">Day Complete ✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <CalendarCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{data?.monthAttendance || 0}</p>
              <p className="text-sm text-dark-400">Days Present (Month)</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10">
              <CalendarOff size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {data?.leaveBalance
                  ? data.leaveBalance.casual + data.leaveBalance.sick + data.leaveBalance.paid
                  : 0}
              </p>
              <p className="text-sm text-dark-400">Leave Balance</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <CalendarOff size={20} className="text-amber-400" />
            </div>
            <div>
              <div className="flex gap-2 text-xs">
                <span className="text-emerald-400">CL: {data?.leaveBalance?.casual || 0}</span>
                <span className="text-blue-400">SL: {data?.leaveBalance?.sick || 0}</span>
                <span className="text-purple-400">PL: {data?.leaveBalance?.paid || 0}</span>
              </div>
              <p className="text-sm text-dark-400 mt-1">Leave Breakdown</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10">
              <Wallet size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                ₹{(data?.latestPayroll?.netSalary || 0).toLocaleString()}
              </p>
              <p className="text-sm text-dark-400">Latest Salary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leaves */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Leave Requests</h3>
        {data?.recentLeaves && data.recentLeaves.length > 0 ? (
          <div className="space-y-3">
            {data.recentLeaves.map((leave: any) => (
              <div
                key={leave._id}
                className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-white capitalize">
                    {leave.leaveType} Leave
                  </p>
                  <p className="text-xs text-dark-400">
                    {new Date(leave.startDate).toLocaleDateString()} -{' '}
                    {new Date(leave.endDate).toLocaleDateString()} ({leave.totalDays} day
                    {leave.totalDays > 1 ? 's' : ''})
                  </p>
                </div>
                <span
                  className={
                    leave.status === 'approved'
                      ? 'badge-success'
                      : leave.status === 'rejected'
                      ? 'badge-danger'
                      : 'badge-warning'
                  }
                >
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-500 text-center py-4">No recent leave requests</p>
        )}
      </div>

      {/* Location Error Modal */}
      {locationError && (
        <Modal onClose={() => setLocationError(null)}>
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Location Check-in Failed</h3>
                <p className="text-sm text-dark-400 mt-1">{locationError.message}</p>
              </div>
            </div>

            {locationError.locations.length > 0 && (
              <div className="bg-dark-700/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-dark-300 uppercase tracking-wide">Required Office Locations</p>
                {locationError.locations.map((loc: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium text-white">{loc.name}</p>
                    <p className="text-xs text-dark-400">{loc.address}</p>
                    <p className="text-xs text-dark-500 mt-0.5">📍 Radius: {loc.radiusMeters}m</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-dark-600">
              <button
                onClick={() => setLocationError(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeDashboard;
