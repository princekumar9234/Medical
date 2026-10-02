export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const mapping = {
    SCHEDULED: { label: 'Scheduled', variant: 'info' },
    CONFIRMED: { label: 'Confirmed', variant: 'primary' },
    IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'danger' },
    NO_SHOW: { label: 'No Show', variant: 'default' },
    PENDING: { label: 'Pending', variant: 'warning' },
    PAID: { label: 'Paid', variant: 'success' },
    UNPAID: { label: 'Unpaid', variant: 'warning' },
  };

  const current = mapping[status?.toUpperCase()] || { label: status || 'Unknown', variant: 'default' };

  return <Badge variant={current.variant}>{current.label}</Badge>;
};

export default Badge;
