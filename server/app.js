const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const errorHandlerMiddleware = require("./src/middlewares/errorHandler.middleware");
const { requestContextMiddleware } = require("./src/context/requestContext");
const activityLogMiddleware = require("./src/middlewares/activityLog.middleware");

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "user_id",
      "x-college-code",
      "college_code",
    ],
    exposedHeaders: ["Authorization"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestContextMiddleware);
app.use(activityLogMiddleware);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});
app.use("/api/", require("./src/routes/index"));

app.use((req,res,next)=>{
    const err=new Error('Route Not Found')
    err.statusCode=404
    next(err)
})

app.use(errorHandlerMiddleware);

module.exports = app;
