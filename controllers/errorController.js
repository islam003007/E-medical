const AppError = require("../utils/appError");

const handleJWTError = () =>
  new AppError("Invalid token! Please log in again.", 401);

const handleJWtExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input date. ${errors.join(". ")}.`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const errors = Object.entries(err.keyValue).map((el) => `${el[0]}: ${el[1]}`);
  let message = `Duplicate field ${errors.join(". ")}. Please use another value!`;
  if (errors.length === 1 && errors[0].startsWith("email"))
    message = "هذا البريد الالكتروني مسجل من قبل";
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log("Error 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") sendErrorDev(err, res);
  else if (process.env.NODE_ENV === "production") {
    let error = { ...err, name: err.name, message: err.message };
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWtExpiredError();

    sendErrorProd(error, res);
  }
};
