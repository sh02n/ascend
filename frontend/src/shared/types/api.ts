export interface ApiStatus {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}
