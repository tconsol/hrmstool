import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  placeholder?: string;
  disabled?: boolean;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const DatePicker = ({
  value,
  onChange,
  className = '',
  required,
  min,
  max,
  placeholder = 'Select date',
  disabled,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 260 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const toDate = (str?: string) => str ? new Date(str + 'T00:00:00') : null;
  const selected = toDate(value);
  const minDate = toDate(min ?? '');
  const maxDate = toDate(max ?? '');

  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const [showMonths, setShowMonths] = useState(false);
  const [showYears, setShowYears] = useState(false);

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

  // Position the portal dropdown under the trigger
  const openCalendar = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const dropWidth = 260;
      let left = rect.left + window.scrollX;
      // keep within viewport
      if (left + dropWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropWidth - 8;
      }
      setDropPos({ top: rect.bottom + window.scrollY + 4, left, width: dropWidth });
    }
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setShowMonths(false);
        setShowYears(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; cur: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevMonthDays - firstDay + 1 + i, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  while (cells.length < 42) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false });

  const isSelected = (day: number) =>
    selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  const selectDay = (day: number) => {
    if (isDisabled(day)) return;
    const d = new Date(viewYear, viewMonth, day);
    onChange(d.toISOString().split('T')[0]);
    setOpen(false);
    setShowMonths(false);
    setShowYears(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const displayValue = selected
    ? `${String(selected.getDate()).padStart(2,'0')} ${MONTH_SHORT[selected.getMonth()]} ${selected.getFullYear()}`
    : '';

  return (
    <div className={className}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openCalendar}
        className={`input-dark flex items-center gap-2 cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'ring-1 ring-brand-500/50 border-brand-500' : ''}`}
      >
        <span className={`flex-1 truncate text-left text-sm ${displayValue ? 'text-gray-100' : 'text-dark-400'}`}>
          {displayValue || placeholder}
        </span>
        <CalendarDays size={15} className="text-dark-400 shrink-0" />
      </button>

      {/* Portal Dropdown — renders directly on document.body, escapes ALL overflow/z-index parents */}
      {open && createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'absolute',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 2147483647, // max possible z-index
          }}
          className="bg-dark-800 border border-dark-600 rounded-xl shadow-2xl p-3 select-none"
        >
          {/* Header: month/year selectors + nav arrows */}
          <div className="flex items-center justify-between mb-2 gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-1 flex-1 justify-center">
              {/* Month selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowMonths(s => !s); setShowYears(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-dark-700 text-sm font-semibold text-white transition-colors"
                >
                  {MONTHS[viewMonth]}
                  <ChevronDown size={13} className={`transition-transform ${showMonths ? 'rotate-180' : ''}`} />
                </button>
                {showMonths && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl w-36 max-h-48 overflow-y-auto"
                    style={{ zIndex: 2147483647 }}
                  >
                    {MONTHS.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setViewMonth(idx); setShowMonths(false); }}
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${idx === viewMonth ? 'bg-brand-600 text-white font-semibold' : 'text-dark-200 hover:bg-dark-700 hover:text-white'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowYears(s => !s); setShowMonths(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-dark-700 text-sm font-semibold text-white transition-colors"
                >
                  {viewYear}
                  <ChevronDown size={13} className={`transition-transform ${showYears ? 'rotate-180' : ''}`} />
                </button>
                {showYears && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl w-24 max-h-48 overflow-y-auto"
                    style={{ zIndex: 2147483647 }}
                  >
                    {years.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => { setViewYear(yr); setShowYears(false); }}
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${yr === viewYear ? 'bg-brand-600 text-white font-semibold' : 'text-dark-200 hover:bg-dark-700 hover:text-white'}`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-dark-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                disabled={!cell.cur || isDisabled(cell.day)}
                onClick={() => cell.cur && selectDay(cell.day)}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
                  ${!cell.cur ? 'text-dark-700 cursor-default' : ''}
                  ${cell.cur && isDisabled(cell.day) ? 'text-dark-600 cursor-not-allowed' : ''}
                  ${cell.cur && !isDisabled(cell.day) && isSelected(cell.day) ? 'bg-brand-500 text-white shadow-sm' : ''}
                  ${cell.cur && !isDisabled(cell.day) && !isSelected(cell.day) && isToday(cell.day) ? 'border border-brand-500 text-brand-400 hover:bg-dark-700' : ''}
                  ${cell.cur && !isDisabled(cell.day) && !isSelected(cell.day) && !isToday(cell.day) ? 'text-dark-200 hover:bg-dark-700 hover:text-white cursor-pointer' : ''}
                `}
              >
                {cell.day}
              </button>
            ))}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-dark-700 text-center">
            <button
              type="button"
              onClick={() => {
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                onChange(today.toISOString().split('T')[0]);
                setOpen(false);
              }}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;
