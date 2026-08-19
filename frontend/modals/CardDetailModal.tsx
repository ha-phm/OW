'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, AlertCircle, Pencil, Save, X } from 'lucide-react';
import { ApiError } from '../api/api';
import { cardService } from '../services/card.service';
import { useCardDetail } from '../hooks/useCardDetail';
import { CARDS_QUERY_KEY } from '../hooks/useCards';
import { ModalShell } from '../components/ModalShell';
import { ModalField } from '../components/ModalField';
import { VirtualCardVisual } from '../components/VirtualCardVisual';
import { formatVnd } from '../utils/format';

export function CardDetailModal({
  cardNumber,
  onClose,
}: {
  cardNumber: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useCardDetail(cardNumber);
  const [isEditing, setIsEditing] = useState(false);

  const [cardName, setCardName] = useState('');
  const [embossedFirstName, setEmbossedFirstName] = useState('');
  const [embossedLastName, setEmbossedLastName] = useState('');
  const [embossedCompanyName, setEmbossedCompanyName] = useState('');

  const startEditing = () => {
    if (!data) return;
    setCardName(data.cardName);
    setEmbossedFirstName(data.embossedFirstName);
    setEmbossedLastName(data.embossedLastName);
    setEmbossedCompanyName(data.embossedCompanyName ?? '');
    setIsEditing(true);
  };

  const mutation = useMutation({
    mutationFn: () =>
      cardService.edit(cardNumber, {
        cardName,
        embossedFirstName,
        embossedLastName,
        embossedCompanyName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARDS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['cardDetail', cardNumber] });
      setIsEditing(false);
    },
  });

  const errorMessage = isError
    ? error instanceof ApiError
      ? error.message
      : 'Không thể tải chi tiết thẻ.'
    : null;
    
  const mutationError = mutation.error
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : 'Không thể cập nhật thẻ. Vui lòng thử lại.'
    : null;

  return (
    <ModalShell
      title={isEditing ? 'Sửa thông tin thẻ' : 'Chi tiết thẻ'}
      icon={<CreditCard className="h-4 w-4" />}
      onClose={onClose}
    >
      {isLoading && !data ? (
        // Khung xương (Skeleton) mượt mà chống giật Layout
        <div className="space-y-5 animate-pulse">
          <div className="flex aspect-[1.586/1] w-full max-w-sm items-center justify-center rounded-2xl bg-slate-100">
             <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
          <div className="h-32 rounded-xl bg-slate-100"></div>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
        </div>
      ) : data ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="flex justify-center">
            <VirtualCardVisual card={data} revealFull />
          </div>

          {isEditing ? (
            <>
              {mutationError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {mutationError}
                </div>
              )}
              <div className="space-y-3">
                <ModalField label="Tên gợi nhớ thẻ (Tùy chọn)" value={cardName} onChange={setCardName} optional />
                <div className="grid grid-cols-2 gap-3">
                  <ModalField
                    label="Tên khắc nổi"
                    value={embossedFirstName}
                    onChange={setEmbossedFirstName}
                  />
                  <ModalField
                    label="Họ khắc nổi"
                    value={embossedLastName}
                    onChange={setEmbossedLastName}
                  />
                </div>
                <ModalField
                  label="Tên công ty"
                  value={embossedCompanyName}
                  onChange={setEmbossedCompanyName}
                  optional
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={mutation.isPending}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <X className="mr-1 inline h-3.5 w-3.5" /> Hủy
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-3 border border-slate-100">
                <DetailRow label="Sản phẩm" value={data.productName} />
                <DetailRow
                  label="Hạn mức"
                  value={data.creditLimit != null ? formatVnd(data.creditLimit) : undefined}
                />
                <DetailRow
                  label="Khả dụng"
                  value={data.available != null ? formatVnd(data.available) : undefined}
                />
                <DetailRow
                  label="Nợ đến hạn"
                  value={data.totalDue != null ? formatVnd(data.totalDue) : undefined}
                />
                <DetailRow
                  label="Nợ quá hạn"
                  value={data.pastDue != null ? formatVnd(data.pastDue) : undefined}
                />
                <DetailRow label="Ngày mở" value={data.openDate} />
                <DetailRow label="Chi nhánh" value={data.branch} />
                <DetailRow label="Chủ thẻ" value={data.clientFullName} />
                <DetailRow label="Hợp đồng phát hành" value={data.issuingContractNumber} />
              </div>

              <button
                onClick={startEditing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100/50"
              >
                <Pencil className="h-4 w-4" />
                Sửa thông tin thẻ
              </button>
            </>
          )}
        </div>
      ) : null}
    </ModalShell>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="block text-slate-400 mb-0.5">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}