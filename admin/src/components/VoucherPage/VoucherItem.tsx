// src/components/VoucherPage/VoucherItem.tsx
import React from 'react';

interface Voucher {
  id: string;
  icon: string;
  lines: string[];
  status: string;
}

interface VoucherItemProps {
  voucher: Voucher;
  isSelected: boolean;
  onSelect: (voucher: Voucher) => void;
}

const VoucherItem: React.FC<VoucherItemProps> = ({ voucher, isSelected, onSelect }) => {
  return (
    <div className="voucher-item">
      <div className="voucher-icon-container">
        <img src={voucher.icon} alt="Mã Giảm Giá" className="voucher-icon" />
      </div>
      <div className="voucher-details">
        {voucher.lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
        <div className="voucher-status">
          <span>{voucher.status}</span>
          <a href="#" className="conditions-link">Điều kiện</a>
        </div>
      </div>
      <div className="voucher-select">
        <input
          type="radio"
          name="voucher"
          id={`voucher-${voucher.id}`}
          checked={isSelected}
          onChange={() => onSelect(voucher)}
        />
      </div>
    </div>
  );
};

export default VoucherItem;