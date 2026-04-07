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
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return (
      <div className="absolute top-full left-0 mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-2xl z-50 p-4 w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">{monthName}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-2 py-1 text-xs bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-dark-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            const isStartDate = dateStr === startDate;
            const isEndDate = dateStr === endDate;
            const isBetween = startDate && endDate && dateStr > startDate && dateStr < endDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                  ${isStartDate || isEndDate
                    ? 'bg-brand-600 text-white shadow-lg'
                    : isBetween
                    ? 'bg-brand-600/20 text-brand-300'
                    : isToday
                    ? 'border border-brand-500 text-white'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Selection Info */}
        {(startDate || endDate) && (
          <div className="mt-4 pt-3 border-t border-dark-700 text-xs text-dark-300">
            {startDate && <p>Start: {formatDate(startDate)}</p>}
            {endDate && <p>End: {formatDate(endDate)}</p>}
            {startDate && endDate && (
              <p className="text-brand-400 mt-1">
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
              </p>
            )}
          </div>
        )}
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
