import express from "express";
import { driverAuthentication } from "../middlewares/auth.middleware.js";
import {
  addDriverLicense,
  deleteDriverProfileImage,
  getDriver,
  loginDriver,
  logoutDriver,
  registerDriver,
  updateDriverLicense,
  updateDriverProfileImage,
  uploadDriverProfileImage,
} from "../controllers/driver.controller.js";
import {
  upload_driver_profile_image,
  upload_vehicle_image,
} from "../middlewares/multer.middleware.js";
import {
  activeVehicle,
  deleteVehicleById,
  getAllVehicleByDriverId,
  getVehicleById,
  registerVehicle,
  updateVehicle,
  uploadVehicleOtherDetails,
} from "../controllers/vehicle.controller.js";

const router = express.Router();

router.post("/", registerDriver);
router.post("/login", loginDriver);
router.get("/", driverAuthentication, getDriver);
router.get("/logout", driverAuthentication, logoutDriver);
router.post(
  "/upload-profile-image",
  driverAuthentication,
  upload_driver_profile_image.single("profile"),
  uploadDriverProfileImage,
);

router.put(
  "/update-profile-image",
  driverAuthentication,
  upload_driver_profile_image.single("profile"),
  updateDriverProfileImage,
);

router.delete(
  "/delete-profile-image",
  driverAuthentication,
  deleteDriverProfileImage,
);

router.post(
  "/add-driver-license",
  driverAuthentication,
  upload_driver_profile_image.single("license_image"),
  addDriverLicense,
);
router.put(
  "/update-driver-license",
  driverAuthentication,
  upload_driver_profile_image.single("license_image"),
  updateDriverLicense,
);

// vehicle routes

router.post("register-vehicle", driverAuthentication, registerVehicle);
router.put("update-vehicle", driverAuthentication, updateVehicle);
router.get("get-all-vehicle", driverAuthentication, getAllVehicleByDriverId);
router.get("/:vehicleId", getVehicleById);
router.delete("/:vehicleId", driverAuthentication, deleteVehicleById);
router.post(
  "/upload-vehicle-other-details",
  driverAuthentication,
  upload_vehicle_image.fields([
    { name: "front_image", maxCount: 1 },
    { name: "back_image", maxCount: 1 },
    { name: "left_side_image", maxCount: 1 },
    { name: "right_side_image", maxCount: 1 },
    { name: "rc_front_image", maxCount: 1 },
    { name: "rc_back_image", maxCount: 1 },
  ]),
  uploadVehicleOtherDetails,
);

router.get("/active-vehicle/:vehicleId", driverAuthentication, activeVehicle);

export default router;
