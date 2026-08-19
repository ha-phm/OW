'use client';

import { useState } from 'react';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { ModalShell } from '../components/ModalShell';
import { ModalField } from '../components/ModalField';
import { quickOpenCard, QuickOpenCardPayload } from '../api/contracts';
import { ApiError } from '../api/api';
import { CardCategory } from '../constants/cardCategories';

export function QuickOpenCardModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (cardPan: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [cardCategory, setCardCategory] = useState<CardCategory>(CardCategory.TRAVEL);
  const [embossedFirstName, setEmbossedFirstName] = useState('');
  const [embossedLastName, setEmbossedLastName] = useState('');
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [paymentOption, setPaymentOption] = useState('FULL_PAYMENT');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!embossedFirstName || !embossedLastName || !bank || !account) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload: QuickOpenCardPayload = {
        cardCategory,
        embossedFirstName,
        embossedLastName,
        bank,
        account,
        paymentOption,
      };
      
      const result = await quickOpenCard(payload);
      onSuccess(result.cardPan);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi hệ thống. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Mở thẻ thông minh" icon={<CreditCard className="h-4 w-4" />} onClose={onClose}>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">1. Chọn loại thẻ bạn muốn mở</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: CardCategory.TRAVEL, label: 'Du lịch', color: 'bg-blue-500' },
              { id: CardCategory.ECOMMERCE, label: 'Thương mại điện tử', color: 'bg-orange-500' },
              { id: CardCategory.VISA, label: 'Thẻ Visa', color: 'bg-emerald-500' },
              { id: CardCategory.CREDIT, label: 'Thẻ Credit', color: 'bg-purple-500' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCardCategory(cat.id)}
                className={`flex flex-col items-start gap-2 rounded-xl border p-4 transition-all ${
                  cardCategory === cat.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className={`h-8 w-12 rounded-md ${cat.color} opacity-80`} />
                <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Tiếp tục
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">2. Thông tin in nổi & Thanh toán</p>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Tên (First Name)" value={embossedFirstName} onChange={setEmbossedFirstName} />
            <ModalField label="Họ (Last Name)" value={embossedLastName} onChange={setEmbossedLastName} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Ngân hàng thanh toán" value={bank} onChange={setBank} placeholder="VD: VCB" />
            <ModalField label="Số tài khoản" value={account} onChange={setAccount} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Xác nhận mở thẻ
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}