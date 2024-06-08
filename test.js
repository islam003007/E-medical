// module.exports.viewAvailableAppointments = catchAsync(
//     //   async (req, res, next) => {
//     //     const doctor = await Doctor.findOne({ _id: req.params.id });
//     //     if (!doctor) return next(new AppError("No Doctor found with that id"));
//     //     const availableAppointments = doctor.availableAppointments();
//     //     console.log(availableAppointments);
//     //   },
//     // );


// doctorSchema.methods.isAppointmentAvailable = async function (date) {
//   const Appointments = await Appointment.find({ doctor: this.id });

// };

// doctorSchema.methods.availableAppointments = function () {
//   const today = dayJs();
//   const start = today.startOf("day");
//   const availableAppointments = [[], [], [], [], [], [], []];
//   const appointmentsNum = Math.floor(
//     (this.scheduleEnd - this.scheduleStart) / this.scheduleInterval,
//   );
//   for (let i = 0; i < 7; i += 1) {
//     for (let j = 0; j < appointmentsNum; j += 1)
//       availableAppointments[i].push(start.add(this.scheduleInterval, "minute"));
//   }
//   return availableAppointments;
// };