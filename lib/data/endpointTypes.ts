/** Realtime endpoint types per protocol (backend `RealtimeEndpointRT.RT_ENDPOINT_TYPE_CHOICES`). */
export const ENDPOINT_TYPES_GTFS_RT = ["trip_update", "vehicle_position", "service_alert"] as const;
export const ENDPOINT_TYPES_SIRI = ["sx", "sm", "vm", "et", "gm"] as const;
export const ENDPOINT_TYPES_GBFS = [
  "gbfs",
  "gbfs_versions",
  "system_information",
  "vehicle_types",
  "station_information",
  "station_status",
  "free_bike_status",
  "system_hours",
  "system_alerts",
] as const;

export const ENDPOINT_TYPES_BY_PROTOCOL = {
  gtfs_rt: ENDPOINT_TYPES_GTFS_RT,
  siri: ENDPOINT_TYPES_SIRI,
  gbfs: ENDPOINT_TYPES_GBFS,
} as const;
