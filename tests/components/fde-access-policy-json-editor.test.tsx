import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JsonEditor } from "@/components/environments/JsonEditor";
import challenge from "@/content/courses/forward-deployed-ai-engineering/challenges/fde-01-access-policy-mission.json";
import { gradeFdeAccessPolicy } from "@/lib/fde-access-policy-grader";

function setPath(input: Record<string, any>, dottedPath: string, value: string): void {
  const keys = dottedPath.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = input;
  for (const key of keys.slice(0, -1)) current = current[key];
  current[keys.at(-1)!] = value;
}

describe("FDE access-policy trusted-option UI", () => {
  it("completes every placeholder using exact references visible before the first attempt", () => {
    const onSubmit = vi.fn();
    render(
      <JsonEditor
        template={challenge.prefilled.template}
        trustedOptions={challenge.prefilled.trusted_options}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText("Trusted option reference")).toBeVisible();
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const completed = JSON.parse(textarea.value) as Record<string, any>;
    const optionRows = Array.from(
      document.querySelectorAll<HTMLElement>("[data-option-id][data-option-paths]")
    );
    expect(optionRows).toHaveLength(19);

    for (const row of optionRows) {
      const id = row.dataset.optionId;
      const paths = row.dataset.optionPaths?.split(",");
      expect(id).toBeTruthy();
      expect(paths?.length).toBeGreaterThan(0);
      expect(row.textContent).toContain("Use at:");
      expect(row.textContent).toMatch(/ — .+/);
      for (const targetPath of paths ?? []) setPath(completed, targetPath, id!);
    }

    const completedText = JSON.stringify(completed, null, 2);
    expect(completedText).not.toContain("SELECT_");
    fireEvent.change(textarea, { target: { value: completedText } });
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(gradeFdeAccessPolicy(challenge, { json: onSubmit.mock.calls[0][0] })).toMatchObject({
      pass: true,
      score: 1,
    });
  });
});
