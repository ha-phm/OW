import { Wifi } from 'lucide-react';
import { CardListItem } from '../types/card.types';

function getCardTheme(card?: CardListItem) {
  const textToMatch = [card?.productName, card?.cardName].filter(Boolean).join(' ').toUpperCase();
  
  if (textToMatch.includes('PRODUCT 01') || textToMatch.includes('TRAINING01') || textToMatch.includes('TRAVEL')) {
    return { bg: 'from-blue-600 via-blue-500 to-blue-700', title: 'Thẻ Du Lịch' };
  }
  if (textToMatch.includes('PRODUCT 02') || textToMatch.includes('TRAINING02') || textToMatch.includes('ECOMMERCE')) {
    return { bg: 'from-orange-500 via-orange-400 to-orange-600', title: 'Thương Mại Điện Tử' };
  }
  if (textToMatch.includes('PRODUCT 03') || textToMatch.includes('TRAINING03') || textToMatch.includes('VISA')) {
    return { bg: 'from-emerald-500 via-emerald-400 to-emerald-600', title: 'Thẻ Visa' };
  }
  
  return { bg: 'from-purple-600 via-purple-500 to-purple-700', title: 'Thẻ Credit' };
}

function formatCardNumberGroups(cardNumber?: string, revealFull?: boolean): string[] {
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
  if (!card) return null;

  const fullName = [card.embossedFirstName, card.embossedLastName].filter(Boolean).join(' ');
  const theme = getCardTheme(card);
  const displayCardName = card.cardName && card.cardName !== 'Card Contract' 
    ? card.cardName 
    : theme.title;

  return (
    // [container-type:inline-size] biến chính thẻ này thành 1 "container query context" —
    // mọi kích thước bên trong sẽ co giãn theo ĐỘ RỘNG THẬT của thẻ, không phải viewport,
    // nên dù nhét vào slider, grid 2 cột, 3 cột hay modal preview đều tự vừa vặn.
    <div
      className={`relative flex aspect-[1.586/1] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-linear-to-br ${theme.bg} px-[clamp(0.9rem,5cqw,1.5rem)] pb-[clamp(0.9rem,5cqw,1.5rem)] pt-[clamp(0.75rem,4cqw,1.25rem)] text-white shadow-2xl ring-1 ring-white/30 transition-all duration-300 group hover:shadow-3xl @container`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-size-[4px_4px] mix-blend-overlay opacity-60" />
      <div className="absolute inset-0 bg-linear-to-tr from-black/20 via-transparent to-white/20" />
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl mix-blend-overlay" />
      <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-black/30 blur-2xl mix-blend-overlay" />

      <div className="relative flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mt-0.5 truncate text-[clamp(0.65rem,4cqw,0.95rem)] font-semibold text-white/90 tracking-wide drop-shadow-md">
            {displayCardName}
          </p>
        </div>
        
        <div className="shrink-0 flex items-center pt-1">
          <span className="font-serif text-[clamp(0.7rem,4.5cqw,1rem)] italic tracking-widest text-white/90 drop-shadow-lg">
            Openway
          </span>
        </div>
      </div>

      {/* Chip: dùng % + aspect-ratio thay vì h-8 w-11 cố định, tự co theo bề rộng thẻ */}
      <div className="relative mt-[clamp(0.9rem,5cqw,1.5rem)] w-[clamp(2rem,14cqw,2.75rem)] aspect-[1.4/1] shrink-0 rounded-md bg-linear-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.4)] opacity-95 flex items-center justify-center overflow-hidden">
        <div className="absolute w-full h-[0.5px] bg-black/20" />
        <div className="absolute h-full w-[0.5px] bg-black/20" />
        <div className="absolute right-2 h-full w-[0.5px] bg-black/10" />
        <div className="absolute bottom-2 w-full h-[0.5px] bg-black/10" />
      </div>

      <div className="relative mt-auto mb-2 flex flex-1 items-center justify-between font-mono text-[clamp(0.8rem,6cqw,1.25rem)] font-medium [text-shadow:1px_2px_2px_rgba(0,0,0,0.4),-1px_-1px_1px_rgba(255,255,255,0.2)]">
        {formatCardNumberGroups(card.cardNumber, revealFull).map((group, i) => (
          <span key={i} className="tracking-[0.12em]">
            {group}
          </span>
        ))}
      </div>

      <div className="relative mt-auto flex shrink-0 items-end justify-between gap-2">
        <div className="min-w-0 flex flex-col">
          <span className="truncate text-[clamp(0.6rem,3.8cqw,0.9rem)] font-semibold uppercase tracking-wider [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]">
            {fullName || 'N/A'}
          </span>
        </div>
        
        <div className="flex items-center gap-[clamp(0.5rem,3cqw,1rem)] shrink-0 text-right">
          <div className="flex flex-col">
            <span className="text-[clamp(0.45rem,2cqw,0.6rem)] uppercase tracking-wider text-white/70 mb-0.5">Expires</span>
            <span className="text-[clamp(0.6rem,3.8cqw,0.9rem)] font-semibold [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]">{card.expiryDate ?? '--/--'}</span>
          </div>
          <Wifi className="w-[clamp(0.9rem,5cqw,1.25rem)] h-[clamp(0.9rem,5cqw,1.25rem)] rotate-90 text-white/80 drop-shadow-md" />
        </div>
      </div>
    </div>
  );
}