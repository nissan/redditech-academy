import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

// Next.js 16 / @next/mdx 16: remark/rehype plugins with function options
// are not serializable for the Rust MDX compiler.
// Plugins are applied in mdx-components.tsx via the useMDXComponents pattern,
// or via a custom prose wrapper component.
const withMDX = createMDX({});

export default withMDX(nextConfig);
