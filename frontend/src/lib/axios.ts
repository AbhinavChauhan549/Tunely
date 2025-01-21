// import axios from "axios";

// export const axiosInstance = axios.create({
//   baseURL: "http://localhost:5000",
// })
import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
});