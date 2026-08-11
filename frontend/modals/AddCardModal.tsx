'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CreditCard, Loader2, AlertCircle, Wallet, CheckCircle2 } from 'lucide-react';
import { ApiError } from '../api/api';
import { contractService } from '../services/contract.service'; // <-- Import service vào đây
import { ModalShell } from '../components/ModalShell';
import { ModalField } from '../components/ModalField';

export function AddCardModal({
  issuingContractNumber,
  onClose,
  onSuccess,
}: {
  issuingContractNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [embossedFirstName, setEmbossedFirstName] = useState('');
  const [embossedLastName, setEmbossedLastName] = useState('');
  const [embossedCompanyName, setEmbossedCompanyName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const canSubmit = embossedFirstName.trim() !== '' && embossedLastName.trim() !== '';

  const mutation = useMutation({
    // Sử dụng contractService thay vì gọi trực tiếp apiPost và giấu đi URL phức tạp
    mutationFn: (payload: Record<string, string>) =>
      contractService.createCard(issuingContractNumber, payload),
    // Lưu ý: Không gọi onSuccess ở đây vì ta muốn màn hình nán lại để người dùng xem số thẻ.
  });

  const handleSubmit = () => {
    if (!canSubmit) {
      setValidationError('Vui lòng điền đầy đủ Tên và Họ khắc nổi trên thẻ.');
      return;
    }
    setValidationError(null);
    mutation.mutate({ embossedFirstName, embossedLastName, embossedCompanyName });
  };

  // Nếu API trả về data (thành công), hiển thị giao diện chúc mừng.
  if (mutation.data) {
    return (
      <ModalShell title="Mở thẻ thành công" icon={<CheckCircle2 className="h-4 w-4" />} onClose={onSuccess}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="text-sm text-slate-500">{mutation.data.message}</p>
          <div className="w-full rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-xs text-slate-400">Số thẻ (PAN)</p>
            <p className="break-all text-sm font-semibold text-emerald-700">{mutation.data.cardPan}</p>
            <p className="mt-2 text-xs text-slate-400">Ngày hết hạn</p>
            <p className="text-sm font-medium text-slate-900">{mutation.data.expiryDate}</p>
          </div>
        </div>
        <button
          onClick={onSuccess} // Bấm Đóng lúc này mới thực sự chốt luồng thành công
          className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Đóng
        </button>
      </ModalShell>
    );
  }

  const displayError = validationError || (mutation.error ? (mutation.error instanceof ApiError ? mutation.error.message : 'Không thể mở thẻ. Vui lòng thử lại.') : null);

  return (
    <ModalShell title="Mở thẻ mới" icon={<CreditCard className="h-4 w-4" />} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">
        Liên kết với hợp đồng phát hành <span className="font-medium text-slate-700">{issuingContractNumber}</span>.
      </p>
      
      {displayError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Tên khắc nổi (First name)" value={embossedFirstName} onChange={setEmbossedFirstName} placeholder="VD: VAN A" />
          <ModalField label="Họ khắc nổi (Last name)" value={embossedLastName} onChange={setEmbossedLastName} placeholder="VD: NGUYEN" />
        </div>
        <ModalField
          label="Tên công ty (nếu là thẻ doanh nghiệp)"
          value={embossedCompanyName}
          onChange={setEmbossedCompanyName}
          placeholder="Bỏ trống nếu là thẻ cá nhân"
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
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Mở thẻ ngay
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
