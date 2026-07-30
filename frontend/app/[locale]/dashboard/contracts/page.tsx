'use client';

import { useState, useEffect } from 'react';
import { apiGet, ApiError } from '../../../../lib/api';
import { FileText, ArrowLeft, Loader2, ChevronRight, AlertCircle } from 'lucide-react';

type ContractRecord = {
  ContractNumber: string;
  ContractName?: string;
  Product?: string;
  Status?: string;
  Institution?: string;
  Branch?: string;
  DateOpen?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedContractNumber, setSelectedContractNumber] = useState<string | null>(null);
  const [contractDetail, setContractDetail] = useState<ContractRecord | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Gọi API lấy danh sách hợp đồng
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setIsLoadingList(true);
        // apiGet đã trả thẳng data (không còn .data lồng bên trong nữa)
        const data = await apiGet<ContractRecord[]>('/contracts/me');
        setContracts(data || []);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Không thể tải danh sách hợp đồng.';
        setError(msg);
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchContracts();
  }, []);

  // Gọi API tra cứu chi tiết
  const handleViewDetail = async (contractNumber: string) => {
    setSelectedContractNumber(contractNumber);
    setContractDetail(null);
    setIsLoadingDetail(true);
    setError(null);

    try {
      const data = await apiGet<any>(`/contracts/${contractNumber}`);
      const detailRecord = data?.GetContractV2Result?.ContractRecord || data;
      setContractDetail(detailRecord);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể tải chi tiết hợp đồng.';
      setError(msg);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    setSelectedContractNumber(null);
    setContractDetail(null);
    setError(null);
  };

  // ==========================================
  // VIEW 2: CHI TIẾT HỢP ĐỒNG
  // ==========================================
  if (selectedContractNumber) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <button
          onClick={handleBackToList}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Chi tiết hợp đồng</h2>
            <p className="text-slate-500">Mã: {selectedContractNumber}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-4 text-slate-500">Đang tải dữ liệu từ WAY4...</p>
          </div>
        ) : contractDetail ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-semibold text-slate-800">
                {contractDetail.ContractName || 'Hợp đồng không tên'}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
              <DetailRow label="Mã hợp đồng" value={contractDetail.ContractNumber} />
              <DetailRow label="Trạng thái" value={contractDetail.Status} />
              <DetailRow label="Sản phẩm (Product)" value={contractDetail.Product} />
              <DetailRow label="Ngày mở (Date Open)" value={contractDetail.DateOpen} />
              <DetailRow label="Chi nhánh (Branch)" value={contractDetail.Branch} />
              <DetailRow label="Tổ chức (Institution)" value={contractDetail.Institution} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // ==========================================
  // VIEW 1: DANH SÁCH HỢP ĐỒNG
  // ==========================================
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Danh sách Hợp đồng</h2>
        <p className="text-slate-500 mt-1">Quản lý các hợp đồng Liability, Issuing và Thẻ của bạn.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {isLoadingList ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">Chưa có hợp đồng nào</h3>
          <p className="mt-1 text-slate-500">Bạn hiện tại chưa có hợp đồng nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {contracts.map((contract, index) => (
            <button
              key={contract.ContractNumber || index}
              onClick={() => handleViewDetail(contract.ContractNumber)}
              className="group flex flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
            >
              <div className="w-full flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {contract.ContractName || 'Contract'}
                    </h3>
                    <p className="text-sm text-slate-500">{contract.ContractNumber}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>

              <div className="flex gap-4 w-full border-t border-slate-100 pt-3">
                <div className="text-xs">
                  <span className="text-slate-400 block mb-0.5">Sản phẩm</span>
                  <span className="font-medium text-slate-700">{contract.Product || 'N/A'}</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block mb-0.5">Trạng thái</span>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {contract.Status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="border-b border-slate-100 p-4 last:border-0 sm:border-r sm:nth-child(even):border-r-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 break-all">{value || 'Không có dữ liệu'}</p>
    </div>
  );
}