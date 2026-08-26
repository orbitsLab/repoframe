'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { writeTheme } from '@/lib/storage/prefs';

function getIsDark() {
  return document.documentElement.classList.contains('dark');
}

type ThemeToggleProps = {
  size?: 'icon' | 'icon-sm';
};

/**
 * Renders a button that switches between the light and dark themes.
 *
 * @param props - Optional button size matching the surrounding header density.
 */
function ThemeToggle({ size = 'icon' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getIsDark());
  }, []);

  function toggleTheme() {
    const nextIsDark = !getIsDark();
    document.documentElement.classList.toggle('dark', nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? 'dark' : 'light';
    writeTheme(nextIsDark ? 'dark' : 'light');
    setIsDark(nextIsDark);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}

export { ThemeToggle };
