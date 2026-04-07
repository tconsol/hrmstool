import ReactDatePicker from 'react-datepicker';
import { forwardRef } from 'react';
import { CalendarDays } from 'lucide-react';
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
      className="input-dark flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className={value ? 'text-gray-100' : 'text-dark-400'}>
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
  const toDate = (str: string): Date | null => {
    if (!str) return null;
    const d = parse(str, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : null;
  };

  const selected = toDate(value);
  const minDate = min ? toDate(min) ?? undefined : undefined;
  const maxDate = max ? toDate(max) ?? undefined : undefined;

  return (
    <div className={`datepicker-wrapper ${className}`}>
      <ReactDatePicker
        selected={selected}
        onChange={(date: Date | null) => {
          onChange(date ? format(date, 'yyyy-MM-dd') : '');
        }}
        dateFormat="dd MMM yyyy"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        required={required}
        placeholderText={placeholder ?? 'Select date'}
        customInput={<CustomInput placeholder={placeholder} disabled={disabled} />}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        popperPlacement="bottom-start"
        popperClassName="z-50"
      />
    </div>
  );
};

export default DatePicker;
