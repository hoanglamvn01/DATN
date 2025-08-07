// src/pages/SettingsPage.tsx
import React, { useState, useContext, useEffect } from 'react';
import type { SyntheticEvent } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Stack, Tabs, Tab, Snackbar, Alert, useTheme,
  FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import KeyIcon from '@mui/icons-material/Key';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { ThemeContext } from '../context/ThemeContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export default function SettingsPage() {
  const theme = useTheme();
  const { toggleColorMode, mode } = useContext(ThemeContext);

  // Tabs
  const [currentTab, setCurrentTab] = useState(0);

  // Profile
  const [profileData, setProfileData] = useState({
    name: 'Tên Người Dùng Hiện Tại',
    email: 'emailhientai@example.com',
  });

  // Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      emailNotifications: true,
      smsNotifications: false,
      appNotifications: true,
    };
  });
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Handlers
  const handleTabChange = (_: SyntheticEvent, newValue: number) => setCurrentTab(newValue);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings((prev: typeof notificationSettings) => ({ ...prev, [name]: checked }));
  };

  const handleDisplayChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    if (e.target.name === 'themeMode') toggleColorMode();
  };

  const handleSaveProfile = () => {
    // Gửi API ở đây nếu cần
    setSnackbarMessage('Thông tin cá nhân đã được cập nhật thành công!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleChangePassword = () => {
    const { currentPassword, newPassword, confirmNewPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setSnackbarMessage('Vui lòng điền đầy đủ tất cả các trường.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSnackbarMessage('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (newPassword.length < 6) {
      setSnackbarMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setSnackbarMessage('Mật khẩu đã được thay đổi thành công!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  };

  const handleSaveNotifications = () => {
    setSnackbarMessage('Cài đặt thông báo đã được lưu thành công!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleSaveDisplaySettings = () => {
    setSnackbarMessage('Cài đặt hiển thị đã được lưu thành công!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.primary.dark }}>
        Cài đặt
      </Typography>
      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="Thông tin chung" icon={<AccountCircleIcon />} iconPosition="start" {...a11yProps(0)} />
            <Tab label="Bảo mật" icon={<KeyIcon />} iconPosition="start" {...a11yProps(1)} />
            <Tab label="Thông báo" icon={<NotificationsIcon />} iconPosition="start" {...a11yProps(2)} />
            <Tab label="Hiển thị" icon={mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />} iconPosition="start" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {/* Tab 1: Thông tin chung */}
        <CustomTabPanel value={currentTab} index={0}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Cập nhật thông tin cá nhân
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Tên Người Dùng"
              name="name"
              variant="outlined"
              fullWidth
              value={profileData.name}
              onChange={handleProfileChange}
            />
            <TextField
              label="Email"
              name="email"
              variant="outlined"
              fullWidth
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              sx={{ alignSelf: 'flex-start' }}
            >
              Lưu thay đổi
            </Button>
          </Stack>
        </CustomTabPanel>

        {/* Tab 2: Bảo mật */}
        <CustomTabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Thay đổi mật khẩu
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Mật khẩu hiện tại"
              name="currentPassword"
              variant="outlined"
              fullWidth
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
            <TextField
              label="Mật khẩu mới"
              name="newPassword"
              variant="outlined"
              fullWidth
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              name="confirmNewPassword"
              variant="outlined"
              fullWidth
              type="password"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<KeyIcon />}
              onClick={handleChangePassword}
              sx={{ alignSelf: 'flex-start' }}
            >
              Đổi mật khẩu
            </Button>
          </Stack>
        </CustomTabPanel>

        {/* Tab 3: Thông báo */}
        <CustomTabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Cài đặt thông báo
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onChange={handleNotificationChange}
                  name="emailNotifications"
                />
              }
              label="Nhận thông báo qua Email"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onChange={handleNotificationChange}
                  name="smsNotifications"
                />
              }
              label="Nhận thông báo qua SMS"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.appNotifications}
                  onChange={handleNotificationChange}
                  name="appNotifications"
                />
              }
              label="Nhận thông báo trong ứng dụng"
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveNotifications}
              sx={{ alignSelf: 'flex-start', mt: 3 }}
            >
              Lưu cài đặt thông báo
            </Button>
          </Stack>
        </CustomTabPanel>

        {/* Tab 4: Hiển thị */}
        <CustomTabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Cài đặt hiển thị và giao diện
          </Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel id="theme-mode-select-label">Chế độ hiển thị</InputLabel>
              <Select
                labelId="theme-mode-select-label"
                id="theme-mode-select"
                value={mode}
                label="Chế độ hiển thị"
                onChange={handleDisplayChange}
                name="themeMode"
              >
                <MenuItem value={'light'}>
                  <LightModeIcon sx={{ mr: 1 }} /> Chế độ sáng
                </MenuItem>
                <MenuItem value={'dark'}>
                  <DarkModeIcon sx={{ mr: 1 }} /> Chế độ tối
                </MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveDisplaySettings}
              sx={{ alignSelf: 'flex-start' }}
            >
              Lưu cài đặt hiển thị
            </Button>
          </Stack>
        </CustomTabPanel>
      </Paper>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
