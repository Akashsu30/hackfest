import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  classroomName: { type: String, default: "My Classroom" },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

teacherSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("Teacher", teacherSchema);