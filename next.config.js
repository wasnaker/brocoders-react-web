/** @type {import('next').NextConfig} */
const packageJson = require("./package.json");

const modulePackages = Object.keys(packageJson.dependencies ?? {}).filter(
  (name) => name.startsWith("@wasnaker/module-")
);

const nextConfig = {
  transpilePackages: modulePackages,
};

module.exports = nextConfig;
