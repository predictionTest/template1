import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage for saved theme
    const saved = localStorage.getItem('prediction-oracle-theme');
    const initialTheme = (saved as Theme) || 'dark';
    
    // Apply theme immediately to avoid flash
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return initialTheme;
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('prediction-oracle-theme', theme);
    
    // Update document class
    console.log('🎨 Applying theme:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('✅ Added dark class to html');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('✅ Removed dark class from html');
    }
    console.log('📋 Current classes:', document.documentElement.className);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

