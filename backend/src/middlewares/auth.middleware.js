import supabase from "../config/supabaseClient.js";
import ApiError from "../utils/apiError.js";

const userAuthentication = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization;

    if (!token) {
      return res.status(401).json(new ApiError(401, "You are not logged in"));
    }

    const { data, error } = await supabase.auth.getUser(token);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

      if (userError) {
      return res.status(401).json(new ApiError(401, "You are not logged in otherwise your not a Rider"));
    }
    const user = {
      ...userData,
      email: data.user.email,
    };

    if (error) {
      return res.status(401).json(new ApiError(401, "You are not logged in"));
    }

    // extend cookies timing out

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // at true in production
      maxAge: 15 * 60 * 1000,
    });

    req.user = user;
    next();
  } catch (error) {
    console.log("error in user authentication ");
    return res.status(500).json(new ApiError(500, error.message));
  }
};



const driverAuthentication = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization;

    if (!token) {
      return res.status(401).json(new ApiError(401, "You are not logged in"));
    }

    const { data, error } = await supabase.auth.getUser(token);

    const { data: userData, error: userError } = await supabase
      .from("drivers")
      .select("*")
      .eq("driver_id", data.user.id)
      .single();

    if (userError) {
      return res.status(401).json(new ApiError(401, "You are not logged in otherwise your not a driver"));
    }

    const driver = {
      ...userData,
      email: data.user.email,
    };

    if (error) {
      return res.status(401).json(new ApiError(401, "You are not logged in"));
    }

    // extend cookies timing out

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // at true in production
      maxAge: 60 * 60 * 1000,
    });
    console.log("Driver Authentication Pass");
    

    req.driver = driver;
    next();
  } catch (error) {
    console.log("error in driver authentication ");
    return res.status(500).json(new ApiError(500, error.message));
  }
};

export { userAuthentication, driverAuthentication };
