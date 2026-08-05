import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` only -- no effect on `next build` or the deployed production
  // site. Without it, Next 16 blocks cross-origin requests to dev resources
  // (HMR, etc.) from any host but localhost, which silently kills all client
  // JS -- buttons dead, the map's region tint (applied by a client effect,
  // see MapExplorer.tsx) never appearing. This is what lets the dev server
  // be opened from a phone on the same LAN for a real review. A `*` subnet
  // wildcard, not a bare IP, so it survives the router handing this machine
  // a different address next time DHCP reassigns it.
  allowedDevOrigins: ["192.168.68.*"],
};

export default nextConfig;
