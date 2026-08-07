'use client';

import { useState } from 'react';
import { FileText, Loader2, AlertCircle, Plus } from 'lucide-react';
import { apiPost, ApiError } from '../api/api';
import { ContractResponse } from '../types/contract.types';
import { ModalShell } from './ModalShell';
import { ModalField } from './ModalField';

// POST /contracts/:liabilityContractNumber/issuing
export function AddIssuingModal({
  liabilityContractNumber,
  onClose,
  onSuccess,
}: {
  liabilityContractNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paymentOption, setPaymentOption] = useState('');
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accName, setAccName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = paymentOption.trim() !== '' && bank.trim() !== '' && account.trim() !== '';

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Vui lòng điền Hình thức thanh toán, Ngân hàng và Số tài khoản.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await apiPost<ContractResponse, Record<string, string>>(
        `/contracts/${liabilityContractNumber}/issuing`,
        { paymentOption, bank, account, bankCode, accName },
      );
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể thêm hợp đồng phát hành. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Thêm hợp đồng phát hành" icon={<FileText className="h-4 w-4" />} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">
        Liên kết với hạn mức <span className="font-medium text-slate-700">{liabilityContractNumber}</span>.
      </p>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-3">
        <ModalField label="Hình thức thanh toán" value={paymentOption} onChange={setPaymentOption} placeholder="VD: FULL_PAYMENT" />
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Ngân hàng" value={bank} onChange={setBank} placeholder="VD: Vietcombank" />
          <ModalField label="Mã ngân hàng" value={bankCode} onChange={setBankCode} placeholder="VD: VCB" optional />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Số tài khoản" value={account} onChange={setAccount} placeholder="VD: 0123456789" />
          <ModalField label="Tên chủ tài khoản" value={accName} onChange={setAccName} placeholder="VD: NGUYEN VAN A" optional />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Thêm hợp đồng
        </button>
      </div>
    </ModalShell>
  );
}
