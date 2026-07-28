'use client';

import React, { useState } from 'react';

export default function CreateClientPage() {
  // Simple local form handling without external dependency
  const [name, setName] = useState('');
  const [identityCard, setIdentityCard] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, identityCard };
    console.log('Dữ liệu chuẩn bị gửi xuống NestJS là:', data);
    alert('Đã lấy được dữ liệu! Bạn mở Console (F12) để xem nhé.');
  };

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold mb-5">Tạo Khách Hàng (Bản nháp cơ bản)</h2>
      
      {/* Bọc các ô input bằng thẻ form */}
      <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-sm">
        
        {/* Ô nhập Họ và Tên */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Họ và tên:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-400 p-2 rounded"
            placeholder="VD: NGUYEN VAN A"
          />
        </div>

        {/* Ô nhập CCCD */}
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Số CCCD:</label>
          <input
            value={identityCard}
            onChange={(e) => setIdentityCard(e.target.value)}
            className="border border-gray-400 p-2 rounded"
            placeholder="0123456789"
          />
        </div>

        {/* Nút Submit */}
        <button type="submit" className="bg-blue-600 text-white font-bold p-2 rounded mt-4">
          Lưu dữ liệu
        </button>

      </form>
    </div>
  );
}