export function ModalField({
  label,
  value,
  onChange,
  placeholder,
  optional,
  error, // 1. Nhận thêm prop error từ form truyền xuống
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  error?: string; // Kiểu dữ liệu của error
}) {
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
        )} {optional && <span className="text-slate-300">(không bắt buộc)</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:ring-2 ${
          // 2. Đổi màu viền thành đỏ nếu form báo lỗi
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
            : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'
        }`}
      />
      {/* 3. Hiển thị dòng chữ lỗi ngay bên dưới input */}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}