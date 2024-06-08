const mongoose = require("mongoose");

const appointmentSchema = mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "An appointment must have a patient"],
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: "Doctor",
    required: [true, "An appointment must have a doctor"],
  },
  date: {
    type: Date,
    required: [true, "An appointment must have a date"],
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "rejected", "not finished", "finished"],
      message:
        "status must either be pending, rejected, not finished or finished",
    },
    default: "pending",
  },
  examination: {
    diagnosis: String,
    prescription: String,
  },
});

appointmentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "patient",
    select: "name email _id photo",
  }).populate({
    path: "doctor",
    select: "name email _id photo phoneNumber clinic summary",
  });
  next();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
