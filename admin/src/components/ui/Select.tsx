/**
 * Custom Select/Dropdown Component
 * 
 * IMPORTANT: This is the standard dropdown component for the entire application.
 * NEVER use native HTML <select> elements in any new components or pages.
 * 
 * Features:
 * - Modern dark theme with proper color contrast
 * - Portal rendering for floating dropdown menus
 * - Click-outside detection to close dropdown
 * - Smooth animations and transitions
 * - Keyboard-friendly with accessible styling
 * - Check icon for selected options
 * - Disabled state support
 * 
 * Usage Example:
 * ```tsx
 * import Select, { SelectOption } from '../../components/ui/Select';
 * 
 * const options = [
 *   { value: 'opt1', label: 'Option 1' },
 *   { value: 'opt2', label: 'Option 2' },
 * ];
 * 
 * <Select
 *   value={selectedValue}
 *   onChange={(newValue) => handleChange(newValue)}
 *   options={options}
 *   placeholder="Select..."
 *   className="w-32"
 * />
 * ```
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

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
  const [dropPos, setDropPos] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  // Close on outside click or scroll outside dropdown
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropRef.current && !dropRef.current.contains(target) && 
          buttonRef.current && !buttonRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleScrollOutside = (e: Event) => {
      const target = e.target as Node;
      // Only close if scrolling is NOT happening inside the dropdown
      if (dropRef.current && !dropRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScrollOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScrollOutside, true);
    };
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      const optionCount = options.length + (placeholder !== undefined ? 1 : 0);
      const neededHeight = Math.min(optionCount * 42 + 8, 224);
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;

      let topVal: number | undefined;
      let bottomVal: number | undefined;
      let maxHeight: number;

      if (spaceBelow >= neededHeight) {
        // Enough space below — show below
        topVal = r.bottom + 4;
        maxHeight = neededHeight;
      } else if (spaceAbove >= neededHeight) {
        // Enough space above — show above
        bottomVal = window.innerHeight - r.top + 4;
        maxHeight = neededHeight;
      } else if (spaceBelow >= spaceAbove) {
        // More space below but not enough — show below with scroll
        topVal = r.bottom + 4;
        maxHeight = Math.max(spaceBelow, 80);
      } else {
        // More space above but not enough — show above with scroll
        bottomVal = window.innerHeight - r.top + 4;
        maxHeight = Math.max(spaceAbove, 80);
      }

      setDropPos({ top: topVal, bottom: bottomVal, left: r.left, width: r.width, maxHeight });
    }
    setOpen(prev => !prev);
  };

  const handleOption = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(val);
    setOpen(false);
  };

  const dropdown = dropPos ? (
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: dropPos.top, bottom: dropPos.bottom, left: dropPos.left, width: dropPos.width, zIndex: 999999 }}
      className="bg-dark-800 border border-dark-600 rounded-lg shadow-2xl overflow-hidden"
      onMouseDown={e => e.stopPropagation()}
    >
      <div style={{ maxHeight: dropPos.maxHeight }} className="overflow-y-auto">
        {placeholder !== undefined && (
          <button
            type="button"
            onMouseDown={e => handleOption(e, '')}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors hover:bg-dark-700 ${value === '' ? 'text-brand-400 bg-brand-500/10' : 'text-dark-400'}`}
          >
            {placeholder}
          </button>
        )}
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onMouseDown={e => handleOption(e, option.value)}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors hover:bg-dark-700/80 ${option.value === value ? 'text-brand-400 bg-brand-500/10' : 'text-gray-200'}`}
          >
            <span className="truncate">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onMouseDown={handleToggle}
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
      {open && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

export default Select;
