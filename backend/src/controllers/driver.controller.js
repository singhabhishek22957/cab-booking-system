import supabase from "../config/supabaseClient.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import fs from "fs";

const registerDriver = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    if (!name || !email || !phone || !password) {
      return res.status(400).json(new ApiError(400, "All field are required"));
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      return res.status(400).json(new ApiError(400, authError.message));
    }

    const { data: newUserData, error: newUserError } = await supabase
      .from("drivers")
      .insert({
        driver_id: authData.user.id,
        name,
        phone,
      });

    if (!newUserError) {
      return res
        .status(201)
        .json(
          new ApiResponse(201, "Driver registered successfully", newUserData),
        );
    }

    return res.status(400).json(new ApiError(400, newUserError.message));
  } catch (error) {
    console.log("Error to register Deriver ", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal server Error in Registering Driver"));
  }
};

const loginDriver = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json(new ApiError(400, "All field are required"));
    }

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      return res.status(400).json(new ApiError(400, loginError.message));
    }

    const driverId = loginData.user.id;
    const token = loginData.session.access_token;
    const { data: loginDriverData, error: loginDriverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("driver_id", driverId)
      .single();

    if (loginDriverError) {
      return res.status(400).json(new ApiError(400, loginDriverError.message));
    }

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // true in production
      maxAge: 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "login successfully", loginDriverData));
  } catch (error) {
    console.log("error to login ", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const getDriver = async (req, res) => {
  const driver = req.driver;
  return res
    .status(200)
    .json(new ApiResponse(200, "Driver Fetch successfully ", driver));
};

const uploadDriverProfileImage = async (req, res) => {
  const profilePath = req.file.path;
  try {
    const profile = req.file;

    const fileName = `${Date.now()}-${profile.filename}`;
    const fileBuffer = fs.readFileSync(profile.path);
    console.log("filename:", fileName);

    console.log("mimetype:", profile.mimetype);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cab-booking-system")
      .upload(`driver_profile_image/${fileName}`, fileBuffer, {
        contentType: profile.mimetype,
      });

    console.log("Upload error ", uploadError);

    if (uploadError) {
      return res
        .status(400)
        .json(new ApiError(400, `from image uploading ${uploadError.message}`));
    }

    const { data: imageLinkData, error: imageLinkError } =
      await supabase.storage
        .from("cab-booking-system")
        .getPublicUrl(`driver_profile_image/${fileName}`);

    if (imageLinkError) {
      return res.status(400).json(new ApiError(400, imageLinkError.message));
    }

    const profileImageUrl = imageLinkData.publicUrl;

    const { data: userData, error: userError } = await supabase
      .from("drivers")
      .update({
        driver_photo: profileImageUrl,
      })
      .eq("driver_id", req.driver.driver_id)
      .single();

    if (userError) {
      return res.status(400).json(new ApiError(400, userError.message));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, "profile image upload successfully", userData),
      );
  } catch (error) {
    console.log("Error to upload profile image ");
    return res.status(500).json(new ApiError(500, error.message));
  } finally {
    if (profilePath) fs.unlinkSync(profilePath);
  }
};

const updateDriverProfileImage = async (req, res) => {
  const profile = req.file;
  const profilePath = req.file.path;
  const fileName = `${Date.now()}-${profile.filename}`;
  const fileBuffer = fs.readFileSync(profile.path);
  try {
    if (!profile) {
      return res
        .status(400)
        .json(new ApiError(400, "Profile Image is required"));
    }
    const oldUrl = req.driver.driver_photo.split("/");
    const oldUrlId = oldUrl[oldUrl.length - 1];

    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("cab-booking-system")
      .remove([`driver_profile_image/${oldUrlId}`]);

    if (deleteError) {
      return res.status(400).json(new ApiError(400, deleteError.message));
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cab-booking-system")
      .upload(`driver_profile_image/${fileName}`, fileBuffer, {
        contentType: profile.mimetype,
      });

    if (uploadError) {
      return res
        .status(400)
        .json(new ApiError(400, `from image uploading ${uploadError.message}`));
    }

    const { data: imageLinkData, error: imageLinkError } =
      await supabase.storage
        .from("cab-booking-system")
        .getPublicUrl(`driver_profile_image/${fileName}`);

    if (imageLinkError) {
      return res.status(400).json(new ApiError(400, imageLinkError.message));
    }

    const profileImageUrl = imageLinkData.publicUrl;

    const { data: userData, error: userError } = await supabase
      .from("drivers")
      .update({
        driver_photo: profileImageUrl,
      })
      .eq("driver_id", req.driver.driver_id);

    if (userError) {
      return res.status(400).json(new ApiError(400, userError.message));
    }

    return res.status(200).json(new ApiResponse(200, "Profile image updated"));
  } catch (error) {
    console.log("Error to update profile image ", error);
    return res.status(400).json(new ApiError(400, error.message));
  } finally {
    if (profilePath) {
      fs.unlinkSync(profilePath);
    }
  }
};

const deleteDriverProfileImage = async (req, res) => {
  try {
    if (!req.driver.driver_photo) {
      return res
        .status(400)
        .json(new ApiError(400, "Profile Image is driver side  required"));
    }
    const oldUrl = req.driver.driver_photo.split("/");
    const oldUrlId = oldUrl[oldUrl.length - 1];
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("cab-booking-system")
      .remove([`driver_profile_image/${oldUrlId}`]);

    if (deleteError) {
      return res.status(400).json(new ApiError(400, deleteError.message));
    }

    const { data: userData, error: userError } = await supabase
      .from("drivers")
      .update({
        driver_photo: null,
      })
      .eq("driver_id", req.driver.driver_id);

    if (userError) {
      return res.status(400).json(new ApiError(400, userError.message));
    }

    return res.status(200).json(new ApiResponse(200, "Profile image deleted"));
  } catch (error) {
    console.log("Error to delete profile image ", error);
    return res.status(400).json(new ApiError(400, error.message));
  }
};

const logoutDriver = async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      await supabase.auth.signOut(token);
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false, // true at production
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.log("Error to logout ", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const addDriverLicense = async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiError(400, "License image is required"));
  }
  const { licenseNumber } = req.body;
  console.log("file ", req.file);
  console.log("body", req.body);
  const license_image = req.file;
  const license_image_path = req.file.path;
  try {
    const fileName = `${Date.now()}-${license_image.filename}`;
    const fileBuffer = fs.readFileSync(license_image_path);
    const driverId = req.driver.driver_id;
    if (!driverId) {
      return res.status(400).json(new ApiError(400, "Driver not found"));
    }

    if(req.driver.license_number && req.driver.license_photo) {
      return res.status(400).json(new ApiError(400, "Driver license already added"));
    }

    if (!licenseNumber || !license_image) {
      return res.status(400).json(new ApiError(400, "All field are required"));
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cab-booking-system")
      .upload(`driver_license/${fileName}`, fileBuffer, {
        contentType: license_image.mimetype,
      });

    if (uploadError) {
      return res
        .status(400)
        .json(new ApiError(400, `from image uploading ${uploadError.message}`));
    }

    const { data: imageLinkData, error: imageLinkError } =
      await supabase.storage
        .from("cab-booking-system")
        .getPublicUrl(`driver_license/${fileName}`);

    if (imageLinkError) {
      return res.status(400).json(new ApiError(400, imageLinkError.message));
    }

    const licenseImageUrl = imageLinkData.publicUrl;

    const { data: userData, error: userError } = await supabase
      .from("drivers")
      .update({
        license_number: licenseNumber,
        license_photo: licenseImageUrl,
      })
      .eq("driver_id", driverId);

    if (userError) {
      return res.status(400).json(new ApiError(400, userError.message));
    }

    return res.status(200).json(new ApiResponse(200, "Driver license added"));
  } catch (error) {
    console.log("Error to adding driver license ");
    return res.status(500).json(new ApiError(500, error.message));
  }finally {
    if (license_image_path) {
      fs.unlinkSync(license_image_path);
    }
  }
};

const updateDriverLicense = async (req, res) => {
  const { licenseNumber } = req.body;
  const license_image = req.file;
  const license_image_path = license_image.path;

  try {
    const fileName = `${Date.now()}-${license_image.filename}`;
    const fileBuffer = fs.readFileSync(license_image_path);
    const driverId = req.driver.driver_id;
    if (!driverId) {
      return res.status(400).json(new ApiError(400, "Driver not found"));
    }

    if(!req.driver.license_number && !req.driver.license_photo) {
      return res.status(400).json(new ApiError(400, "Driver license not found"));
    }

    if (!licenseNumber || !license_image) {
      return res.status(400).json(new ApiError(400, "All field are required"));
    }
    console.log("license image", req.driver.license_photo);
    
    const OldLicenseImage = req.driver.license_photo.split("/");
    const OldLicenseImageId = OldLicenseImage[OldLicenseImage.length - 1];

    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("cab-booking-system")
      .remove([`driver_license/${OldLicenseImageId}`]);

    if (deleteError) {
      return res.status(400).json(new ApiError(400, deleteError.message));
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cab-booking-system")
      .upload(`driver_license/${fileName}`, fileBuffer, {
        contentType: license_image.mimetype,
      });

    if (uploadError) {
      return res
        .status(400)
        .json(new ApiError(400, `from image uploading ${uploadError.message}`));
    }

    const { data: imageLinkData, error: imageLinkError } =
      await supabase.storage
        .from("cab-booking-system")
        .getPublicUrl(`driver_license/${fileName}`);

    if (imageLinkError) {
      return res.status(400).json(new ApiError(400, imageLinkError.message));
    }

    const licenseImageUrl = imageLinkData.publicUrl;

    const { data: userData, error: userError } = await supabase
      .from("drivers")
      .update({
        license_number: licenseNumber,
        license_photo: licenseImageUrl,
      })
      .eq("driver_id", driverId);

    if (userError) {
      return res.status(400).json(new ApiError(400, userError.message));
    }

    return res.status(200).json(new ApiResponse(200, "Driver license updated"));
  } catch (error) {
    console.log("Error to Updating  driver license ");
    return res.status(500).json(new ApiError(500, error.message));
  }finally {
    if (license_image_path) {
      fs.unlinkSync(license_image_path);
    }
  }
};

export {
  registerDriver,
  getDriver,
  loginDriver,
  logoutDriver,
  uploadDriverProfileImage,
  updateDriverProfileImage,
  deleteDriverProfileImage,
  addDriverLicense,
  updateDriverLicense,
};
