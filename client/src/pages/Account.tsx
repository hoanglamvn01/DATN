import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, CircularProgress, Snackbar,
  Stack, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, IconButton, Alert as MuiAlertOriginal, Autocomplete
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import type { AlertProps, AlertColor } from '@mui/material'; 
import addressData from '../data/vietnam_address.json'; // Dữ liệu địa chỉ

const MuiAlert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlertOriginal elevation={6} ref={ref} variant="filled" {...props} />;
});

interface UserFormData {
  full_name: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  address: string;
  ward: string;
  district: string;
  province: string;
}

interface LocationData {
  Id: string; Name: string;
  Districts?: LocationData[];
  Wards?: LocationData[];
}
interface DistrictData extends LocationData {}
interface WardData extends LocationData {}


const Account = () => {
  const { currentUser, logout, updateUser } = useAuth();
  
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    email: '',
    phone_number: '',
    gender: '',
    date_of_birth: '',
    address: '',
    ward: '',
    district: '',
    province: '',
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false, message: '', severity: 'success' as AlertColor,
  });
  const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [allProvinces] = useState<LocationData[]>(addressData);
  const [districtsOptions, setDistrictsOptions] = useState<DistrictData[]>([]);
  const [wardsOptions, setWardsOptions] = useState<WardData[]>([]);


  // useEffect chính để khởi tạo formData VÀ CẬP NHẬT OPTIONS CŨNG NHƯ RESET AUTOCOMPLETE
  useEffect(() => {
    console.log("[Account Init Effect] Running...");
    if (currentUser) {
      const initialFormData = { // Tạo một object tạm thời
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || '',
        gender: currentUser.gender || '',
        date_of_birth: currentUser.date_of_birth 
          ? new Date(currentUser.date_of_birth).toISOString().split('T')[0] 
          : '',
        address: currentUser.address || '',
        ward: currentUser.ward || '',
        district: currentUser.district || '',
        province: currentUser.province || '',
      };
      setFormData(initialFormData);
      
      console.log("[Account Init Effect] Initial formData after currentUser:", initialFormData);
      console.log("[Account Init Effect] All Provinces Data:", allProvinces); // ✅ LOG dữ liệu gốc

      // Logic cập nhật options và reset nếu giá trị cũ không khớp NGAY TẠI ĐÂY
      const currentProvinceName = initialFormData.province; // Dùng giá trị từ initialFormData
      const currentDistrictName = initialFormData.district;
      const currentWardName = initialFormData.ward;

      const foundProvince = allProvinces.find(p => p.Name === currentProvinceName);
      console.log("[Account Init Effect] Found Province object:", foundProvince); // ✅ LOG đối tượng tỉnh tìm được
      if (foundProvince) {
        setDistrictsOptions(foundProvince.Districts || []);
        const foundDistrict = foundProvince.Districts?.find(d => d.Name === currentDistrictName);
        console.log("[Account Init Effect] Found District object:", foundDistrict); // ✅ LOG đối tượng huyện tìm được
        if (foundDistrict) {
          setWardsOptions(foundDistrict.Wards || []);
        } else {
          setWardsOptions([]);
          // reset ward in form if not found in updated list
          setFormData(prev => ({ ...prev, district: '', ward: '' })); // Reset district và ward nếu district không khớp
        }
      } else {
        setDistrictsOptions([]);
        setWardsOptions([]);
        // reset province, district, ward in form if province not found
        setFormData(prev => ({ ...prev, province: '', district: '', ward: '' })); // Reset province nếu không tìm thấy
      }
    } else {
        // Reset form và options nếu không có currentUser
        setFormData({
            full_name: '', email: '', phone_number: '', gender: '', date_of_birth: '',
            address: '', ward: '', district: '', province: '',
        });
        setDistrictsOptions([]);
        setWardsOptions([]);
    }
  }, [currentUser, allProvinces]); // Depend on allProvinces as well, as it's the source data


  // ✅ useEffect riêng để cập nhật danh sách quận/huyện VÀ reset Autocomplete value khi cần (cho tương tác người dùng)
  // Chỉ chạy khi formData.province thay đổi (do người dùng chọn hoặc do useEffect trên reset)
  useEffect(() => {
    console.log("[Province Change Effect] formData.province changed:", formData.province);
    if (formData.province && allProvinces.length > 0) {
      const selectedProvinceObj = allProvinces.find(p => p.Name === formData.province);
      console.log("[Province Change Effect] Selected Province Obj:", selectedProvinceObj);
      setDistrictsOptions(selectedProvinceObj?.Districts || []);
      // Nếu huyện hiện tại không còn thuộc tỉnh đã chọn, hoặc tỉnh mới được chọn, reset huyện
      if (!selectedProvinceObj?.Districts?.some(d => d.Name === formData.district)) {
        setFormData(prev => ({ ...prev, district: '', ward: '' }));
      }
    } else if (!formData.province && districtsOptions.length > 0) { // Nếu tỉnh trống và đã có options huyện, reset
      setDistrictsOptions([]);
      setFormData(prev => ({ ...prev, district: '', ward: '' }));
    }
  }, [formData.province, allProvinces]); // Depend on allProvinces as well, for re-evaluation if data loads later

  // ✅ useEffect riêng để cập nhật danh sách phường/xã VÀ reset Autocomplete value khi cần (cho tương tác người dùng)
  // Chỉ chạy khi formData.district thay đổi (do người dùng chọn hoặc do useEffect trên reset)
  useEffect(() => {
    console.log("[District Change Effect] formData.district changed:", formData.district);
    if (formData.district && districtsOptions.length > 0) {
      const selectedDistrictObj = districtsOptions.find(d => d.Name === formData.district);
      console.log("[District Change Effect] Selected District Obj:", selectedDistrictObj);
      setWardsOptions(selectedDistrictObj?.Wards || []);
      // Nếu xã hiện tại không còn thuộc huyện đã chọn, hoặc huyện mới được chọn, reset xã
      if (!selectedDistrictObj?.Wards?.some(w => w.Name === formData.ward)) {
        setFormData(prev => ({ ...prev, ward: '' }));
      }
    } else if (!formData.district && wardsOptions.length > 0) { // Nếu huyện trống và đã có options xã, reset
      setWardsOptions([]);
      setFormData(prev => ({ ...prev, ward: '' }));
    }
  }, [formData.district, districtsOptions]);


  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | React.SyntheticEvent, value?: string | LocationData | null) => {
    if ('target' in e && 'name' in e.target) { // TextField hoặc Select
      const { name, value: inputValue } = e.target;
      setFormData(prev => ({ ...prev, [name]: inputValue }));
    } else { // Autocomplete
      const targetElement = e.target as HTMLElement;
      // Autocomplete TextField có id="fieldName-autocomplete-id"
      const inputElement = targetElement.closest('.MuiAutocomplete-root')?.querySelector('input');
      const inputId = inputElement?.id || (targetElement as HTMLInputElement).id;
      const fieldName = inputId ? inputId.split('-')[0] : '';
      
      console.log("Autocomplete - Target Element ID:", inputId);
      console.log("Autocomplete - Field Name:", fieldName);
      console.log("Autocomplete - Selected Value (raw):", value);

      if (fieldName) {
          const selectedValue = (value && typeof value === 'object' && 'Name' in value) ? value.Name : value;
          console.log("Autocomplete - Selected Value (processed):", selectedValue);

          setFormData(prev => {
              const newData = { ...prev, [fieldName]: selectedValue || '' };
              return newData;
          });
      }
    }
  };


  const handleUpdateProfile = async () => {
    if (!formData.full_name || !formData.phone_number) { 
      setSnackbar({ open: true, message: 'Họ tên và Số điện thoại không được để trống.', severity: 'warning' });
      return;
    }
    if (!formData.province || !formData.district || !formData.ward) {
        setSnackbar({ open: true, message: 'Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện, Phường/Xã.', severity: 'warning' });
        return;
    }

    setLoading(true);
    try {
      const res = await axios.put('http://localhost:3000/api/auth/me', formData); 
      
      if (res.data.user) {
        updateUser(res.data.user); 
      }
      
      setSnackbar({ open: true, message: res.data.message || 'Cập nhật thông tin thành công!', severity: 'success' });
    } catch (error: any) {
      console.error('Lỗi cập nhật thông tin:', error.response?.data || error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Cập nhật thông tin thất bại.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setSnackbar({ open: true, message: 'Vui lòng điền đủ Mật khẩu hiện tại, Mật khẩu mới và Xác nhận mật khẩu mới.', severity: 'warning' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSnackbar({ open: true, message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.', severity: 'warning' });
      return;
    }
    if (newPassword.length < 6) {
      setSnackbar({ open: true, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/auth/change-password', {
        email: currentUser?.email,
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      setSnackbar({ open: true, message: res.data.message || 'Đổi mật khẩu thành công!', severity: 'success' });
      setOpenChangePasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (error: any) {
      console.error('Lỗi đổi mật khẩu:', error.response?.data || error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Đổi mật khẩu thất bại.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', mt: 10 }}>
        <CircularProgress />
        <Typography variant="h6" ml={2}>Đang tải thông tin người dùng...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: { xs: 4, md: 16 }, p: { xs: 2, md: 4 }, bgcolor: '#ffffff', borderRadius: 2, boxShadow: 'rgba(0, 0, 0, 0.08) 0px 4px 12px' }}>
      <Typography variant="h4" fontWeight="bold" mb={4} textAlign="center" sx={{ color: '#333' }}>
        Quản lý tài khoản
      </Typography>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2, border: '1px solid #eee', boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px' }}>
        <Typography variant="h6" fontWeight="bold" mb={3} sx={{ color: '#555' }}>Thông tin cá nhân</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              label="Họ và tên"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              disabled={loading}
              required
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              label="Email (Không thể thay đổi)"
              name="email"
              value={formData.email}
              disabled
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              label="Số điện thoại"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              disabled={loading}
              required
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <FormControl fullWidth disabled={loading} variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
              <InputLabel>Giới tính</InputLabel>
              <Select
                label="Giới tính"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="">Chọn giới tính</MenuItem>
                <MenuItem value="Nam">Nam</MenuItem>
                <MenuItem value="Nữ">Nữ</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              
              label="Ngày sinh"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
          {/* ✅ Thay đổi Grid item của Địa chỉ chi tiết để chiếm hết chiều rộng nếu cần */}
          <Grid item xs={12} component="div">
            <TextField
              fullWidth
              label="Địa chỉ chi tiết (Số nhà, tên đường, thôn/ấp)"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>

          {/* Thay thế TextField bằng Autocomplete cho Tỉnh/Thành phố */}
          <Grid item xs={12} sm={6} component="div"> {/* sm=6 để 2 cột chiếm 12 trên màn hình lớn */}
            <Autocomplete
              fullWidth
              sx ={{ width: 270}}
              id="province-autocomplete"
              options={allProvinces}
              getOptionLabel={(option) => option.Name || ''}
              value={allProvinces.find(p => p.Name === formData.province) || null}
              onChange={handleChange}
              isOptionEqualToValue={(option, value) => option.Id === value.Id}
              renderInput={(params) => (
                <TextField {...params} label="Tỉnh/Thành phố" variant="outlined"
                  id="province"
                  name="province"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              )}
            />
          </Grid>
          {/* Thay thế TextField bằng Autocomplete cho Quận/Huyện */}
          <Grid item xs={12} sm={6} component="div"> {/* sm=6 để 2 cột chiếm 12 trên màn hình lớn */}
            <Autocomplete
              fullWidth
              sx ={{ width: 250}}
              id="district-autocomplete"
              options={districtsOptions}
              getOptionLabel={(option) => option.Name || ''}
              value={districtsOptions.find(d => d.Name === formData.district) || null}
              onChange={handleChange}
              isOptionEqualToValue={(option, value) => option.Id === value.Id}
              disabled={!formData.province}
              renderInput={(params) => (
                <TextField {...params} label="Quận/Huyện" variant="outlined"
                  id="district"
                  name="district"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              )}
            />
          </Grid>
          {/* Thay thế TextField bằng Autocomplete cho Phường/Xã */}
          <Grid item xs={12} component="div"> {/* xs=12 để chiếm toàn bộ hàng */}
            <Autocomplete
              fullWidth
              sx ={{ width: 250}}
              id="ward-autocomplete"
              options={wardsOptions}
              getOptionLabel={(option) => option.Name || ''}
              value={wardsOptions.find(w => w.Name === formData.ward) || null}
              onChange={handleChange}
              isOptionEqualToValue={(option, value) => option.Id === value.Id}
              disabled={!formData.district}
              renderInput={(params) => (
                <TextField {...params} label="Phường/Xã" variant="outlined"
                  id="ward"
                  name="ward"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              )}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          sx={{
            mt: 4,
            bgcolor: '#d81b60',
            color: '#fff',
            py: 1.2,
            fontWeight: 'bold',
            borderRadius: '8px',
            '&:hover': { bgcolor: '#c2185b' }
          }}
          onClick={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "CẬP NHẬT THÔNG TIN"}
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2, border: '1px solid #eee', boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px' }}>
        <Typography variant="h6" fontWeight="bold" mb={3} sx={{ color: '#555' }}>Bảo mật tài khoản</Typography>
        <Button
          variant="outlined"
          sx={{
            color: '#d81b60',
            borderColor: '#d81b60',
            py: 1.2,
            fontWeight: 'bold',
            borderRadius: '8px',
            '&:hover': { bgcolor: 'rgba(216, 27, 96, 0.05)', borderColor: '#c2185b' }
          }}
          onClick={() => setOpenChangePasswordDialog(true)}
          disabled={loading}
        >
          ĐỔI MẬT KHẨU
        </Button>
        <Button
          variant="outlined"
          color="error"
          sx={{
            ml: { xs: 0, sm: 2 },
            mt: { xs: 2, sm: 0 },
            py: 1.2,
            fontWeight: 'bold',
            borderRadius: '8px',
            borderColor: '#f44336',
            color: '#f44336',
            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.05)', borderColor: '#d32f2f' }
          }}
          onClick={logout}
          disabled={loading}
        >
          ĐĂNG XUẤT
        </Button>
      </Paper>

      {/* Dialog Đổi mật khẩu */}
      <Dialog open={openChangePasswordDialog} onClose={() => setOpenChangePasswordDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ bgcolor: '#d81b60', color: '#fff', pb: 1, position: 'relative' }}>
          <Typography variant="h6" fontWeight="bold">Đổi mật khẩu</Typography>
          <IconButton
            aria-label="close"
            onClick={() => setOpenChangePasswordDialog(false)}
            sx={{
              position: 'absolute', right: 8, top: 8, color: '#fff',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, pb: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth label="Mật khẩu hiện tại"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={loading}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth label="Mật khẩu mới"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth label="Xác nhận mật khẩu mới"
              type={showConfirmNewPassword ? 'text' : 'password'}
              value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} disabled={loading}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} edge="end">
                    {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenChangePasswordDialog(false)} variant="outlined" color="secondary" sx={{ borderRadius: '8px' }}>Hủy</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={loading} sx={{ borderRadius: '8px', bgcolor: '#d81b60', '&:hover': { bgcolor: '#c2185b' } }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "XÁC NHẬN"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Account;