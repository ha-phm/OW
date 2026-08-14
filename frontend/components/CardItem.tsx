'use client';

import { useState } from 'react';
import { CreditCard, ChevronDown, ChevronRight } from 'lucide-react';
import { ContractTreeCard } from '../types/contract.types';
import { StatusBadge } from './StatusBadge';
import { ContractDetailPanel } from './ContractDetailPanel';

export function CardItem({ card }: { card: ContractTreeCard }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-700">{card.contractNumber}</p>
          <StatusBadge status={card.status} small />
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        )}
      </button>
      
      {expanded && (
        <div className="mt-2">
          <ContractDetailPanel contractNumber={card.contractNumber} />
        </div>
      )}
    </div>
  );
}
