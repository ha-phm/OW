'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

// Kế thừa toàn bộ thuộc tính của thẻ <input> chuẩn (bao gồm onChange, onBlur, name, value...)
export interface ModalFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean;
  error?: string;
}

export const ModalField = forwardRef<HTMLInputElement, ModalFieldProps>(
  ({ label, optional, error, maxLength, className = '', ...props }, ref) => {
    return (
      <label className="block w-full">
        <span className="mb-1.5 block text-xs font-medium text-slate-500">
          {label.includes('*') ? (
            <>
              {label.replace('*', '')}
              <span className="text-red-500 font-bold">*</span>
            </>
          ) : (
            label
          )}{' '}
          {optional && <span className="text-slate-300">(không bắt buộc)</span>}
        </span>
        
        <input
          ref={ref} // Gắn ref từ react-hook-form vào đây
          type="text"
          maxLength={maxLength}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'
          } ${className}`}
          {...props} // Rải toàn bộ props (như onChange, name, placeholder...) vào đây
        />
        
        {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
      </label>
    );
  }
);

ModalField.displayName = 'ModalField';