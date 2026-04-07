const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const errorHandlerMiddleware = require("./src/middlewares/errorHandler.middleware");
const { requestContextMiddleware } = require("./src/context/requestContext");
const activityLogMiddleware = require("./src/middlewares/activityLog.middleware");
const configureGooglePassport = require("./src/config/passport.google");

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

app.use(
  session({
    name: "aca.sid",
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: String(process.env.SESSION_COOKIE_SECURE || "").toLowerCase() === "true",
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
    },
  }),
);
configureGooglePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(requestContextMiddleware);
app.use(activityLogMiddleware);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

const ragService = require("./src/services/rag.service");
app.get("/api/health/chroma", async (req, res) => {
  try {
    await ragService.chromaHeartbeat();
    res.status(200).json({
      ok: true,
      url: ragService.getChromaServerUrl(),
    });
  } catch (e) {
    res.status(503).json({
      ok: false,
      url: ragService.getChromaServerUrl(),
      message: e?.message || "Chroma unreachable",
      hint:
        "Start Chroma with Docker from the server folder: npm run chroma:up. " +
        "POST /api/public/ask still returns 200 without Chroma unless PUBLIC_FALLBACK_OPENAI_ON_CHROMA_DOWN=false.",
    });
  }
});
app.use("/api/", require("./src/routes/index"));

app.use((req,res,next)=>{
    const err=new Error('Route Not Found')
    err.statusCode=404
    next(err)
})

app.use(errorHandlerMiddleware);

module.exports = app;
