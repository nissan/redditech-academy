declare module "*.mdx" {
  import type { MDXComponents } from "mdx/types";
  const MDXComponent: (props: MDXComponents) => JSX.Element;
  export default MDXComponent;
}
