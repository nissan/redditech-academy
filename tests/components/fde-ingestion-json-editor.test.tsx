import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JsonEditor } from "@/components/environments/JsonEditor";
import challenge from "@/content/courses/forward-deployed-ai-engineering/challenges/fde-03-ingestion-mission.json";
import { gradeFdeIngestion } from "@/lib/fde-ingestion-grader";

describe("FDE ingestion trusted-option UI", () => {
  it("explains the workflow but cannot turn the template into passing execution evidence", () => {
    const onSubmit = vi.fn();
    render(<JsonEditor template={challenge.prefilled.template} trustedOptions={challenge.prefilled.trusted_options} onSubmit={onSubmit} />);
    expect(screen.getByLabelText("Trusted option reference")).toBeVisible();
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-option-id][data-option-paths]"));
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.dataset.optionId).toBeTruthy();
      expect(row.textContent).toContain("Use at:");
    }
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(gradeFdeIngestion(challenge, { json: onSubmit.mock.calls[0][0] })).toMatchObject({ pass: false });
  });
});
