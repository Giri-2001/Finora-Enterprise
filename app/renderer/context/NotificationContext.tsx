import { createContext, useContext, useState, type ReactNode } from "react";

import Toast from "../components/ui/Toast";

type NotificationType = "success" | "error" | "warning" | "info";

type NotificationContextType = {
  showToast: (message: string, type?: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

type ProviderProps = {
  children: ReactNode;
};

export function NotificationProvider({ children }: ProviderProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  function showToast(message: string, type: NotificationType = "success") {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  return (
    <NotificationContext.Provider
      value={{
        showToast,
      }}
    >
      {children}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider");
  }

  return context;
}
