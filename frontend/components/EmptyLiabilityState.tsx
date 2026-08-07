import { Landmark, Plus } from 'lucide-react';

export function EmptyLiabilityState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Landmark className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Bạn chưa có hợp đồng hạn mức</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Mở hợp đồng hạn mức trước, sau đó bạn có thể thêm hợp đồng phát hành và mở thẻ.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4" />
        Mở hợp đồng hạn mức
      </button>
    </div>
  );
}
