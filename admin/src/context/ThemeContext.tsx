import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

const darkVars: Record<string, string> = {
  '--theme-bg':           '#020617',
  '--theme-bg-secondary': '#0f172a',
  '--theme-bg-card':      'rgba(15, 23, 42, 0.7)',
  '--theme-bg-elevated':  '#1e293b',
  '--theme-border':       'rgba(30, 41, 59, 0.6)',
  '--theme-border-strong':'#334155',
  '--theme-text':         '#f1f5f9',
  '--theme-text-muted':   '#94a3b8',
  '--theme-text-soft':    '#64748b',
  '--theme-hover':        'rgba(30, 41, 59, 0.5)',
  '--theme-input-bg':     '#0f172a',
  '--theme-table-head':   'rgba(15, 23, 42, 0.9)',
  '--theme-input-text':   '#f1f5f9',
  '--theme-input-placeholder': '#64748b',
  '--theme-select-bg':    'rgb(31, 41, 55)',
  '--theme-select-color': 'white',
  '--theme-picker-filter':'invert(1) brightness(1.2)',
  '--theme-color-scheme': 'dark',
};

const lightVars: Record<string, string> = {
  '--theme-bg':           '#f1f5f9',
  '--theme-bg-secondary': '#ffffff',
  '--theme-bg-card':      'rgba(255, 255, 255, 0.97)',
  '--theme-bg-elevated':  '#e2e8f0',
  '--theme-border':       'rgba(203, 213, 225, 0.8)',
  '--theme-border-strong':'#cbd5e1',
  '--theme-text':         '#0f172a',
  '--theme-text-muted':   '#475569',
  '--theme-text-soft':    '#64748b',
  '--theme-hover':        'rgba(226, 232, 240, 0.8)',
  '--theme-input-bg':     '#f8fafc',
  '--theme-table-head':   'rgba(248, 250, 252, 0.98)',
  '--theme-input-text':   '#0f172a',
  '--theme-input-placeholder': '#94a3b8',
  '--theme-select-bg':    '#ffffff',
  '--theme-select-color': '#0f172a',
  '--theme-picker-filter':'none',
  '--theme-color-scheme': 'light',
};

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('hrms_theme') as Theme) ?? 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      applyVars(lightVars);
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    } else {
      applyVars(darkVars);
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    }
    localStorage.setItem('hrms_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
