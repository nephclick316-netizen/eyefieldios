import React, { createContext, useContext, useState } from 'react';

interface NotificationContextType {
  isSupported: boolean;
  isSubscribed: boolean;
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSupported] = useState(false);
  const [isSubscribed] = useState(false);

  const requestPermission = async () => {
    console.log("Push notifications not supported on Web (OneSignal removed)");
  };

  return (
    <NotificationContext.Provider value={{ isSupported, isSubscribed, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
