const mongoose = require("mongoose");
const { ensureGlobalConfiguration } = require("../services/globalConfiguration.service");

const connectMongoDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB: ${connection.connection.host}`);
    await ensureGlobalConfiguration();
  } catch (error) {
    console.error(`Error while connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectMongoDB;