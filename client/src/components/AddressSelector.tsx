// 📁 src/components/AddressSelector.tsx

import React, { useState, useEffect, useCallback } from 'react'; // ✅ SỬA 1: Xóa ", a," thừa
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Box, Typography, Radio, RadioGroup, FormControlLabel, Button, 
  Paper, CircularProgress, IconButton, Dialog, DialogActions, 
  DialogContent, DialogContentText, DialogTitle 
} from '@mui/material';
import CustomerForm, { type CustomerFormData } from './CustomerForm';
import { toast } from 'sonner';
import DeleteIcon from '@mui/icons-material/Delete';

export interface SavedAddress {
  address_id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  province: string;
  district: string;
  ward: string;
  address_line: string;
  is_default: boolean | number;
}

interface AddressSelectorProps {
  onAddressSelect: (addressData: SavedAddress | CustomerFormData | null) => void;
  selectedAddressId: string | null;
  onSetSelectedAddressId: (id: string | null) => void;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({ onAddressSelect, selectedAddressId, onSetSelectedAddressId }) => {
    const { currentUser } = useAuth();
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<SavedAddress | null>(null);

    const fetchAddresses = useCallback(() => {
        if (currentUser?.user_id) {
            setLoading(true);
            axios.get(`http://localhost:3000/api/addresses/${currentUser.user_id}`)
                .then(res => {
                    const addresses: SavedAddress[] = res.data;
                    setSavedAddresses(addresses);
                    const defaultAddress = addresses.find(addr => addr.is_default);

                    if (defaultAddress && !selectedAddressId) {
                        const defaultId = String(defaultAddress.address_id);
                        onSetSelectedAddressId(defaultId);
                        onAddressSelect(defaultAddress);
                    } else if (addresses.length === 0) {
                        setShowNewAddressForm(true);
                    }
                })
                .catch(() => toast.error("Không thể tải sổ địa chỉ."))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
            setShowNewAddressForm(true);
        }
    }, [currentUser, onAddressSelect, selectedAddressId, onSetSelectedAddressId]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleSelectAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
        const addressId = event.target.value;
        onSetSelectedAddressId(addressId);
        setShowNewAddressForm(false);
        const selected = savedAddresses.find(addr => String(addr.address_id) === addressId);
        if (selected) {
            onAddressSelect(selected);
        }
    };
    
    const handleNewFormChange = (formData: CustomerFormData) => {
        onSetSelectedAddressId(null);
        onAddressSelect(formData);
    };
    
    const handleOpenConfirmDialog = (address: SavedAddress) => {
        setAddressToDelete(address);
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = () => {
        setAddressToDelete(null);
        setOpenConfirmDialog(false);
    };

    const handleConfirmDelete = async () => {
        if (!addressToDelete) return;
        try {
            await axios.delete(`http://localhost:3000/api/addresses/${addressToDelete.address_id}`);
            toast.success("Đã xóa địa chỉ thành công.");
            setSavedAddresses(prev => prev.filter(addr => addr.address_id !== addressToDelete.address_id));
            if (String(addressToDelete.address_id) === selectedAddressId) {
                onSetSelectedAddressId(null);
                onAddressSelect(null);
            }
        } catch (error) {
            toast.error("Xóa địa chỉ thất bại.");
        } finally {
            handleCloseConfirmDialog();
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }

    if (savedAddresses.length === 0 && !showNewAddressForm) {
        return (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', mb: 3 }}>
                <Typography variant="body1" color="text.secondary">Bạn chưa có địa chỉ đã lưu nào.</Typography>
                <Button sx={{mt: 1}} type="button" onClick={() => setShowNewAddressForm(true)}>+ Thêm địa chỉ mới</Button>
            </Paper>
        );
    }

    return (
        <Box>
            {!showNewAddressForm && savedAddresses.length > 0 && (
                <RadioGroup value={selectedAddressId || ''} onChange={handleSelectAddress}>
                    {savedAddresses.map(addr => (
                        <Paper key={addr.address_id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                 <FormControlLabel 
                                    value={String(addr.address_id)} 
                                    control={<Radio />} 
                                    label={
                                        <Box>
                                            <Typography component="span" fontWeight="bold">{addr.full_name} - {addr.phone_number}</Typography>
                                            {addr.is_default ? <Typography component="span" color="primary.main" sx={{ml: 1}}>(Mặc định)</Typography> : ''}
                                            <Typography variant="body2" color="text.secondary">
                                                {`${addr.address_line}, ${addr.ward}, ${addr.district}, ${addr.province}`}
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ flexGrow: 1, mr: 1 }}
                                 />
                                 <IconButton 
                                    color="error" 
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenConfirmDialog(addr);
                                    }}
                                 >
                                    <DeleteIcon fontSize="small" />
                                 </IconButton>
                            </Box>
                        </Paper>
                    ))}
                </RadioGroup>
            )}

            {!showNewAddressForm && (
                <Button 
                    variant="outlined" 
                    onClick={() => {
                        setShowNewAddressForm(true);
                        onSetSelectedAddressId(null);
                        onAddressSelect(null);
                    }}
                    type="button"
                >
                    + Thêm địa chỉ giao hàng mới
                </Button>
            )}
            
            {showNewAddressForm && <CustomerForm onFormChange={handleNewFormChange} />}

            <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
            >
                <DialogTitle>Xác nhận xóa địa chỉ</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Chị có chắc chắn muốn xóa địa chỉ này không? Thao tác này không thể hoàn tác.
                        <br/>
                        <strong style={{ marginTop: '8px', display: 'block' }}>
                            {addressToDelete?.full_name} - {addressToDelete?.address_line}...
                        </strong>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} type="button">Hủy</Button>
                    <Button onClick={handleConfirmDelete} color="error" type="button" autoFocus>
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};