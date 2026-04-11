import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Select Date Range',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];

    if (!startDate || (startDate && endDate) || (startDate && dateStr < startDate)) {
      onStartDateChange(dateStr);
      onEndDateChange('');
    } else {
      onEndDateChange(dateStr);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const todayStr = new Date().toISOString().split('T')[0];

    return (
      <div
        className="absolute top-full left-0 mt-2 rounded-2xl overflow-hidden border border-dark-600/50 shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2540 100%)', width: '292px', zIndex: 999999 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-dark-700/60"
          style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.12), rgba(99,102,241,0.08))' }}
        >
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-1.5 rounded-lg bg-dark-700/40 hover:bg-dark-600/60 text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide">{monthName}</h3>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2 py-0.5 text-xs bg-brand-600/30 hover:bg-brand-600/50 text-brand-400 rounded-full font-medium transition-all"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-1.5 rounded-lg bg-dark-700/40 hover:bg-dark-600/60 text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3">
          {/* Weekday headers — Sunday (index 0) in red */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-bold py-1.5 tracking-wide ${i === 0 ? 'text-red-400' : 'text-dark-500'}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="h-8" />;

              const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
              const isStartDate = dateStr === startDate;
              const isEndDate   = dateStr === endDate;
              const isBetween   = !!(startDate && endDate && dateStr > startDate && dateStr < endDate);
              const isToday     = dateStr === todayStr;
              const isSunday    = (firstDay + day - 1) % 7 === 0;

              if (isStartDate || isEndDate) {
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className="h-8 w-full flex items-center justify-center rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}
                  >
                    {day}
                  </button>
                );
              }
              if (isBetween) {
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className="h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium text-brand-300 bg-brand-600/15 hover:bg-brand-600/25 transition-all"
                  >
                    {day}
                  </button>
                );
              }
              if (isToday) {
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-bold transition-all ring-1 ring-brand-500 hover:bg-brand-600/20 ${isSunday ? 'text-red-400' : 'text-brand-400'}`}
                  >
                    {day}
                  </button>
                );
              }
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all hover:bg-dark-700/60 hover:text-white ${isSunday ? 'text-red-400' : 'text-emerald-400'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Selection summary */}
          {(startDate || endDate) && (
            <div className="mt-3 pt-2.5 border-t border-dark-700/50 space-y-1">
              {startDate && (
                <p className="text-xs">
                  <span className="text-dark-500">From: </span>
                  <span className="text-gray-300">{formatDate(startDate)}</span>
                </p>
              )}
              {endDate && (
                <p className="text-xs">
                  <span className="text-dark-500">To: </span>
                  <span className="text-gray-300">{formatDate(endDate)}</span>
                </p>
              )}
              {startDate && endDate && (
                <p className="text-xs font-semibold text-brand-400">
                  {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s) selected
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-dark-300 mb-2">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-lg text-dark-300 text-sm text-left hover:bg-dark-700 hover:border-dark-600 transition-colors flex items-center justify-between group"
          >
            <span>{startDate ? formatDate(startDate) : 'Start date'}</span>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-lg text-dark-300 text-sm text-left hover:bg-dark-700 hover:border-dark-600 transition-colors flex items-center justify-between"
          >
            <span>{endDate ? formatDate(endDate) : 'End date'}</span>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              onStartDateChange('');
              onEndDateChange('');
            }}
            className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
            title="Clear dates"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && renderCalendar()}
    </div>
  );
};

export default DateRangePicker;
