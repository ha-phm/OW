'use client';
import { useEffect, useState } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { 
  Loader2, 
  AlertCircle, 
  CreditCard, 
  Search, 
  Plus, 
  Eye, 
  Copy, 
  Check, 
  LayoutGrid, 
  TableProperties 
} from 'lucide-react';
import { toast } from 'sonner';
import { useCards } from '../../../hooks/useCards';
import { ApiError } from '../../../api/api';
import { VirtualCardVisual } from '../../../components/Card/VirtualCardVisual';
import { CardDetailModal } from '../../../modals/CardDetailModal';
import { QuickOpenCardModal } from '../../../modals/QuickOpenCardModal';
import { AdminDataTable, type AppFeatures } from '../../../components/AdminDataTable';
import { CardListItem } from '../../../types/card.types';
import { maskCardNumber } from '../../../utils/format';
import { formatCardProductLabel } from '../../../constants/cardCategories';

const SEARCH_DEBOUNCE_MS = 300;

function MaskedCardCell({ cardNumber, maskedCardNumber }: { cardNumber: string; maskedCardNumber?: string }) {
  const [copied, setCopied] = useState(false);
  const display = maskedCardNumber || maskCardNumber(cardNumber);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    toast.success('Đã sao chép số thẻ');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <span className="text-slate-800 font-medium">{display}</span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Sao chép số thẻ"
        title="Sao chép số thẻ"
        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {copied ? <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600" /> : <Copy aria-hidden="true" className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// Hàm chuyển đổi SortingState của bảng thành tham số API
const convertSortingToParams = (sorting: SortingState) => {
  const [first] = sorting;
  if (!first) return {};
  return {
    sortBy: first.id,
    sortOrder: first.desc ? ('desc' as const) : ('asc' as const),
  };
};

export default function CardsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isQuickOpenModalVisible, setIsQuickOpenModalVisible] = useState(false);
  
  // STATE QUẢN LÝ SẮP XẾP CỦA BẢNG
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // NỐI DỮ LIỆU SẮP XẾP VÀO HOOK GỌI API
  const sortParams = convertSortingToParams(sorting);
  const { data, isLoading, isFetching, isError, error, refetch } = useCards(
    search, 
    page, 
    pageSize,
    sortParams.sortBy,      // Truyền cột cần sort
    sortParams.sortOrder    // Truyền chiều sort (asc/desc)
  );

  const cards = data?.data ?? [];
  const meta = data?.meta;
  const isFirstLoad = isLoading && !data;
  const errorMessage = isError
    ? error instanceof ApiError
      ? error.message
      : 'Không thể tải danh sách thẻ.'
    : null;

  const allCards = cards.map((c) => ({
    cardNumber: c.cardNumber,
    productName: c.productName,
    cardName: c.cardName,
  }));

  const columns: ColumnDef<AppFeatures, CardListItem>[] = [
    {
      accessorKey: 'cardNumber',
      header: 'Số thẻ (PAN)',
      enableSorting: true,
      cell: ({ row }) => (
        <MaskedCardCell
          cardNumber={row.original.cardNumber}
          maskedCardNumber={row.original.maskedCardNumber}
        />
      ),
    },
    {
      accessorKey: 'cardName',
      header: 'Tên thẻ',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-800">{getValue<string>() || '---'}</span>
      ),
    },
    {
      id: 'embossedName',
      header: 'Chủ thẻ',
      enableSorting: false,
      cell: ({ row }) =>
        `${row.original.embossedFirstName} ${row.original.embossedLastName}`.trim() || '---',
    },
    {
      accessorKey: 'productName',
      header: 'Loại thẻ / Sản phẩm',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          {formatCardProductLabel(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: 'issuingContractNumber',
      header: 'HĐ phát hành',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-slate-600">{getValue<string>() || '---'}</span>
      ),
    },
    {
      accessorKey: 'expiryDate',
      header: 'Hết hạn',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-slate-600">{getValue<string>() ?? '12/28'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      enableSorting: false,
      cell: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Hoạt động
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelectedCard(row.original.cardNumber)}
          aria-label={`Xem chi tiết thẻ ${row.original.cardName || maskCardNumber(row.original.cardNumber)}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Eye aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
          <span>Chi tiết</span>
        </button>
      ),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-8">
      <div aria-live="polite" className="sr-only">
        {isLoading || isFetching 
          ? 'Đang tải dữ liệu thẻ...' 
          : `Đã tìm thấy ${meta?.total ?? cards.length} thẻ.`}
      </div>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Thẻ của tôi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý danh sách thẻ ghi nợ & thẻ tín dụng cá nhân
          </p>
        </div>

        <button
          onClick={() => setIsQuickOpenModalVisible(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          <span>Mở thẻ mới</span>
        </button>
      </header>

      <form 
        role="search" 
        aria-label="Tìm kiếm thẻ" 
        onSubmit={(e) => e.preventDefault()} 
        className="relative"
      >
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <label htmlFor="searchInput" className="sr-only">Nhập từ khóa tìm kiếm thẻ</label>
        <input
          id="searchInput"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo số thẻ, tên thẻ hoặc tên chủ thẻ..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/50 shadow-xs"
        />
        {isFetching && !isFirstLoad && (
          <Loader2 aria-hidden="true" className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </form>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" /> {errorMessage}
        </div>
      )}

      {isFirstLoad ? (
        <div aria-busy="true" className="flex items-center justify-center py-24">
          <Loader2 aria-hidden="true" className="h-9 w-9 animate-spin text-emerald-600" />
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 sm:p-16 text-center shadow-xs">
          <div aria-hidden="true" className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <CreditCard aria-hidden="true" className="h-8 w-8" />
          </div>
          <p className="text-base font-semibold text-slate-700 mb-1">
            {search ? `Không tìm thấy thẻ nào khớp với "${search}".` : 'Bạn chưa có thẻ nào.'}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6">
            {!search && 'Khám phá ngay các dòng thẻ thanh toán số với nhiều ưu đãi hoàn tiền và bảo mật cao cấp.'}
          </p>
          {!search && (
            <button
              onClick={() => setIsQuickOpenModalVisible(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-700 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Plus aria-hidden="true" className="h-4 w-4" /> Mở thẻ ngay
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          <section aria-label="Thẻ ảo trực quan" className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <LayoutGrid aria-hidden="true" className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Thẻ ảo trực quan</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 pt-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
              {cards.map((card) => (
                <button
                  key={card.cardNumber}
                  onClick={() => setSelectedCard(card.cardNumber)}
                  aria-label={`Xem chi tiết thẻ ${card.cardName || maskCardNumber(card.cardNumber)}`}
                  className="flex-none w-[85vw] sm:w-[320px] snap-center sm:snap-start text-left transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl sm:rounded-3xl"
                >
                  <VirtualCardVisual card={card} />
                </button>
              ))}
            </div>
          </section>

          <section aria-label="Bảng quản lý thẻ" className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <TableProperties aria-hidden="true" className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-bold">Danh sách thẻ chi tiết</h2>
                  <p className="text-xs text-slate-500">
                    Bảng quản lý thông tin các thẻ thanh toán thuộc tài khoản của bạn
                  </p>
                </div>
              </div>
            </div>

            <div aria-busy={isLoading || isFetching}>
              <AdminDataTable
                columns={columns}
                data={cards}
                page={meta?.page ?? page}
                totalPages={meta?.totalPages ?? 1}
                total={meta?.total ?? cards.length}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                isLoading={isLoading}
                isFetching={isFetching}
                emptyMessage="Không tìm thấy thẻ nào."
                showColumnFilters={false}
                
                // 2 DÒNG QUAN TRỌNG ĐỂ KÍCH HOẠT A11Y SORTING
                sorting={sorting}
                onSortingChange={setSorting}
              />
            </div>
          </section>
        </div>
      )}

      {isQuickOpenModalVisible && (
        <QuickOpenCardModal
          existingCards={allCards}
          onClose={() => setIsQuickOpenModalVisible(false)}
          onSuccess={async (cardPan) => {
            setIsQuickOpenModalVisible(false);
            await refetch?.();
            setSelectedCard(cardPan);
          }}
        />
      )}

      {selectedCard && (
        <CardDetailModal cardNumber={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </main>
  );
}