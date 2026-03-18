import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("./public/temp")) {
      fs.mkdirSync("./public/temp", { recursive: true });
    }
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const userEmail = req.user.user_id;
    const ext = file.originalname.split(".").pop();
    cb(null, `${userEmail}.${ext}`);
  },
});

export const upload_user_profile_image = multer({
  storage: storage,
});

// driver
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
     if (!fs.existsSync("./public/temp")) {
      fs.mkdirSync("./public/temp", { recursive: true });
    }
    console.log("I am in multer driver ");

    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    console.log("I am in multer driver filename function ");

    const userEmail = req.driver.driver_id;
    const ext = file.originalname.split(".").pop();
    cb(null, `${userEmail}.${ext}`);
  },
});

export const upload_driver_profile_image = multer({
  storage: storage1,
});


// for vehicle
const storageVehicle = multer.diskStorage({
  destination: function (req, file, cb) {
     const dir = "./public/uploads";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {

    const vehicleId = req.params.vehicleId;
    const ext = file.originalname.split(".").pop();
    let suffix = "";

    if (file.fieldname === "front_image") suffix = "front-image";
    if (file.fieldname === "back_image") suffix = "back-image";
    if (file.fieldname === "left_side_image") suffix = "left-side-image";
    if (file.fieldname === "right_side_image") suffix = "right-side-image";
    if (file.fieldname === "rc_front_image") suffix = "rc-front-image";
    if (file.fieldname === "rc_back_image") suffix = "rc-back-image";
    cb(null, `${vehicleId}-${suffix}.${ext}`);
  },
}); 

export const upload_vehicle_image = multer({
  storage: storageVehicle,
});



