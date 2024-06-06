const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const Doctor = require("../models/doctorModel");

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

module.exports.signup = (Model) =>
  catchAsync(async (req, res, next) => {
    req.body.role = undefined;
    const newUser = await Model.create(req.body);

    createSendToken(newUser, 201, res);
  });

module.exports.login = (Model) =>
  catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError("Please provide email and password", 400));

    const user = await Model.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password)))
      return next(new AppError("Incorrect email or password", 401));

    createSendToken(user, 200, res);
  });

module.exports.protect = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1) get token and check if it is there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    )
      token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return next(
        new AppError(
          "You are not logged in! Please log in to get access.",
          401,
        ),
      );
    }

    // 2) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check if user still exists
    const user = await Model.findById(decoded.id);
    if (!user)
      return next(
        new AppError("The user the token belongs to no longer exists.", 401),
      );

    // 4) check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          "User recently changed Password! Please log in again.",
          401,
        ),
      );
    }

    req.user = user;
    next();
  });

module.exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    next();
  };
};

module.exports.forgotPassword = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await Model.findOne({ email: req.body.email });
    if (!user)
      return next(
        new AppError("There is no user with this email address", 404),
      );

    // 2) Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/${Model === Doctor ? "doctors" : "users"}/resetPassword/${resetToken}`;
    const message = `Forgot you password? Submit a PATCH request with you new password and password Confirm to:
${resetUrl}.\nIf you didn't forget you password, plaase ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message,
      });
      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch {
      user.passwordResetToken = undefined;
      user.PasswordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError("There was an error sending the email. Try again later!"),
        500,
      );
    }
  });

module.exports.resetPassword = (Model) =>
  catchAsync(async (req, res, next) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await Model.findOne({
      passwordResetToken: hashedToken,
      PasswordResetExpires: { $gt: Date.now() },
    });

    if (!user)
      return next(new AppError("Token is invalid or has expired", 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  });

module.exports.updateMyPassword = (Model) =>
  catchAsync(async (req, res, next) => {
    const user = await Model.findById(req.user.id).select("+password");

    if (!(await user.correctPassword(req.body.passwordCurrent)))
      return next(new AppError("Your current password is not correct", 401));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createSendToken(user, 200, res);
  });
