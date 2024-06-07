const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  allowedFields.forEach((el) => {
    newObj[el] = obj[el];
  });
  return newObj;
};

module.exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Doctor.find(), req.query);
  features.filter().sort().limitFields().paginate();

  const doctors = await features.query;

  res.status(200).json({
    status: "success",
    results: doctors.length,
    data: {
      doctors,
    },
  });
});

module.exports.getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) return next(new AppError("No doctor found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      doctor,
    },
  });
});

module.exports.createDoctor = catchAsync(async (req, res, next) => {
  const newDoctor = await Doctor.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      user: newDoctor,
    },
  });
});

// NOT FOR PASSWORDS!!!!
module.exports.updateDoctor = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        400,
      ),
    );

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doctor) return next(new AppError("No doctor found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      doctor,
    },
  });
});

module.exports.deleteDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) return next(new AppError("No doctor found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        400,
      ),
    );

  const filteredBody = filterObj(
    req.body,
    "name",
    "email",
    "photo",
    "phoneNumber",
    "scheduleStart",
    "scheduleEnd",
    "scheduleInterval",
    "clinic",
    "summary",
  );
  const updatedUser = await Doctor.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: "success",
    data: {
      doctor: updatedUser,
    },
  });
});

module.exports.deleteMe = catchAsync(async (req, res, next) => {
  await Doctor.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports.acceptAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findOneAndUpdate(
    {
      doctor: req.user._id,
      _id: req.body.appointment,
      status: "pending",
    },
    { status: "not finished" },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!appointment)
    return next(
      new AppError(
        "Appointment doesn't exist or you don't have permission to access it",
        400,
      ),
    );
  res.status(200).json({
    status: "success",
    data: {
      appointment,
    },
  });
});

module.exports.rejectAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findOneAndUpdate(
    {
      doctor: req.user._id,
      _id: req.body.appointment,
      status: "pending",
    },
    { status: "rejected" },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!appointment)
    return next(
      new AppError(
        "Appointment doesn't exist or you don't have permission to access it",
        400,
      ),
    );
  res.status(200).json({
    status: "success",
    data: {
      appointment,
    },
  });
});

module.exports.finishAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findOneAndUpdate(
    {
      doctor: req.user._id,
      _id: req.body.appointment,
      status: "not finished",
    },
    {
      status: "finished",
      examination: {
        diagnosis: req.body.diagnosis,
        prescription: req.body.prescription,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!appointment)
    return next(
      new AppError(
        "Appointment doesn't exist or you don't have permission to access it",
        400,
      ),
    );
  res.status(200).json({
    status: "success",
    data: {
      appointment,
    },
  });
});

module.exports.showMedicalHistory = catchAsync(async (req, res, next) => {
  let appointments = await Appointment.findOne({
    doctor: req.user.id,
    patient: req.params.id,
    status: "not finished",
  });

  if (!appointments)
    return next(
      new AppError(
        "patient does not exist or you do not have access to this patient's medical history",
      ),
    );

  appointments = await Appointment.find({
    patient: req.params.id,
    status: "finished",
  });

  res.status(200).json({
    status: "success",
    data: {
      appointments,
    },
  });
});

module.exports.myAppointments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Appointment.find(), req.query);
  features.filter().sort().limitFields().paginate();

  const appointments = await features.query.find({ doctor: req.user.id });

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: {
      appointments,
    },
  });
});

module.exports.availableDepartmentsAndLocations = (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      locations: ["أخميم", "سوهاج", "ساقلتة", "دار السلام", "طحطا", "طما"],
      departments: [
        "الأطفال",
        "القلب",
        "العيون",
        "الجراحة",
        "الأسنان",
        "العظام",
      ],
    },
  });
};
