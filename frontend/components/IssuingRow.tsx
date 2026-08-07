'use client';

import { useState } from 'react';
import { FileText, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { ContractTreeIssuing, ContractDetail, MAX_CARDS_PER_ISSUING } from '../types/contract.types';
import { StatusBadge } from './StatusBadge';
import { ContractDetailPanel } from './ContractDetailPanel';
import { CardItem } from './CardItem';
import { formatVnd } from '../utils/format';

export function IssuingRow({
  issuing,
  onAddCard,
  detailCache,
  onDetailLoaded,
}: {
  issuing: ContractTreeIssuing;
  onAddCard: () => void;
  detailCache: Record<string, ContractDetail>;
  onDetailLoaded: (contractNumber: string, detail: ContractDetail) => void;
}) {
  const [detailExpanded, setDetailExpanded] = useState(false);
  const cardCount = issuing.cards.length;
  const isFull = cardCount >= MAX_CARDS_PER_ISSUING;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <button
        onClick={() => setDetailExpanded((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">{issuing.contractName}</h4>
              <StatusBadge status={issuing.status} />
            </div>
            <p className="text-xs text-slate-500">{issuing.contractNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs">
            <div>
              <span className="block text-slate-400">Hạn mức</span>
              <span className="font-medium text-slate-700">{formatVnd(issuing.creditLimit)}</span>
            </div>
            <div>
              <span className="block text-slate-400">Dư nợ</span>
              <span className="font-medium text-slate-700">{formatVnd(issuing.balance)}</span>
            </div>
          </div>
          {detailExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          )}
        </div>
      </button>

      {detailExpanded && (
        <div className="mt-3">
          <ContractDetailPanel
            contractNumber={issuing.contractNumber}
            cachedDetail={detailCache[issuing.contractNumber]}
            onLoaded={(d) => onDetailLoaded(issuing.contractNumber, d)}
          />
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        {cardCount === 0 ? (
          <p className="mb-3 text-xs text-slate-400">Chưa có thẻ nào được mở.</p>
        ) : (
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {issuing.cards.map((card) => (
              <CardItem
                key={card.contractNumber}
                card={card}
                detail={detailCache[card.contractNumber]}
                onDetailLoaded={onDetailLoaded}
              />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {cardCount}/{MAX_CARDS_PER_ISSUING} thẻ
          </span>
          <button
            onClick={onAddCard}
            disabled={isFull}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <Plus className="h-3.5 w-3.5" />
            {isFull ? 'Đã đạt giới hạn thẻ' : 'Mở thẻ mới'}
          </button>
        </div>
      </div>
    </div>
  );
}
