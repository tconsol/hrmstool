import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';

interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  type: 'holiday' | 'company_leave' | 'event';
  startDate: string;
  endDate: string;
  color: string;
  createdBy: { _id: string; name: string };
}

const TYPE_CONFIG = {
  holiday: { label: 'Public Holiday', color: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  company_leave: { label: 'Company Leave', color: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  event: { label: 'Event / Announcement', color: '#6366f1', bg: 'bg-brand-500/20', text: 'text-brand-400', border: 'border-brand-500/40' },
};

const empty = { title: '', description: '', type: 'event', startDate: '', endDate: '', color: '' };

const CompanyCalendar = () => {
  const { user } = useAuth();
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

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/calendar`, {
        params: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        },
      });
      setEvents(data.events);
    } catch {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

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
    if (!confirm('Delete this event?')) return;
    try {
      await api.delete(`/calendar/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
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
          <p className="text-dark-400 text-sm mt-1">Holidays, company leaves &amp; events</p>
        </div>
        {isHR && (
          <button onClick={() => openCreate()} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Add Event
          </button>
        )}
      </div>

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
                      <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {isHR && (
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
