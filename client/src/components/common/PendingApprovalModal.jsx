import { ShieldCheck, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import { useNavigate } from 'react-router-dom';

const PendingApprovalModal = ({ isOpen, onClose, request }) => {
  const navigate = useNavigate();

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approval Request">
      <div className="flex-col items-center text-center gap-4" style={{ padding: '10px 0' }}>
        <div style={{ 
          background: '#dcfce7', 
          color: '#16a34a', 
          padding: 20, 
          borderRadius: '50%', 
          marginBottom: 10 
        }}>
          <ShieldCheck size={48} />
        </div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>
          Action Required
        </h3>
        
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--gray-900)' }}>{request.requestedBy?.name}</strong> has requested access to make changes. 
          Your vote is needed to approve or reject this session.
        </p>

        <div style={{ 
          background: 'var(--gray-50)', 
          padding: 16, 
          borderRadius: 'var(--radius-lg)', 
          width: '100%', 
          textAlign: 'left',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 6 }}>Reason for request</div>
          <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--gray-700)' }}>
            "{request.reason}"
          </div>
        </div>

        <div className="flex-col gap-3 w-full" style={{ marginTop: 20 }}>
          <button 
            className="btn btn-primary w-full justify-center" 
            style={{ padding: 12 }}
            onClick={() => {
              onClose();
              navigate('/leader/change-requests');
            }}
          >
            Review & Vote <ArrowRight size={18} />
          </button>
          <button 
            className="btn btn-ghost w-full justify-center" 
            onClick={onClose}
          >
            Decide Later
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PendingApprovalModal;
