import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  Link,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import momo from '../assets/momo.png';
import shipping_box from '../assets/shipping-box.png';
import vnpay from '../assets/vnpay.png';
import zalopay from '../assets/zalo_payv2.png';

interface PaymentMethodsProps {
  selectedMethod?: string;
  onMethodChange?: (value: string) => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  selectedMethod = 'cod',
  onMethodChange = () => {},
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onMethodChange(event.target.value);
  };

  const paymentMethods = [
    {
      id: 'cod',
      label: 'Thanh toán khi nhận hàng (COD)',
      image: shipping_box,
      bgColor: '#FFF0EA',
    },
    {
      id: 'bank',
      label: 'Thẻ ATM / Thẻ tín dụng / Ghi nợ',
      image: vnpay,
      bgColor: '#E3F2FD',
    },
    {
      id: 'zalopay',
      label: 'Ví điện tử ZaloPay',
      image: zalopay,
      bgColor: '#E1F5FE',
    },
    {
      id: 'momo',
      label: 'Ví MOMO',
      image: momo,
      bgColor: '#FCE4EC',
    },
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Chọn Hình thức thanh toán
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
          <RadioGroup value={selectedMethod} onChange={handlePaymentMethodChange}>
            {paymentMethods.map(method => (
              <Card
                key={method.id}
                variant="outlined"
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  borderColor: selectedMethod === method.id ? 'primary.main' : 'grey.300',
                  '&:hover': { borderColor: 'primary.main' },
                  transition: 'border-color 0.2s',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <FormControlLabel
                    value={method.id}
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          sx={{
                            p: 1,
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            backgroundColor: method.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={method.image}
                            alt={method.label}
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {method.label}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Bằng việc nhấn vào nút thanh toán trực tiếp bạn đã đồng ý với các{' '}
                <Link href="#" color="primary">
                  chính sách mua hàng
                </Link>
                ,{' '}
                <Link href="#" color="primary">
                  thanh toán
                </Link>{' '}
                và{' '}
                <Link href="#" color="primary">
                  chính sách bảo mật thông tin
                </Link>
              </Typography>
            }
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PaymentMethods;
