'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { useForm, useWatch } from 'react-hook-form';
import { UserCog, Trash2, Pencil, Search, Unlock, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminUsers, useUpdateUserRole, useDeleteUser, useRestoreUser } from '../../../hooks/useAdminUsers';
import { useAuthMe } from '../../../hooks/useAuthMe';
import { AdminUser, Role } from '../../../types/user';
import { AdminDataTable, type AppFeatures } from '../../../components/AdminDataTable';
import { useAdminStore } from '../../../store/useAdminStore';
import { CustomSelect } from '../../../components/CustomSelect'; // Import Component mới

const SEARCH_DEBOUNCE_MS = 300;
type FilterField = 'search' | 'email' | 'clientNumber' | 'role' | 'isActive';

interface FilterFormValues {
  filterField: FilterField;
  inputValue: string;
}

const convertSortingToParams = (sorting: SortingState) => {
  const [first] = sorting;
  if (!first) return {};
  return {
    sortBy: first.id,
    sortOrder: first.desc ? ('desc' as const) : ('asc' as const),
  };
};

// --- CÁC MẢNG DỮ LIỆU OPTIONS CHO CUSTOM SELECT ---
const FILTER_FIELD_OPTIONS = [
  { value: 'search', label: 'Tìm kiếm chung' },
  { value: 'email', label: 'Email' },
  { value: 'clientNumber', label: 'Số khách hàng' },
  { value: 'role', label: 'Quyền (Role)' },
  { value: 'isActive', label: 'Trạng thái' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả quyền' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'USER', label: 'USER' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Bị khóa' },
];

// Options dành riêng cho cột Role trong bảng
const TABLE_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'USER', label: 'USER' },
];
// --------------------------------------------------

