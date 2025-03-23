import axios from "axios";

const API_URL = "https://yellow-oryx-132975.hostingersite.com/api/v1/dashboard/banks";
const TOKEN = "215|mzqKpmN2w3GdVBs77jDd7XYysI6iQQ0EOTAk8Lya0cc7551e";

// ✅ Fetch All Banks
export const fetchBanks = async () => {
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
      console.error("Failed to fetch banks", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching banks:", error);
    return [];
  }
};

// ✅ Add New Bank
export const addBank = async (newBank: {
  name: string;
  price: number | null;
}) => {
  try {
    const response = await axios.post(API_URL, newBank, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      console.error("Failed to add bank", response);
      throw new Error("Failed to add bank");
    }
  } catch (error) {
    console.error("Error adding bank:", error);
    throw error;
  }
};
