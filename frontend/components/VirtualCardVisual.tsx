import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CardListItem } from '../types/card.types';
import { formatCardNumberGroups } from '../utils/format';

// ĐÃ SỬA: Hàm lấy Theme Thẻ đổi sang Màu Đơn Sắc
function getCardTheme(card?: CardListItem) {
  const textToMatch = [card?.productName, card?.cardName]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
  
  // 1. Thẻ Du Lịch
  if (
    textToMatch.includes('TRAINING01') ||
    textToMatch.includes('PRODUCT 01') ||
    textToMatch.includes('TRAVEL') ||
    textToMatch.includes('DU LỊCH') ||
    textToMatch.includes('DU LICH')
  ) {
    return { 
      bgClass: 'bg-blue-800',
      glow: 'rgba(30, 64, 175, 0.35)',
      cardLabel: 'Thẻ Du Lịch'
    };
  }

  // 2. Thẻ Thương Mại Điện Tử
  if (
    textToMatch.includes('TRAINING02') ||
    textToMatch.includes('PRODUCT 02') ||
    textToMatch.includes('ECOMMERCE') ||
    textToMatch.includes('THƯƠNG MẠI') ||
    textToMatch.includes('THUONG MAI')
  ) {
    return { 
      bgClass: 'bg-orange-700',
      glow: 'rgba(194, 65, 12, 0.35)',
      cardLabel: 'Thương Mại Điện Tử'
    };
  }

  // 3. Thẻ Visa
  if (
    textToMatch.includes('TRAINING03') ||
    textToMatch.includes('PRODUCT 03') ||
    textToMatch.includes('VISA')
  ) {
    return { 
      bgClass: 'bg-emerald-700',
      glow: 'rgba(4, 120, 87, 0.35)',
      cardLabel: 'Thẻ Visa'
    };
  }
  
  // 4. Thẻ Credit / Signature (Màu siêu tối quyền lực)
  return { 
    bgClass: 'bg-indigo-950',
    glow: 'rgba(30, 27, 75, 0.35)',
    cardLabel: 'Thẻ Credit'
  };
}

