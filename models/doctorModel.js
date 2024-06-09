const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const doctorSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "A user must have a name"],
  },
  email: {
    type: String,
    required: [true, "A user must have an Email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid Email"],
  },
  photo: {
    type: String,
    default:
      "https://res.cloudinary.com/dtk7ufofp/image/upload/v1717974296/oqsmr4xbaynfhaocpmc1.png",
  },
  idCard: {
    type: String,
    required: [true, "A Doctor must have an id card"],
  },
  role: {
    type: String,
    default: "doctor",
    enum: ["doctor"],
  },
  password: {
    type: String,
    required: [true, "A user needs a Password"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your Password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  phoneNumber: String,
  department: {
    type: String,
    enum: {
      values: ["الأطفال", "القلب", "العيون", "الجراحة", "الأسنان", "العظام"],
      message: "department not supported",
    },
    required: [true, "A doctor must have a department"],
  },
  scheduleStart: {
    type: Date,
    default: "2024-06-08:12:00",
  },
  scheduleEnd: {
    type: Date,
    default: "2024-06-08:17:00",
  },
  scheduleInterval: {
    type: Number,
    default: 30,
  },
  location: {
    type: String,
    enum: {
      values: ["أخميم", "سوهاج", "ساقلتة", "دار السلام", "طحطا", "طما"],
      message: "department not supported",
    },
    required: [true, "A doctor must have a location"],
  },
  clinic: String,
  summary: String,
  passwordChangedAt: Date,
  passwordResetToken: String,
  PasswordResetExpires: Date,
  confirmed: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

doctorSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

doctorSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

doctorSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.methods.changedPasswordAfter = function (timeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = Number.parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return changedTimeStamp > timeStamp;
  }

  return false;
};

doctorSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.PasswordResetExpires = Date.now() + 1000 * 60 * 10;

  return resetToken;
};

const User = mongoose.model("Doctor", doctorSchema);

module.exports = User;
