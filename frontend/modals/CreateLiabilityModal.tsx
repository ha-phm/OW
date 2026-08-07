'use client';

import { useState } from 'react';
import { Landmark, Loader2, AlertCircle, Plus } from 'lucide-react';
import { apiPost, ApiError } from '../api/api';
import { ContractResponse } from '../types/contract.types';
import { ModalShell } from './ModalShell';
import { ModalField } from './ModalField';

// POST /contracts { cbsNumber?, institutionCode?, branch? }
export function CreateLiabilityModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [cbsNumber, setCbsNumber] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [branch, setBranch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiPost<ContractResponse, Record<string, string>>('/contracts', {
        cbsNumber,
        institutionCode,
        branch,
      });
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể mở hợp đồng hạn mức. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Mở hợp đồng hạn mức" icon={<Landmark className="h-4 w-4" />} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500">
        Đây là hợp đồng hạn mức gốc — cần có trước khi thêm hợp đồng phát hành và mở thẻ.
      </p>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
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
          Mở hợp đồng
        </button>
      </div>
    </ModalShell>
  );
}
