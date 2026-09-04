'use client';

import { useState } from 'react';
import { useForm, Controller, Control, useWatch, RegisterOptions } from 'react-hook-form';
import { CreditCard, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { ModalShell } from '../components/Card/ModalShell';
import { ModalField } from '../components/Card/ModalField';
import { quickOpenCard, createSupplementaryCard } from '../api/contracts';
import { ApiError } from '../api/api';
import { CardCategory } from '../constants/cardCategories';
import { CustomSelect } from '../components/CustomSelect'; // Bổ sung import CustomSelect

const CATEGORY_TO_TAG_MAP: Record<string, string> = {
  [CardCategory.TRAVEL]: 'Thẻ Du Lịch',
  [CardCategory.ECOMMERCE]: 'Thẻ Thương Mại Điện Tử',
  [CardCategory.VISA]: 'Thẻ Visa',
  [CardCategory.CREDIT]: 'Thẻ Credit',
};

interface QuickOpenCardModalProps {
  existingCards?: { cardNumber: string; productName?: string; cardName?: string }[];
  onClose: () => void;
  onSuccess: (cardPan: string) => void;
}

interface FormValues {
  cardCategory: CardCategory;
  cardName: string; 
  embossedFirstName: string;
  embossedLastName: string;
  bank: string;
  account: string;
  selectedMainCard: string;
  suppCardName: string;
  suppFirstName: string;
  suppLastName: string;
}

const FormField = ({
  name,
  control,
  label,
  placeholder,
  required = false,
  maxLength,
  rules,
}: {
  name: keyof FormValues;
  control: Control<FormValues>;
  label: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rules?: RegisterOptions<FormValues, keyof FormValues>;
}) => (
  <Controller
    name={name}
    control={control}
    rules={{ 
      required: required ? 'Vui lòng điền thông tin này' : false,
      ...rules 
    }}
    render={({ field, fieldState: { error } }) => (
      <div>
        <ModalField
          label={label}
          value={field.value as string}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            // Lấy trực tiếp value từ event target (vì ModalField là thẻ input chuẩn)
            const strVal = e.target.value;

            // Xử lý logic format trước khi cập nhật vào form state
            if (name === 'account') {
              field.onChange(strVal.replace(/\D/g, ''));
            } else {
              field.onChange(name === 'cardName' || name === 'suppCardName' ? strVal : strVal.toUpperCase());
            }
          }}
          placeholder={placeholder}
          error={error?.message}
          maxLength={maxLength}
        />
      </div>
    )}
  />
);

