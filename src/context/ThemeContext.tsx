import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

const ThemeContext = createContext<{
    theme: ThemeMode;
    toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeMode>(() => {
        return (localStorage.getItem('app-theme') as ThemeMode) || 'dark';
    });

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
