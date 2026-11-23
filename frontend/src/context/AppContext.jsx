import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSubject, setSelectedSubject] = useState('Science');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, duration = 2200) => {
    setToast(message);
    const timer = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const startGame = useCallback((mode) => {
    setGameMode(mode);
    setCurrentPage(mode === 'quiz' ? 'quiz' : 'sequence');
  }, []);

  const value = {
    currentPage,
    navigateTo,
    selectedSubject,
    setSelectedSubject,
    selectedChapter,
    setSelectedChapter,
    gameMode,
    startGame,
    toast,
    showToast,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
