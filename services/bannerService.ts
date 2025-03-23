import axios from "axios";

const API_URL = "https://yellow-oryx-132975.hostingersite.com/api/v1/dashboard/banners";
const TOKEN = "215|mzqKpmN2w3GdVBs77jDd7XYysI6iQQ0EOTAk8Lya0cc7551e";

// ✅ Fetch All Banners
export const fetchBanners = async () => {
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
      console.error("Failed to fetch banners", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
};

// ✅ Add New Banner
export const addBanner = async (newBanner: {
  image: string;
  status: string;
  type: string;
  teacher: number | null;
}) => {
  try {
    const response = await axios.post(API_URL, newBanner, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Failed to add banner", response);
      throw new Error("Failed to add banner");
    }
  } catch (error) {
    console.error("Error adding banner:", error);
    throw error;
  }
};
