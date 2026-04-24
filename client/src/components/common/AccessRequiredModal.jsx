import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Modal from './Modal';

const AccessRequiredModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access Restricted">
      <div className="flex-col items-center text-center gap-4" style={{ padding: '10px 0' }}>
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: 20, 
          borderRadius: '50%', 
          marginBottom: 10 
        }}>
          <ShieldAlert size={48} />
        </div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>
          Approval Required
        </h3>
        
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          To maintain security and transparency, all data modifications require a peer-approved session. 
          You currently don't have an active approved change request.
        </p>

        <div style={{ 
          background: 'var(--gray-50)', 
          padding: 16, 
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          marginTop: 10,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>How to get access?</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Submit a request describing your changes and wait for other leaders to approve it.
          </div>
        </div>

        <div className="flex-col gap-3 w-full" style={{ marginTop: 20 }}>
          <Link 
            to="/leader/change-requests" 
            className="btn btn-primary w-full justify-center"
            onClick={onClose}
            style={{ padding: '12px' }}
          >
            Go to Change Requests <ArrowRight size={18} />
          </Link>
          <button 
            type="button" 
            className="btn btn-ghost w-full justify-center" 
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AccessRequiredModal;
