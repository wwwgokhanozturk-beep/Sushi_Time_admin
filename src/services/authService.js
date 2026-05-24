import api from "./api";

export const authService = {
  login: (credentials) => api.post("/users/login", credentials),

  me: () => api.get("/users/me"),
};
