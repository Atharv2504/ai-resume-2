import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { query } from "../db/index.js";

const mapResume = (row) => ({
  _id: row.id,
  id: row.id,
  user: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  title: row.title,
  summary: row.summary,
  jobTitle: row.job_title,
  phone: row.phone,
  address: row.address,
  experience: row.experience,
  education: row.education,
  skills: row.skills,
  projects: row.projects,
  themeColor: row.theme_color,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const start = async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Welcome to Resume Builder API"));
};

const createResume = async (req, res) => {
  const { title, themeColor } = req.body;

  // Validate that the title and themeColor are provided
  if (!title || !themeColor) {
    return res
      .status(400)
      .json(new ApiError(400, "Title and themeColor are required."));
  }

  try {
    const result = await query(
      `INSERT INTO resumes (
        user_id, title, theme_color, first_name, last_name, email, summary, job_title, phone, address, experience, education, skills, projects
      ) VALUES (
        $1, $2, $3, '', '', '', '', '', '', '', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
      )
      RETURNING *`,
      [req.user._id, title, themeColor]
    );
    const resume = mapResume(result.rows[0]);

    return res
      .status(201)
      .json(new ApiResponse(201, { resume }, "Resume created successfully"));
  } catch (error) {
    console.error("Error creating resume:", error);
    return res
      .status(500)
      .json(
        new ApiError(500, "Internal Server Error", [error.message], error.stack)
      );
  }
};

const getALLResume = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC",
      [req.user._id]
    );
    const resumes = result.rows.map(mapResume);
    return res
      .status(200)
      .json(new ApiResponse(200, resumes, "Resumes fetched successfully"));
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", [], error.stack));
  }
};

const getResume = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json(new ApiError(400, "Resume ID is required."));
    }

    const result = await query("SELECT * FROM resumes WHERE id = $1 LIMIT 1", [id]);
    const resume = mapResume(result.rows[0]);

    if (!resume) {
      return res.status(404).json(new ApiError(404, "Resume not found."));
    }

    // Check if the resume belongs to the current user
    if (resume.user_id !== req.user._id) {
      return res
        .status(403)
        .json(
          new ApiError(403, "You are not authorized to access this resume.")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, resume, "Resume fetched successfully"));
  } catch (error) {
    console.error("Error fetching resume:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", [], error.stack));
  }
};

const updateResume = async (req, res) => {
  console.log("Resume update request received:");
  const id = req.query.id;

  try {
    // Find and update the resume with the provided ID and user ID
    console.log("Database update request started");
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "title",
      "summary",
      "jobTitle",
      "phone",
      "address",
      "experience",
      "education",
      "skills",
      "projects",
      "themeColor",
    ];
    const fieldToColumn = {
      firstName: "first_name",
      lastName: "last_name",
      email: "email",
      title: "title",
      summary: "summary",
      jobTitle: "job_title",
      phone: "phone",
      address: "address",
      experience: "experience",
      education: "education",
      skills: "skills",
      projects: "projects",
      themeColor: "theme_color",
    };

    const updates = [];
    const values = [];
    let idx = 1;

    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, key) &&
        req.body[key] !== undefined
      ) {
        updates.push(`${fieldToColumn[key]} = $${idx}`);
        // For JSON fields, ensure they are properly serialized
        if (['experience', 'education', 'skills', 'projects'].includes(key)) {
          values.push(JSON.stringify(req.body[key]));
        } else {
          values.push(req.body[key]);
        }
        idx += 1;
      }
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json(new ApiError(400, "No valid fields provided for update."));
    }

    values.push(id);
    values.push(req.user._id);
    const updatedResumeResult = await query(
      `UPDATE resumes
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING *`,
      values
    );
    const updatedResume = mapResume(updatedResumeResult.rows[0]);

    if (!updatedResume) {
      console.log("Resume not found or unauthorized");
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Resume not found or unauthorized"));
    }

    console.log("Resume updated successfully:");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedResume, "Resume updated successfully"));
  } catch (error) {
    console.error("Error updating resume:", error);
    return res
      .status(500)
      .json(
        new ApiError(500, "Internal Server Error", [error.message], error.stack)
      );
  }

  // return res.status(200).json({ message: "Hello World" });
};

const removeResume = async (req, res) => {
  const id = req.query.id;

  try {
    // Check if the resume exists and belongs to the current user
    const result = await query(
      "DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user._id]
    );
    const resume = result.rows[0];

    if (!resume) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Resume not found or not authorized to delete this resume"
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Resume deleted successfully"));
  } catch (error) {
    console.error("Error while deleting resume:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error"));
  }
};

export {
  start,
  createResume,
  getALLResume,
  getResume,
  updateResume,
  removeResume,
};
