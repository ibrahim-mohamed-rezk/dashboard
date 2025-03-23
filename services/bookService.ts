import axios from "axios";
import { log } from "console";

const API_URL = "https://yellow-oryx-132975.hostingersite.com/api/v1/dashboard/books";
const TOKEN = "215|mzqKpmN2w3GdVBs77jDd7XYysI6iQQ0EOTAk8Lya0cc7551e";

// ✅ Fetch All Users
export const fetchBooks = async () => {
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
    console.error("Error fetching users:", error);
    return [];
  }
};

// ✅ Add New User
export const AddBook = async (newUser: {
  full_name: string;
  email: string;
  phone: string;
  role: string;
}) => {
  try {
    const response = await axios.post(API_URL, newUser, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Failed to add user", response);
      throw new Error("Failed to add user");
    }
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};