export function QuickOpenCardModal({ existingCards = [], onClose, onSuccess }: QuickOpenCardModalProps) {
  const [tab, setTab] = useState<'MAIN' | 'SUPPLEMENTARY'>('MAIN');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdCardPan, setCreatedCardPan] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, setValue, reset, formState: { isSubmitting, errors } } = useForm<FormValues>({
    defaultValues: {
      cardCategory: CardCategory.TRAVEL,
      cardName: '', 
      embossedFirstName: '',
      embossedLastName: '',
      bank: '',
      account: '',
      selectedMainCard: '',
      suppCardName: '',
      suppFirstName: '',
      suppLastName: '',
    },
  });

  const cardCategory = useWatch({
    control,
    name: 'cardCategory',
  });

  // TẠO MẢNG OPTIONS CHO CUSTOM SELECT TỪ EXISTING CARDS
  const mainCardOptions = [
    { value: '', label: '-- Bấm để chọn thẻ --' },
    ...existingCards.map(c => ({
      value: c.cardNumber,
      label: `${c.productName || 'Thẻ'} - ${c.cardNumber.slice(-4)} ${c.cardName ? `(${c.cardName})` : ''}`
    }))
  ];

  const onSubmitForm = async (data: FormValues) => {
    setApiError(null);
    try {
      if (tab === 'MAIN') {
        const defaultTagName = CATEGORY_TO_TAG_MAP[data.cardCategory] || 'Thẻ Mới';
        const finalCardName = data.cardName?.trim() ? data.cardName.trim() : defaultTagName;

        const result = await quickOpenCard({
          cardCategory: data.cardCategory,
          cardName: finalCardName, 
          embossedFirstName: data.embossedFirstName,
          embossedLastName: data.embossedLastName,
          bank: data.bank,
          account: data.account,
          paymentOption: 'FULL_PAYMENT',
        });
        setCreatedCardPan(result.cardPan);
      } else {
        const finalSuppCardName = data.suppCardName?.trim() ? data.suppCardName.trim() : 'Thẻ Phụ';

        const result = await createSupplementaryCard(data.selectedMainCard, {
          cardName: finalSuppCardName, 
          embossedFirstName: data.suppFirstName,
          embossedLastName: data.suppLastName,
        });
        setCreatedCardPan(result.cardNumber);
      }
      setStep(3);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Lỗi hệ thống. Vui lòng thử lại.');
    }
  };

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
            className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Khám phá thẻ ngay
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Mở thẻ thông minh" icon={<CreditCard className="h-4 w-4" />} onClose={onClose}>
      <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => { 
            setTab('MAIN'); 
            setStep(1); 
            setApiError(null); 
            reset(); 
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            tab === 'MAIN' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Thẻ chính
        </button>
        <button
          type="button"
          onClick={() => { 
            setTab('SUPPLEMENTARY'); 
            setStep(1); 
            setApiError(null); 
            reset(); 
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            tab === 'SUPPLEMENTARY' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" /> Thẻ phụ
        </button>
      </div>

      {(apiError || Object.keys(errors).length > 0) && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> 
          {apiError || 'Vui lòng điền đầy đủ các trường bắt buộc.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitForm)}>
        
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
                      type="button"
                      onClick={() => setValue('cardCategory', cat.id)}
                      className={`flex flex-col items-start gap-2 rounded-xl border p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        cardCategory === cat.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 shadow-sm' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`h-8 w-12 rounded-md ${cat.color} opacity-90 shadow-inner`} />
                      <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                    </button>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  Tiếp tục
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
                <p className="text-sm font-medium text-slate-700">2. Thông tin in nổi & Thanh toán</p>
                
                <FormField 
                  name="cardName" 
                  control={control} 
                  label="Tên gọi nhớ thẻ (Không bắt buộc)" 
                  placeholder={`Mặc định: ${CATEGORY_TO_TAG_MAP[cardCategory] || 'Thẻ Mới'}`} 
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField name="embossedFirstName" control={control} label="Tên (First Name) *" placeholder="VD: VAN A" required />
                  <FormField name="embossedLastName" control={control} label="Họ (Last Name) *" placeholder="VD: NGUYEN" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField name="bank" control={control} label="Ngân hàng thanh toán *" placeholder="VD: VCB" required />
                  <FormField 
                    name="account" 
                    control={control} 
                    label="Số tài khoản *" 
                    placeholder="VD: 0123456789" 
                    required 
                    maxLength={15} 
                    rules={{
                      pattern: {
                        value: /^\d{8,15}$/,
                        message: 'Tài khoản phải từ 8 đến 15 số'
                      },
                      minLength: {
                        value: 8,
                        message: 'Tài khoản phải có ít nhất 8 số'
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    Quay lại
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Xác nhận
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'SUPPLEMENTARY' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">Chọn Thẻ chính để liên kết *</label>
              {existingCards.length === 0 ? (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                  Bạn chưa có Thẻ chính nào. Vui lòng quay lại tab Thẻ chính để mở trước.
                </div>
              ) : (
                <Controller
                  name="selectedMainCard" 
                  control={control} 
                  rules={{ required: 'Vui lòng chọn thẻ chính' }}
                  render={({ field }) => (
                    <>
                      {/* ĐÃ THAY THẾ SELECT BẰNG CUSTOMSELECT */}
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={mainCardOptions}
                        ariaLabel="Chọn Thẻ chính để liên kết"
                      />
                      {errors.selectedMainCard && (
                        <span className="mt-1 block text-xs text-red-500">
                          {errors.selectedMainCard.message}
                        </span>
                      )}
                    </>
                  )}
                />
              )}
            </div>
            
            <FormField 
              name="suppCardName" 
              control={control} 
              label="Tên gọi nhớ thẻ (Không bắt buộc)" 
              placeholder="Mặc định: Thẻ Phụ" 
            />
            
            <div className="grid grid-cols-2 gap-3">
              <FormField name="suppFirstName" control={control} label="Tên người thân *" placeholder="VD: VAN A" required />
              <FormField name="suppLastName" control={control} label="Họ người thân *" placeholder="VD: NGUYEN" required />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || existingCards.length === 0} 
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Phát hành thẻ phụ
            </button>
          </div>
        )}
      </form>
    </ModalShell>
  );
}