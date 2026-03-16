import express from 'express'
import { getUser, loginUser, logoutUser, registerUser } from '../controllers/user.controllers.js';
import { userAuthentication } from '../middlewares/auth.middleware.js';


const router = express.Router();



router.post("/",registerUser);
router.post("/login",loginUser)
router.get("/",userAuthentication,getUser)
router.get("/logout",userAuthentication,logoutUser)



export default router;