'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { writeTheme } from '@/lib/storage/prefs';
import { wipeTheme } from '@/lib/themeWipe';
import { cn } from '@/lib/utils';

function getIsDark() {
  return document.documentElement.classList.contains('dark');
}

type ThemeToggleProps = {
  size?: 'icon' | 'icon-sm';
  variant?: 'outline' | 'ghost';
  className?: string;
};

/**
 * Renders a button that switches between the light and dark themes.
 *
 * @param props - Optional button size and variant matching the surrounding
 * chrome.
 */
function ThemeToggle({
  size = 'icon',
  variant = 'outline',
  className,
}: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getIsDark());
  }, []);

  function toggleTheme() {
    const nextIsDark = !getIsDark();
    const nextTheme = nextIsDark ? 'dark' : 'light';

    // The ground changes behind the pixel wipe's cover; the preference and the
    // icon do not wait on it.
    wipeTheme(nextTheme, () => {
      document.documentElement.classList.toggle('dark', nextIsDark);
      document.documentElement.style.colorScheme = nextTheme;
    });

    writeTheme(nextTheme);
    setIsDark(nextIsDark);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}

export { ThemeToggle };
