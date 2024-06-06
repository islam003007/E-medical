const Appointment = require("../models/appointmentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

module.exports.getAllAppointments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Appointment.find(), req.query);
  features.filter().sort().limitFields().paginate();

  const appointments = await features.query;

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: {
      appointments,
    },
  });
});

module.exports.getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment)
    return next(new AppError("No appointment found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      appointment,
    },
  });
});

module.exports.createAppointment = catchAsync(async (req, res, next) => {
  const newAppointment = await Appointment.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      user: newAppointment,
    },
  });
});

module.exports.updateAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!appointment)
    return next(new AppError("No appointment found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: {
      appointment,
    },
  });
});

module.exports.deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment)
    return next(new AppError("No appointment found with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports.userGetAllAppointments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Appointment.find(), req.query);
  features.filter().sort().limitFields().paginate();

  const appointments = await features.query.find({ patient: req.user.id });

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: {
      appointments,
    },
  });
});

module.exports.doctorGetAllAppointments = catchAsync(async (req, res, next) => {
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
