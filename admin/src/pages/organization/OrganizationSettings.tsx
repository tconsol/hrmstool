import { useState, useEffect, useRef } from 'react';
import { Building, Save, Loader2, Upload, X, MapPin, Plus, Trash2, Pencil, Navigation, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import Select from '../../components/ui/Select';
import GoogleMap from '../../components/ui/GoogleMap';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { reverseGeocode, formatAddress } from '../../services/reverseGeocode';

interface OfficeLocation {
  _id?: string;
  name: string;
  address: string;
  latitude: number | '';
  longitude: number | '';
  radiusMeters: number;
  isActive: boolean;
}

const emptyLocation = (): OfficeLocation => ({
  name: '', address: '', latitude: '', longitude: '', radiusMeters: 50, isActive: true,
});

export default function OrganizationSettings() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const canManageSettings = user?.role === 'ceo';
  const canManageLocations = ['hr', 'manager', 'ceo'].includes(user?.role || '');

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
    leavePolicy: {
      casual: 12,
      sick: 12,
      paid: 15,
    },
  });

  // Office locations state
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [locationForm, setLocationForm] = useState<OfficeLocation>(emptyLocation());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [geocodingAddress, setGeocodingAddress] = useState(false);

  const dayMap = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
  const dayMapReverse = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' };
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    (async () => {
      try {
        const [orgRes, settingsRes, locRes] = await Promise.all([
          api.get('/organization'),
          api.get('/organization/settings'),
          api.get('/organization/locations'),
        ]);
        setOrg({
          name: orgRes.data.name || '', email: orgRes.data.email || '', phone: orgRes.data.phone || '',
          address: orgRes.data.address || '', website: orgRes.data.website || '', industry: orgRes.data.industry || '',
          logo: orgRes.data.logo || '',
        });
        if (settingsRes.data?.settings) {
          setSettings(prev => ({ ...prev, ...settingsRes.data.settings }));
        }
        setLocations(locRes.data || []);
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

  const handleResetLeaveBalances = async () => {
    const ok = await confirm({
      title: 'Reset Leave Balances',
      message: `This will reset leave balances for ALL active employees to the current policy values.\n\nCasual: ${settings.leavePolicy.casual} | Sick: ${settings.leavePolicy.sick} | Paid: ${settings.leavePolicy.paid}`,
      confirmLabel: 'Yes, Reset',
      variant: 'warning',
    });
    if (!ok) return;
    setSaving(true);
    try {
      await api.put('/organization/settings', { settings });
      const res = await api.post('/organization/sync-leave-policy');
      toast.success(res.data.message || 'Leave balances reset for all active employees');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to reset leave balances'); }
    finally { setSaving(false); }
  };

  // ── Auto-geocode whenever coordinates change (debounced) ──
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const lat = typeof locationForm.latitude === 'number' ? locationForm.latitude : null;
    const lng = typeof locationForm.longitude === 'number' ? locationForm.longitude : null;
    if (!lat || !lng || !showLocationForm) return;

    // Debounce 500ms — user might still be typing
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    
    geocodeTimerRef.current = setTimeout(() => {
      setGeocodingAddress(true);
      reverseGeocode(lat, lng)
        .then(data => {
          if (data) {
            setLocationForm(prev => ({ ...prev, address: formatAddress(data) }));
          }
        })
        .catch(() => {})
        .finally(() => setGeocodingAddress(false));
    }, 500);

    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationForm.latitude, locationForm.longitude]);

  // ── Office Location Handlers ──────────────────────────────────────────────
  const handleMapClick = (lat: number, lng: number) => {
    setLocationForm(p => ({ ...p, latitude: lat, longitude: lng }));
  };

  const handleGetGPS = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    // Check permission state — show helpful message if denied
    try {
      const permResult = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (permResult.state === 'denied') {
        toast.error('Location is blocked. Click the lock 🔒 icon in your address bar → Site Settings → Location → Allow, then refresh.', { duration: 8000 });
        return;
      }
    } catch {
      // permissions API not supported — proceed anyway
    }

    setGettingGPS(true);
    toast.loading('Requesting location…', { id: 'gps-loading' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('gps-loading');
        const lat = parseFloat(pos.coords.latitude.toFixed(7));
        const lng = parseFloat(pos.coords.longitude.toFixed(7));
        setLocationForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
        setGettingGPS(false);
        toast.success(`📍 GPS captured: ${lat}, ${lng}`);
      },
      (err) => {
        toast.dismiss('gps-loading');
        setGettingGPS(false);
        if (err.code === 1) {
          toast.error('Location permission denied. Click the lock 🔒 icon in address bar → allow location → refresh.', { duration: 8000 });
        } else if (err.code === 2) {
          toast.error('Could not determine location. Make sure GPS/Location is enabled on your device.');
        } else if (err.code === 3) {
          toast.error('Location request timed out. Try again.');
        } else {
          toast.error(`Location error: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name.trim()) { toast.error('Location name is required'); return; }
    if (locationForm.latitude === '' || locationForm.longitude === '') { toast.error('Latitude and longitude are required'); return; }
    setSavingLocation(true);
    try {
      const payload = { ...locationForm, latitude: Number(locationForm.latitude), longitude: Number(locationForm.longitude) };
      if (editingId) {
        const res = await api.put(`/organization/locations/${editingId}`, payload);
        setLocations(res.data.officeLocations);
        toast.success('Location updated');
      } else {
        const res = await api.post('/organization/locations', payload);
        setLocations(res.data.officeLocations);
        toast.success('Location added');
      }
      setLocationForm(emptyLocation());
      setEditingId(null);
      setShowLocationForm(false);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save location'); }
    finally { setSavingLocation(false); }
  };

  const handleEditLocation = (loc: OfficeLocation) => {
    setLocationForm({ ...loc });
    setEditingId(loc._id || null);
    setShowLocationForm(true);
  };

  const handleDeleteLocation = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Office Location',
      message: 'Are you sure you want to delete this office location? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await api.delete(`/organization/locations/${id}`);
      setLocations(res.data.officeLocations);
      toast.success('Location deleted');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const handleToggleActive = async (loc: OfficeLocation) => {
    if (!loc._id) return;
    try {
      const res = await api.put(`/organization/locations/${loc._id}`, { isActive: !loc.isActive });
      setLocations(res.data.officeLocations);
    } catch { toast.error('Failed to update status'); }
  };
  // ─────────────────────────────────────────────────────────────────────────

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
    <div className="space-y-6">
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

        {/* Leave Policy — CEO only */}
        {canManageSettings && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Leave Policy (days per year)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['casual', 'sick', 'paid'] as const).map((type) => (
                  <div key={type}>
                    <label className="block text-xs text-slate-400 mb-1 capitalize">{type} Leave</label>
                    <input
                      type="number"
                      min={0}
                      max={366}
                      value={(settings.leavePolicy as any)[type]}
                      onChange={e => setSettings({ ...settings, leavePolicy: { ...settings.leavePolicy, [type]: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">These values set the annual leave balance for all new employees. Use "Reset Balances" to apply to existing employees at year start.</p>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={handleResetLeaveBalances} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Reset Balances
              </button>
              <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
              </button>
            </div>
          </>
        )}

        {/* Non-CEO users: Save-only button */}
        {!canManageSettings && (
          <div className="flex justify-end mt-5">
            <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
            </button>
          </div>
        )}
      </div>

      {/* ── Office Locations (HR / Manager / CEO only) ───────────────────── */}
      {canManageLocations && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Office Locations</h2>
                <p className="text-xs text-slate-400 mt-0.5">Employees must be within the radius to check in</p>
              </div>
            </div>
            {!showLocationForm && (
              <button
                onClick={() => { setShowLocationForm(true); setEditingId(null); setLocationForm(emptyLocation()); }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add Location
              </button>
            )}
          </div>

          {/* Side-by-side: form/list on left, map on right */}
          <div className={`${showLocationForm ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'block'}`}>

            {/* Left column: list and form */}
            <div className="space-y-4">
              {/* Saved locations list */}
              {locations.length > 0 && !showLocationForm && (
                <div className="space-y-3">
                  {locations.map(loc => (
                    <div
                      key={loc._id}
                      className={`flex items-start justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer ${loc.isActive ? 'bg-slate-700/40 border-slate-600/60 hover:border-emerald-600/40' : 'bg-slate-800/30 border-slate-700/40 opacity-60'}`}
                      onClick={() => handleEditLocation(loc)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${loc.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/30 text-slate-500'}`}>
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{loc.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loc.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/30 text-slate-400'}`}>
                              {loc.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-600/50 px-2 py-0.5 rounded-full">{loc.radiusMeters}m radius</span>
                          </div>
                          {loc.address && <p className="text-xs text-slate-400 mt-0.5 truncate">{loc.address}</p>}
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">{loc.latitude}, {loc.longitude}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleToggleActive(loc)} title={loc.isActive ? 'Deactivate' : 'Activate'} className="p-1.5 rounded-lg hover:bg-slate-600/60 text-slate-400 hover:text-emerald-400 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                        <button onClick={() => handleEditLocation(loc)} className="p-1.5 rounded-lg hover:bg-slate-600/60 text-slate-400 hover:text-blue-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => loc._id && handleDeleteLocation(loc._id)} disabled={deletingId === loc._id} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50">
                          {deletingId === loc._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {locations.length === 0 && !showLocationForm && (
                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No office locations yet.</p>
                  <p className="text-xs mt-1">Add one to enable location-based check-in.</p>
                </div>
              )}

              {/* Add / Edit form */}
              {showLocationForm && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit' : 'New'} Office Location</h3>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Location Name <span className="text-red-400">*</span></label>
                    <input
                      value={locationForm.name}
                      onChange={e => setLocationForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., HQ, Bangalore Office"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Address
                      {geocodingAddress && <span className="ml-2 text-emerald-400 animate-pulse">Auto-filling…</span>}
                    </label>
                    <input
                      value={locationForm.address}
                      onChange={e => setLocationForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Tap map or use GPS to auto-fill"
                      disabled={geocodingAddress}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Latitude <span className="text-red-400">*</span></label>
                      <input
                        type="number" step="any"
                        value={locationForm.latitude}
                        onChange={e => setLocationForm(p => ({ ...p, latitude: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                        placeholder="e.g. 17.52"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Longitude <span className="text-red-400">*</span></label>
                      <input
                        type="number" step="any"
                        value={locationForm.longitude}
                        onChange={e => setLocationForm(p => ({ ...p, longitude: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                        placeholder="e.g. 78.38"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Radius (m)</label>
                      <input
                        type="number" min={10} max={1000}
                        value={locationForm.radiusMeters}
                        onChange={e => setLocationForm(p => ({ ...p, radiusMeters: Math.max(10, Number(e.target.value)) }))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button" onClick={handleGetGPS} disabled={gettingGPS}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-600/40 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm disabled:opacity-50"
                  >
                    {gettingGPS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    {gettingGPS ? 'Getting location…' : 'Use My Current Location'}
                  </button>

                  <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-700">
                    <button onClick={() => { setShowLocationForm(false); setEditingId(null); setLocationForm(emptyLocation()); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSaveLocation} disabled={savingLocation} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50">
                      {savingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingId ? 'Update' : 'Save'} Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: always-visible map */}
            {showLocationForm && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-400">
                  📍 <span className="text-slate-300">Click on map</span> to drop a pin · Drag the marker to fine-tune
                </p>
                <GoogleMap
                  latitude={typeof locationForm.latitude === 'number' ? locationForm.latitude : ''}
                  longitude={typeof locationForm.longitude === 'number' ? locationForm.longitude : ''}
                  zoom={16}
                  onClick={handleMapClick}
                  draggable={true}
                  height="420px"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
