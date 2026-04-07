const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model("College", collegeSchema);
