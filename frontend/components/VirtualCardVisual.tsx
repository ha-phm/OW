import { Wifi } from 'lucide-react';
import { CardListItem } from '../types/card.types';

const GRADIENTS = [
  'from-slate-800 via-slate-900 to-black',
  'from-emerald-700 via-emerald-800 to-slate-900',
  'from-indigo-700 via-purple-800 to-slate-900',
  'from-amber-600 via-orange-700 to-slate-900',
];

function gradientForCard(cardNumber: string): string {
  if (!cardNumber) return GRADIENTS[0];
  const sum = cardNumber.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

function formatCardNumberGroups(cardNumber: string, revealFull: boolean): string[] {
  if (!cardNumber || cardNumber.length < 4) return ['••••', '••••', '••••', '????'];

  if (revealFull) {
    const padded = cardNumber.padStart(Math.ceil(cardNumber.length / 4) * 4, '0');
    const groups: string[] = [];
    for (let i = 0; i < padded.length; i += 4) {
      groups.push(padded.slice(i, i + 4));
    }
    return groups;
  }

  const last4 = cardNumber.slice(-4);
  return ['••••', '••••', '••••', last4];
}

export function VirtualCardVisual({
  card,
  revealFull = false,
}: {
  card: CardListItem;
  revealFull?: boolean;
}) {
  const fullName = [card.embossedFirstName, card.embossedLastName].filter(Boolean).join(' ');
  const isActive = card.status?.toUpperCase().includes('ACTIV');

  return (
    <div
      className={`relative flex aspect-[1.4/1] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-linear-to-br ${gradientForCard(
        card.cardNumber,
      )} px-5 pb-6 pt-5 text-white shadow-lg`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />

      <div className="relative flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-widest text-white/60">
            {card.cardName}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-white/80">
            {card.productName ?? 'Credit Card'}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/60'
          }`}
        >
          {card.status || 'N/A'}
        </span>
      </div>

      <div className="relative mt-6 h-6 w-9 shrink-0 rounded-md bg-linear-to-br from-yellow-200 to-yellow-500" />

      <div className="relative mt-8 flex flex-1 items-center justify-between font-mono text-base sm:text-lg">
        {formatCardNumberGroups(card.cardNumber, revealFull).map((group, i) => (
          <span key={i} className="tracking-[0.15em]">
            {group}
          </span>
        ))}
      </div>

      <div className="relative mt-auto flex shrink-0 items-end justify-between gap-2 pt-4">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wide text-white/50">Chủ thẻ</p>
          <p className="truncate text-sm font-semibold uppercase tracking-wide">
            {fullName || 'N/A'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] uppercase tracking-wide text-white/50">Hết hạn</p>
          <p className="text-sm font-semibold">{card.expiryDate ?? '--/--'}</p>
        </div>
        <Wifi className="h-5 w-5 shrink-0 rotate-90 text-white/50" />
      </div>
    </div>
  );
}
