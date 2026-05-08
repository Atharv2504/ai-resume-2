import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { query } from "../db/index.js";

const isUserAvailable = async (req, res, next) => {
  let { token } = req.cookies;

  if (!token) {
    return res.status(404).json(new ApiError(404, "User not authenticated."));
  }

  try {
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { rows } = await query(
      "SELECT id, full_name, email FROM users WHERE id = $1 LIMIT 1",
      [decodedToken.id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found."));
    }

    req.user = {
      _id: user.id,
      id: user.id,
      fullName: user.full_name,
      email: user.email,
    };
    next();
  } catch (err) {
    console.error("Error verifying token:", err);
    return res.status(500).json(new ApiError(500, "Internal Server Error.", [], err.stack));
  }
};

export { isUserAvailable };
