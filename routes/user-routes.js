import express from 'express';
const userRouter = express.Router();
import { getAllUsers } from '../controllers/user-controller';
import { signUp } from '../controllers/user-controller';
import { login } from '../controllers/user-controller';
import { verifyToken } from '../controllers/user-controller';
import { deleteId } from '../controllers/user-controller';
import { refreshToken } from '../controllers/user-controller';
import { logout } from '../controllers/user-controller';
userRouter.get("/", getAllUsers);
userRouter.post("/signup", signUp);
userRouter.post("/login", login);
userRouter.delete("/:userId", verifyToken, deleteId);
userRouter.post("/refresh", refreshToken);
userRouter.post("/logout", verifyToken, logout);
export default userRouter;