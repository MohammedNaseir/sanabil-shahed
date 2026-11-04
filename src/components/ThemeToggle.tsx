import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../utils/theme';

/** زر التبديل بين الوضع الداكن والفاتح. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border hairline text-amber-300 hover:bg-amber-500/10 transition-colors ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
    </button>
  );
};
