'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useContractsTree } from '../hooks/useContractsTree';
import { AddCardModal } from '../modals/AddCardModal';
import { CARDS_QUERY_KEY } from '../hooks/useCards';

export function QuickAddCardButton() {
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [issuingFor, setIssuingFor] = useState<string | null>(null);
  const { data } = useContractsTree('', 1);

  // Gom tất cả hợp đồng phát hành từ mọi hạn mức để chọn nơi mở thẻ mới
  const issuingOptions = (data?.data ?? []).flatMap((liability) =>
    liability.issuings.map((issuing) => ({
      value: issuing.contractNumber,
      label: issuing.contractName,
      cardCount: issuing.cards.length,
    })),
  );

  const closeAll = () => {
    setIssuingFor(null);
    setShowPicker(false);
  };

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark"
      >
        <Plus className="h-3.5 w-3.5" />
        Tạo thẻ
      </button>

      {showPicker && !issuingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Chọn hợp đồng phát hành</h3>
              <button onClick={closeAll} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {issuingOptions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Bạn chưa có hợp đồng phát hành nào. Vào mục <span className="font-medium text-brand">Hợp đồng</span> để mở trước.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {issuingOptions.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => setIssuingFor(opt.value)}
                      disabled={opt.cardCount >= 4}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm transition hover:border-brand hover:bg-brand-mint disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="font-medium text-ink">{opt.label}</span>
                      <span className="text-xs text-slate-400">{opt.cardCount}/4 thẻ</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {issuingFor && (
        <AddCardModal
          issuingContractNumber={issuingFor}
          onClose={closeAll}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [CARDS_QUERY_KEY] });
            closeAll();
          }}
        />
      )}
    </>
  );
}