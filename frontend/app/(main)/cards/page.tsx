'use client';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CreditCard, Search } from 'lucide-react';
import { useCards } from '../../../hooks/useCards';
import { ApiError } from '../../../api/api';
import { VirtualCardVisual } from '../../../components/VirtualCardVisual';
import { CardDetailModal } from '../../../modals/CardDetailModal';

const SEARCH_DEBOUNCE_MS = 300;

export default function CardsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  
  const { data, isLoading, isFetching, isError, error } = useCards(search, page);

  const cards = data?.data ?? [];
  const meta = data?.meta;
  const isFirstLoad = isLoading && !data;
  const errorMessage = isError
    ? error instanceof ApiError
      ? error.message
      : 'Không thể tải danh sách thẻ.'
    : null;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Thẻ của tôi</h2>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo số thẻ, tên thẻ hoặc tên chủ thẻ..."
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
        {isFetching && !isFirstLoad && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-300" />
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" /> {errorMessage}
        </div>
      )}

      {isFirstLoad ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">
            {search ? `Không tìm thấy thẻ nào khớp với "${search}".` : 'Bạn chưa có thẻ nào.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <button
                key={card.cardNumber}
                onClick={() => setSelectedCard(card.cardNumber)}
                className="text-left transition-transform hover:-translate-y-0.5"
              >
                <VirtualCardVisual card={card} />
              </button>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Trang {meta.page}/{meta.totalPages} - Tổng số: {meta.total} thẻ
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={meta.page >= meta.totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedCard && (
        <CardDetailModal cardNumber={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}