import { resolveHideOriginal } from "@/lib/data/hideOriginalAuth";
import {
  parseSourceUpdateInterval,
  SOURCE_UPDATE_INTERVAL_DEFAULT,
} from "@/lib/data/intervalChoices";

export const REALTIME_PROTOCOLS = ["gtfs_rt", "siri", "gbfs"] as const;
export type RealtimeProtocol = (typeof REALTIME_PROTOCOLS)[number];

/** The fixed endpoint types per protocol (backend `RealtimeSubmission.allowed_endpoint_types`). */
const ENDPOINT_TYPES: Record<RealtimeProtocol, readonly string[]> = {
  gtfs_rt: ["trip_update", "vehicle_position", "service_alert"],
  siri: ["sx", "sm", "vm", "et", "gm"],
  gbfs: [
    "gbfs",
    "gbfs_versions",
    "system_information",
    "vehicle_types",
    "station_information",
    "station_status",
    "free_bike_status",
    "system_hours",
    "system_alerts",
  ],
};

export function isRealtimeProtocol(value: string): value is RealtimeProtocol {
  return (REALTIME_PROTOCOLS as readonly string[]).includes(value);
}

export function endpointTypesFor(protocol: RealtimeProtocol): readonly string[] {
  return ENDPOINT_TYPES[protocol];
}

/** GTFS-RT and SIRI belong to a static feed (GTFS and NeTEx); GBFS has none. */
export function requiresStaticSubmission(protocol: RealtimeProtocol): boolean {
  return protocol !== "gbfs";
}

export type RtEndpointDraft = {
  /** Stable React key for removable rows (never the array index). */
  uid: string;
  endpoint_type: string;
  url: string;
  interval: string;
  /** The interval saved on the backend, accepted even outside the usual range. */
  storedInterval?: number;
  is_original: boolean;
  hide_original: boolean;
  auth_type: string;
  auth_value: string;
};

let endpointUidSeq = 0;
export function nextEndpointUid(): string {
  endpointUidSeq += 1;
  return `ep-${endpointUidSeq}`;
}

export function emptyEndpoint(protocol: RealtimeProtocol): RtEndpointDraft {
  return {
    uid: nextEndpointUid(),
    endpoint_type: endpointTypesFor(protocol)[0],
    url: "",
    interval: String(SOURCE_UPDATE_INTERVAL_DEFAULT),
    is_original: true,
    hide_original: false,
    auth_type: "",
    auth_value: "",
  };
}

/** Endpoints after a protocol change: GBFS starts over, other types fall back to the first one. */
export function endpointsForProtocol(
  rows: RtEndpointDraft[],
  protocol: RealtimeProtocol,
): RtEndpointDraft[] {
  if (protocol === "gbfs" || !rows.length) return [emptyEndpoint(protocol)];
  const types = endpointTypesFor(protocol);
  return rows.map((r) => (types.includes(r.endpoint_type) ? r : { ...r, endpoint_type: types[0] }));
}

export function parseEndpointInterval(ep: RtEndpointDraft): number | null {
  return parseSourceUpdateInterval(ep.interval, ep.storedInterval);
}

/** An endpoint as the API writes it; `auth_value` only when the user typed one. */
export function endpointPayload(ep: RtEndpointDraft): Record<string, unknown> {
  const o: Record<string, unknown> = {
    endpoint_type: ep.endpoint_type,
    url: ep.url.trim(),
    interval: parseEndpointInterval(ep) ?? SOURCE_UPDATE_INTERVAL_DEFAULT,
    is_original: ep.is_original,
    hide_original: resolveHideOriginal(ep.auth_type, ep.hide_original),
    auth_type: ep.auth_type,
  };
  if (ep.auth_type && ep.auth_value.trim()) o.auth_value = ep.auth_value.trim();
  return o;
}
