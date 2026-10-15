/** IPv4 and IPv6 addresses and networks, enough to match an address against a ban. */

type Parsed = { v6: boolean; value: bigint };

function parseV4(ip: string): bigint | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = BigInt(0);
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    value = (value << BigInt(8)) + BigInt(p);
  }
  return value;
}

function parseV6(ip: string): bigint | null {
  if (!/^[0-9a-f:]+$/i.test(ip) || ip.split("::").length > 2) return null;
  const [head, tail] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail !== undefined && tail !== "" ? tail.split(":") : [];
  const missing = 8 - left.length - right.length;
  if (tail === undefined ? missing !== 0 : missing < 1) return null;
  const groups = [...left, ...Array<string>(tail === undefined ? 0 : missing).fill("0"), ...right];
  let value = BigInt(0);
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    value = (value << BigInt(16)) + BigInt(parseInt(g, 16));
  }
  return value;
}

function parse(ip: string): Parsed | null {
  const v4 = parseV4(ip);
  if (v4 !== null) return { v6: false, value: v4 };
  const v6 = parseV6(ip);
  return v6 !== null ? { v6: true, value: v6 } : null;
}

/** A single IPv4 or IPv6 address, without a prefix length. */
export function isIpAddress(value: string): boolean {
  return parse(value.trim()) !== null;
}

/** An address or a network (`203.0.113.0/24`, `2001:db8::/64`), as `ip-bans/` accepts it. */
export function isIpNetwork(value: string): boolean {
  const [ip, prefix, extra] = value.trim().split("/");
  if (extra !== undefined) return false;
  const parsed = parse(ip);
  if (!parsed) return false;
  if (prefix === undefined) return true;
  const max = parsed.v6 ? 128 : 32;
  return /^\d{1,3}$/.test(prefix) && Number(prefix) <= max;
}

/** The network a ban should cover: the address itself, or its `/64` for IPv6 clients. */
export function defaultBanNetwork(ip: string): string {
  const parsed = parse(ip);
  if (!parsed?.v6) return `${ip}/32`;
  const groups: string[] = [];
  for (let i = 7; i >= 4; i--) {
    groups.push(((parsed.value >> BigInt(i * 16)) & BigInt(0xffff)).toString(16));
  }
  return `${groups.join(":")}::/64`;
}

/** Whether `network` (address or CIDR) covers `ip`. */
export function networkContains(network: string, ip: string): boolean {
  const [base, prefixRaw] = network.split("/");
  const a = parse(base);
  const b = parse(ip);
  if (!a || !b || a.v6 !== b.v6) return false;
  const bits = a.v6 ? 128 : 32;
  const prefix = prefixRaw === undefined ? bits : Number(prefixRaw);
  const shift = BigInt(bits - prefix);
  return a.value >> shift === b.value >> shift;
}

export function isIpv6(ip: string): boolean {
  return parse(ip)?.v6 === true;
}
