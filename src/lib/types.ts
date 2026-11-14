export type JobStatus = "requested" | "accepted" | "arrived" | "in_progress" | "completed" | "cancelled";

export type Job = {
  id: string;
  service: "ride" | "package";
  city: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  vehicle_type: string;
  duration_min: number;
  distance_km: number;
  fare_ngn: number;
  status: JobStatus;
  package_note: string | null;
  driver_id: string | null;
  created_at: string;
};

export const STATUS_LABEL: Record<JobStatus, string> = {
  requested: "Finding a driver",
  accepted: "Driver on the way",
  arrived: "Driver has arrived",
  in_progress: "On the way to drop-off",
  completed: "Completed",
  cancelled: "Cancelled",
};
