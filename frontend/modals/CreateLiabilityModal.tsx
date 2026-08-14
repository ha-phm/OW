'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Landmark, Loader2, AlertCircle, Plus } from 'lucide-react';
import { ApiError } from '../api/api';
import { contractService } from '../services/contract.service'; 
import { ModalShell } from '../components/ModalShell';
import { ModalField } from '../components/ModalField';

export function CreateLiabilityModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (contractNumber: string) => void;
}) {
  
  const [cbsNumber, setCbsNumber] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [branch, setBranch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      contractService.createLiability(payload), 
    onSuccess: (data) => {
      if (data.contractNumber) onSuccess(data.contractNumber);
    },
  });

  const handleSubmit = () => {
    setValidationError(null);
    mutation.mutate({
      cbsNumber,
      institutionCode,
      branch,
    });
  };

  const displayError = validationError || (mutation.error ? (mutation.error instanceof ApiError ? mutation.error.message : 'Không thể mở hợp đồng hạn mức. Vui lòng thử lại.') : null);

  return (
    <ModalShell title="Mở hợp đồng hạn mức" icon={<Landmark className="h-4 w-4" />} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">
        Đây là hợp đồng hạn mức gốc — cần có trước khi thêm hợp đồng phát hành và mở thẻ.
      </p>

      {displayError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mb-4 text-xs font-medium text-emerald-600 hover:text-emerald-700"
      >
        {showAdvanced ? 'Ẩn tùy chọn nâng cao' : 'Hiện tùy chọn nâng cao (CBS, chi nhánh...)'}
      </button>

      {showAdvanced && (
        <div className="mb-4 space-y-3">
          <ModalField label="Số CBS" value={cbsNumber} onChange={setCbsNumber} placeholder="VD: 000123456" optional />
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Mã tổ chức" value={institutionCode} onChange={setInstitutionCode} placeholder="0001" optional />
            <ModalField label="Chi nhánh" value={branch} onChange={setBranch} placeholder="0101" optional />
          </div>
        </div>
      )}

      <div className="flex gap-3">
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
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Mở hợp đồng
        </button>
      </div>
    </ModalShell>
  );
}