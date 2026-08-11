import { Wifi } from 'lucide-react';
import { CardListItem } from '../types/card.types';

const GRADIENTS = [
  'from-slate-800 via-slate-900 to-black',
  'from-emerald-700 via-emerald-800 to-slate-900',
  'from-indigo-700 via-purple-800 to-slate-900',
  'from-amber-600 via-orange-700 to-slate-900',
];

function gradientForCard(cardNumber: string): string {
  const sum = cardNumber.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

function maskCardNumber(cardNumber: string): string {
  const last4 = cardNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function VirtualCardVisual({ card }: { card: CardListItem }) {
  const fullName = [card.embossedFirstName, card.embossedLastName].filter(Boolean).join(' ');
  const isActive = card.status?.toUpperCase().includes('ACTIV');

  return (
    <div
      className={`relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br ${gradientForCard(
        card.cardNumber,
      )} p-5 text-white shadow-lg`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/60">{card.cardName}</p>
          <p className="mt-0.5 text-xs font-medium text-white/80">
            {card.productName ?? 'Credit Card'}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/60'
          }`}
        >
          {card.status || 'N/A'}
        </span>
      </div>

      <div className="relative mt-6 h-6 w-9 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500" />

      <p className="relative mt-4 font-mono text-lg tracking-[0.2em]">
        {maskCardNumber(card.cardNumber)}
      </p>

      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-white/50">Chủ thẻ</p>
          <p className="text-sm font-semibold uppercase tracking-wide">{fullName || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wide text-white/50">Hết hạn</p>
          <p className="text-sm font-semibold">{card.expiryDate ?? '--/--'}</p>
        </div>
        <Wifi className="h-5 w-5 rotate-90 text-white/50" />
      </div>
    </div>
  );
}