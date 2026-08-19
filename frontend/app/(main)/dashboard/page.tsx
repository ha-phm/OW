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
import { VirtualCardVisual } from '../../../components/VirtualCardVisual'; 
import { CardDetailModal } from '../../../modals/CardDetailModal'; 
import { QuickOpenCardModal } from '../../../modals/QuickOpenCardModal';

// Dữ liệu 4 thẻ giả lập để làm hiệu ứng trượt
const MOCK_CARDS = [
  { id: '1', gradient: 'from-slate-700 to-slate-900', type: 'Signature' },
  { id: '2', gradient: 'from-blue-500 to-blue-800', type: 'Platinum' },
  { id: '3', gradient: 'from-amber-400 to-orange-600', type: 'Gold' },
  { id: '4', gradient: 'from-teal-400 to-emerald-600', type: 'Infinite' },
];

export default function DashboardPage() {
  const { data: authData, isLoading: isAuthLoading } = useAuthMe();
  const { data: clientData, isLoading: isClientLoading } = useCurrentUser();
  
  const { data: cardsData, isLoading: isCardsLoading, error: cardsError, refetch: refetchCards } = useCards('', 1);
  const cards = cardsData?.data ?? [];

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [activeMockIndex, setActiveMockIndex] = useState(0);

  // Hiệu ứng tự động trượt thẻ sau mỗi 3 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMockIndex((prevIndex) => (prevIndex + 1) % MOCK_CARDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Chỉ giữ lại state quản lý ẩn/hiện Modal
  const [isQuickOpenModalVisible, setIsQuickOpenModalVisible] = useState(false);

  if (isAuthLoading || isClientLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải thông tin...</div>;
  }

  // --- GIAO DIỆN DÀNH CHO ADMIN ---
  if (authData?.role === 'ADMIN') {
    return (
      <div className="flex w-full max-w-6xl flex-col gap-6 mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Xin chào, Quản trị viên</h1>
          <p className="text-slate-500">Đây là bảng điều khiển dành riêng cho Super Admin.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard label="Email quản trị" value={authData.email} />
          <InfoCard label="Quyền hạn" value="Toàn quyền (Admin)" />
          <InfoCard label="ID Hệ thống" value={`#${authData.userId}`} />
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN DÀNH CHO KHÁCH HÀNG ---
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
      
      {/* 1. HEADER & GREETING */}
      <div>
        <h1 className="text-xl font-medium text-slate-500">Xin chào,</h1>
        <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
      </div>

      {/* 2. BANNER MỞ THẺ */}
      <div className="relative z-0 flex min-h-55 sm:min-h-65 w-full flex-col justify-center overflow-hidden rounded-3xl bg-linear-to-br from-emerald-400 to-teal-600 p-6 shadow-md sm:p-8">
        
        <div className="relative z-40 max-w-[55%] sm:max-w-[50%]">
          <h3 className="mb-2 text-lg sm:text-3xl font-bold text-white leading-tight drop-shadow-md">
            Khám phá đặc quyền <br className="hidden sm:block" /> thẻ xanh
          </h3>
          <p className="mb-5 sm:mb-6 text-xs sm:text-sm text-emerald-50 drop-shadow-md">
            Trải nghiệm thanh toán không giới hạn.
          </p>
          <div>
            <button
              onClick={() => setIsQuickOpenModalVisible(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 sm:px-8 py-2.5 text-sm font-bold text-teal-600 shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Mở thẻ ngay
            </button>
          </div>
        </div>
        
        {/* Khu vực thẻ tự trượt bên phải */}
        <div className="absolute right-4 sm:right-12 top-1/2 flex -translate-y-1/2 items-center h-full w-40 sm:w-60 pointer-events-none">
          {MOCK_CARDS.map((mockCard, index) => {
            const distance = (index - activeMockIndex + MOCK_CARDS.length) % MOCK_CARDS.length;
            
            let transformClasses = 'opacity-0 translate-x-20 scale-50 z-0'; 
            
            if (distance === 0) {
              transformClasses = 'opacity-100 translate-x-0 sm:-translate-x-4 scale-100 z-30 -rotate-6 drop-shadow-2xl';
            } else if (distance === 1) {
              transformClasses = 'opacity-90 translate-x-6 sm:translate-x-10 scale-95 z-20 rotate-2 drop-shadow-xl';
            } else if (distance === 2) {
              transformClasses = 'opacity-70 translate-x-12 sm:translate-x-20 scale-90 z-10 rotate-6 drop-shadow-md';
            } else if (distance === 3) {
              transformClasses = 'opacity-0 -translate-x-12 sm:-translate-x-20 scale-110 z-40 -rotate-12';
            }

            return (
              <MockCard 
                key={mockCard.id}
                gradient={mockCard.gradient}
                cardType={mockCard.type}
                className={`absolute left-0 top-1/2 -translate-y-1/2 origin-center transition-all duration-1000 ease-in-out ${transformClasses}`}
              />
            );
          })}
        </div>
      </div>

      {/* 3. THẺ CỦA TÔI */}
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
          <div className="flex w-full snap-x snap-mandatory flex-nowrap gap-4 overflow-x-auto pb-4 sm:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            {cards.map((card) => (
              <button
                key={card.cardNumber}
                onClick={() => setSelectedCard(card.cardNumber)}
                className="w-[85vw] shrink-0 snap-center text-left transition-transform hover:-translate-y-1 sm:w-85"
              >
                <VirtualCardVisual card={card} />
              </button>
            ))}
            
            {cards.length >= 3 && (
              <Link 
                href="/cards" 
                className="flex w-40 sm:w-50 shrink-0 snap-center flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/30 transition hover:bg-slate-50/50 hover:border-emerald-300"
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

      {/* MODAL MỞ THẺ NHANH */}
      {isQuickOpenModalVisible && (
        <QuickOpenCardModal
          onClose={() => setIsQuickOpenModalVisible(false)}
          onSuccess={async (cardPan) => {
            setIsQuickOpenModalVisible(false);
            await refetchCards?.();
            setSelectedCard(cardPan); // Tự động mở chi tiết thẻ vừa tạo
          }}
        />
      )}

      {selectedCard && (
        <CardDetailModal cardNumber={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}

// Component Thẻ giả lập Nằm ngang
function MockCard({ gradient, cardType, className }: { gradient: string; cardType: string; className: string }) {
  return (
    <div 
      className={`flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-white/20 p-3 sm:p-4 shadow-xl bg-linear-to-br aspect-[1.586/1] w-40 sm:w-56 text-white ${gradient} ${className}`}
    >
      <div className="flex items-center justify-between opacity-80">
        <span className="text-[8px] sm:text-[10px] font-bold tracking-widest uppercase">{cardType}</span>
        <Wifi className="h-3 w-3 sm:h-4 sm:w-4 rotate-90" />
      </div>
      
      <div className="mt-1 sm:mt-2 relative h-5 w-7 sm:h-7 sm:w-9 rounded bg-linear-to-br from-yellow-200 to-yellow-500 shadow-inner flex items-center justify-center opacity-90 overflow-hidden">
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
      
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-slate-900 sm:text-lg">{value}</p>
    </div>
  );
}