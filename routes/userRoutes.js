const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const appointmentController = require("../controllers/appointmentController");
const User = require("../models/userModel");

const router = express.Router();

router.post("/signup", authController.signup(User));
router.post("/login", authController.login(User));
router.post("/forgotPassword", authController.forgotPassword(User));
router.patch("/resetPassword/:token", authController.resetPassword(User));
router.patch(
  "/updateMyPassword",
  authController.protect(User),
  authController.updateMyPassword(User),
);

router.patch(
  "/updateMe",
  authController.protect(User),
  userController.updateMe,
);
router.delete(
  "/deleteMe",
  authController.protect(User),
  userController.deleteMe,
);

router.post(
  "/requestAppointment",
  authController.protect(User),
  authController.restrictTo("user"),
  userController.requestAppointment,
  appointmentController.createAppointment,
);

router.get(
  "/myAppointments",
  authController.protect(User),
  authController.restrictTo("user"),
  userController.myAppointments,
);

router.use(authController.protect(User));
router.use(authController.restrictTo("admin"));
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
