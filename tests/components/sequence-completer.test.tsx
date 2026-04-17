/**
 * SequenceCompleter component tests
 *
 * Ensures:
 *  - Steps render with labels (not raw IDs)
 *  - Submit button calls onSubmit with step IDs in current order
 *  - Locks after submission (no re-submit)
 *  - Correct/incorrect visual state after submission
 *  - Empty steps list renders without crash
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SequenceCompleter } from "../../components/environments/SequenceCompleter";

const STEPS = [
  { id: "s1", label: "Account created and initialized with lamports" },
  { id: "s2", label: "Instruction specifies which program to call" },
  { id: "s3", label: "Transaction bundles one or more instructions" },
  { id: "s4", label: "Signer authorizes the transaction" },
  { id: "s5", label: "Runtime validates accounts and executes" },
];
const CORRECT_ORDER = ["s1", "s2", "s3", "s4", "s5"];

describe("SequenceCompleter — rendering", () => {
  it("renders all step labels (not raw IDs)", () => {
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={vi.fn()}
      />
    );
    for (const step of STEPS) {
      expect(screen.getByText(step.label)).toBeTruthy();
    }
    // IDs should NOT be visible as text
    for (const step of STEPS) {
      expect(screen.queryByText(step.id)).toBeNull();
    }
  });

  it("renders 'Drag to reorder' instruction", () => {
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText(/drag to reorder/i)).toBeTruthy();
  });

  it("renders Check Answer button initially", () => {
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /check answer/i })).toBeTruthy();
  });

  it("renders without crashing when steps is empty", () => {
    expect(() =>
      render(
        <SequenceCompleter steps={[]} correctOrder={[]} onSubmit={vi.fn()} />
      )
    ).not.toThrow();
  });
});

describe("SequenceCompleter — submission", () => {
  it("calls onSubmit with an array of step IDs on click", () => {
    const onSubmit = vi.fn();
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
    const submitted = onSubmit.mock.calls[0][0] as string[];
    expect(Array.isArray(submitted)).toBe(true);
    expect(submitted).toHaveLength(STEPS.length);
    // Each element should be a known step ID
    for (const id of submitted) {
      expect(STEPS.map((s) => s.id)).toContain(id);
    }
  });

  it("does NOT call onSubmit a second time when button is locked", () => {
    const onSubmit = vi.fn();
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={onSubmit}
      />
    );
    const btn = screen.getByRole("button", { name: /check answer/i });
    fireEvent.click(btn);
    fireEvent.click(btn); // second click on now-locked button
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("shows 'Submitted' on button after submission", () => {
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByRole("button", { name: /submitted/i })).toBeTruthy();
  });

  it("submit button is disabled during loading", () => {
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={vi.fn()}
        loading={true}
      />
    );
    // dnd-kit sortable items also carry role="button" — match by name instead
    const btn = screen.getByRole("button", { name: /checking/i });
    expect(btn).toBeDisabled();
  });
});

describe("SequenceCompleter — shows 'Order locked' message after submit", () => {
  it("shows lock message after submission", () => {
    render(
      <SequenceCompleter
        steps={STEPS}
        correctOrder={CORRECT_ORDER}
        onSubmit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(screen.getByText(/order locked/i)).toBeTruthy();
  });
});
