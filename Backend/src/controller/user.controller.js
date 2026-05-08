import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { query } from "../db/index.js";

const start = async (req, res) => {
  if (req.user) {
    return res.status(200).json(new ApiResponse(200, req.user, "User Found"));
  } else {
    return res.status(404).json(new ApiResponse(404, null, "Use Not Found"));
  }
};

const registerUser = async (req, res) => {
  console.log("Registration Started");
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    console.log("Registration Failed data insufficeient ");
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Please provide all required fields: fullName, email, and password."
        )
      );
  }

  try {
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Registration Failed already registered user");
      return res
        .status(409)
        .json(new ApiError(409, "User already registered."));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserResult = await query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [fullName, email, passwordHash]
    );
    const newUser = newUserResult.rows[0];

    console.log("Registration Successful");
    res.status(201).json(
      new ApiResponse(
        201,
        {
          user: {
            id: newUser.id,
            fullName: newUser.full_name,
            email: newUser.email,
          },
        },
        "User successfully registered."
      )
    );
  } catch (err) {
    // Change the error parameter to err
    console.log("Registration Failed due to server error");
    console.error("Error while creating user:", err);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error.", [], err.stack));
  }
  // return res.status(200).send("Hello WOrld")
};

const loginUser = async (req, res) => {
  console.log("Login Started");
  const { email, password } = req.body;

  if (!email || !password) {
    console.log("Login Failed: Missing required fields");
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Please provide all required fields: email and password."
        )
      );
  }

  try {
    const result = await query(
      "SELECT id, full_name, email, password_hash FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      console.log("Login Failed: User not found");
      return res.status(404).json(new ApiError(404, "User not found."));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      console.log("Login Failed: Invalid credentials");
      return res.status(406).json(new ApiError(406, "Invalid credentials."));
    }

    const jwtToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_SECRET_EXPIRES_IN } // Add token expiration for better security
    );

    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Set cookie to expire in 1 day
      sameSite: process.env.NODE_ENV == "Dev" ? "lax" : "none", // Set SameSite attribute for better security
      secure: process.env.NODE_ENV == "Dev" ? false : true, // Set Secure attribute for better security
    };
    

    console.log("Login Successful");
    return res
      .cookie("token", jwtToken, cookieOptions)
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            user: {
              id: user.id,
              email: user.email,
              fullName: user.full_name,
            },
          },
          "User logged in successfully."
        )
      );
  } catch (err) {
    console.log("Login Failed: Server error");
    console.error("Error during login:", err);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", [], err.stack));
  }
};

const logoutUser = (req, res) => {
  console.log("Logged out");
  if (req.user) {
    return res
      .clearCookie("token")
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully."));
  } else {
    return res.status(404).json(new ApiError(404, "User not found."));
  }
};

export { start, loginUser, logoutUser, registerUser };
