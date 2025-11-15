import { MetadataRoute } from "next";
import { NEXT_PUBLIC_SITE_URL } from "@/config/env";

// Generate robots.txt dynamically
export default function robots(): MetadataRoute.Robots {
  const baseUrl = NEXT_PUBLIC_SITE_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/private/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
