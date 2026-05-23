import { useToast } from "../context/ToastContext";
import type { ToastType } from "../context/ToastContext";

// ─── per-type visual config ───────────────────────────────────────────────────
const config: Record<
  ToastType,
  { headerClass: string; closeClass: string; icon: string; label: string }
> = {
  success: {
    headerClass: "bg-success text-white",
    closeClass:  "btn-close-white",
    icon:        "✓",
    label:       "Success",
  },
  warning: {
    headerClass: "bg-warning text-dark",
    closeClass:  "",
    icon:        "⚠",
    label:       "Warning",
  },
  error: {
    headerClass: "bg-danger text-white",
    closeClass:  "btn-close-white",
    icon:        "✕",
    label:       "Error",
  },
  info: {
    headerClass: "bg-dark text-white",
    closeClass:  "btn-close-white",
    icon:        "ℹ",
    label:       "Info",
  },
};

// ─── component ────────────────────────────────────────────────────────────────
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1100 }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => {
        const { headerClass, closeClass, icon, label } = config[t.type];
        return (
          <div
            key={t.id}
            className="toast show mb-2 shadow"
            role="alert"
            style={{ minWidth: "280px", maxWidth: "360px" }}
          >
            {/* Header */}
            <div className={`toast-header ${headerClass}`}>
              <span className="me-2" aria-hidden="true">{icon}</span>
              <strong className="me-auto">{label}</strong>
              <button
                type="button"
                className={`btn-close ${closeClass}`}
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
              />
            </div>

            {/* Body */}
            <div className="toast-body small">{t.message}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
