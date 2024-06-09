const multer = require("multer");
const cloudinary = require("cloudinary");
const path = require("path");
const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadCloudinary = async (pathFileTOUpload) => {
  try {
    const image = await cloudinary.uploader.upload(pathFileTOUpload, {
      resource_type: "auto",
    });
    return image;
  } catch (error) {
    return error;
  }
};

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not An image! Please upload only images", 400), false);
  }
};

const uploadPhoto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/img/doctors");
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
    },
  }),
  fileFilter: multerFilter,
});

const uploadIdCard = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "private/img/idCards");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `doctor-${req.body.email}-${Date.now()}.${ext}`);
    },
  }),
  fileFilter: multerFilter,
});

module.exports.UploadDoctorIdCard = uploadIdCard.single("photo");

module.exports.uploadMulter = uploadPhoto.single("photo");

module.exports.uploadDoctorPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const dir = path.join(__dirname, "../public/img/doctors", req.file.filename);
  const photoObj = await uploadCloudinary(dir);
  req.file.filename = photoObj.secure_url;
  next();
});

//secure_url

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  allowedFields.forEach((el) => {
    newObj[el] = obj[el];
  });
  return newObj;
};

module.exports.getAllDoctors = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Doctor.find({ confirmed: true }), req.query);
  features.filter().sort().limitFields().paginate();

  const doctors = await features.query.select("-idCard -email -role");

  res.status(200).json({
    status: "success",
    results: doctors.length,
    data: {
      doctors,
    },
  });
});

module.exports.getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).select(
    "-idCard -email -role",
  );
  if (!doctor) return next(new AppError("No doctor found with that ID", 404));

  if (!doctor.confirmed)
    return next(new AppError("This doctor is not confirmed yet", 401));

  res.status(200).json({
    status: "success",
    data: {
      doctor,
    },
  });
});

module.exports.getAllDoctorsAdmin = catchAsync(async (req, res, next) => {
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

module.exports.getDoctorAdmin = catchAsync(async (req, res, next) => {
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
    "phoneNumber",
    "scheduleStart",
    "scheduleEnd",
    "scheduleInterval",
    "clinic",
    "summary",
  );
  if (req.file) filteredBody.photo = req.file.filename;
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
      status: { $ne: "finished" },
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
        patientAge: req.body.patientAge,
        patientName: req.body.patientName,
        patientAddress: req.body.patientAddress,
        date: req.body.date,
      },
    },
    {
      new: true,
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

module.exports.viewAvailableAppointments = catchAsync(
  async (req, res, next) => {
    const doctor = await Doctor.findOne({ _id: req.params.id });
    let appointmentsDates;
    if (!doctor) return next(new AppError("No Doctor found with that id"));

    const appointments = await Appointment.find({
      doctor: doctor._id,
      status: "not finished",
      date: {
        $gte: new Date(),
      },
    });
    if (appointments) {
      appointmentsDates = appointments.map((el) => el.date);
    }
    res.status(200).json({
      status: "success",
      data: {
        scheduleStart: doctor.scheduleStart,
        scheduleEnd: doctor.scheduleEnd,
        scheduleInterval: doctor.scheduleInterval,
        appointments: appointmentsDates,
      },
    });
  },
);
