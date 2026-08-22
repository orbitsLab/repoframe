'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const themeStorageKey = 'repoframe-theme';

function getIsDark() {
  return document.documentElement.classList.contains('dark');
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getIsDark());
  }, []);

  function toggleTheme() {
    const nextIsDark = !getIsDark();
    document.documentElement.classList.toggle('dark', nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? 'dark' : 'light';
    localStorage.setItem(themeStorageKey, nextIsDark ? 'dark' : 'light');
    setIsDark(nextIsDark);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}

export { ThemeToggle };
