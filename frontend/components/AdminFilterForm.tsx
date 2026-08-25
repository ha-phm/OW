'use client';

import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form'; 
import { Search } from 'lucide-react';

function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Args) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  return debounced;
}

interface FilterFormValues {
  search: string;
  type?: string;
}

interface AdminFilterFormProps {
  defaultValues: FilterFormValues;
  onFilterChange: (values: FilterFormValues) => void;
  showTypeFilter?: boolean;
}

export function AdminFilterForm({ defaultValues, onFilterChange, showTypeFilter }: AdminFilterFormProps) {

  const { register, control } = useForm<FilterFormValues>({
    defaultValues,
  });

  // DÙNG useWatch ĐỂ LẤY DỮ LIỆU MÀ KHÔNG GÂY RE-RENDER COMPONENT
  const formValues = useWatch({ control });

  const debouncedFilter = useMemo(
    () => debounce((values: FilterFormValues) => onFilterChange(values), 400),
    [onFilterChange]
  );

  useEffect(() => {
    debouncedFilter(formValues as FilterFormValues);
    return () => debouncedFilter.cancel();
  }, [formValues, debouncedFilter]);

  return (
    <form className="flex items-center gap-2 w-full lg:w-max">
      {showTypeFilter && (
        <select
          {...register('type')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none cursor-pointer"
        >
          <option value="">Tất cả loại</option>
          <option value="LIABILITY">Liability</option>
          <option value="ISSUING">Issuing</option>
        </select>
      )}
      <div className="relative w-full lg:w-96">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          {...register('search')}
          placeholder="Tìm kiếm dữ liệu..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
    </form>
  );
}