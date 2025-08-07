// src/components/VoucherPage/VoucherPage.tsx
import React, { useState, useCallback } from 'react';
import './VoucherPage.css';
import VoucherItem from './VoucherItem'; // Import VoucherItem

// 1. Định nghĩa "kiểu" (type) cho một đối tượng voucher
interface Voucher {
  id: string;
  icon: string;
  lines: string[];
  status: string;
}

// 2. Khai báo mảng voucherData với kiểu đã định nghĩa
const voucherData: Voucher[] = [
  {
    id: 'VC1',
    icon: 'https://i.imgur.com/Sajg2aG.png',
    lines: ['Giảm tối đa ₫100k', 'Đơn Tối Thiểu ₫400k', 'Freeship hỏa tốc'],
    status: 'Đã dùng 89%, HSD: 15.06.2025'
  },
  {
    id: 'VC2',
    icon: 'https://i.imgur.com/Sajg2aG.png',
    lines: ['Giảm 50% Giảm tối đa ₫60k', 'Đơn Tối Thiểu ₫50k', 'Mua trước trả sau'],
    status: 'HSD: 15.06.2025'
  },
 
];

const VoucherPage: React.FC = () => {
  const [manualVoucherCode, setManualVoucherCode] = useState<string>('');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Sử dụng useCallback để memoize các hàm xử lý sự kiện, tránh re-render không cần thiết
  const handleApplyManualCode = useCallback(() => {
    const message = manualVoucherCode.trim() ? `Đang áp dụng mã: ${manualVoucherCode}` : 'Vui lòng nhập mã voucher!';
    alert(message);
  }, [manualVoucherCode]);

  const handleConfirm = useCallback(() => {
    const message = selectedVoucher ? `Voucher đã chọn: ${selectedVoucher.id}` : 'Bạn chưa chọn voucher nào.';
    alert(message);
    console.log("Đã nhấn OK.");
  }, [selectedVoucher]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setManualVoucherCode(event.target.value);
  }, []);

  const handleSelectVoucher = useCallback((voucher: Voucher) => {
    setSelectedVoucher(voucher);
  }, []);

  return (
    <div className="voucher-modal-background">
      <div className="voucher-container">
        <header className="voucher-header">
          <h2>Chọn Voucher</h2>
        </header>
        <main className="voucher-body">
          <div className="manual-voucher-section">
            <label htmlFor="voucher-input">Mã voucher</label>
            <input
              id="voucher-input"
              type="text"
              value={manualVoucherCode}
              onChange={handleInputChange}
            />
            <button onClick={handleApplyManualCode} className="apply-btn">Áp dụng</button>
          </div>
          <div className="voucher-list-section">
            <h3 className="list-title">Mã Miễn Phí Vận Chuyển</h3>
            <p className="list-subtitle">Có thể chọn 1 Voucher</p>
            <div className="voucher-list">
              {voucherData.map((voucher) => (
                <VoucherItem
                  key={voucher.id}
                  voucher={voucher}
                  isSelected={selectedVoucher?.id === voucher.id}
                  onSelect={handleSelectVoucher}
                />
              ))}
            </div>
          </div>
        </main>
        <footer className="voucher-footer">
          <button className="footer-btn back-btn">Trở lại</button>
          <button onClick={handleConfirm} className="footer-btn ok-btn">Ok</button>
        </footer>
      </div>
    </div>
  );
};

export default VoucherPage;