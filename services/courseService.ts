import axios from "axios";

const API_URL = "https://yellow-oryx-132975.hostingersite.com/api/v1/dashboard/courses";
const TOKEN = "215|mzqKpmN2w3GdVBs77jDd7XYysI6iQQ0EOTAk8Lya0cc7551e";

// ✅ Fetch All Courses
export const fetchCourses = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      return response.data.data;
    } else {
      console.error("Failed to fetch data", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

// ✅ Add New Course
export const addCourse = async (newCourse: {
  title: string;
  cour_no: string;
  level: string;
  subject: string;
  cover: string;
}) => {
  try {
    const response = await axios.post(API_URL, newCourse, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Failed to add course", response);
      throw new Error("Failed to add course");
    }
  } catch (error) {
    console.error("Error adding course:", error);
    throw error;
  }
};

// ✅ Delete Course
export const deleteCourse = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Failed to delete course", response);
      throw new Error("Failed to delete course");
    }
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};
