'use client';

import React, { createContext, useContext, useCallback } from 'react';

interface ActivityLogsContextType {
  refreshActivityLogs: () => void;
  setRefreshFunction: (refreshFn: () => void) => void;
}

const ActivityLogsContext = createContext<ActivityLogsContextType | undefined>(undefined);

export function ActivityLogsProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  let refreshFunction: (() => void) | null = null;

  const setRefreshFunction = useCallback((refreshFn: () => void) => {
    refreshFunction = refreshFn;
  }, []);

  const refreshActivityLogs = useCallback(() => {
    if (refreshFunction) {
      refreshFunction();
    }
  }, []);

  return (
    <ActivityLogsContext.Provider value={{
      refreshActivityLogs,
      setRefreshFunction,
    }}>
      {children}
    </ActivityLogsContext.Provider>
  );
}

export function useActivityLogsRefresh() {
  const context = useContext(ActivityLogsContext);
  if (context === undefined) {
    throw new Error('useActivityLogsRefresh must be used within an ActivityLogsProvider');
  }
  return context;
}
