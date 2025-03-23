import axios from "axios";

const API_URL = "https://yellow-oryx-132975.hostingersite.com/api/v1/dashboard/blogs";
const TOKEN = "215|mzqKpmN2w3GdVBs77jDd7XYysI6iQQ0EOTAk8Lya0cc7551e";

// ✅ Fetch All Blogs
export const fetchBlogs = async () => {
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
      console.error("Failed to fetch blogs", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
};

// ✅ Add New Blog
export const addBlog = async (newBlog: {
  title: string;
  slug: string;
  description: string;
  content: string;
  meta_description?: string;
  meta_keywords?: string;
}) => {
  try {
    const response = await axios.post(API_URL, newBlog, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Failed to add blog", response);
      throw new Error("Failed to add blog");
    }
  } catch (error) {
    console.error("Error adding blog:", error);
    throw error;
  }
};

// ✅ Delete Blog
export const deleteBlog = async (id: number) => {
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
      console.error("Failed to delete blog", response);
      throw new Error("Failed to delete blog");
    }
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw error;
  }
};

// ✅ Update Blog
export const updateBlog = async (id: number, updatedData: any) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updatedData, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error("Failed to update blog", response);
      throw new Error("Failed to update blog");
    }
  } catch (error) {
    console.error("Error updating blog:", error);
    throw error;
  }
};
