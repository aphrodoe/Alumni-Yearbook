import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com", "profile-pics-yearbook.s3.ap-south-1.amazonaws.com"],
  },
};

export default nextConfig;
