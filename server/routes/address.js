// 📁 routes/addressRoutes.js
import express from 'express';
import {
    getAddressesByUserId,
    addAddress,
    setDefaultAddress,
    deleteAddress,
    updateAddress
} from '../controllers/addressController.js';


const addressRoutes = express.Router();

// Get addresses for a user
addressRoutes.get('/:userId', getAddressesByUserId);

// Add a new address
addressRoutes.post('/', addAddress); // This is the critical line for the 404 error

// Set an address as default
addressRoutes.put('/:addressId/set-default', setDefaultAddress); // Changed to use addressId directly

// Delete an address
addressRoutes.delete('/:addressId', deleteAddress);

// Update an address
addressRoutes.put('/:addressId', updateAddress);

export default addressRoutes;