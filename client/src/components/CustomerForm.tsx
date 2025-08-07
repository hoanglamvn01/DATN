import {
  Autocomplete, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Grid, TextField, Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';

// Sử dụng file dữ liệu nội bộ để đảm bảo 100% ổn định
import addressData from '../data/vietnam_address.json';

// ===================================================================
// INTERFACES (ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU)
// ===================================================================

interface CustomerFormProps {
  onFormChange?: (data: CustomerFormData) => void;
  onSaveInfoChange?: (shouldSave: boolean) => void;
  initialShippingAddress?: {
    name: string; phone_number: string; email: string; address: string; province: string; district: string; ward: string; notes?: string;
  };
}

interface CustomerFormData {
  name: string; phone_number: string; email: string; address: string; province: string; district: string; ward: string; notes: string;
  save_info_for_next_time: boolean;
}

// Cấu trúc dữ liệu cho địa chỉ, khớp với file vietnam_address.json
interface LocationData {
  Id: string; Name: string;
  Districts: LocationData[];
  Wards: LocationData[];
}
interface DistrictData extends LocationData {}
interface WardData extends LocationData {}

// ===================================================================
// COMPONENT CustomerForm
// ===================================================================

const CustomerForm: React.FC<CustomerFormProps> = ({
  onFormChange = () => { }, onSaveInfoChange = () => { }
}) => {
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '', phone_number: '', email: '', address: '', province: '', district: '', ward: '', notes: '',
    save_info_for_next_time: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [allProvinces] = useState<LocationData[]>(addressData);
  const [districtsOptions, setDistrictsOptions] = useState<DistrictData[]>([]);
  const [wardsOptions, setWardsOptions] = useState<WardData[]>([]);

  useEffect(() => {
    if (formData.province && allProvinces.length > 0) {
      const selectedProvince = allProvinces.find(p => p.Name === formData.province);
      setDistrictsOptions(selectedProvince?.Districts || []);
    } else {
      setDistrictsOptions([]);
    }
  }, [formData.province, allProvinces]);

  useEffect(() => {
    if (formData.district && districtsOptions.length > 0) {
      const selectedDistrict = districtsOptions.find(d => d.Name === formData.district);
      setWardsOptions(selectedDistrict?.Wards || []);
    } else {
      setWardsOptions([]);
    }
  }, [formData.district, districtsOptions]);

  // ✨ SỬA LỖI Ở ĐÂY: Dùng đúng 'phone_number'
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || '', // Sửa 'phone' thành 'phone_number'
        address: currentUser.address || '',
        province: currentUser.province || '',
        district: currentUser.district || '',
        ward: currentUser.ward || '',
      }));
    }
  }, [currentUser]);

  // ✨ SỬA LỖI Ở ĐÂY: Dùng đúng 'phone_number'
  const validate = (field: keyof CustomerFormData, value: string): string => {
    if (!value && !['notes'].includes(field)) {
      return 'Vui lòng không để trống';
    }
    if (field === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      return 'Email không hợp lệ';
    }
    if (field === 'phone_number' && value && !/^(0[3|5|7|8|9])+([0-9]{8})\b/.test(value)) { // Sửa 'phone' thành 'phone_number'
      return 'Số điện thoại không hợp lệ';
    }
    return '';
  };

  const handleChange = useCallback((field: keyof CustomerFormData, value: string | boolean | LocationData | null) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (typeof value === 'object' && value !== null && 'Name' in value) {
        (newData as any)[field] = value.Name;
      } else {
        (newData as any)[field] = value;
      }
      if (field === 'province') {
        newData.district = '';
        newData.ward = '';
      } else if (field === 'district') {
        newData.ward = '';
      }
      if (onFormChange) onFormChange(newData);
      if (onSaveInfoChange && field === 'save_info_for_next_time') {
        onSaveInfoChange(value as boolean);
      }
      return newData;
    });

    if (typeof value === 'string') {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
  }, [onFormChange, onSaveInfoChange]);

  const primaryColor = theme.palette.primary.main;
  
  const standardTextFieldSx = {
    '& label.Mui-focused': { color: primaryColor },
    '& .MuiInput-underline:after': { borderBottomColor: primaryColor },
    '& .MuiInput-underline:before': { borderBottomColor: 'rgba(0, 0, 0, 0.23)' }, 
    '&:hover:not(.Mui-disabled):before': { borderBottomColor: primaryColor },
    '& .MuiInputLabel-root': { color: '#666' }, 
    '& .MuiFormHelperText-root': {
        position: 'absolute',
        bottom: -22,
        fontSize: '0.75rem',
    },
    '& .Mui-error:after': { borderBottomColor: theme.palette.error.main },
    '& .Mui-error .MuiInputLabel-root': { color: theme.palette.error.main },
  };

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 0, width: '74vh'}}>
      <CardContent sx={{ p: { xs: 2, md: 1 } }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth label="Email" variant="standard" value={formData.email} onChange={e => handleChange('email', e.target.value)}
            disabled={!!currentUser?.email} error={!!errors.email} helperText={errors.email} sx={{ ...standardTextFieldSx, mb: 2 }}
          />
        </Box>

        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mt: 2, mb: 3 }}>Địa chỉ giao hàng</Typography>
        
       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
  {/* Hàng 1: Họ và tên - SĐT */}
  <Grid container spacing={4}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth label="Họ và tên" variant="standard"
        value={formData.name} onChange={e => handleChange('name', e.target.value)}
          sx={{ ...standardTextFieldSx, minWidth: 220 }}
          error={!!errors.name}
          helperText={errors.name}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth label="Số điện thoại" variant="standard"
        value={formData.phone_number} onChange={e => handleChange('phone_number', e.target.value)}
          sx={{ ...standardTextFieldSx, minWidth: 220 }}
          error={!!errors.phone_number}
          helperText={errors.phone_number}

      />
    </Grid>
  </Grid>

  {/* Hàng 2: Tỉnh - Phường */}
  <Grid container spacing={4}>
    <Grid item xs={12} sm={6}>
      <Autocomplete
        fullWidth
        options={allProvinces}
        getOptionLabel={(option) => option.Name || ''}
        value={allProvinces.find(p => p.Name === formData.province) || null}
        onChange={(_e, newValue) => handleChange('province', newValue)}
        isOptionEqualToValue={(option, value) => option.Id === value.Id}
        renderInput={(params) => (
          <TextField {...params} label="Tỉnh/Thành phố" variant="standard"
            sx={{ ...standardTextFieldSx, minWidth: 220 }}
          error={!!errors.province}
          helperText={errors.province}
            
          />
        )}
      />
    </Grid>
      <Grid item xs={12} sm={6}>
      <Autocomplete
        fullWidth
        options={districtsOptions}
        getOptionLabel={(option) => option.Name || ''}
        value={districtsOptions.find(d => d.Name === formData.district) || null}
        onChange={(_e, newValue) => handleChange('district', newValue)}
        isOptionEqualToValue={(option, value) => option.Id === value.Id}
        disabled={!formData.province}
        renderInput={(params) => (
          <TextField {...params} label="Quận/Huyện" variant="standard"
          sx={{ ...standardTextFieldSx, minWidth: 220 }}
          error={!!errors.district}
          helperText={errors.district}
          />
        )}
      />
    </Grid>
  
  </Grid>

  {/* Hàng 3: Quận - Số nhà */}
  <Grid container spacing={4}>
     <Grid item xs={12} sm={6}>
      <Autocomplete
        fullWidth
        options={wardsOptions}
        getOptionLabel={(option) => option.Name || ''}
        value={wardsOptions.find(w => w.Name === formData.ward) || null}
        onChange={(_e, newValue) => handleChange('ward', newValue)}
        isOptionEqualToValue={(option, value) => option.Id === value.Id}
        disabled={!formData.district}
        renderInput={(params) => (
          <TextField {...params} label="Phường/Xã" variant="standard"
          sx={{ ...standardTextFieldSx, minWidth: 220 }}
          error={!!errors.ward}
          helperText={errors.ward}

          />
        )}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth label="Số nhà, tên đường" variant="standard"
        value={formData.address} onChange={e => handleChange('address', e.target.value)}
          sx={{ ...standardTextFieldSx, minWidth: 220 }}
          error={!!errors.address}
          helperText={errors.address}
      />
    </Grid>
  </Grid>
</Box>


        <FormControlLabel
          control={
            <Checkbox
              checked={formData.save_info_for_next_time}
              onChange={e => handleChange('save_info_for_next_time', e.target.checked)}
              sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
            />
          }
          label="Lưu thông tin cho lần thanh toán tiếp theo"
          sx={{ mt: 3 }}
        />
      </CardContent>
    </Card>
  );
};

export default CustomerForm;