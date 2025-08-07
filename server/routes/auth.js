import express from 'express';
import { register, login, logout, requestOTP, verifyOTP, forgotPasswordRequestOtp, resetPassword, verifyOtpForResetPassword, changePassword, googleLogin } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import {getProfile, updateProfile} from '../controllers/userController.js'; 

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
//gmail xac nhan
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password-request-otp', forgotPasswordRequestOtp); //Yêu cầu OTP để đặt lại
router.post('/verify-otp-for-reset-password', verifyOtpForResetPassword); // Xác minh OTP cho đặt lại
router.post('/reset-password', resetPassword); //Đặt lại mật khẩu

router.get('/me', authMiddleware, getProfile); 
router.put('/me', authMiddleware, updateProfile); 
router.post('/change-password', authMiddleware, changePassword); 
router.post('/google-login', googleLogin); 

export default router;
