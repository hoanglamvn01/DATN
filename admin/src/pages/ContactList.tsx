//Thư, trang liên hệ
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Snackbar, Alert, Typography, CircularProgress, Stack, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import axios from 'axios';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
}

const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchContacts = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/contact');
      setContacts(res.data);
    } catch (error) {
      console.error('Lỗi khi tải liên hệ:', error);
      setSnackbar({ open: true, message: 'Lỗi khi tải liên hệ', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/api/contact/${id}`);
      setSnackbar({ open: true, message: 'Đã xoá liên hệ', severity: 'success' });
      fetchContacts();
    } catch (error) {
      setSnackbar({ open: true, message: 'Xoá thất bại', severity: 'error' });
    }
  };

  const handleMarkAsDone = async (id: number) => {
    try {
      await axios.patch(`http://localhost:3000/api/contact/${id}`);
      setSnackbar({ open: true, message: 'Đã cập nhật trạng thái', severity: 'success' });
      fetchContacts();
    } catch (error) {
      setSnackbar({ open: true, message: 'Cập nhật thất bại', severity: 'error' });
    }
  };

  return (
    <div style={{ padding: 24 }}>
<Typography
  variant="h4"
  component="h1"
  gutterBottom
  sx={{
    mb: 4,
    fontWeight: 'bold',
    color: 'rgb(17, 82, 147)' // ✅ màu chị chọn
  }}
>
  Quản lý danh sách liên hệ
</Typography>

      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>STT</TableCell>
                <TableCell>Họ và tên</TableCell>
                <TableCell>SĐT</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Nội dung</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact, index) => (
                <TableRow key={contact.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.message}</TableCell>
                  <TableCell>{contact.status}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleDelete(contact.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                    {contact.status !== 'Đã xử lý' && (
                      <IconButton onClick={() => handleMarkAsDone(contact.id)} color="primary">
                        <DoneAllIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có liên hệ nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default ContactList;
