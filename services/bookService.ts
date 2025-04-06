import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/books`;

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

// ✅ Fetch All Books
export const fetchBooks = async () => {
  const token = getAuthToken();
  if (!token) {
    console.error("No auth token found in localStorage.");
    return [];
  }

  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      return response.data.data;
    } else {
      console.error("Failed to fetch books", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
};

// ✅ Add New Book
export const addBook = async (book: {
  full_name: string;
  email: string;
  phone: string;
  role: string;
}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No auth token found in localStorage.");
  }

  try {
    const response = await axios.post(API_URL, book, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Failed to add book", response);
      throw new Error("Failed to add book");
    }
  } catch (error) {
    console.error("Error adding book:", error);
    throw error;
  }
};
