/**
 * FeedbackPanel component tests
 *
 * Ensures:
 *  - Score is displayed as a percentage (not a raw decimal like 0.1)
 *  - Pass/fail states render correct copy and styling cues
 *  - Raw JSON strings are NOT rendered as markdown code fences in feedback
 *  - Reward text only shown on pass
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackPanel } from "../../components/environments/FeedbackPanel";

describe("FeedbackPanel — score display", () => {
  it("renders score as percentage, not raw decimal", () => {
    render(<FeedbackPanel pass={false} score={0.1} feedback="Try again." />);
    // Should show "10%" not "0.1"
    expect(screen.getByText(/10%/)).toBeTruthy();
    expect(screen.queryByText(/score:\s*0\.1/)).toBeNull();
  });

  it("renders 100% for a perfect score", () => {
    render(<FeedbackPanel pass={true} score={1.0} feedback="Perfect." />);
    expect(screen.getByText(/100%/)).toBeTruthy();
  });

  it("renders 80% for score=0.8", () => {
    render(<FeedbackPanel pass={true} score={0.8} feedback="Good." />);
    expect(screen.getByText(/80%/)).toBeTruthy();
  });

  it("rounds fractional scores correctly (0.333 → 33%)", () => {
    render(<FeedbackPanel pass={false} score={0.333} feedback="Partial." />);
    expect(screen.getByText(/33%/)).toBeTruthy();
  });
});

describe("FeedbackPanel — pass/fail states", () => {
  it("shows 'Mission complete' on pass", () => {
    render(<FeedbackPanel pass={true} score={1.0} feedback="Well done." />);
    expect(screen.getByText("Mission complete")).toBeTruthy();
  });

  it("shows 'Not quite' on fail", () => {
    render(<FeedbackPanel pass={false} score={0.4} feedback="Wrong." />);
    expect(screen.getByText("Not quite")).toBeTruthy();
  });

  it("renders the feedback text", () => {
    const feedback = "You got the signer step wrong — it comes after bundling.";
    render(<FeedbackPanel pass={false} score={0.6} feedback={feedback} />);
    expect(screen.getByText(feedback)).toBeTruthy();
  });
});

describe("FeedbackPanel — raw JSON regression", () => {
  it("score is always computed from the score prop, never from feedback text", () => {
    // Regression: judge route was returning ```json fences, JSON.parse failed,
    // fallback forced score=0 and dumped raw JSON string as feedback.
    // The component itself always computes display from its score prop.
    render(<FeedbackPanel pass={false} score={0.1} feedback="Try again." />);
    expect(screen.getByText(/10%/)).toBeTruthy();
    // Should not show 0%
    expect(screen.queryByText(/score:\s*0%/)).toBeNull();
  });

  it("component renders without crashing when feedback contains special characters", () => {
    expect(() =>
      render(
        <FeedbackPanel
          pass={false}
          score={0}
          feedback={'{"pass": false, "score": 0}'}
        />
      )
    ).not.toThrow();
  });

  it("feedback string is rendered verbatim (no markdown parsing in component)", () => {
    // The judge route must strip fences before sending feedback here.
    // If raw JSON ever reaches the component it will render as text — ugly but not broken.
    // This test documents that contract and ensures score is still correct.
    const feedback = "Correct. Signer authorization precedes runtime execution.";
    render(<FeedbackPanel pass={true} score={1.0} feedback={feedback} />);
    expect(screen.getByText(feedback)).toBeTruthy();
    expect(screen.getByText(/100%/)).toBeTruthy();
  });
});

describe("FeedbackPanel — reward text", () => {
  it("shows reward text when passed and rewardText provided", () => {
    render(
      <FeedbackPanel
        pass={true}
        score={1.0}
        feedback="Correct."
        rewardText="Sequence confirmed. +145 points"
      />
    );
    expect(screen.getByText(/Sequence confirmed/)).toBeTruthy();
    expect(screen.getByText(/\+145 points/)).toBeTruthy();
  });

  it("does NOT show reward text on fail", () => {
    render(
      <FeedbackPanel
        pass={false}
        score={0.4}
        feedback="Wrong."
        rewardText="You earned it"
      />
    );
    expect(screen.queryByText(/You earned it/)).toBeNull();
  });

  it("renders without rewardText prop", () => {
    expect(() =>
      render(<FeedbackPanel pass={true} score={1.0} feedback="Good." />)
    ).not.toThrow();
  });
});