export default function UsersPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useAuthMe();
  const { usersParams, setUsersParams } = useAdminStore();

  const { register, control, setValue } = useForm<FilterFormValues>({
    defaultValues: {
      filterField: 'search',
      inputValue: usersParams.search || '',
    }
  });

  const filterField = useWatch({ control, name: 'filterField' });
  const inputValue = useWatch({ control, name: 'inputValue' });

  const getStoreValue = useCallback((field: FilterField) => {
    if (field === 'search') return usersParams.search || '';
    const filterObj = usersParams.columnFilters?.find(f => f.id === field);
    return (filterObj?.value as string) || '';
  }, [usersParams.search, usersParams.columnFilters]);

  useEffect(() => {
    if (filterField !== 'isActive' && filterField !== 'role') {
      setValue('inputValue', getStoreValue(filterField));
    }
  }, [filterField, getStoreValue, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filterField !== 'isActive' && filterField !== 'role') {
        const currentValueInStore = getStoreValue(filterField);
        if (inputValue !== currentValueInStore) {
          if (filterField === 'search') {
            setUsersParams({ search: inputValue, page: 1 });
          } else {
            const currentFilters = usersParams.columnFilters || [];
            const otherFilters = currentFilters.filter(f => f.id !== filterField);
            if (inputValue.trim() === '') {
              setUsersParams({ columnFilters: otherFilters, page: 1 });
            } else {
              setUsersParams({
                columnFilters: [...otherFilters, { id: filterField, value: inputValue }],
                page: 1
              });
            }
          }
        }
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, filterField, getStoreValue, usersParams.columnFilters, setUsersParams]);

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [meLoading, me, router]);

  const filterObject = (usersParams.columnFilters || []).reduce((acc, filter) => {
    acc[filter.id] = filter.value as string;
    return acc;
  }, {} as Record<string, string>);

  const { data: usersData, isLoading, isFetching } = useAdminUsers({
    search: usersParams.search,
    page: usersParams.page,
    pageSize: usersParams.pageSize,
    ...filterObject,
    ...convertSortingToParams(usersParams.sorting || []),
  });

  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();

  if (meLoading || me?.role !== 'ADMIN') {
    return null;
  }

  const handleRoleChange = (userId: number, userEmail: string, newRole: Role) => {
    toast(`Xác nhận đổi quyền?`, {
      description: `Đổi quyền của ${userEmail} thành ${newRole}.`,
      action: { label: 'Đồng ý', onClick: () => updateRole.mutate({ id: userId, role: newRole }) },
      cancel: { label: 'Huỷ', onClick: () => {} },
    });
  };

  const handleDeleteUser = (userId: number, userEmail: string) => {
    toast.error(`Vô hiệu hóa tài khoản?`, {
      description: `Tài khoản ${userEmail} sẽ bị khóa và không thể đăng nhập.`,
      actionButtonStyle: { backgroundColor: '#dc2626', color: 'white' },
      cancelButtonStyle: { backgroundColor: '#e5e7eb', color: '#374151' },
      action: { label: 'Khóa ngay', onClick: () => deleteUser.mutate(userId) },
      cancel: { label: 'Huỷ', onClick: () => {} },
    });
  };

  const columns: ColumnDef<AppFeatures, AdminUser>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      enableSorting: true,
      cell: ({ row }) => {
        const email = row.getValue<string>('email');
        return <span className="font-medium text-slate-700">{email}</span>;
      },
    },
    {
      accessorKey: 'clientNumber',
      header: 'Số khách hàng',
      enableSorting: true,
      cell: ({ row }) => row.original.clientNumber || '---'
    },
    {
      accessorKey: 'role',
      header: 'Quyền',
      enableSorting: true,
      cell: ({ row }) => {
        const user = row.original;
        return (
          // Thay <select> mặc định bằng CustomSelect
          <div className="min-w-[120px]">
             <CustomSelect
                value={user.role}
                onChange={(val) => handleRoleChange(user.id, user.email, val as Role)}
                options={TABLE_ROLE_OPTIONS}
                ariaLabel={`Thay đổi quyền của người dùng ${user.email}`}
              />
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      enableSorting: true,
      cell: ({ getValue }) => {
        const isActive = getValue<boolean>();
        return isActive ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 whitespace-nowrap">
            Hoạt động
          </span>
        ) : (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 whitespace-nowrap">
            Bị khóa
          </span>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      enableSorting: true,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString('vi-VN'),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const isActive = user.isActive;

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => toast('Đang mở trang chỉnh sửa...', { description: user.email })}
              title="Chỉnh sửa thông tin"
              aria-label={`Chỉnh sửa thông tin tài khoản ${user.email}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-blue-50"
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
            </button>
            {isActive !== false ? (
              <button
                onClick={() => handleDeleteUser(user.id, user.email)}
                title="Vô hiệu hoá tài khoản"
                aria-label={`Vô hiệu hoá tài khoản ${user.email}`}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:bg-red-50"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${user.email} không?`)) {
                    restoreUser.mutate(user.id);
                  }
                }}
                title="Mở khóa tài khoản"
                aria-label={`Mở khóa tài khoản ${user.email}`}
                className="rounded-lg p-2 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-emerald-50"
              >
                <Unlock aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <main className="flex flex-col gap-6 p-4 sm:p-8">
      {/* KHU VỰC THÔNG BÁO CHO TRÌNH ĐỌC MÀN HÌNH */}
      <div aria-live="polite" className="sr-only">
        {isLoading || isFetching 
          ? 'Đang tải dữ liệu người dùng...' 
          : `Đã tìm thấy ${usersData?.meta?.total ?? 0} người dùng.`}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      
        <header className="flex items-center gap-3">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <UserCog aria-hidden="true" className="h-5 w-5 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Quản lý người dùng</h1>
        </header>

        {/* NÂNG CẤP BỘ LỌC CHUẨN A11Y */}
        <form 
          role="search"
          aria-label="Bộ lọc tìm kiếm người dùng" 
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100"
        >
          {/* Dropdown 1: Chọn trường cần lọc */}
          <CustomSelect
            value={filterField}
            onChange={(val) => setValue('filterField', val as FilterField)}
            options={FILTER_FIELD_OPTIONS}
            icon={<Filter className="h-4 w-4" />}
            ariaLabel="Chọn trường dữ liệu để lọc"
          />

          {/* Ô nhập liệu/Dropdown hiển thị tương ứng */}
          {filterField === 'isActive' ? (
             <CustomSelect
              value={usersParams.columnFilters?.find(f => f.id === 'isActive')?.value as string || ''}
              onChange={(val) => {
                const otherFilters = (usersParams.columnFilters || []).filter(f => f.id !== 'isActive');
                setUsersParams({ 
                  columnFilters: val === '' ? otherFilters : [...otherFilters, { id: 'isActive', value: val }], 
                  page: 1 
                });
              }}
              options={STATUS_OPTIONS}
              ariaLabel="Lọc theo trạng thái hoạt động"
            />
            
          ) : filterField === 'role' ? (
             <CustomSelect
              value={usersParams.columnFilters?.find(f => f.id === 'role')?.value as string || ''}
              onChange={(val) => {
                const otherFilters = (usersParams.columnFilters || []).filter(f => f.id !== 'role');
                setUsersParams({ 
                  columnFilters: val === '' ? otherFilters : [...otherFilters, { id: 'role', value: val }], 
                  page: 1 
                });
              }}
              options={ROLE_OPTIONS}
              ariaLabel="Lọc theo quyền quản trị"
            />

          ) : (
            <div className="relative flex-1">
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <label htmlFor="userSearchInput" className="sr-only">
                {filterField === 'search' ? 'Nhập từ khóa tìm kiếm chung' : 
                 filterField === 'email' ? 'Nhập email cần tìm' : 
                 'Nhập số khách hàng cần tìm'}
              </label>
              <input
                id="userSearchInput"
                {...register('inputValue')}
                placeholder={
                  filterField === 'search' ? 'Nhập từ khóa...' : 
                  filterField === 'email' ? 'Nhập email...' : 
                  'Nhập số khách hàng...'
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
              />
            </div>
          )}
        </form>
      </div>

      <div aria-busy={isLoading || isFetching}>
        <AdminDataTable
          columns={columns}
          data={usersData?.data || []}
          page={usersParams.page || 1}
          pageSize={usersParams.pageSize || 10}
          totalPages={usersData?.meta?.totalPages || 1}
          total={usersData?.meta?.total || 0}
          onPageChange={(page) => setUsersParams({ page })}
          onPageSizeChange={(pageSize) => setUsersParams({ pageSize, page: 1 })}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyMessage="Không tìm thấy người dùng nào."
          showColumnFilters={false}
          sorting={usersParams.sorting}
          onSortingChange={(sorting) => setUsersParams({ sorting })}
        />
      </div>
    </main>
  );
}