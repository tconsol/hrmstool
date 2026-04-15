import { useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, X } from 'lucide-react';
import Modal from './Modal';
import api from '../../services/api';
import DatePicker from './DatePicker';
import Select from './Select';

interface ProcessCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employees?: any[];
  preSelectedEmployee?: any;
}

const ProcessCheckoutModal = ({
  isOpen,
  onClose,
  onSuccess,
  employees = [],
  preSelectedEmployee,
}: ProcessCheckoutModalProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState(preSelectedEmployee?.user?._id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkoutTime, setCheckoutTime] = useState('18:00');
  const [isLoading, setIsLoading] = useState(false);

  const employeeOptions = employees
    .filter((emp) => emp._id && emp.name)
    .map((emp) => ({
      value: emp._id,
      label: `${emp.name} (${emp.employeeId || 'N/A'})`,
    }));

  const handleProcessCheckout = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (!checkoutTime.match(/^\d{2}:\d{2}$/)) {
      toast.error('Invalid time format. Use HH:mm');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/attendance/manual-checkout', {
        employeeId: selectedEmployee,
        date: selectedDate,
        checkoutTime,
      });

      const empName = employees.find((e) => e._id === selectedEmployee)?.name || 'Employee';
      toast.success(`Checkout processed for ${empName}`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to process checkout';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="glass-card p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock size={20} />
            Process Checkout
          </h3>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Employee Selection */}
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Select Employee *
          </label>
          <Select
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            placeholder="Choose an employee"
            options={employeeOptions}
            className="w-full"
          />
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Date *
          </label>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-full"
          />
          <p className="text-xs text-dark-400 mt-1">
            Select today or a past date to process checkout
          </p>
        </div>

        {/* Time Selection */}
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Checkout Time *
          </label>
          <input
            type="time"
            value={checkoutTime}
            onChange={(e) => setCheckoutTime(e.target.value)}
            className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:border-brand-500 transition"
          />
          <p className="text-xs text-dark-400 mt-1">
            Enter the time when the employee should check out
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessCheckout}
            disabled={isLoading}
            className="flex-1 btn-primary"
          >
            {isLoading ? 'Processing...' : 'Process Checkout'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProcessCheckoutModal;
