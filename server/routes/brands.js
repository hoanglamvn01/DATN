import express from 'express';
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  updateBrand
} from '../controllers/brandController.js';
import upload from '../middlewares/upload.js';


const brandRoutes = express.Router();


brandRoutes.get('/', getAllBrands);
brandRoutes.post('/add', upload.single('logo'), createBrand);
brandRoutes.put('/update/:id', upload.single('logo'), updateBrand);
brandRoutes.delete('/delete/:id', deleteBrand);

export default brandRoutes;
