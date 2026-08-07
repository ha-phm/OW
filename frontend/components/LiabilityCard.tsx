'use client';

import { useState } from 'react';
import { Landmark, FileText, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { ContractTreeLiability, ContractDetail } from '../types/contract.types';
import { StatusBadge } from './StatusBadge';
import { ContractDetailPanel } from './ContractDetailPanel';
import { IssuingRow } from './IssuingRow';

export function LiabilityCard({
  liability,
  onAddIssuing,
  onAddCard,
}: {
  liability: ContractTreeLiability;
  onAddIssuing: () => void;
  onAddCard: (issuingContractNumber: string) => void;
}) {
  const [childrenExpanded, setChildrenExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(false);
  // Cache chi tiết hợp đồng theo contractNumber, dùng chung cho Liability/Issuing/Card
  // để mở ra rồi đóng lại không phải gọi API lần nữa.
  const [detailCache, setDetailCache] = useState<Record<string, ContractDetail>>({});

  const handleDetailLoaded = (contractNumber: string, detail: ContractDetail) => {
    setDetailCache((prev) => ({ ...prev, [contractNumber]: detail }));
  };

  const hasIssuing = liability.issuings.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header Liability */}
      <div className="flex w-full items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
        <button
          onClick={() => setChildrenExpanded((v) => !v)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{liability.contractName}</h3>
              <StatusBadge status={liability.status} />
            </div>
            <p className="text-sm text-slate-500">{liability.contractNumber}</p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDetailExpanded((v) => !v)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
          >
            {detailExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
          <button onClick={() => setChildrenExpanded((v) => !v)}>
            {childrenExpanded ? (
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {detailExpanded && (
        <div className="border-b border-slate-100 px-6 py-4">
          <ContractDetailPanel
            contractNumber={liability.contractNumber}
            cachedDetail={detailCache[liability.contractNumber]}
            onLoaded={(d) => handleDetailLoaded(liability.contractNumber, d)}
          />
        </div>
      )}

      {childrenExpanded && (
        <div className="p-6">
          {!hasIssuing ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">Chưa có hợp đồng phát hành nào.</p>
              <button
                onClick={onAddIssuing}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Thêm hợp đồng phát hành
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 border-l-2 border-emerald-100 pl-6">
                {liability.issuings.map((issuing) => (
                  <IssuingRow
                    key={issuing.contractNumber}
                    issuing={issuing}
                    onAddCard={() => onAddCard(issuing.contractNumber)}
                    detailCache={detailCache}
                    onDetailLoaded={handleDetailLoaded}
                  />
                ))}
              </div>
              {/* NOTE: nút này trước đây bị thiếu — khi đã có >=1 issuing thì
                  không còn cách nào để thêm issuing thứ 2 từ UI. Thêm lại ở đây. */}
              <button
                onClick={onAddIssuing}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" />
                Thêm hợp đồng phát hành khác
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
