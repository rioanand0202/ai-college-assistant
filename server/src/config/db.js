const mongoose = require("mongoose");
const connectMongoDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB: ${connection.connection.host}`);
  } catch (error) {
    console.error(`Error while connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectMongoDB;