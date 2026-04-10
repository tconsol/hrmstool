import ReactDatePicker from 'react-datepicker';
import { forwardRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { parse, format, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

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

// Custom input rendered by react-datepicker
const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void; placeholder?: string; disabled?: boolean }>(
  ({ value, onClick, placeholder, disabled }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      disabled={disabled}
      className="input-dark flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className={`flex-1 truncate text-left ${value ? 'text-gray-100' : 'text-dark-400'}`}>
        {value || placeholder || 'Select date'}
      </span>
      <CalendarDays size={16} className="text-gray-300 shrink-0" />
    </button>
  )
);
CustomInput.displayName = 'CustomInput';

const DatePicker = ({
  value,
  onChange,
  className = '',
  required,
  min,
  max,
  placeholder,
  disabled,
}: DatePickerProps) => {
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const toDate = (str: string): Date | null => {
    if (!str) return null;
    const d = parse(str, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : null;
  };

  const selected = toDate(value);
  const minDate = min ? toDate(min) ?? undefined : undefined;
  const maxDate = max ? toDate(max) ?? undefined : undefined;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);

  return (
    <div className={`datepicker-wrapper ${className}`}>
      <ReactDatePicker
        selected={selected}
        onChange={(date: Date | null) => {
          onChange(date ? format(date, 'yyyy-MM-dd') : '');
          setMonthOpen(false);
          setYearOpen(false);
        }}
        dateFormat="dd MMM yyyy"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        required={required}
        placeholderText={placeholder ?? 'Select date'}
        customInput={<CustomInput placeholder={placeholder} disabled={disabled} />}
        renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled, changeYear, changeMonth }) => (
          <div className="px-3 pb-3 pt-2">
            {/* Month/Year Selectors */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setMonthOpen(!monthOpen);
                    setYearOpen(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-700/50 hover:bg-dark-600/70 border border-dark-600 rounded-lg text-sm font-medium text-white transition-all"
                >
                  {months[date.getMonth()]}
                  <ChevronDown size={14} className={monthOpen ? 'rotate-180' : ''} />
                </button>
                {monthOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 w-40 max-h-48 overflow-y-auto">
                    {months.map((month, idx) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => {
                          changeMonth(idx);
                          setMonthOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${idx === date.getMonth() ? 'bg-brand-600 text-white font-semibold' : 'text-dark-300 hover:bg-dark-700 hover:text-white'}`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setYearOpen(!yearOpen);
                    setMonthOpen(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-700/50 hover:bg-dark-600/70 border border-dark-600 rounded-lg text-sm font-medium text-white transition-all"
                >
                  {date.getFullYear()}
                  <ChevronDown size={14} className={yearOpen ? 'rotate-180' : ''} />
                </button>
                {yearOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 w-28 max-h-48 overflow-y-auto">
                    {years.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          changeYear(year);
                          setYearOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${year === date.getFullYear() ? 'bg-brand-600 text-white font-semibold' : 'text-dark-300 hover:bg-dark-700 hover:text-white'}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-semibold text-dark-300 tracking-wide">
                Prev / Next
              </span>
              <button
                type="button"
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
        dayClassName={(date) => date.getDay() === 0 ? 'rdp-sun' : 'rdp-weekday'}
        popperPlacement="bottom-start"
        popperClassName="z-[9999]"
      />
    </div>
  );
};

export default DatePicker;
