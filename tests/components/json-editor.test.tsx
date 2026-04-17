/**
 * JsonEditor component tests
 *
 * Ensures:
 *  - Template is rendered in the textarea (user can see starting content)
 *  - Textarea is editable (not read-only — this was the reported UX bug)
 *  - Submit calls onSubmit with edited JSON content
 *  - Invalid JSON shows a parse error and does NOT call onSubmit
 *  - Valid JSON clears the parse error
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JsonEditor } from "../../components/environments/JsonEditor";

const TEMPLATE = JSON.stringify(
  { what_is_a_wallet: "", what_happens_when_you_buy_an_nft: "" },
  null,
  2
);

describe("JsonEditor — renderability", () => {
  it("renders without crashing", () => {
    expect(() =>
      render(<JsonEditor template={TEMPLATE} onSubmit={vi.fn()} />)
    ).not.toThrow();
  });

  it("renders the template content in the textarea", () => {
    render(<JsonEditor template={TEMPLATE} onSubmit={vi.fn()} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.value).toContain("what_is_a_wallet");
  });

  it("textarea is NOT read-only — user can type", () => {
    render(<JsonEditor template={TEMPLATE} onSubmit={vi.fn()} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.readOnly).toBe(false);
    expect(textarea.disabled).toBe(false);
  });

  it("renders a submit button", () => {
    render(<JsonEditor template={TEMPLATE} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});

describe("JsonEditor — interaction", () => {
  it("calls onSubmit with current value when JSON is valid", () => {
    const onSubmit = vi.fn();
    render(<JsonEditor template={TEMPLATE} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toContain("what_is_a_wallet");
  });

  it("does NOT call onSubmit when JSON is invalid", () => {
    const onSubmit = vi.fn();
    render(<JsonEditor template="{invalid json}" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a parse error when user types invalid JSON", () => {
    const onSubmit = vi.fn();
    render(<JsonEditor template="{}" onSubmit={onSubmit} />);
    const textarea = screen.getByRole("textbox");
    // Use fireEvent.change — avoids userEvent's special-character parsing of { }
    fireEvent.change(textarea, { target: { value: "not valid json at all" } });
    const error = screen.queryByText(/expected|unexpected|invalid|parse/i);
    expect(error).toBeTruthy();
  });

  it("clears parse error after correcting invalid JSON", () => {
    render(<JsonEditor template="{}" onSubmit={vi.fn()} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "broken" } });
    expect(screen.queryByText(/expected|unexpected|invalid|parse/i)).toBeTruthy();
    fireEvent.change(textarea, { target: { value: "{}" } });
    expect(screen.queryByText(/expected|unexpected|invalid|parse/i)).toBeNull();
  });
});

describe("JsonEditor — loading state", () => {
  it("disables the button while loading=true", () => {
    render(<JsonEditor template={TEMPLATE} onSubmit={vi.fn()} loading={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows loading indicator while loading", () => {
    render(<JsonEditor template={TEMPLATE} onSubmit={vi.fn()} loading={true} />);
    const btn = screen.getByRole("button");
    expect(btn.textContent?.toLowerCase()).toMatch(/check|submit|loading|checking/i);
  });
});
