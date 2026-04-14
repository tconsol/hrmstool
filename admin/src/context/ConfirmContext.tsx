import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export const useConfirm = () => useContext(ConfirmContext);

interface State extends ConfirmOptions {
  open: boolean;
}

const defaultState: State = {
  open: false,
  title: '',
  message: '',
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<State>(defaultState);
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};
