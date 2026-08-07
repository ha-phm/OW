'use client';
import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Plus, Search } from 'lucide-react';
import { apiGet, ApiError } from '../../../api/api';
import { PaginatedContractTree } from '../../../types/contract.types';
import { LiabilityCard } from '../../../components/LiabilityCard';
import { EmptyLiabilityState } from '../../../components/EmptyLiabilityState';
import { CreateLiabilityModal } from '../../../modals/CreateLiabilityModal';
import { AddIssuingModal } from '../../../modals/AddIssuingModal';
import { AddCardModal } from '../../../modals/AddCardModal';

const PAGE_SIZE = 1;
const SEARCH_DEBOUNCE_MS = 300;

const CONTRACTS_QUERY_KEY = 'contracts-tree';

async function fetchContractTree(
  search: string,
  page: number,
): Promise<PaginatedContractTree> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  if (search.trim()) params.set('search', search.trim());

  return apiGet<PaginatedContractTree>(`/contracts/me?${params.toString()}`);
}

export default function ContractsPage() {
  const queryClient = useQueryClient();

  const [openLiabilityModal, setOpenLiabilityModal] = useState(false);
  const [issuingModalFor, setIssuingModalFor] = useState<string | null>(null);
  const [cardModalFor, setCardModalFor] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(''); // giá trị gõ trực tiếp trong ô input
  const [search, setSearch] = useState(''); // giá trị đã debounce, thực sự dùng để query
  const [page, setPage] = useState(1);

  // Debounce: chỉ bắn request sau khi user ngừng gõ 300ms, tránh gọi API
  // mỗi lần bấm phím.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Về trang 1 mỗi khi search (đã debounce) thay đổi
  useEffect(() => {
    setPage(1);
  }, [search]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: [CONTRACTS_QUERY_KEY, search, page],
    queryFn: () => fetchContractTree(search, page),
    placeholderData: keepPreviousData, // giữ dữ liệu trang cũ khi đang tải trang mới, tránh nháy loading
  });

  const refetchTree = () =>
    queryClient.invalidateQueries({ queryKey: [CONTRACTS_QUERY_KEY] });

  const tree = data?.data ?? [];
  const meta = data?.meta;
  const hasAnyResult = tree.length > 0;
  const isFirstLoad = isLoading && !data;
  const errorMessage = isError
    ? error instanceof ApiError
      ? error.message
      : 'Không thể tải dữ liệu hợp đồng.'
    : null;

  // "Chưa có hợp đồng nào" (lần đầu, không search) khác với "không tìm thấy
  // kết quả khớp search" — 2 trạng thái này cần UI khác nhau.
  const isTrulyEmpty = !isFirstLoad && !hasAnyResult && !search;
  const isEmptySearchResult = !isFirstLoad && !hasAnyResult && !!search;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hợp đồng</h2>
        </div>
        <button
          onClick={() => setOpenLiabilityModal(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Mở hợp đồng mới
        </button>
      </div>

      {!isTrulyEmpty && (
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo số hợp đồng hoặc tên..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          {isFetching && !isFirstLoad && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-300" />
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {isFirstLoad ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : isTrulyEmpty ? (
        <EmptyLiabilityState onCreate={() => setOpenLiabilityModal(true)} />
      ) : isEmptySearchResult ? (
        <p className="py-12 text-center text-sm text-slate-400">
          Không tìm thấy hợp đồng nào khớp với &quot;{search}&quot;.
        </p>
      ) : (
        <>
          <div className="space-y-6">
            {tree.map((liability) => (
              <LiabilityCard
                key={liability.contractNumber}
                liability={liability}
                onAddIssuing={() => setIssuingModalFor(liability.contractNumber)}
                onAddCard={(issuingContractNumber) => setCardModalFor(issuingContractNumber)}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Trang {meta.page}/{meta.totalPages} - Tổng số: {meta.total} hợp đồng
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

      {openLiabilityModal && (
        <CreateLiabilityModal
          onClose={() => setOpenLiabilityModal(false)}
          onSuccess={() => {
            setOpenLiabilityModal(false);
            refetchTree();
          }}
        />
      )}
      {issuingModalFor && (
        <AddIssuingModal
          liabilityContractNumber={issuingModalFor}
          onClose={() => setIssuingModalFor(null)}
          onSuccess={() => {
            setIssuingModalFor(null);
            refetchTree();
          }}
        />
      )}
      {cardModalFor && (
        <AddCardModal
          issuingContractNumber={cardModalFor}
          onClose={() => setCardModalFor(null)}
          onSuccess={() => {
            setCardModalFor(null);
            refetchTree();
          }}
        />
      )}
    </div>
  );
}