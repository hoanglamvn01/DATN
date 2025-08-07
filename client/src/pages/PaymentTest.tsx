import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import PaymentMethods from '../pages/PaymentMethods';

const PaymentTest: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('cod');

  const handleMethodChange = (method: string) => {
    console.log('PaymentTest: Method changed to:', method);
    setSelectedMethod(method);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Test Payment Methods Component
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Current selected method: <strong>{selectedMethod}</strong>
      </Typography>

      <Button 
        variant="outlined" 
        onClick={() => setSelectedMethod('bank')}
        sx={{ mr: 2, mb: 2 }}
      >
        Set to VNPay
      </Button>
      
      <Button 
        variant="outlined" 
        onClick={() => setSelectedMethod('cod')}
        sx={{ mb: 2 }}
      >
        Set to COD
      </Button>

      <PaymentMethods 
        selectedMethod={selectedMethod}
        onMethodChange={handleMethodChange}
      />
    </Box>
  );
};

export default PaymentTest;