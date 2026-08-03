import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('telemetry_theme') as 'dark' | 'light' | null;
      if (savedTheme) return savedTheme;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.setAttribute('data-theme', 'dark');
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('telemetry_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-2 rounded-xl border border-[var(--border-structure)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[var(--accent-cyan)] transition-all duration-200 panel-shadow-box"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Telemetry Theme`}
      aria-label="Toggle telemetry theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
      ) : (
        <Moon className="w-4 h-4 text-[#0284c7] drop-shadow-[0_0_8px_rgba(2,132,199,0.4)]" />
      )}
      <span className="ml-2 text-xs font-mono font-medium hidden sm:inline text-[var(--text-muted)]">
        {theme === 'dark' ? 'DARK' : 'LIGHT'}
      </span>
    </motion.button>
  );
}
export default ThemeToggle;
