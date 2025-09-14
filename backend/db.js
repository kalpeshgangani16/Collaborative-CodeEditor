// backend/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "code1" // explicitly set database
    });
    console.log("✅ MongoDB Connected");

    // // list collections in the 'code' database
    // const collections = await mongoose.connection.db.listCollections().toArray();
    // console.log("Collections:");
    // collections.forEach(col => console.log(col.name));

  } catch (err) {
    console.error("❌ MongoDB connection failed", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
