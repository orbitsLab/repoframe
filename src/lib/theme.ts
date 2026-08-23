import { themeStorageKey } from '@/lib/storage/prefs';

/** Applies the saved theme before hydration to prevent a color-scheme flash. */
const themeScript = `try{const t=localStorage.getItem(${JSON.stringify(themeStorageKey)});const d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch{}`;

export { themeScript };
