import express from "express";
import {
  deleteProfileImage,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfileImage,
  uploadProfileImage,
} from "../controllers/user.controllers.js";
import { userAuthentication } from "../middlewares/auth.middleware.js";
import { upload_user_profile_image } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", loginUser);
router.get("/", userAuthentication, getUser);
router.get("/logout", userAuthentication, logoutUser);
router.post(
  "/upload-profile-image",
  userAuthentication,
  upload_user_profile_image.single("profile"),
  uploadProfileImage,
);

router.put(
  "/update-profile-image",
  userAuthentication,
  upload_user_profile_image.single("profile"),
  updateProfileImage,
);

router.delete("/delete-profile-image", userAuthentication, deleteProfileImage);

export default router;
