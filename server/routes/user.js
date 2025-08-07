import express from "express";
import { authMiddleware, checkRole } from "../middlewares/authMiddleware.js";
import { getUserProfile, updateUserProfile, getAllUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.get("/me", authMiddleware, getUserProfile);
userRoutes.put("/me", authMiddleware, updateUserProfile);
userRoutes.get("/", getAllUsers);
userRoutes.get("/:id", getUserById);
userRoutes.post("/", createUser);
userRoutes.put("/:id", updateUser);
userRoutes.delete("/:id", deleteUser);

export default userRoutes;

// import express from 'express';
// import { authMiddleware, checkRole } from '../middlewares/authMiddleware.js';
// import {
//   getAllUsers,
//   getUserById,
//   createUser,
//   updateUser,
//   deleteUser
// } from '../controllers/userController.js';
// const userRoutes = express.Router();


// userRoutes.get('/', authMiddleware, checkRole(['admin']), getAllUsers);
// userRoutes.get('/:id', authMiddleware, checkRole(['admin']), getUserById);
// userRoutes.post('/', authMiddleware, checkRole(['admin']), createUser);
// userRoutes.put('/:id', authMiddleware, checkRole(['admin']), updateUser);
// userRoutes.delete('/:id', authMiddleware, checkRole(['admin']), deleteUser);

// export default userRoutes;
