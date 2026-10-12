"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Event-based global trigger (allows calling outside React component trees)
const TOAST_EVENT = "erp_custom_toast_event";

export const showToast = (type: ToastType, message: string, title?: string, duration = 3500) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { type, message, title, duration },
      })
    );
  }
};

export const toast = {
  success: (msg: string, title?: string, duration?: number) => showToast("success", msg, title, duration),
  error: (msg: string, title?: string, duration?: number) => showToast("error", msg, title, duration),
  warning: (msg: string, title?: string, duration?: number) => showToast("warning", msg, title, duration),
  info: (msg: string, title?: string, duration?: number) => showToast("info", msg, title, duration),
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, message, title, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleCustomToast = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: ToastType;
        message: string;
        title?: string;
        duration?: number;
      }>;
      if (customEvent.detail) {
        const { type, message, title, duration } = customEvent.detail;
        addToast(type, message, title, duration);
      }
    };

    window.addEventListener(TOAST_EVENT, handleCustomToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleCustomToast);
    };
  }, [addToast]);

  const success = useCallback(
    (msg: string, title?: string, dur?: number) => addToast("success", msg, title, dur),
    [addToast]
  );
  const error = useCallback(
    (msg: string, title?: string, dur?: number) => addToast("error", msg, title, dur),
    [addToast]
  );
  const warning = useCallback(
    (msg: string, title?: string, dur?: number) => addToast("warning", msg, title, dur),
    [addToast]
  );
  const info = useCallback(
    (msg: string, title?: string, dur?: number) => addToast("info", msg, title, dur),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ success, error, warning, info, dismiss }}>
      {children}
      {/* Floating Toast Container */}
      <div
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-md border bg-white shadow-lg transition-all transform duration-200 animate-slideUp ${
              t.type === "success"
                ? "border-emerald-200 text-slate-800"
                : t.type === "error"
                ? "border-rose-200 text-slate-800"
                : t.type === "warning"
                ? "border-amber-200 text-slate-800"
                : "border-sky-200 text-slate-800"
            }`}
          >
            {/* Semantic Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {t.type === "success" && (
                <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
                  ✓
                </div>
              )}
              {t.type === "error" && (
                <div className="w-5 h-5 rounded bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs border border-rose-200">
                  ✕
                </div>
              )}
              {t.type === "warning" && (
                <div className="w-5 h-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs border border-amber-200">
                  ⚠
                </div>
              )}
              {t.type === "info" && (
                <div className="w-5 h-5 rounded bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-200">
                  ℹ
                </div>
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-1">
              {t.title && <h4 className="text-xs font-bold text-slate-900 mb-0.5">{t.title}</h4>}
              <p className="text-xs font-medium text-slate-700 leading-snug break-words">{t.message}</p>
            </div>

            {/* Dismiss Close Button */}
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition flex-shrink-0"
              title="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback to global toast object if used outside Provider
    return {
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      dismiss: () => {},
    };
  }
  return context;
};

