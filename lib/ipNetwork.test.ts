import { describe, expect, it } from "vitest";

import {
  defaultBanNetwork,
  isIpAddress,
  isIpNetwork,
  isIpv6,
  networkContains,
} from "@/lib/ipNetwork";

describe("isIpAddress", () => {
  it.each([
    "203.0.113.7",
    "0.0.0.0",
    "255.255.255.255",
    " 10.0.0.1 ",
    "::",
    "::1",
    "2001:db8::",
    "2001:DB8:0:0:0:0:0:1",
    "fe80::1:2",
  ])("accepts %j", (value) => expect(isIpAddress(value)).toBe(true));

  it.each([
    "",
    "256.0.0.1",
    "1.2.3",
    "1.2.3.4.5",
    "1.2.3.-1",
    "a.b.c.d",
    "1::2::3",
    "2001:db8:::1",
    "12345::",
    "1:2:3:4:5:6:7:8:9",
    ":1:2:3:4:5:6:7",
    "::ffff:1.2.3.4",
    "203.0.113.0/24",
  ])("rejects %j", (value) => expect(isIpAddress(value)).toBe(false));

  // Python's ipaddress (the backend's `ip-bans/`) refuses leading zeros since 3.9.5, so the
  // form accepts an address the backend then rejects with a generic error.
  it.fails("rejects IPv4 octets with leading zeros, as the backend does", () => {
    expect(isIpAddress("010.0.0.1")).toBe(false);
  });
});

describe("isIpNetwork", () => {
  it("accepts an address or a network within the family's prefix length", () => {
    expect(isIpNetwork("203.0.113.7")).toBe(true);
    expect(isIpNetwork("203.0.113.0/24")).toBe(true);
    expect(isIpNetwork("0.0.0.0/0")).toBe(true);
    expect(isIpNetwork("2001:db8::/64")).toBe(true);
    expect(isIpNetwork("2001:db8::/128")).toBe(true);
  });

  it("rejects a prefix that is too long or malformed", () => {
    expect(isIpNetwork("203.0.113.0/33")).toBe(false);
    expect(isIpNetwork("2001:db8::/129")).toBe(false);
    expect(isIpNetwork("203.0.113.0/")).toBe(false);
    expect(isIpNetwork("203.0.113.0/-1")).toBe(false);
    expect(isIpNetwork("203.0.113.0/24/1")).toBe(false);
    expect(isIpNetwork("evil.example/24")).toBe(false);
  });
});

describe("defaultBanNetwork", () => {
  it("bans a single IPv4 address", () => {
    expect(defaultBanNetwork("203.0.113.7")).toBe("203.0.113.7/32");
  });

  it("bans the /64 of an IPv6 client", () => {
    expect(defaultBanNetwork("2001:db8:1:2:aaaa:bbbb:cccc:dddd")).toBe("2001:db8:1:2::/64");
    expect(defaultBanNetwork("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });
});

describe("networkContains", () => {
  it("matches IPv4 networks and single addresses", () => {
    expect(networkContains("203.0.113.0/24", "203.0.113.200")).toBe(true);
    expect(networkContains("203.0.113.0/24", "203.0.114.1")).toBe(false);
    expect(networkContains("203.0.113.7", "203.0.113.7")).toBe(true);
    expect(networkContains("203.0.113.7", "203.0.113.8")).toBe(false);
    expect(networkContains("0.0.0.0/0", "198.51.100.1")).toBe(true);
  });

  it("matches IPv6 networks", () => {
    expect(networkContains("2001:db8:1:2::/64", "2001:db8:1:2:ffff::1")).toBe(true);
    expect(networkContains("2001:db8:1:2::/64", "2001:db8:1:3::1")).toBe(false);
  });

  it("never matches across address families or invalid input", () => {
    expect(networkContains("0.0.0.0/0", "::1")).toBe(false);
    expect(networkContains("::/0", "127.0.0.1")).toBe(false);
    expect(networkContains("203.0.113.0/24", "not-an-ip")).toBe(false);
  });
});

describe("isIpv6", () => {
  it("tells the families apart", () => {
    expect(isIpv6("2001:db8::1")).toBe(true);
    expect(isIpv6("203.0.113.7")).toBe(false);
    expect(isIpv6("garbage")).toBe(false);
  });
});
