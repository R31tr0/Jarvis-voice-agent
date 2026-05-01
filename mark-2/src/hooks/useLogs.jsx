import React, { createContext, useState, useContext, useCallback } from 'react';

const LogContext = createContext();

// 1. Экспорт провайдера
export const LogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
    if (window.jarvisStream) {
    window.jarvisStream(message);
  }
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog }}>
      {children}
    </LogContext.Provider>
  );
};

// 2. ЭКСПОРТ ХУКА (Проверьте эту строку!)
export const useLogs = () => {
  const context = useContext(LogContext);
  return context;
};