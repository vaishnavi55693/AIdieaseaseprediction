import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = (toast) => {
    const id = crypto.randomUUID();
    const entry = { id, type: "info", duration: 3200, ...toast };
    setToasts((current) => [...current, entry]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, entry.duration);
  };

  const removeToast = (id) => setToasts((current) => current.filter((item) => item.id !== id));

  const value = useMemo(() => ({ toasts, pushToast, removeToast }), [toasts]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}
