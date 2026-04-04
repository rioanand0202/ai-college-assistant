const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const errorHandlerMiddleware = require("./src/middlewares/errorHandler.middleware");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
