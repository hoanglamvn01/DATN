import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Container, Grid, CircularProgress, Alert,
    InputAdornment, TextField
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VoucherCard from './VoucherCard'; // Import component VoucherCard

// --- INTERFACES & UTILITY FUNCTIONS ---
// (Cần định nghĩa lại hoặc import các interfaces và hàm processDbData từ file khác)
interface DiscountCodeDb {
    code_id: number;
    code: string;
    description: string;
    discount_percent: number | null;
    discount_amount: number | null;
    start_date: string;
    end_date: string;
}

interface VoucherDisplay {
    code_id: number;
    code: string;
    name: string;
    value: number;
    type: 'percentage' | 'fixed_amount';
    expiryDate: string;
    status: 'Active' | 'Inactive' | 'Expired';
}

// Hàm xử lý dữ liệu từ DB (cần có để tính toán trạng thái và giá trị)
const processDbData = (data: DiscountCodeDb[]): VoucherDisplay[] => {
    const now = new Date();
    return data.map(item => {
        // ... (Logic tính toán status, type, value tương tự như các file trước) ...
        let type: 'percentage' | 'fixed_amount';
        let value: number;

        if (item.discount_percent !== null && item.discount_percent > 0) {
            type = 'percentage';
            value = item.discount_percent;
        } else {
            type = 'fixed_amount';
            value = item.discount_amount || 0;
        }

        const startDate = new Date(item.start_date);
        const endDate = new Date(item.end_date);
        let status: 'Active' | 'Inactive' | 'Expired';

        if (now > endDate) {
            status = 'Expired';
        } else if (now >= startDate && now <= endDate) {
            status = 'Active';
        } else {
            status = 'Inactive';
        }

        return {
            code_id: item.code_id,
            code: item.code,
            name: item.description,
            value,
            type,
            expiryDate: item.end_date,
            status,
        };
    });
};

const API_URL = 'http://localhost:3000/api/discounts';

// --- VOUCHER LIST PAGE COMPONENT ---
const VoucherListPage: React.FC = () => {
    const [vouchers, setVouchers] = useState<VoucherDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State để theo dõi các voucher đã được người dùng lưu
    const [savedVouchers, setSavedVouchers] = useState<number[]>([]); 

    // --- Lấy dữ liệu Voucher từ Backend ---
    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<DiscountCodeDb[]>(API_URL);
            const processedVouchers = processDbData(response.data);
            setVouchers(processedVouchers);
        } catch (err) {
            console.error("Lỗi khi tải voucher:", err);
            setError('Không thể tải danh sách mã giảm giá. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    // --- Xử lý Lưu mã giảm giá ---
    const handleSaveVoucher = (voucherId: number) => {
        // Giả lập lưu mã giảm giá: thêm ID vào danh sách savedVouchers
        // Trong thực tế, bạn sẽ gửi request POST/PUT tới backend để lưu trạng thái này cho người dùng hiện tại
        setSavedVouchers(prev => {
            if (!prev.includes(voucherId)) {
                console.log(`Đã lưu voucher ID: ${voucherId}`);
                return [...prev, voucherId];
            }
            return prev;
        });
    };

    // --- Lọc và sắp xếp (Nếu cần) ---
    const filteredVouchers = vouchers.filter(voucher => 
        voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 5 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 15 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Kho Voucher
            </Typography>

            {/* Thanh tìm kiếm */}
            <Box sx={{ mb: 4 }}>
                <TextField
                    fullWidth
                    label="Tìm kiếm mã hoặc tên voucher"
                    variant="outlined"
                    size="medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Danh sách Voucher */}
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    {filteredVouchers.length > 0 ? (
                        filteredVouchers.map((voucher) => (
                            <VoucherCard 
                                key={voucher.code_id} 
                                voucher={voucher} 
                                onSaveVoucher={handleSaveVoucher} 
                                isSaved={savedVouchers.includes(voucher.code_id)}
                            />
                        ))
                    ) : (
                        <Alert severity="info">
                            Không tìm thấy voucher nào phù hợp.
                        </Alert>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default VoucherListPage;