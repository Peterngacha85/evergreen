import Modal from './Modal';
import { AlertCircle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmText = 'Confirm', type = 'danger', loading = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <div className="flex-col gap-5 items-center text-center" style={{ padding: '10px 0' }}>
        <div 
          className="flex items-center justify-center" 
          style={{ 
            width: 56, 
            height: 56, 
            borderRadius: '50%', 
            background: type === 'danger' ? '#fee2e2' : '#fef3c7',
            color: type === 'danger' ? '#dc2626' : '#d97706',
            marginBottom: 8
          }}
        >
          <AlertCircle size={32} />
        </div>
        
        <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {message}
        </p>

        <div className="flex gap-3 w-full" style={{ marginTop: 12 }}>
          <button 
            type="button" 
            className="btn btn-ghost flex-1" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn flex-1" 
            style={{ 
              background: type === 'danger' ? '#dc2626' : '#111827',
              color: 'white'
            }} 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
