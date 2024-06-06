const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const authController = require("../controllers/authController");
const User = require("../models/userModel");

const router = express.Router();

router.use(authController.protect(User));
router.use(authController.restrictTo("admin"));
router
  .route("/")
  .get(appointmentController.getAllAppointments)
  .post(appointmentController.createAppointment);
router
  .route("/:id")
  .get(appointmentController.getAppointment)
  .patch(appointmentController.updateAppointment)
  .delete(appointmentController.deleteAppointment);

module.exports = router;
