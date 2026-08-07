'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { apiGet, ApiError } from '../../../lib/api';
import { ContractTreeLiability } from '../../../types/contract.types';
import { LiabilityCard } from '../../../components/LiabilityCard';
import { EmptyLiabilityState } from '../../../components/EmptyLiabilityState';
import { CreateLiabilityModal } from '../../../modals/CreateLiabilityModal';
import { AddIssuingModal } from '../../../modals/AddIssuingModal';
import { AddCardModal } from '../../../modals/AddCardModal';

export default function ContractsPage() {
  const [tree, setTree] = useState<ContractTreeLiability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openLiabilityModal, setOpenLiabilityModal] = useState(false);
  const [issuingModalFor, setIssuingModalFor] = useState<string | null>(null); // liabilityContractNumber
  const [cardModalFor, setCardModalFor] = useState<string | null>(null); // issuingContractNumber

  const fetchTree = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiGet<ContractTreeLiability[]>('/contracts/me');
      setTree(data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể tải dữ liệu hợp đồng.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const hasLiability = tree.length > 0;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hợp đồng</h2>
          <p className="mt-1 text-slate-500">
            Hạn mức, hợp đồng phát hành và thẻ của bạn — theo đúng cấu trúc liên kết trên WAY4.
          </p>
        </div>
        {/* Nút tạo NHÁNH MỚI: 1 user giờ có thể mở nhiều Liability, mỗi Liability là
            gốc của 1 cây Liability -> Issuing -> Card độc lập. Đặt ở đầu trang, luôn
            hiển thị, không phụ thuộc vào việc đã có liability nào hay chưa. */}
        <button
          onClick={() => setOpenLiabilityModal(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Mở hợp đồng hạn mức mới
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : !hasLiability ? (
        <EmptyLiabilityState onCreate={() => setOpenLiabilityModal(true)} />
      ) : (
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
      )}

      {openLiabilityModal && (
        <CreateLiabilityModal
          onClose={() => setOpenLiabilityModal(false)}
          onSuccess={() => {
            setOpenLiabilityModal(false);
            fetchTree();
          }}
        />
      )}

      {issuingModalFor && (
        <AddIssuingModal
          liabilityContractNumber={issuingModalFor}
          onClose={() => setIssuingModalFor(null)}
          onSuccess={() => {
            setIssuingModalFor(null);
            fetchTree();
          }}
        />
      )}

      {cardModalFor && (
        <AddCardModal
          issuingContractNumber={cardModalFor}
          onClose={() => setCardModalFor(null)}
          onSuccess={() => {
            setCardModalFor(null);
            fetchTree();
          }}
        />
      )}
    </div>
  );
}