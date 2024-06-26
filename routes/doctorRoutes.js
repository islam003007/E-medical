const express = require("express");
const doctorController = require("../controllers/doctorController");
const authController = require("../controllers/authController");
const Doctor = require("../models/doctorModel");
const User = require("../models/userModel");

const router = express.Router();

router.post(
  "/signup",
  doctorController.UploadDoctorIdCard,
  authController.signup(Doctor),
);
router.post("/login", authController.login(Doctor));
router.post("/forgotPassword", authController.forgotPassword(Doctor));
router.patch("/resetPassword/:token", authController.resetPassword(Doctor));
router.get(
  "/departmentsAndLocations",
  doctorController.availableDepartmentsAndLocations,
);
router.patch(
  "/updateMyPassword",
  authController.protect(Doctor),
  authController.updateMyPassword(Doctor),
);

router.patch(
  "/updateMe",
  authController.protect(Doctor),
  doctorController.uploadMulter,
  doctorController.uploadDoctorPhoto,
  doctorController.updateMe,
);

router.delete(
  "/deleteMe",
  authController.protect(Doctor),
  doctorController.deleteMe,
);

router.post(
  "/acceptAppointment",
  authController.protect(Doctor),
  authController.restrictTo("doctor"),
  doctorController.acceptAppointment,
);

router.post(
  "/rejectAppointment",
  authController.protect(Doctor),
  authController.restrictTo("doctor"),
  doctorController.rejectAppointment,
);

router.post(
  "/finishAppointment",
  authController.protect(Doctor),
  authController.restrictTo("doctor"),
  doctorController.finishAppointment,
);

router.get(
  "/:id/showMedicalHistory",
  authController.protect(Doctor),
  authController.restrictTo("doctor"),
  doctorController.showMedicalHistory,
);

router.get(
  "/myAppointments",
  authController.protect(Doctor),
  authController.restrictTo("doctor"),
  doctorController.myAppointments,
);

router.get(
  "/admin",
  authController.protect(User),
  authController.restrictTo("admin"),
  doctorController.getAllDoctorsAdmin,
);

router.get(
  "/:id/admin",
  authController.protect(User),
  authController.restrictTo("admin"),
  doctorController.getDoctorAdmin,
);

router.get(
  "/:id/availableAppointments",
  doctorController.viewAvailableAppointments,
);

router.get("/", doctorController.getAllDoctors);
router.get("/:id", doctorController.getDoctor);

router.use(authController.protect(User));
router.use(authController.restrictTo("admin"));
router.route("/").post(doctorController.createDoctor);
router
  .route("/:id")
  .patch(doctorController.updateDoctor)
  .delete(doctorController.deleteDoctor);

module.exports = router;
