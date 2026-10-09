import type {Tunnel, TunnelOutputFilter} from "@engine/models/Tunnel";
import type {DirectionType} from "@engine/models/Conveyor";
import type {ResourcesType} from "@engine/models/Resources";
import {directions} from "./NetworkTopology";

export function tunnelOutputFilter(tunnel: Tunnel, side: DirectionType): TunnelOutputFilter {
  return tunnel.outputFilters?.[side] ?? tunnel.outputResource ?? "any";
}

export function tunnelAllowsOutput(tunnel: Tunnel, side: DirectionType, resource: ResourcesType): boolean {
  if (resource === "water") return true;
  const filter = tunnelOutputFilter(tunnel, side);
  if (filter === "any") return true;
  if (filter === "unfiltered") return !directions.some(direction => tunnelOutputFilter(tunnel, direction) === resource);
  return filter === resource;
}

export function migrateTunnelFilters(tunnel: Tunnel): Tunnel {
  if (!tunnel.outputResource) return tunnel;
  const outputFilters = Object.fromEntries(directions.map(side => [side, tunnelOutputFilter(tunnel, side)]));
  const migrated: Tunnel = {...tunnel, outputFilters};
  delete migrated.outputResource;
  return migrated;
}
