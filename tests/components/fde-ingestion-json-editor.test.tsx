import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JsonEditor } from "@/components/environments/JsonEditor";
import challenge from "@/content/courses/forward-deployed-ai-engineering/challenges/fde-03-ingestion-mission.json";
import { gradeFdeIngestion } from "@/lib/fde-ingestion-grader";

function setPath(input: Record<string, any>, dottedPath: string, value: string): void {
  const keys = dottedPath.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = input;
  for (const key of keys.slice(0, -1)) current = current[key];
  current[keys.at(-1)!] = value;
}

describe("FDE ingestion trusted-option UI", () => {
  it("completes every placeholder from references visible before the first attempt", () => {
    const onSubmit = vi.fn();
    render(<JsonEditor template={challenge.prefilled.template} trustedOptions={challenge.prefilled.trusted_options} onSubmit={onSubmit} />);
    expect(screen.getByLabelText("Trusted option reference")).toBeVisible();
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const completed = JSON.parse(textarea.value) as Record<string, any>;
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-option-id][data-option-paths]"));
    expect(rows).toHaveLength(9);
    for (const row of rows) {
      const id = row.dataset.optionId;
      const paths = row.dataset.optionPaths?.split(",");
      expect(id).toBeTruthy(); expect(paths?.length).toBeGreaterThan(0); expect(row.textContent).toContain("Use at:");
      for (const targetPath of paths ?? []) setPath(completed, targetPath, id!);
    }
    const completedText = JSON.stringify(completed, null, 2);
    expect(completedText).not.toContain("SELECT_");
    fireEvent.change(textarea, { target: { value: completedText } });
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(gradeFdeIngestion(challenge, { json: onSubmit.mock.calls[0][0] })).toMatchObject({ pass: true, score: 1 });
  });
});
