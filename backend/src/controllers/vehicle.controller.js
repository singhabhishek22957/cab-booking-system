import supabase from "../config/supabaseClient.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const registerVehicle = async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, model, capacity } = req.body;
    const driverID = req.driver.driver_id;
    if (!driverID) {
      return res.status(400).json(new ApiError(400, "UnAuthorized"));
    }

    if ([vehicle_number, vehicle_type, model, capacity].includes("")) {
      return res.status(400).json(new ApiError(400, "All field are required"));
    }

    const { data: checkExistingVehicleData, error: checkExistingVehicleError } =
      await supabase
        .from("vehicles")
        .select("*")
        .eq("driver_id", driverID)
        .eq("vehicle_number", vehicle_number)
        .maybeSingle();

    if (checkExistingVehicleError) {
      return res
        .status(400)
        .json(new ApiError(400, checkExistingVehicleError.message));
    }

    if (checkExistingVehicleData) {
      return res
        .status(400)
        .json(new ApiError(400, "Vehicle already registered"));
    }

    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .insert({
        driver_id: driverID,
        vehicle_number,
        vehicle_type,
        model,
        capacity,
      });
    if (vehicleError) {
      return res.status(400).json(new ApiError(400, vehicleError.message));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Vehicle registered successfully"));
  } catch (error) {
    console.log("Error to register vehicle ");
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, model, capacity, vehicle_id } =
      req.body;
    const driverID = req.driver.driver_id;
    if (!driverID) {
      return res.status(400).json(new ApiError(400, "UnAuthorized"));
    }

    if (!vehicle_id) {
      return res.status(400).json(new ApiError(400, "id is required"));
    }

    const { data: checkExistingVehicleData, error: checkExistingVehicleError } =
      await supabase
        .from("vehicles")
        .select("*")
        .eq("driver_id", driverID)
        .neq("vehicle_id", vehicle_id)
        .eq("vehicle_number", vehicle_number)
        .maybeSingle();

    if (checkExistingVehicleError) {
      return res
        .status(400)
        .json(new ApiError(400, checkExistingVehicleError.message));
    }

    if (checkExistingVehicleData) {
      return res
        .status(400)
        .json(new ApiError(400, "Vehicle already registered"));
    }

    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .update({
        vehicle_number,
        vehicle_type,
        model,
        capacity,
      })
      .eq("vehicle_id", vehicle_id);
    if (vehicleError) {
      return res.status(400).json(new ApiError(400, vehicleError.message));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Vehicle updated successfully"));
  } catch (error) {
    console.log("Error to update vehicle details");
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const deleteVehicleById = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    if (!vehicleId) {
      return res.status(400).json(new ApiError(400, "Vehicle id is required"));
    }
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .delete()
      .eq("vehicle_id", vehicleId);
    if (vehicleError) {
      return res.status(400).json(new ApiError(400, vehicleError.message));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Vehicle deleted successfully"));
  } catch (error) {
    console.log("error to delete vehicle ");
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const getAllVehicleByDriverId = async (req, res) => {
  try {
    const driverId = req.driver.driver_id;
    if (!driverId) {
      return res.status(400).json(new ApiError(400, "UnAuthorized"));
    }
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", driverId);
    if (vehicleError) {
      return res.status(400).json(new ApiError(400, vehicleError.message));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Vehicles fetched successfully", vehicleData));
  } catch (error) {
    console.log("Error to fetch vehicle details");
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const getVehicleById = async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    if (!vehicleId) {
      return res.status(400).json(new ApiError(400, "vehicle id is required"));
    }
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("vehicle_id", vehicleId);
    if (vehicleError) {
      return res.status(400).json(new ApiError(400, vehicleError.message));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Vehicles fetched successfully", vehicleData));
  } catch (error) {
    console.log("Error to fetch vehicle details");
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const uploadToSupabase = async (file, filename) => {
  const filePath = file.path;
  const fileBuffer = fs.readFileSync(filePath);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("cab-booking-system")
    .upload(`vehicle_images/${filename}`, fileBuffer, {
      contentType: file.mimetype,
    });

  if (uploadError) throw uploadError;

  const { data: imageLinkData, error: imageLinkError } = await supabase.storage
    .from("cab-booking-system")
    .getPublicUrl(`vehicle_images/${filename}`);
  if (imageLinkError) throw imageLinkError;
  return imageLinkData.publicUrl;
};

const uploadVehicleOtherDetails = async (req, res) => {
  const { vehicleId } = req.params;
  if (req.files.length == 0) {
    return res.status(400).json(new ApiError(400, "Image is required"));
  }
  const front_image = req.files?.front_image?.[0];
  const back_image = req.files?.back_image?.[0];
  const left_side_image = req.files?.left_side_image?.[0];
  const right_side_image = req.files?.right_side_image?.[0];
  const rc_front_image = req.files?.rc_front_image?.[0];
  const rc_back_image = req.files?.rc_back_image?.[0];

  const front_image_path = front_image?.path;
  const back_image_path = back_image?.path;
  const left_side_image_path = left_side_image?.path;
  const right_side_image_path = right_side_image?.path;
  const rc_front_image_path = rc_front_image?.path;
  const rc_back_image_path = rc_back_image?.path;
  try {
    const front_image_link = front_image
      ? await uploadToSupabase(
          front_image,
          `${Date.now()}-${front_image.filename}`,
        )
      : null;
    const back_image_link = back_image
      ? await uploadToSupabase(
          back_image,
          `${Date.now()}-${back_image.filename}`,
        )
      : null;
    const left_side_image_link = left_side_image
      ? await uploadToSupabase(
          left_side_image,
          `${Date.now()}-${left_side_image.filename}`,
        )
      : null;
    const right_side_image_link = right_side_image
      ? await uploadToSupabase(
          right_side_image,
          `${Date.now()}-${right_side_image.filename}`,
        )
      : null;
    const rc_front_image_link = rc_front_image
      ? await uploadToSupabase(
          rc_front_image,
          `${Date.now()}-${rc_front_image.filename}`,
        )
      : null;
    const rc_back_image_link = rc_back_image
      ? await uploadToSupabase(
          rc_back_image,
          `${Date.now()}-${rc_back_image.filename}`,
        )
      : null;

    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .update({
        front_image: front_image_link,
        back_image: back_image_link,
        left_side_image: left_side_image_link,
        right_side_image: right_side_image_link,
        rc_front_image: rc_front_image_link,
        rc_back_image: rc_back_image_link,
      })
      .eq("vehicle_id", vehicleId);

    if (vehicleError) {
      return res.status(400).json(new ApiError(400, vehicleError.message));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Vehicle other details updated successfully"));
  } catch (error) {
    console.log("Error to upload vehicle images and rc");
    return res.status(500).json(new ApiError(500, error.message));
  } finally {
    if (front_image_path) fs.unlinkSync(front_image_path);
    if (back_image_path) fs.unlinkSync(back_image_path);
    if (left_side_image_path) fs.unlinkSync(left_side_image_path);
    if (right_side_image_path) fs.unlinkSync(right_side_image_path);
    if (rc_front_image_path) fs.unlinkSync(rc_front_image_path);
    if (rc_back_image_path) fs.unlinkSync(rc_back_image_path);
  }
};


const activeVehicle = async (req,res)=>{

    const {vehicleId} = req.params;

    try {

        const {data:vehicleData, error : vehicleError} = await supabase
        .from("vehicles")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .single();

        if(vehicleError){
            return res.status(400).json(new ApiError(400, vehicleError.message));
        }

        const vehicleNumber = vehicleData.vehicle_number;

        const {data:existingVehicleData, error:existingVehicleError} = await supabase
        .from("vehicles")
        .eq("vehicle_number", vehicleNumber)
        .eq("is_active", true)
        .single();

        
        if(existingVehicleError){
            return res.status(400).json(new ApiError(400, existingVehicleError.message));
        }

        if(existingVehicleData.length > 0){
            return res.status(400).json(new ApiError(400, "Vehicle is already active"));
        }

        const {data:vehicleUpdateData, error:vehicleUpdateError} = await supabase
        .from("vehicles")
        .update({is_active : true})
        .eq("vehicle_id", vehicleId);

        if(vehicleUpdateError){
            return res.status(400).json(new ApiError(400, vehicleUpdateError.message));
        }

        const {data:driverUpdateData, error:driverUpdateError} = await supabase
        .from("drivers")
        .update({"active_vehicle_id" : vehicleId})
        .eq("driver_id", vehicleData.driver_id);

        if(driverUpdateError){
            return res.status(400).json(new ApiError(400, driverUpdateError.message));
        }
        return res.status(200).json(new ApiResponse(200, "Vehicle activated successfully"));
        
    } catch (error) {
        console.log("error to activate vehicle");
        return res.status(500).json(new ApiError(500, error.message));
        
        
    }


}

export {
  registerVehicle,
  updateVehicle,
  deleteVehicleById,
  getAllVehicleByDriverId,
  getVehicleById,
  uploadVehicleOtherDetails,
  activeVehicle,
};
