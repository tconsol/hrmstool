import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Select = ({ value, onChange, options, placeholder, className = '', disabled = false }: SelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-dark-500"
      >
        <span className={`text-sm truncate ${selected ? 'text-gray-100' : 'text-dark-400'}`}>
          {selected ? selected.label : (placeholder ?? 'Select...')}
        </span>
        <ChevronDown
          size={16}
          className={`text-dark-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-dark-800 border border-dark-600 rounded-lg shadow-2xl z-[9999] overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {placeholder !== undefined && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors hover:bg-dark-700 ${value === '' ? 'text-brand-400 bg-brand-500/10' : 'text-dark-400'}`}
              >
                {value === '' ? <Check size={14} className="flex-shrink-0" /> : <span className="w-[18px] flex-shrink-0" />}
                {placeholder}
              </button>
            )}
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors hover:bg-dark-700/80 ${option.value === value ? 'text-brand-400 bg-brand-500/10' : 'text-gray-200'}`}
              >
                {option.value === value
                  ? <Check size={14} className="flex-shrink-0 text-brand-400" />
                  : <span className="w-[18px] flex-shrink-0" />
                }
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
