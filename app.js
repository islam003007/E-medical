const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { xss } = require("express-xss-sanitizer");
const mongoSanitize = require("express-mongo-sanitize");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const doctorRouter = require("./routes/doctorRoutes");
const appointmentRouter = require("./routes/appointmentRoutes");
const authController = require("./controllers/authController");
const User = require("./models/userModel");

const app = express();

// Setting security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Limiting requests
app.use(
  "/api",
  rateLimit({
    max: 10000,
    windowMs: 60 * 60 * 1000,
    message: "too many requests from this IP, please try again later!",
  }),
);

// body parser
app.use(express.json());

// Data sanitization against query injection
app.use(mongoSanitize());

// Data sanitization against xss
app.use(xss());

// Serving static files
app.use(express.static(`${__dirname}/public`));

// corse
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.all("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/img/idCards")) return next();
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(authController.protect(User), authController.restrictTo("admin"));
app.use(express.static(`${__dirname}/private`));
app.use(globalErrorHandler);

module.exports = app;
