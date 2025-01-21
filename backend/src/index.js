import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors"
import cron from "node-cron"
import fs from "fs"

import { clerkMiddleware }from "@clerk/express"
import userRoutes from "./routes/user.route.js"
import adminRoutes from "./routes/admin.route.js"
import authRoutes from "./routes/auth.route.js"
import songRoutes from "./routes/song.route.js"
import albumRoutes from "./routes/album.route.js"
import statRoutes from "./routes/stat.route.js"
import { connectDB } from "./lib/db.js";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import { initializeSocket } from "./lib/socket.js";
// it is mandatory to import dotenv and run its funtion to get the values of the environment variables
dotenv.config();

const app = express();
const __dirname=path.resolve();
const PORT = process.env.PORT;

const httpServer = createServer(app);
initializeSocket(httpServer)

app.use(cors(
  {
    origin:"http://localhost:3000",
    credentials: true,
  }
));

app.use(express.json());// to parse req.body or json data

app.use(clerkMiddleware())// this will add auth to req obj=> req.auth.userid to get id of logged in user 

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname,"tmp"),
  createParentPath: true,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
})
);

const tempDir = path.join(process.cwd(),"tmp");
// cron jobs : to delete temp files on timely basis and to delete expired sessions
cron.schedule("0 0 * * *", () => {
  if(fs.existsSync(tempDir)){
    fs.readdir(tempDir,(err,files)=>{
      if(err){
        console.log("Error in deleting temp files",err);
        return
      }
      for(const file of files){
        fs.unlink(path.join(tempDir,file),(err)=>{})
      }
    })
  }
})

app.use("/api/users",userRoutes)
app.use("/api/auth",authRoutes)
app.use("/api/admin",adminRoutes)
app.use("/api/songs",songRoutes)
app.use("/api/albums",albumRoutes)
app.use("/api/stats",statRoutes)

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname,"../frontend/dist")));
  app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"../frontend","dist","index.html"));
  });
}

// error handler 
app.use((err,req,res,next)=>{
  res.status(500).json({ message: process.env.NODE_ENV === "production"? "Internal server error" : err.message });
})


httpServer.listen(PORT, ()=>{
  console.log("Server running on port : "+PORT);
  connectDB()
})

// todo : socket.io implementation 