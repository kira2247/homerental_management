'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ViewMode = 'grid' | 'list';

interface ViewModeContextType {
  viewMode: ViewMode;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

interface ViewModeProviderProps {
  children: ReactNode;
  initialMode?: ViewMode;
}

export function ViewModeProvider({ 
  children, 
  initialMode = 'grid' 
}: ViewModeProviderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const value = {
    viewMode,
    toggleViewMode
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
} 