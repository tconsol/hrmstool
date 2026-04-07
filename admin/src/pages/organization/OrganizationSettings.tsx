import { useState, useEffect } from 'react';
import { Building, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function OrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState({ name: '', email: '', phone: '', address: '', website: '', industry: '' });
  const [settings, setSettings] = useState({
    fiscalYearStart: 4,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    lateThresholdMinutes: 15,
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
  });

  const dayMap = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
  const dayMapReverse = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' };
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    (async () => {
      try {
        const [orgRes, settingsRes] = await Promise.all([
          api.get('/organization'),
          api.get('/organization/settings'),
        ]);
        setOrg({
          name: orgRes.data.name || '', email: orgRes.data.email || '', phone: orgRes.data.phone || '',
          address: orgRes.data.address || '', website: orgRes.data.website || '', industry: orgRes.data.industry || '',
        });
        if (settingsRes.data) {
          setSettings(prev => ({ ...prev, ...settingsRes.data }));
        }
      } catch { toast.error('Failed to load settings'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSaveOrg = async () => {
    setSaving(true);
    try {
      await api.put('/organization', org);
      toast.success('Organization updated');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/organization/settings', { settings });
      toast.success('Settings updated');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggleDay = (day: string) => {
    const abbrevDay = dayMapReverse[day as keyof typeof dayMapReverse];
    setSettings(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(abbrevDay)
        ? prev.workingDays.filter(d => d !== abbrevDay)
        : [...prev.workingDays, abbrevDay],
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Organization Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your organization profile and preferences</p>
      </div>

      {/* Organization Profile */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Building className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Organization Profile</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Organization Name</label>
            <input value={org.name} onChange={e => setOrg({ ...org, name: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input type="email" value={org.email} onChange={e => setOrg({ ...org, email: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Phone</label>
            <input value={org.phone} onChange={e => setOrg({ ...org, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Website</label>
            <input value={org.website} onChange={e => setOrg({ ...org, website: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Industry</label>
            <input value={org.industry} onChange={e => setOrg({ ...org, industry: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Address</label>
            <input value={org.address} onChange={e => setOrg({ ...org, address: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSaveOrg} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </div>
      </div>

      {/* Work Settings */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Work Settings</h2>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Fiscal Year Start</label>
              <select value={settings.fiscalYearStart} onChange={e => setSettings({ ...settings, fiscalYearStart: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Currency</label>
              <select value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Date Format</label>
              <select value={settings.dateFormat} onChange={e => setSettings({ ...settings, dateFormat: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Shift Start</label>
              <input type="time" value={settings.shiftStartTime} onChange={e => setSettings({ ...settings, shiftStartTime: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Shift End</label>
              <input type="time" value={settings.shiftEndTime} onChange={e => setSettings({ ...settings, shiftEndTime: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Late Threshold (min)</label>
              <input type="number" min={0} value={settings.lateThresholdMinutes} onChange={e => setSettings({ ...settings, lateThresholdMinutes: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {allDays.map(day => {
                const abbrev = dayMapReverse[day as keyof typeof dayMapReverse];
                const isSelected = settings.workingDays.includes(abbrev);
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
