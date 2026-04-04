const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "faculty", "student"],
    default: "student",
  },
  degree: {
    type: String,
    required: true,
    enum: ["bsc", "msc", "ba", "ma", "scholar"],
  },
  department: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
    enum: ["year 1", "year 2", "year 3"],
  },
  semester: {
    type: String,
    required: true,
    enum: ["sem 1", "sem 2"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Users", userSchema);
