'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, ApiError } from '../../../lib/api';
import {
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Landmark,
  UserSquare2,
} from 'lucide-react';

type CurrentUser = {
  id: number;
  email: string;
  clientId?: string | null;
  clientNumber?: string | null;
};

type FullCardFormData = {
  // Bước 1 - Liability
  liabProductCode: string;
  cbsNumber: string;
  institutionCode: string;
  branch: string;
  // Bước 2 - Issuing
  issuingProductCode: string;
  contractName: string;
  paymentOption: string;
  bank: string;
  account: string;
  bankCode: string;
  accName: string;
  // Bước 3 - Thẻ
  cardProductCode: string;
  embossedFirstName: string;
  embossedLastName: string;
  embossedCompanyName: string;
};

type FullCardApplicationResponse = {
  success: boolean;
  message: string;
  liabilityContract?: string;
  issuingContract?: string;
  cardPan: string;
  expiryDate: string;
};

const EMPTY_FORM: FullCardFormData = {
  liabProductCode: '',
  cbsNumber: '',
  institutionCode: '',
  branch: '',
  issuingProductCode: '',
  contractName: '',
  paymentOption: '',
  bank: '',
  account: '',
  bankCode: '',
  accName: '',
  cardProductCode: '',
  embossedFirstName: '',
  embossedLastName: '',
  embossedCompanyName: '',
};

const STEPS = [
  { number: 1, label: 'Hạn mức', sublabel: 'Liability Contract' },
  { number: 2, label: 'Phát hành', sublabel: 'Issuing Contract' },
  { number: 3, label: 'Thẻ', sublabel: 'Sinh số thẻ' },
];

