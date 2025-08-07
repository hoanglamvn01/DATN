// 📁 src/components/ContactForm.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ContactForm.css';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth

interface FormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

const ContactForm = () => {
  const { currentUser } = useAuth(); // ✅ Lấy thông tin người dùng
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState<string>('');

  // ✅ Dùng useEffect để điền thông tin người dùng khi component mount hoặc user thay đổi
  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.full_name || '',
        phone: currentUser.phone_number || '',
        email: currentUser.email || '',
        message: '',
      });
    }
  }, [currentUser]); // Chạy lại khi currentUser thay đổi

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const { name, phone, email, message } = form;

    if (!name.trim() || name.length < 2 || /\d/.test(name)) {
      setStatus('❌ Vui lòng nhập họ tên hợp lệ (không chứa số).');
      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      setStatus('❌ Số điện thoại phải có đúng 10 chữ số.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('❌ Email không hợp lệ.');
      return false;
    }

    if (!message.trim() || message.length < 10) {
      setStatus('❌ Nội dung cần ít nhất 10 ký tự.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('');

    if (!validateForm()) return;

    try {
      await axios.post('http://localhost:3000/api/contact', form);
      setStatus('✅ Gửi thành công! Cảm ơn bạn đã liên hệ.');
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      console.error('❌ Gửi lỗi:', error);
      setStatus('❌ Gửi thất bại. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="contact-container" style={{ marginTop: '80px' }}>
      <div className="contact-left">
        <h2>Liên hệ chúng tôi để được tư vấn</h2>
        <p>Đừng ngần ngại, chúng tôi luôn sẵn sàng đồng hành cùng bạn!</p>

        {status && <div className="form-status">{status}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Họ và tên"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="phone"
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <textarea
              name="message"
              placeholder="Nội dung"
              rows={4}
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">Gửi</button>
        </form>

        <div className="contact-info">
          <h3>THÔNG TIN LIÊN HỆ</h3>
          <div>
            <strong>Số điện thoại:</strong> 0775413664
            <button onClick={() => window.location.href = 'tel:0775413664'}>Gọi ngay</button>
          </div>
          <div>
            <strong>Email:</strong> Thuhapd10684@gmail.com
            <button onClick={() => window.location.href = 'mailto:Thuhapd10684@gmail.com'}>Gửi ngay</button>
          </div>
        </div>
      </div>

      <div className="contact-right">
        <img
          src="https://www.thebodyshop.com/cdn/shop/files/25Q3_SOL_TonkaGroup_CT10.jpg?v=1748356989&width=1000"
          alt="Contact"
          width={600}
        />
      </div>
    </div>
  );
};

export default ContactForm;