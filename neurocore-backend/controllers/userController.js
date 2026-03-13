import User from "../models/User.js";
import Teacher from "../models/Teacher.js";

export const createUser = async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name ?? "Anonymous",
      email: req.body.email ?? null,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { baselineProfile: req.body } },
      { returnDocument: "after" }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinClassroom = async (req, res) => {
  try {
    const { classroomCode } = req.body;
    const teacher = await Teacher.findOne({ classroomCode });
    if (!teacher) return res.status(404).json({ error: "Invalid classroom code" });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { classroomCode },
      { returnDocument: "after" }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Joined classroom", classroomCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};