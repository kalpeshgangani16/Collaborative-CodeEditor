const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      //dbName: "your database name" // explicitly set database
    });
    console.log("MongoDB Connected");

  } catch (err) {
    console.error("MongoDB connection failed", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
