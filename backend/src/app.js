import dotenv from "dotenv";

dotenv.config();
import express from "express";
import cookieParser from 'cookie-parser'

const app = express();
console.log("checkong this  :", process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY);

app.use(express.json());
app.use(cookieParser())

app.get("/", (req, res) => {
  res.send(
    "I am Abhishek Kumar Singh, now I am going to work on  cab booking system for internship project. thankyou.",
  );
});

import userRouter from "./routes/user.route.js"
app.use("/user",userRouter);

export default app;
