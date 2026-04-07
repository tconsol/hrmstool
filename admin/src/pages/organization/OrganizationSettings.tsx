import { useState, useEffect, useRef } from 'react';
import { Building, Save, Loader2, Upload, X } from 'lucide-react';
import api from '../../services/api';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';

export default function OrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState({ name: '', email: '', phone: '', address: '', website: '', industry: '', logo: '' });
  const logoInputRef = useRef<HTMLInputElement>(null);
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
          logo: orgRes.data.logo || '',
        });
        if (settingsRes.data?.settings) {
          setSettings(prev => ({ ...prev, ...settingsRes.data.settings }));
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Compress if needed
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(400 / img.width, 400 / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/png', 0.9);
        setOrg(prev => ({ ...prev, logo: compressed }));
      };
      img.onerror = () => setOrg(prev => ({ ...prev, logo: dataUrl }));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
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
        {/* Logo Upload */}
        <div className="mt-4">
          <label className="block text-sm text-slate-300 mb-2">Organization Logo</label>
          <div className="flex items-center gap-4">
            {org.logo ? (
              <div className="relative group">
                <img src={org.logo} alt="Logo" className="h-16 w-auto rounded-lg bg-white p-1.5 border border-slate-600" />
                <button
                  onClick={() => setOrg(prev => ({ ...prev, logo: '' }))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                <Building className="w-6 h-6 text-slate-500" />
              </div>
            )}
            <div>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {org.logo ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>
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
              <label className="block text-sm text-slate-300 mb-2">Fiscal Year Start</label>
              <Select
                value={String(settings.fiscalYearStart)}
                onChange={(val) => setSettings({ ...settings, fiscalYearStart: Number(val) })}
                options={months.map((m, idx) => ({ value: String(idx), label: m }))}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Currency</label>
              <Select
                value={settings.currency}
                onChange={(val) => setSettings({ ...settings, currency: val })}
                options={[
                  { value: 'INR', label: 'INR (₹)' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Date Format</label>
              <Select
                value={settings.dateFormat}
                onChange={(val) => setSettings({ ...settings, dateFormat: val })}
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                ]}
              />
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
