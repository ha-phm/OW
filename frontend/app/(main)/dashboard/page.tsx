'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Loader2, 
  AlertCircle, 
  ChevronRight,
  Wifi
} from 'lucide-react';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useCards } from '../../../hooks/useCards'; 
import { VirtualCardVisual } from '../../../components/Card/VirtualCardVisual'; 
import { CardDetailModal } from '../../../modals/CardDetailModal'; 
import { QuickOpenCardModal } from '../../../modals/QuickOpenCardModal';
import { AdminDashboard } from '../../../components/Dashboard/AdminDashboard';

const MOCK_CARDS = [
  { id: '1', bgClass: 'bg-slate-900', type: 'Signature' },
  { id: '2', bgClass: 'bg-blue-800', type: 'Platinum' },
  { id: '3', bgClass: 'bg-amber-700', type: 'Gold' },
  { id: '4', bgClass: 'bg-teal-800', type: 'Infinite' },
];

export default function DashboardPage() {
  const { data: authData, isLoading: isAuthLoading } = useAuthMe();
  const { data: clientData, isLoading: isClientLoading } = useCurrentUser();
  
  const { data: cardsData, isLoading: isCardsLoading, error: cardsError, refetch: refetchCards } = useCards('', 1);
  const cards = cardsData?.data ?? [];

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [activeMockIndex, setActiveMockIndex] = useState(0);
  const [isQuickOpenModalVisible, setIsQuickOpenModalVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMockIndex((prevIndex) => (prevIndex + 1) % MOCK_CARDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const allCardsOnDashboard = cards.map(card => ({
    cardNumber: card.cardNumber,
    productName: card.productName,
    cardName: card.cardName
  }));

  if (isAuthLoading || isClientLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải thông tin...</div>;
  }

  // --- LUỒNG ADMIN ---
  if (authData?.role === 'ADMIN') {
    return <AdminDashboard authData={authData} />;
  }

  // --- LUỒNG USER ---
  if (!clientData || !clientData.IssClientDetailsV2APIRecord) {
    return (
      <div className="m-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-500">
        Lỗi: Không tìm thấy hồ sơ hệ thống. Vui lòng liên hệ hỗ trợ.
      </div>
    );
  } 

  const profile = clientData.IssClientDetailsV2APIRecord;
  const displayName =
    [profile.LastName, profile.MiddleName, profile.FirstName].filter(Boolean).join(' ') ||
    profile.FullName || 
    authData?.email;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-10">
      
      <div>
        <h1 className="text-xl font-medium text-slate-500">Xin chào,</h1>
        <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
      </div>

      {/* ĐÃ SỬA: Đổi nền khối Hero thành bg-brand để đồng bộ với Sidebar */}
      <div className="relative z-0 flex min-h-55 sm:min-h-65 w-full flex-col justify-center overflow-hidden rounded-3xl bg-emerald-600 p-6 shadow-md sm:p-8">
        <div className="relative z-40 max-w-[55%] sm:max-w-[50%]">
          <h3 className="mb-2 text-lg sm:text-3xl font-bold text-white leading-tight drop-shadow-md">
            Khám phá đặc quyền <br className="hidden sm:block" /> thẻ xanh
          </h3>
          <p className="mb-5 sm:mb-6 text-xs sm:text-sm text-white/90 drop-shadow-md">
            Trải nghiệm thanh toán không giới hạn.
          </p>
          <div>
            <button
              onClick={() => setIsQuickOpenModalVisible(true)}
              // ĐÃ SỬA: Đổi text button thành text-brand và hover thành bg-brand-mint
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 sm:px-8 py-2.5 text-sm font-bold text-brand shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 hover:bg-brand-mint hover:text-brand-dark cursor-pointer"
            >
              Mở thẻ ngay
            </button>
          </div>
        </div>
        
        <div className="absolute right-4 sm:right-12 top-1/2 flex -translate-y-1/2 items-center h-full w-40 sm:w-60 pointer-events-none">
          {MOCK_CARDS.map((mockCard, index) => {
            const distance = (index - activeMockIndex + MOCK_CARDS.length) % MOCK_CARDS.length;
            let transformClasses = 'opacity-0 translate-x-20 scale-50 z-0'; 
            if (distance === 0) transformClasses = 'opacity-100 translate-x-0 sm:-translate-x-4 scale-100 z-30 -rotate-6 drop-shadow-2xl';
            else if (distance === 1) transformClasses = 'opacity-90 translate-x-6 sm:translate-x-10 scale-95 z-20 rotate-2 drop-shadow-xl';
            else if (distance === 2) transformClasses = 'opacity-70 translate-x-12 sm:translate-x-20 scale-90 z-10 rotate-6 drop-shadow-md';
            else if (distance === 3) transformClasses = 'opacity-0 -translate-x-12 sm:-translate-x-20 scale-110 z-40 -rotate-12';

            return (
              <MockCard 
                key={mockCard.id}
                bgClass={mockCard.bgClass}
                cardType={mockCard.type}
                className={`absolute left-0 top-1/2 -translate-y-1/2 origin-center transition-all duration-1000 ease-in-out ${transformClasses}`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Danh sách thẻ của tôi</h3>
          </div>
          <Link href="/cards" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Xem tất cả
          </Link>
        </div>

        {isCardsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : cardsError ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Không thể tải danh sách thẻ.
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
            <p className="text-sm text-slate-500">Bạn chưa có thẻ nào.</p>
          </div>
        ) : (
          <div className="flex w-full snap-x snap-mandatory flex-nowrap gap-4 overflow-x-auto pb-6 pt-2 sm:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none scroll-smooth">
            {cards.map((card) => (
              <button
                key={card.cardNumber}
                onClick={() => setSelectedCard(card.cardNumber)}
                className="w-[85vw] shrink-0 snap-center sm:snap-start text-left transition-transform hover:-translate-y-1 sm:w-[320px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <VirtualCardVisual card={card} />
              </button>
            ))}
            
            {cards.length >= 3 && (
              <Link 
                href="/cards" 
                className="flex w-40 sm:w-50 shrink-0 snap-center flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-300 bg-white/30 transition hover:bg-slate-50/50 hover:border-emerald-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ChevronRight className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-slate-500">Xem tất cả thẻ</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {isQuickOpenModalVisible && (
        <QuickOpenCardModal
          existingCards={allCardsOnDashboard}
          onClose={() => setIsQuickOpenModalVisible(false)}
          onSuccess={async (cardPan) => {
            setIsQuickOpenModalVisible(false);
            await refetchCards?.();
            setSelectedCard(cardPan);
          }}
        />
      )}

      {selectedCard && (
        <CardDetailModal cardNumber={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

// Bỏ gradient, dùng màu Solid, làm Chip phẳng hơn
function MockCard({ bgClass, cardType, className }: { bgClass: string; cardType: string; className: string }) {
  return (
    <div className={`flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 shadow-xl aspect-[1.586/1] w-40 sm:w-56 text-white ${bgClass} ${className}`}>
      <div className="flex items-center justify-between opacity-80">
        <span className="text-[8px] sm:text-[10px] font-bold tracking-widest uppercase">{cardType}</span>
        <Wifi className="h-3 w-3 sm:h-4 sm:w-4 rotate-90" />
      </div>
      <div className="mt-1 sm:mt-2 relative h-5 w-7 sm:h-7 sm:w-9 rounded bg-amber-400 border border-amber-500/50 flex items-center justify-center opacity-90 overflow-hidden">
        <div className="w-full h-px bg-black/10 absolute" />
        <div className="h-full w-px bg-black/10 absolute" />
      </div>
      <div className="mt-2 sm:mt-3 font-mono text-[11px] sm:text-[14px] font-medium tracking-widest sm:tracking-[0.15em] drop-shadow-md">
        •••• •••• •••• 1234
      </div>
      <div className="mt-auto flex items-end justify-between pt-1 sm:pt-2">
        <div className="flex flex-col">
          <span className="text-[5px] sm:text-[6px] uppercase opacity-60">Cardholder Name</span>
          <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-widest drop-shadow-md">Name Surname</span>
        </div>
        <div className="flex -space-x-1.5 sm:-space-x-2 relative z-10">
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500/90 mix-blend-multiply" />
          <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-yellow-400/90 mix-blend-multiply" />
        </div>
      </div>
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
    </div>
  );
}