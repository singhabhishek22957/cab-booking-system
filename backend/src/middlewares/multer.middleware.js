import multer from 'multer'


const storage  = multer.diskStorage({
    destination: function (req,file,cb){
        cb(null, "./public/temp")
    } ,
    filename: function( req,file,cb){
        const userEmail = req.user.user_id;
         const ext = file.originalname.split(".").pop();
        cb(null, `${userEmail}.${ext}`)

    }
})

export const upload_user_profile_image = multer ({
    storage: storage,
})