export default function CreateCardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FullCardFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullCardApplicationResponse | null>(null);

  // Lấy clientNumber của user đang đăng nhập
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const user = await apiGet<CurrentUser>('/clients/me');
        setCurrentUser(user);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Không thể tải thông tin tài khoản.';
        setError(msg);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const updateField = (field: keyof FullCardFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canGoToStep2 =
    form.liabProductCode.trim() !== '' &&
    form.cbsNumber.trim() !== '' &&
    form.institutionCode.trim() !== '' &&
    form.branch.trim() !== '';

  const canGoToStep3 =
    form.issuingProductCode.trim() !== '' &&
    form.contractName.trim() !== '' &&
    form.paymentOption.trim() !== '' &&
    form.bank.trim() !== '' &&
    form.account.trim() !== '' &&
    form.bankCode.trim() !== '' &&
    form.accName.trim() !== '';

  const canSubmit =
    form.cardProductCode.trim() !== '' &&
    form.embossedFirstName.trim() !== '' &&
    form.embossedLastName.trim() !== '';

  const handleNext = () => {
    setError(null);
    if (step === 1 && !canGoToStep2) {
      setError('Vui lòng điền đầy đủ thông tin Hạn mức trước khi tiếp tục.');
      return;
    }
    if (step === 2 && !canGoToStep3) {
      setError('Vui lòng điền đầy đủ thông tin Phát hành trước khi tiếp tục.');
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Vui lòng điền đầy đủ thông tin Thẻ.');
      return;
    }
    if (!currentUser?.clientNumber) {
      setError('Tài khoản của bạn chưa có clientNumber. Vui lòng tạo hồ sơ khách hàng trước ở mục Khách hàng.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = { clientNumber: currentUser.clientNumber, ...form };
      const response = await apiPost<FullCardApplicationResponse, typeof payload>(
        '/contracts/full-application',
        payload,
      );
      setResult(response);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi mở thẻ. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // MÀN HÌNH KẾT QUẢ
  // ==========================================
  if (result) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4 border-b border-emerald-100 bg-emerald-50 px-6 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mở thẻ thành công</h2>
              <p className="mt-1 text-sm text-slate-500">{result.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
            <ResultRow label="Số thẻ (PAN)" value={result.cardPan} highlight />
            <ResultRow label="Ngày hết hạn" value={result.expiryDate} />
            <ResultRow label="Mã hợp đồng Liability" value={result.liabilityContract} />
            <ResultRow label="Mã hợp đồng Issuing" value={result.issuingContract} />
          </div>

          <div className="flex gap-3 border-t border-slate-100 p-6">
            <button
              onClick={() => router.push('/dashboard/contracts')}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Xem danh sách hợp đồng
            </button>
            <button
              onClick={() => {
                setResult(null);
                setForm(EMPTY_FORM);
                setStep(1);
              }}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Mở thẻ khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MÀN HÌNH FORM WIZARD
  // ==========================================
  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Mở thẻ mới</h2>
        <p className="mt-1 text-slate-500">
          Quy trình 3 bước: tạo Hạn mức, Phát hành, rồi sinh số thẻ — theo đúng chuỗi liên kết của WAY4.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center">
        {STEPS.map((s, idx) => (
          <div key={s.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step === s.number
                    ? 'bg-emerald-600 text-white'
                    : step > s.number
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.number ? <CheckCircle2 className="h-5 w-5" /> : s.number}
              </div>
              <div className="text-center">
                <p className={`text-xs font-medium ${step === s.number ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </p>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 rounded ${step > s.number ? 'bg-emerald-300' : 'bg-slate-100'}`} />
            )}
          </div>
        ))}
      </div>

      {isLoadingUser ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Hiển thị clientNumber, không cho sửa */}
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <UserSquare2 className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Mã khách hàng (clientNumber)</p>
              <p className="text-sm font-medium text-slate-800">
                {currentUser?.clientNumber || 'Chưa có — vui lòng tạo hồ sơ khách hàng trước'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <SectionTitle icon={<Landmark className="h-4 w-4" />} title="Thông tin Hạn mức (Liability)" />
              <Field label="Mã sản phẩm hạn mức" value={form.liabProductCode} onChange={(v) => updateField('liabProductCode', v)} placeholder="VD: LIAB_STD_01" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Số CBS" value={form.cbsNumber} onChange={(v) => updateField('cbsNumber', v)} placeholder="VD: 000123456" />
                <Field label="Mã tổ chức" value={form.institutionCode} onChange={(v) => updateField('institutionCode', v)} placeholder="VD: 01" />
              </div>
              <Field label="Chi nhánh" value={form.branch} onChange={(v) => updateField('branch', v)} placeholder="VD: HN01" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <SectionTitle icon={<Landmark className="h-4 w-4" />} title="Thông tin Phát hành (Issuing)" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Mã sản phẩm phát hành" value={form.issuingProductCode} onChange={(v) => updateField('issuingProductCode', v)} placeholder="VD: ISS_STD_01" />
                <Field label="Tên hợp đồng" value={form.contractName} onChange={(v) => updateField('contractName', v)} placeholder="VD: Thẻ Visa Classic" />
              </div>
              <Field label="Hình thức thanh toán" value={form.paymentOption} onChange={(v) => updateField('paymentOption', v)} placeholder="VD: FULL_PAYMENT" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ngân hàng" value={form.bank} onChange={(v) => updateField('bank', v)} placeholder="VD: Vietcombank" />
                <Field label="Mã ngân hàng" value={form.bankCode} onChange={(v) => updateField('bankCode', v)} placeholder="VD: VCB" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Số tài khoản" value={form.account} onChange={(v) => updateField('account', v)} placeholder="VD: 0123456789" />
                <Field label="Tên chủ tài khoản" value={form.accName} onChange={(v) => updateField('accName', v)} placeholder="VD: NGUYEN VAN A" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SectionTitle icon={<CreditCard className="h-4 w-4" />} title="Thông tin Thẻ" />
              <Field label="Mã sản phẩm thẻ" value={form.cardProductCode} onChange={(v) => updateField('cardProductCode', v)} placeholder="VD: CARD_VISA_CLASSIC" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tên khắc nổi (First name)" value={form.embossedFirstName} onChange={(v) => updateField('embossedFirstName', v)} placeholder="VD: VAN A" />
                <Field label="Họ khắc nổi (Last name)" value={form.embossedLastName} onChange={(v) => updateField('embossedLastName', v)} placeholder="VD: NGUYEN" />
              </div>
              <Field
                label="Tên công ty (nếu là thẻ doanh nghiệp)"
                value={form.embossedCompanyName}
                onChange={(v) => updateField('embossedCompanyName', v)}
                placeholder="Bỏ trống nếu là thẻ cá nhân"
                optional
              />
            </div>
          )}

          {/* Nút điều hướng */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="ml-auto flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Tiếp tục
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Mở thẻ ngay'
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      {title}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label} {optional && <span className="text-slate-300">(không bắt buộc)</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="border-b border-slate-100 p-4 last:border-0 sm:border-r sm:nth-child(even):border-r-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 break-all text-sm font-medium ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>
        {value || 'Không có dữ liệu'}
      </p>
    </div>
  );
}