export function VirtualCardVisual({
  card,
  revealFull = false,
  allowToggle = false,
}: {
  card: CardListItem;
  revealFull?: boolean;
  allowToggle?: boolean;
}) {
  const [internalRevealed, setInternalRevealed] = useState(revealFull);
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const isRevealed = allowToggle ? internalRevealed : revealFull;
  const fullName = [card.embossedFirstName, card.embossedLastName].filter(Boolean).join(' ') || 'CARDHOLDER NAME';
  const theme = getCardTheme(card);
  const groups = formatCardNumberGroups(card.cardNumber, isRevealed);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.cardNumber) return;
    navigator.clipboard.writeText(card.cardNumber);
    setCopied(true);
    toast.success('Đã sao chép số thẻ vào bộ nhớ tạm');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalRevealed((prev) => !prev);
  };

  return (
    <div
      // ĐÃ SỬA: Xóa bg-gradient-to-br, thay bằng theme.bgClass và thêm border mờ tạo khối
      className={`relative flex aspect-[1.586/1] w-full max-w-full flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl ${theme.bgClass} border border-white/10 p-[clamp(0.85rem,4.8cqw,1.5rem)] text-white shadow-xl sm:shadow-2xl transition-all duration-300 group hover:shadow-2xl hover:border-white/25 @container`}
    >
      {/* 1. NỀN HỌA TIẾT CONG & CHẤM BI */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none opacity-50"
        viewBox="0 0 360 227"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="cardDotPattern" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="white" fillOpacity="0.12" />
          </pattern>
          <clipPath id="domeClip">
            <path d="M -20 250 C 60 50, 220 20, 380 200 L 380 250 Z" />
          </clipPath>
        </defs>
        <rect width="100%" height="100%" fill="url(#cardDotPattern)" clipPath="url(#domeClip)" />
        <path
          d="M 120 -20 C 120 80, 210 145, 380 170"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Ánh sáng tản mờ viền */}
      <div 
        className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl pointer-events-none opacity-50"
        style={{ backgroundColor: theme.glow }}
      />

      {/* 2. HÀNG TRÊN CÙNG: "openway" + TÍN HIỆU WIFI */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-sans text-[clamp(1rem,5.8cqw,1.55rem)] font-light tracking-tight text-white drop-shadow-sm lowercase">
            openway
          </span>
        </div>

        <div className="flex items-center">
          <svg
            className="w-[clamp(1rem,4.8cqw,1.35rem)] h-[clamp(1rem,4.8cqw,1.35rem)] text-white/90 drop-shadow-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M14.5 3.5a14 14 0 0 1 0 17" />
            <path d="M10.8 6.8a9.5 9.5 0 0 1 0 10.4" />
            <path d="M7.2 10a5 5 0 0 1 0 4" />
          </svg>
        </div>
      </div>

      {/* 3. CHIP EMV VÀNG (Làm phẳng, bỏ Gradient nổi 3D quá đà) */}
      <div className="relative z-10 my-auto pt-0.5">
        <div className="relative w-[clamp(2rem,11.5cqw,2.75rem)] aspect-[1.35/1] rounded-lg bg-amber-500 p-[1.2px] shadow-sm">
          <div className="relative h-full w-full rounded-[5px] bg-amber-400 overflow-hidden border border-amber-600/40">
            <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-amber-700/30 -translate-y-1/2" />
            <div className="absolute top-0 left-1/3 w-[0.5px] h-full bg-amber-700/30" />
            <div className="absolute top-0 right-1/3 w-[0.5px] h-full bg-amber-700/30" />
            <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 rounded-full border border-amber-700/20" />
          </div>
        </div>
      </div>

      {/* 4. SỐ THẺ TRẢI RỘNG */}
      <div className="relative z-10 flex flex-col gap-1 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex w-full items-center justify-between font-mono text-[clamp(0.82rem,5.2cqw,1.38rem)] font-bold tracking-widest sm:tracking-[0.15em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
            {groups.map((group, i) => (
              <span key={i} className="inline-block drop-shadow-md">
                {group}
              </span>
            ))}
          </div>

          {allowToggle && (
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={handleToggle}
                title={isRevealed ? 'Ẩn số thẻ' : 'Hiện số thẻ'}
                className="flex h-[clamp(1.4rem,6.8cqw,1.75rem)] w-[clamp(1.4rem,6.8cqw,1.75rem)] items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20 active:scale-95 cursor-pointer text-white hover:text-white"
              >
                {isRevealed ? <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="Sao chép số thẻ"
                className="flex h-[clamp(1.4rem,6.8cqw,1.75rem)] w-[clamp(1.4rem,6.8cqw,1.75rem)] items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20 active:scale-95 cursor-pointer text-white hover:text-white"
              >
                {copied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* 5. HÀNG THÔNG TIN DƯỚI CÙNG */}
        <div className="flex items-end justify-between pt-0.5 sm:pt-1">
          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[clamp(0.38rem,1.7cqw,0.52rem)] font-semibold uppercase tracking-wider text-white/70">
                VALID THRU
              </span>
              <span className="font-mono text-[clamp(0.6rem,2.8cqw,0.85rem)] font-bold text-white tracking-widest">
                {card.expiryDate ?? '12/28'}
              </span>
            </div>
            <span className="text-[clamp(0.65rem,3.3cqw,0.95rem)] font-medium uppercase tracking-wider text-white drop-shadow-sm truncate">
              {fullName}
            </span>
          </div>

          <div className="flex items-center shrink-0 -space-x-2.5 sm:-space-x-3">
            <div className="h-[clamp(1.4rem,7cqw,1.9rem)] w-[clamp(1.4rem,7cqw,1.9rem)] rounded-full bg-[#EB001B] opacity-95" />
            <div className="h-[clamp(1.4rem,7cqw,1.9rem)] w-[clamp(1.4rem,7cqw,1.9rem)] rounded-full bg-[#F79E1B] opacity-95 mix-blend-screen" />
          </div>
        </div>
      </div>
    </div>
  );
}