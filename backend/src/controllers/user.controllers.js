import supabase from "../config/supabaseClient.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import fs from "fs";

const registerUser = async (req, res) => {
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
      .from("users")
      .insert({
        user_id: authData.user.id,
        name,
        phone,
      });

    if (!newUserError) {
      return res
        .status(201)
        .json(
          new ApiResponse(201, "User registered successfully", newUserData),
        );
    }

    return res.status(400).json(new ApiError(400, newUserError.message));
  } catch (error) {
    console.log("Error to register user ", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal server Error in Registering user"));
  }
};

const loginUser = async (req, res) => {
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

    const userId = loginData.user.id;
    const token = loginData.session.access_token;
    const { data: loginUserData, error: loginUserError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (loginUserError) {
      return res.status(400).json(new ApiError(400, loginUserError.message));
    }

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // true in production
      maxAge: 15 * 60 * 1000,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "login successfully", loginUserData));
  } catch (error) {
    console.log("error to login ", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const getUser = async (req, res) => {
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, "User Fetch successfully ", user));
};

const uploadProfileImage = async (req, res) => {
  const profilePath = req.file.path;
  try {
    const profile = req.file;

    const fileName = `${Date.now()}-${profile.filename}`;
    const fileBuffer = fs.readFileSync(profile.path);
    console.log("filename:", fileName);

    console.log("mimetype:", profile.mimetype);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cab-booking-system")
      .upload(`user_profile_image/${fileName}`, fileBuffer, {
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
        .getPublicUrl(`user_profile_image/${fileName}`);

    if (imageLinkError) {
      return res.status(400).json(new ApiError(400, imageLinkError.message));
    }

    const profileImageUrl = imageLinkData.publicUrl;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({
        profile_image: profileImageUrl,
      })
      .eq("user_id", req.user.user_id);

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
    fs.unlinkSync(profilePath);
  }
};

const updateProfileImage = async (req, res) => {
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
    const oldUrl = req.user.profile_image.split("/");
    const oldUrlId = oldUrl[oldUrl.length - 1];

    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("cab-booking-system")
      .remove([`user_profile_image/${oldUrlId}`]);

    if (deleteError) {
      return res.status(400).json(new ApiError(400, deleteError.message));
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cab-booking-system")
      .upload(`user_profile_image/${fileName}`, fileBuffer, {
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
        .getPublicUrl(`user_profile_image/${fileName}`);

    if (imageLinkError) {
      return res.status(400).json(new ApiError(400, imageLinkError.message));
    }

    const profileImageUrl = imageLinkData.publicUrl;

    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({
        profile_image: profileImageUrl,
      })
      .eq("user_id", req.user.user_id);

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

const deleteProfileImage = async (req, res) => {
  try {
    if (!req.user.profile_image) {
      return res
        .status(400)
        .json(new ApiError(400, "Profile Image is required"));
    }
    const oldUrl = req.user.profile_image.split("/");
    const oldUrlId = oldUrl[oldUrl.length - 1];
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("cab-booking-system")
      .remove([`user_profile_image/${oldUrlId}`]);

    if (deleteError) {
      return res.status(400).json(new ApiError(400, deleteError.message));
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({
        profile_image: null,
      })
      .eq("user_id", req.user.user_id);

    if (userError) {
      return res.status(400).json(new ApiError(400, userError.message));
    }

    return res.status(200).json(new ApiResponse(200, "Profile image deleted"));
  } catch (error) {
    console.log("Error to delete profile image ", error);
    return res.status(400).json(new ApiError(400, error.message));
  }
};

const logoutUser = async (req, res) => {
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

export {
  registerUser,
  getUser,
  loginUser,
  logoutUser,
  uploadProfileImage,
  updateProfileImage,
  deleteProfileImage,
};
