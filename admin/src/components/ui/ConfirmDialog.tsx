import { createPortal } from 'react-dom';
import { AlertTriangle, Info, HelpCircle, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    icon: <AlertTriangle size={22} className="text-red-400" />,
    iconBg: 'bg-red-500/10',
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: <AlertTriangle size={22} className="text-amber-400" />,
    iconBg: 'bg-amber-500/10',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: <Info size={22} className="text-brand-400" />,
    iconBg: 'bg-brand-500/10',
    confirmBtn: 'bg-brand-600 hover:bg-brand-700 text-white',
  },
};

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!open) return null;

  const cfg = variantConfig[variant];

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="bg-dark-800 border border-dark-700 rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in"
        style={{ animation: 'scaleIn 0.15s ease-out' }}
      >
        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.iconBg}`}>
            {cfg.icon}
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-sm text-dark-300 leading-relaxed pl-1">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-dark-300 border border-dark-600 rounded-lg hover:bg-dark-700/50 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all disabled:opacity-60 ${cfg.confirmBtn}`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
