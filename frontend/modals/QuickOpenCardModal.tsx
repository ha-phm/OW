'use client';

import { useState } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { ModalShell } from '../components/ModalShell';
import { ModalField } from '../components/ModalField';
import { quickOpenCard, createSupplementaryCard, QuickOpenCardPayload } from '../api/contracts';
import { ApiError } from '../api/api';
import { CardCategory } from '../constants/cardCategories';

export function QuickOpenCardModal({
  existingCards = [], // Nhận danh sách thẻ hiện có để làm nguồn mở thẻ phụ
  onClose,
  onSuccess,
}: {
  existingCards?: { cardNumber: string; productName?: string; cardName?: string }[];
  onClose: () => void;
  onSuccess: (cardPan: string) => void;
}) {
  // --- STATE CHUNG ---
  const [tab, setTab] = useState<'MAIN' | 'SUPPLEMENTARY'>('MAIN');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdCardPan, setCreatedCardPan] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- STATE THẺ CHÍNH ---
  const [cardCategory, setCardCategory] = useState<CardCategory>(CardCategory.TRAVEL);
  const [embossedFirstName, setEmbossedFirstName] = useState('');
  const [embossedLastName, setEmbossedLastName] = useState('');
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [paymentOption] = useState('FULL_PAYMENT');

  // --- STATE THẺ PHỤ ---
  const [selectedMainCard, setSelectedMainCard] = useState('');
  const [suppCardName, setSuppCardName] = useState('');
  const [suppFirstName, setSuppFirstName] = useState('');
  const [suppLastName, setSuppLastName] = useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (tab === 'MAIN') {
        if (!embossedFirstName || !embossedLastName || !bank || !account) {
          setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
          setIsSubmitting(false);
          return;
        }
        const payload: QuickOpenCardPayload = {
          cardCategory,
          embossedFirstName,
          embossedLastName,
          bank,
          account,
          paymentOption,
        };
        const result = await quickOpenCard(payload);
        setCreatedCardPan(result.cardPan);
      } else {
        // XỬ LÝ GỌI API THẺ PHỤ
        if (!selectedMainCard || !suppFirstName || !suppLastName) {
          setError('Vui lòng chọn thẻ chính và điền đủ họ tên in nổi.');
          setIsSubmitting(false);
          return;
        }
        const result = await createSupplementaryCard(selectedMainCard, {
          cardName: suppCardName,
          embossedFirstName: suppFirstName,
          embossedLastName: suppLastName,
        });
        setCreatedCardPan(result.cardNumber); // Từ API Supplementary trả về cardNumber
      }

      setStep(3); // Chuyển sang màn hình chúc mừng
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi hệ thống. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // MÀN HÌNH CHÚC MỪNG (BƯỚC 3)
  if (step === 3) {
    return (
      <ModalShell title="Mở thẻ thành công" icon={<CheckCircle2 className="h-4 w-4" />} onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-4 text-center animate-in zoom-in duration-300">
          <div className="rounded-full bg-emerald-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-slate-800">Chúc mừng bạn!</p>
          <p className="text-sm text-slate-500">
            {tab === 'MAIN' ? 'Thẻ chính' : 'Thẻ phụ'} của bạn đã được phát hành thành công.
          </p>

          <div className="mt-2 w-full rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-400">Số thẻ (PAN)</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-widest text-emerald-700">
              {createdCardPan}
            </p>
          </div>

          <button
            onClick={() => onSuccess(createdCardPan!)}
            className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
          >
            Khám phá thẻ ngay
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Mở thẻ thông minh" icon={<CreditCard className="h-4 w-4" />} onClose={onClose}>
      {/* SEGMENTED TABS (Chỉ hiện khi chưa thành công) */}
      <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => { setTab('MAIN'); setStep(1); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            tab === 'MAIN' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Thẻ chính
        </button>
        <button
          onClick={() => { setTab('SUPPLEMENTARY'); setStep(1); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            tab === 'SUPPLEMENTARY' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" /> Thẻ phụ
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* --- FORM THẺ CHÍNH (Giữ nguyên cấu trúc Step 1 & 2 của bạn) --- */}
      {tab === 'MAIN' && (
        <>
          {step === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-left-2 duration-200">
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
                      cardCategory === cat.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 shadow-sm' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`h-8 w-12 rounded-md ${cat.color} opacity-90 shadow-inner`} />
                    <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-colors"
              >
                Tiếp tục
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
              <p className="text-sm font-medium text-slate-700">2. Thông tin in nổi & Thanh toán</p>
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Tên (First Name) *" value={embossedFirstName} onChange={(val) => setEmbossedFirstName(val.toUpperCase())} placeholder="VD: VAN A" />
                <ModalField label="Họ (Last Name) *" value={embossedLastName} onChange={(val) => setEmbossedLastName(val.toUpperCase())} placeholder="VD: NGUYEN" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Ngân hàng thanh toán *" value={bank} onChange={setBank} placeholder="VD: VCB" />
                <ModalField label="Số tài khoản *" value={account} onChange={setAccount} placeholder="VD: 0123456789" />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Xác nhận mở thẻ
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- FORM THẺ PHỤ (Chỉ có 1 Step) --- */}
      {tab === 'SUPPLEMENTARY' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900">Chọn Thẻ chính để liên kết *</label>
            {existingCards.length === 0 ? (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                Bạn chưa có Thẻ chính nào. Vui lòng quay lại tab Thẻ chính để mở trước.
              </div>
            ) : (
              <select
                value={selectedMainCard}
                onChange={(e) => setSelectedMainCard(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="" disabled>-- Bấm để chọn thẻ --</option>
                {existingCards.map(card => (
                  <option key={card.cardNumber} value={card.cardNumber}>
                    {card.productName || 'Thẻ'} - {card.cardNumber.slice(-4)} {card.cardName ? `(${card.cardName})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <ModalField 
            label="Tên gọi nhớ thẻ (Không bắt buộc)" 
            value={suppCardName} 
            onChange={setSuppCardName} 
            placeholder="VD: Thẻ tiêu vặt cho con..." 
          />

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Tên người thân *" value={suppFirstName} onChange={(val) => setSuppFirstName(val.toUpperCase())} placeholder="VD: VAN A" />
            <ModalField label="Họ người thân *" value={suppLastName} onChange={(val) => setSuppLastName(val.toUpperCase())} placeholder="VD: NGUYEN" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || existingCards.length === 0}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Phát hành thẻ phụ
          </button>
        </div>
      )}
    </ModalShell>
  );
}