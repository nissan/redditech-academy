import path from "path";
import fs from "fs";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MDXContentProps {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}

function preprocessMermaidBlocks(
  markdown: string,
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string
): string {
  let diagramIndex = 0;

  return markdown.replace(/```mermaid\s*([\s\S]*?)```/g, (_match, mermaidSource) => {
    diagramIndex += 1;

    const imagePath = `/assets/courses/${courseSlug}/diagrams/${moduleSlug}-${lessonSlug}-d${diagramIndex}.png`;
    const imageDiskPath = path.join(process.cwd(), "public", imagePath.replace(/^\//, ""));

    if (!fs.existsSync(imageDiskPath)) {
      return `\n\`\`\`mermaid\n${String(mermaidSource).trim()}\n\`\`\`\n`;
    }

    return [
      `<figure class="my-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-cyan-400/5 to-fuchsia-500/10 p-3 shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_12px_40px_rgba(14,116,144,0.25)]">`,
      `  <img src="${imagePath}" alt="Diagram ${diagramIndex}" class="w-full rounded-xl border border-slate-700/70 bg-slate-950/70 p-2" loading="lazy" />`,
      `</figure>`,
    ].join("\n");
  });
}

export function MDXContent({ courseSlug, moduleSlug, lessonSlug }: MDXContentProps) {
  const lessonPath = path.join(
    process.cwd(),
    "content",
    "courses",
    courseSlug,
    "modules",
    moduleSlug,
    "lessons",
    `${lessonSlug}.mdx`
  );

  if (!fs.existsSync(lessonPath)) {
    return (
      <div className="text-slate-400 text-center py-8">
        Content not found.
      </div>
    );
  }

  const fileContents = fs.readFileSync(lessonPath, "utf8");
  const { content } = matter(fileContents);
  const renderedContent = preprocessMermaidBlocks(content, courseSlug, moduleSlug, lessonSlug);

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Override code blocks with styled versions
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-4">
                  <code className={`language-${match[1]} text-sm font-mono text-slate-200`} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code
                className="bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono text-orange-300"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          // Styled blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-orange-500 pl-4 my-4 text-slate-300 italic">
                {children}
              </blockquote>
            );
          },
          // Styled tables
          table({ children }) {
            return (
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-slate-700 border border-slate-600 px-4 py-2 text-left font-semibold text-white">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-slate-700 px-4 py-2 text-slate-300">
                {children}
              </td>
            );
          },
        }}
      >
        {renderedContent}
      </ReactMarkdown>
    </div>
  );
}
