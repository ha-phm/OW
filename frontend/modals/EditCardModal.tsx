'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, AlertCircle, Save } from 'lucide-react';
import { ApiError } from '../api/api';
import { cardService } from '../services/card.service';
import { CARDS_QUERY_KEY } from '../hooks/useCards';
import { CardListItem } from '../types/card.types';
import { ModalShell } from '../components/ModalShell';
import { ModalField } from '../components/ModalField';

export function EditCardModal({
  card,
  onClose,
  onSuccess,
}: {
  card: CardListItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [cardName, setCardName] = useState(card.cardName);
  const [embossedFirstName, setEmbossedFirstName] = useState(card.embossedFirstName);
  const [embossedLastName, setEmbossedLastName] = useState(card.embossedLastName);
  const [embossedCompanyName, setEmbossedCompanyName] = useState(card.embossedCompanyName ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      cardService.edit(card.cardNumber, {
        cardName,
        embossedFirstName,
        embossedLastName,
        embossedCompanyName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARDS_QUERY_KEY] });
      onSuccess();
    },
  });

  const displayError = mutation.error
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : 'Không thể cập nhật thẻ. Vui lòng thử lại.'
    : null;

  return (
    <ModalShell title="Sửa thông tin thẻ" icon={<CreditCard className="h-4 w-4" />} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">
        Số thẻ <span className="font-medium text-slate-700">•••• {card.cardNumber.slice(-4)}</span>
      </p>

      {displayError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {displayError}
        </div>
      )}

      <div className="space-y-3">
        <ModalField label="Tên gợi nhớ thẻ" value={cardName} onChange={setCardName} optional />
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Tên khắc nổi" value={embossedFirstName} onChange={setEmbossedFirstName} />
          <ModalField label="Họ khắc nổi" value={embossedLastName} onChange={setEmbossedLastName} />
        </div>
        <ModalField
          label="Tên công ty"
          value={embossedCompanyName}
          onChange={setEmbossedCompanyName}
          optional
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          disabled={mutation.isPending}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu thay đổi
        </button>
      </div>
    </ModalShell>
  );
}