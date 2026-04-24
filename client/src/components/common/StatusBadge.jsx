const statusConfig = {
  pending:  { label: 'Pending',  className: 'badge badge-yellow' },
  approved: { label: 'Approved', className: 'badge badge-green'  },
  paid:     { label: 'Paid',     className: 'badge badge-blue'   },
  rejected: { label: 'Rejected', className: 'badge badge-red'    },
  expired:  { label: 'Expired',  className: 'badge badge-gray'   },
  active:   { label: 'Active',   className: 'badge badge-green'  },
  inactive: { label: 'Inactive', className: 'badge badge-gray'   },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status?.toLowerCase()] || { label: status, className: 'badge badge-gray' };
  return <span className={cfg.className}>{cfg.label}</span>;
};

export default StatusBadge;
