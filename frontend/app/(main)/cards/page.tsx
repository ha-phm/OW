'use client';

import { useEffect, useState, useCallback } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { useForm, useWatch } from 'react-hook-form';
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
  TableProperties,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

import { useCards } from '../../../hooks/useCards';
import { CardQueryParams } from '../../../services/card.service';
import { ApiError } from '../../../api/api';
import { VirtualCardVisual } from '../../../components/Card/VirtualCardVisual';
import { CardDetailModal } from '../../../modals/CardDetailModal';
import { QuickOpenCardModal } from '../../../modals/QuickOpenCardModal';
import { AdminDataTable, type AppFeatures } from '../../../components/AdminDataTable';
import { CardListItem } from '../../../types/card.types';
import { maskCardNumber } from '../../../utils/format';
import { formatCardProductLabel } from '../../../constants/cardCategories';
import { CustomSelect } from '../../../components/CustomSelect';

const SEARCH_DEBOUNCE_MS = 300;

// ĐỊNH NGHĨA CÁC TRƯỜNG LỌC CHO KHÁCH HÀNG
type FilterField = 'search' | 'cardNumber' | 'cardName' | 'productName';

const FILTER_FIELD_OPTIONS = [
  { value: 'search', label: 'Tìm kiếm chung' },
  { value: 'cardNumber', label: 'Số thẻ' },
  { value: 'cardName', label: 'Tên thẻ' },
  { value: 'productName', label: 'Loại thẻ' },
];

const PRODUCT_OPTIONS = [
  { value: '', label: 'Tất cả loại thẻ' },
  { value: '001-Training Card Product 01', label: 'TRAVEL' },
  { value: '001-Training Card Product 02', label: 'ECOMMERCE' },
  { value: '001-Training Card Product 03', label: 'VISA' },
  { value: '001-Training Card Product 04', label: 'CREDIT' },
];

interface FilterFormValues {
  filterField: FilterField;
  inputValue: string;
}

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

const convertSortingToParams = (sorting: SortingState) => {
  const [first] = sorting;
  if (!first) return {};
  return {
    sortBy: first.id,
    sortOrder: first.desc ? ('desc' as const) : ('asc' as const),
  };
};

export default function CardsPage() {
  const [apiParams, setApiParams] = useState<CardQueryParams>({
    page: 1,
    pageSize: 10,
  });

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isQuickOpenModalVisible, setIsQuickOpenModalVisible] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { register, control, setValue } = useForm<FilterFormValues>({
    defaultValues: { filterField: 'search', inputValue: '' }
  });

  const filterField = useWatch({ control, name: 'filterField' });
  const inputValue = useWatch({ control, name: 'inputValue' });

  const getStoreValue = useCallback((field: FilterField) => {
    return (apiParams[field as keyof CardQueryParams] as string) || '';
  }, [apiParams]);

  // Bỏ qua update Input text nếu đang chọn Dropdown (productName)
  useEffect(() => {
    if (filterField !== 'productName') {
      setValue('inputValue', getStoreValue(filterField));
    }
  }, [filterField, getStoreValue, setValue]);

  // DEBOUNCE TÌM KIẾM CHO CÁC TRƯỜNG TEXT
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filterField !== 'productName') {
        const currentValueInStore = getStoreValue(filterField);
        
        if (inputValue !== currentValueInStore) {
          setApiParams(prev => {
            const next: CardQueryParams = { ...prev, page: 1 };
            
            // Xóa các trường lọc cũ để tránh đụng độ
            delete next.search;
            delete next.cardNumber;
            delete next.cardName;
            delete next.productName; // Reset luôn filter dropdown nếu có

            // Gán trường text mới
            if (inputValue.trim() !== '') {
              if (filterField === 'search') next.search = inputValue;
              if (filterField === 'cardNumber') next.cardNumber = inputValue;
              if (filterField === 'cardName') next.cardName = inputValue;
            }
            return next;
          });
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, filterField, getStoreValue]);

  // GỌI API BẰNG OBJECT PARAMS
  const { data, isLoading, isFetching, isError, error, refetch } = useCards(apiParams);

  const cards = data?.data ?? [];
  const meta = data?.meta;
  const isFirstLoad = isLoading && !data;
  const errorMessage = isError
    ? error instanceof ApiError ? error.message : 'Không thể tải danh sách thẻ.'
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
      header: 'Loại thẻ',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          {formatCardProductLabel(getValue<string>())}
        </span>
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

      {/* FORM LỌC ĐÃ ĐƯỢC BỔ SUNG LOGIC HIỂN THỊ DROPDOWN TÙY BIẾN */}
      <form 
        role="search" 
        aria-label="Tìm kiếm và lọc thẻ" 
        onSubmit={(e) => e.preventDefault()} 
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100"
      >
        <CustomSelect
          value={filterField}
          onChange={(val) => setValue('filterField', val as FilterField)}
          options={FILTER_FIELD_OPTIONS}
          icon={<Filter className="h-4 w-4" />}
          ariaLabel="Chọn trường cần lọc"
        />

        {/* NẾU CHỌN LỌC THEO LOẠI THẺ THÌ HIỂN THỊ DROPDOWN THỨ 2 */}
        {filterField === 'productName' ? (
          <CustomSelect
            value={apiParams.productName || ''}
            onChange={(val) => {
              setApiParams(prev => {
                const next: CardQueryParams = { ...prev, page: 1 };
                delete next.search;
                delete next.cardNumber;
                delete next.cardName;
                
                if (val) next.productName = val;
                else delete next.productName;
                
                return next;
              });
            }}
            options={PRODUCT_OPTIONS}
            ariaLabel="Lọc theo loại thẻ"
          />
        ) : (
          /* NẾU KHÔNG THÌ HIỂN THỊ Ô INPUT NHẬP TEXT BÌNH THƯỜNG */
          <div className="relative flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <label htmlFor="searchInput" className="sr-only">Nhập thông tin tìm kiếm</label>
            <input
              id="searchInput"
              {...register('inputValue')}
              placeholder={
                filterField === 'search' ? 'Nhập từ khóa chung...' :
                filterField === 'cardNumber' ? 'Nhập số thẻ...' : 'Nhập tên thẻ...'
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
            />
            {isFetching && !isFirstLoad && (
              <Loader2 aria-hidden="true" className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
            )}
          </div>
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
            Không tìm thấy dữ liệu phù hợp.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6">
            Hãy thử điều chỉnh lại bộ lọc hoặc mở một thẻ thanh toán mới.
          </p>
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
                page={meta?.page ?? apiParams.page}
                totalPages={meta?.totalPages ?? 1}
                total={meta?.total ?? cards.length}
                pageSize={apiParams.pageSize}
                onPageChange={(p) => setApiParams(prev => ({ ...prev, page: p }))}
                onPageSizeChange={(size) => setApiParams(prev => ({ ...prev, pageSize: size, page: 1 }))}
                isLoading={isLoading}
                isFetching={isFetching}
                emptyMessage="Không tìm thấy thẻ nào."
                showColumnFilters={false}
                sorting={sorting}
                
                onSortingChange={(nextSorting: SortingState) => {
                  setSorting(nextSorting);
                  const sortConf = convertSortingToParams(nextSorting);
                  setApiParams(prev => ({ ...prev, ...sortConf }));
                }}
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