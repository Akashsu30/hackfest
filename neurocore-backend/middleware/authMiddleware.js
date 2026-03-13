import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "neurocore_secret";

export const requireTeacher = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    req.teacherId = decoded.teacherId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};