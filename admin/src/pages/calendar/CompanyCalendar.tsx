import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  CalendarPlus,
  Mail,
  Globe,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';

interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  type: 'holiday' | 'company_leave' | 'event' | 'google_calendar';
  startDate: string;
  endDate: string;
  color: string;
  createdBy?: { _id: string; name: string };
  isFromGoogle?: boolean;
}

const TYPE_CONFIG = {
  holiday: { label: 'Public Holiday', color: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  company_leave: { label: 'Company Leave', color: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  event: { label: 'Event / Announcement', color: '#6366f1', bg: 'bg-brand-500/20', text: 'text-brand-400', border: 'border-brand-500/40' },
  google_calendar: { label: 'Festival / Google Calendar', color: '#8b5cf6', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
};

const empty = { title: '', description: '', type: 'event', startDate: '', endDate: '', color: '' };

const CompanyCalendar = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isHR = user?.role === 'hr';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<typeof empty>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState('');
  const [sendingInvitesFor, setSendingInvitesFor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'holidays'>('calendar');
  const [publicHolidays, setPublicHolidays] = useState<{ _id: string; name: string; date: string; type: string; description?: string }[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const fetchGoogleCalendarEvents = async (monthStart: Date, monthEnd: Date) => {
    if (!import.meta.env.VITE_GOOGLE_CALENDAR_ID || !import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY) {
      return [];
    }
    try {
      const startDate = monthStart.toISOString();
      const endDate = monthEnd.toISOString();
      // Calendar ID may contain '#' already encoded as %23 in env var
      const calId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?key=${import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY}&timeMin=${encodeURIComponent(startDate)}&timeMax=${encodeURIComponent(endDate)}&singleEvents=true&orderBy=startTime`;

      const response = await fetch(url);
      if (!response.ok) {
        console.warn('Google Calendar API error:', response.status, await response.text());
        return [];
      }
      
      const data = await response.json();
      return (data.items || []).map((item: any) => {
        // For all-day events, Google's end.date is EXCLUSIVE (day after last day)
        // We subtract 1 day so the event only shows on its actual date(s)
        let endDate: string;
        if (item.end.dateTime) {
          endDate = item.end.dateTime;
        } else {
          const d = new Date(item.end.date);
          d.setDate(d.getDate() - 1);
          endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return {
          _id: `google_${item.id}`,
          title: item.summary || 'Untitled',
          description: item.description || '',
          type: 'google_calendar' as const,
          startDate: item.start.dateTime || item.start.date || '',
          endDate,
          color: '#8b5cf6',
          isFromGoogle: true,
        };
      });
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
      return [];
    }
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const [companyRes, googleEvents] = await Promise.all([
        api.get(`/calendar`, {
          params: {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
          },
        }),
        fetchGoogleCalendarEvents(monthStart, monthEnd),
      ]);

      setEvents([...companyRes.data.events, ...googleEvents]);
    } catch {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const fetchPublicHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const { data } = await api.get(`/holidays?year=${currentDate.getFullYear()}&type=national`);
      setPublicHolidays(data);
    } catch {
      toast.error('Failed to load public holidays');
    } finally {
      setLoadingHolidays(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'holidays') fetchPublicHolidays();
  }, [activeTab, currentDate]);

  const openCreate = (date?: Date) => {
    const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
    setEditing(null);
    setForm({ ...empty, startDate: dateStr, endDate: dateStr });
    setShowModal(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      type: ev.type,
      startDate: ev.startDate.split('T')[0],
      endDate: ev.endDate.split('T')[0],
      color: ev.color,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error('Title, start date and end date are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/calendar/${editing._id}`, form);
        toast.success('Event updated');
      } else {
        await api.post('/calendar', form);
        toast.success('Event created');
      }
      setShowModal(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Event',
      message: 'Are you sure you want to delete this calendar event? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/calendar/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const buildGoogleCalendarUrl = (ev: CalendarEvent) => {
    const startStr = ev.startDate.split('T')[0].replace(/-/g, '');
    const endDateObj = new Date(ev.endDate.split('T')[0]);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endStr = endDateObj.toISOString().split('T')[0].replace(/-/g, '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: ev.title,
      dates: `${startStr}/${endStr}`,
      details: ev.description || '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const sendInvitesToAllEmployees = async (eventId: string) => {
    const ok = await confirm({
      title: 'Send to All Employees',
      message: 'This will send calendar event invitations to all active employees. They will receive an email with the event details.',
      confirmLabel: 'Send Invites',
      variant: 'info',
    });
    if (!ok) return;

    setSendingInvitesFor(eventId);
    try {
      const { data } = await api.post(`/calendar/${eventId}/send-invites`);
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send invitations');
    } finally {
      setSendingInvitesFor(null);
    }
  };

  // Calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  // Normalize a date string (ISO or YYYY-MM-DD) to midnight local time
  const toLocalDay = (dateStr: string) => {
    const s = dateStr.split('T')[0]; // get YYYY-MM-DD part
    const [y, m, day] = s.split('-').map(Number);
    return new Date(y, m - 1, day);
  };

  const getEventsForDay = (day: Date) => {
    const filtered = filterType ? events.filter(ev => ev.type === filterType) : events;
    return filtered.filter((ev) => {
      const start = toLocalDay(ev.startDate);
      const end = toLocalDay(ev.endDate);
      const target = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      return target >= start && target <= end;
    });
  };

  const filteredEvents = filterType ? events.filter(ev => ev.type === filterType) : events;

  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Calendar</h1>
          <p className="text-dark-400 text-sm mt-1">Holidays, company leaves, events &amp; festivals</p>
        </div>
        {isHR && (
          <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Add Event
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-dark-800/60 rounded-xl w-fit border border-dark-700/50">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'bg-brand-600 text-white'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'holidays'
              ? 'bg-brand-600 text-white'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <Globe size={14} />
          Public Holidays
        </button>
      </div>

      {/* Public Holidays Panel */}
      {activeTab === 'holidays' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700/50">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-purple-400" />
              <div>
                <h2 className="text-base font-semibold text-white">India National & Public Holidays</h2>
                <p className="text-xs text-dark-400 mt-0.5">{currentDate.getFullYear()} &middot; {publicHolidays.length} holidays</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-white">{currentDate.getFullYear()}</span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {loadingHolidays ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : publicHolidays.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Globe size={28} className="mx-auto text-dark-600" />
              <p className="text-sm text-dark-400">No public holidays found for {currentDate.getFullYear()}</p>
              <p className="text-xs text-dark-500">Go to Holidays page and click "Sync India Holidays"</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-700/30">
              {publicHolidays.map((h) => {
                const d = new Date(h.date);
                const isUpcoming = d >= new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <div key={h._id} className={`flex items-center gap-4 px-5 py-3 hover:bg-dark-700/20 transition-colors ${isSameDay(d, new Date()) ? 'bg-purple-500/5' : ''}`}>
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${
                      isSameDay(d, new Date())
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : isUpcoming
                        ? 'bg-purple-500/20 border-purple-500/30'
                        : 'bg-dark-700/40 border-dark-600/50'
                    }`}>
                      <span className={`text-base font-bold leading-none ${
                        isSameDay(d, new Date()) ? 'text-white' : isUpcoming ? 'text-purple-300' : 'text-dark-400'
                      }`}>{String(d.getDate()).padStart(2, '0')}</span>
                      <span className={`text-[10px] uppercase mt-0.5 ${
                        isSameDay(d, new Date()) ? 'text-purple-200' : isUpcoming ? 'text-purple-400' : 'text-dark-500'
                      }`}>{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        isSameDay(d, new Date()) ? 'text-purple-300' : isUpcoming ? 'text-white' : 'text-dark-400'
                      }`}>{h.name}</p>
                      <p className="text-xs text-dark-400">{d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    {isSameDay(d, new Date()) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium flex-shrink-0">Today</span>
                    )}
                    {!isSameDay(d, new Date()) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium flex-shrink-0">National</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Calendar View (hidden when holidays tab active) */}
      {activeTab === 'calendar' && <>

      {/* Filter / Legend */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filterType === '' ? 'bg-dark-600 text-white border-dark-400' : 'bg-transparent text-dark-400 border-dark-600 hover:border-dark-400'
          }`}
        >
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG.holiday][]).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilterType(filterType === k ? '' : k)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterType === k
                ? `${v.bg} ${v.text} ${v.border}`
                : `bg-transparent text-dark-400 border-dark-600 hover:${v.border} hover:${v.text}`
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
            {v.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700/50">
            <button onClick={prevMonth} className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-dark-700/50">
            {weekDays.map((wd) => (
              <div key={wd} className="py-2 text-center text-xs font-semibold text-dark-400 uppercase tracking-wider">
                {wd}
              </div>
            ))}
          </div>

          {/* Days */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayEvs = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[72px] p-1.5 border-b border-r border-dark-700/30 cursor-pointer transition-colors
                      ${isCurrentMonth ? '' : 'opacity-30'}
                      ${isSelected ? 'bg-brand-500/10' : 'hover:bg-dark-700/20'}
                    `}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1
                      ${isToday ? 'bg-brand-600 text-white' : isCurrentMonth ? 'text-gray-300' : 'text-dark-500'}
                    `}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvs.slice(0, 2).map((ev) => (
                        <div
                          key={ev._id}
                          className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white font-medium"
                          style={{ backgroundColor: ev.color + 'cc' }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvs.length > 2 && (
                        <div className="text-[10px] text-dark-400 px-1">+{dayEvs.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: day events or upcoming */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CalendarDays size={16} className="text-brand-400" />
            {selectedDay ? format(selectedDay, 'dd MMM yyyy') : 'This Month'}
          </h3>

          {selectedDay && dayEvents.length === 0 && (
            <div className="text-center py-8 text-dark-500 text-sm">
              No events on this day
              {isHR && (
                <div className="mt-3">
                  <button onClick={() => openCreate(selectedDay)} className="btn-primary text-xs px-3 py-1.5">
                    <Plus size={14} className="inline mr-1" />
                    Add Event
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {(selectedDay ? dayEvents : filteredEvents).map((ev) => {
              const cfg = TYPE_CONFIG[ev.type];
              return (
                <div key={ev._id} className={`rounded-lg p-3 border ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${cfg.text} truncate`}>{ev.title}</p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {format(parseISO(ev.startDate), 'dd MMM')}
                        {ev.startDate !== ev.endDate && ` → ${format(parseISO(ev.endDate), 'dd MMM')}`}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-dark-300 mt-1 line-clamp-2">{ev.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        <a
                          href={buildGoogleCalendarUrl(ev)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Add to Google Calendar"
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CalendarPlus size={9} />
                          Google Cal
                        </a>
                        {isHR && !ev.isFromGoogle && (
                          <button
                            onClick={() => sendInvitesToAllEmployees(ev._id)}
                            disabled={sendingInvitesFor === ev._id}
                            title="Send event invitation to all employees"
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-colors disabled:opacity-50"
                          >
                            {sendingInvitesFor === ev._id ? (
                              <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CalendarPlus size={9} />
                            )}
                            Send to All
                          </button>
                        )}
                      </div>
                    </div>
                    {isHR && !ev.isFromGoogle && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(ev)}
                          className="p-1 hover:bg-dark-600/50 rounded text-dark-400 hover:text-brand-400 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev._id)}
                          className="p-1 hover:bg-dark-600/50 rounded text-dark-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!selectedDay && filteredEvents.length === 0 && !loading && (
              <p className="text-center text-dark-500 text-sm py-8">No events this month</p>
            )}
          </div>
        </div>
      </div>

      </> }

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {editing ? 'Edit Event' : 'Add Event'}
            </h3>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label>
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                options={[
                  { value: 'holiday', label: 'Public Holiday' },
                  { value: 'company_leave', label: 'Company Leave' },
                  { value: 'event', label: 'Event / Announcement' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-dark"
                placeholder="e.g. Diwali Holiday"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Start Date *</label>
                <DatePicker
                  value={form.startDate}
                  onChange={(val) => setForm({ ...form, startDate: val, endDate: form.endDate || val })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">End Date *</label>
                <DatePicker
                  value={form.endDate}
                  onChange={(val) => setForm({ ...form, endDate: val })}
                  min={form.startDate}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-dark min-h-[72px]"
                placeholder="Optional details..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CompanyCalendar;
