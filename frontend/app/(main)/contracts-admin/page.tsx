'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { FileStack } from 'lucide-react';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { useAdminContracts } from '../../../hooks/useAdminContracts';
import { AdminContractItem, ContractType } from '../../../types/admin-tables';
import { AdminDataTable } from '../../../components/AdminDataTable';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300; 

const TYPE_LABEL: Record<ContractType, string> = {
  LIABILITY: 'Hạn mức (Liability)',
  ISSUING: 'Phát hành (Issuing)',
};

export default function AdminContractsPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ContractType | ''>('');
  const [page, setPage] = useState(1);


  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  const { data, isLoading, isFetching } = useAdminContracts({
    search,
    type: type || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  const columns: ColumnDef<AdminContractItem>[] = [
    { accessorKey: 'contractNumber', header: 'Số hợp đồng' },
    { accessorKey: 'contractName', header: 'Tên hợp đồng' },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ getValue }) => {
        const value = getValue<ContractType>();
        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              value === 'LIABILITY'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-sky-50 text-sky-700'
            }`}
          >
            {TYPE_LABEL[value]}
          </span>
        );
      },
    },
    { accessorKey: 'clientNumber', header: 'Mã khách hàng' },
    { accessorKey: 'userEmail', header: 'Chủ sở hữu' },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ getValue }) =>
        new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <FileStack className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Quản lý hợp đồng
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as ContractType | '');
              setPage(1);
            }}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          >
            <option value="">Tất cả loại</option>
            <option value="LIABILITY">Hạn mức (Liability)</option>
            <option value="ISSUING">Phát hành (Issuing)</option>
          </select>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo số HĐ, tên, email..."
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.data ?? []}
        page={data?.meta.page ?? page}
        totalPages={data?.meta.totalPages ?? 1}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyMessage="Không tìm thấy hợp đồng nào."
      />
    </div>
  );
}
