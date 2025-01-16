import axios from "axios";

// Base URL for your API
export const base = async () => {
  try {
    const response = await axios.get("http://localhost:5000/api");
    return response.data.message;
  } catch (error) {
    console.error("Error fetching data from server:", error);
    return "Error fetching data.";
  }
};
