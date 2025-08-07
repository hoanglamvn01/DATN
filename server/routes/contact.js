import express from 'express';
import { createContact, getAllContacts, deleteContact, updateContactStatus } from '../controllers/Contactform.js';

const ContactRoutes = express.Router();

ContactRoutes.post('/', createContact);
ContactRoutes.get('/', getAllContacts);
ContactRoutes.delete('/:id', deleteContact);
ContactRoutes.patch('/:id', updateContactStatus);
export default ContactRoutes;
