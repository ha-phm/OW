export function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const normalized = (status || '').toUpperCase();
  const isActive = normalized.includes('ACTIV') || normalized.includes('OPEN');
  const isClosed = normalized.includes('CLOS') || normalized.includes('BLOCK');
  const color = isActive
    ? 'bg-green-50 text-green-700 ring-green-600/20'
    : isClosed
    ? 'bg-red-50 text-red-700 ring-red-600/20'
    : 'bg-amber-50 text-amber-700 ring-amber-600/20';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${color} ${
        small ? 'text-[10px]' : 'text-xs'
      }`}
    >
      {status || 'N/A'}
    </span>
  );
}
