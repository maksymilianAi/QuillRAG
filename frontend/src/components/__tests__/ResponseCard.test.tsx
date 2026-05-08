import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ResponseCard } from "../ResponseCard";
import type { GenerateCopyResponse } from "../../types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const base: GenerateCopyResponse = {
  format: "full",
  recommended: 0,
  variants: [
    { headline: "Service Created", body: "Update payout definitions.", ctas: ["Go to Services"] },
    { headline: "Done", body: "Configure payouts.", ctas: ["View Services"] },
  ],
  fixes: [],
  reasoning: { headline: "Short noun phrase.", body: "Verb-first, sentence style." },
};

// ─── Ticket: approved + approvalNote ─────────────────────────────────────────

describe("Approved state", () => {
  it("shows approvalNote and hides variants", () => {
    render(
      <ResponseCard
        data={{ ...base, approved: true, approvalNote: "Looks good — verb-first, ends with period." }}
      />
    );
    expect(screen.getByText("Looks good — verb-first, ends with period.")).toBeInTheDocument();
    expect(screen.queryByText("Service Created")).not.toBeInTheDocument();
  });

  it("falls back to default note when approvalNote is absent", () => {
    render(<ResponseCard data={{ ...base, approved: true }} />);
    expect(screen.getByText(/no changes needed/i)).toBeInTheDocument();
  });
});

// ─── Ticket: clarifying questions ────────────────────────────────────────────

describe("Clarification mode", () => {
  const clarify: GenerateCopyResponse = {
    format: "full",
    needsClarification: true,
    clarifyingQuestions: ["What type of component is this?", "What is the user goal?"],
    quickOptions: ["Empty state", "Error message"],
    recommended: 0,
    variants: [],
    fixes: [],
    reasoning: {},
  };

  it("renders all clarifying questions", () => {
    render(<ResponseCard data={clarify} />);
    expect(screen.getByText("What type of component is this?")).toBeInTheDocument();
    expect(screen.getByText("What is the user goal?")).toBeInTheDocument();
  });

  it("renders quick option chips", () => {
    render(<ResponseCard data={clarify} />);
    expect(screen.getByRole("button", { name: "Empty state" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Error message" })).toBeInTheDocument();
  });

  it("calls onAnswer with chip text when chip is clicked", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ResponseCard data={clarify} onAnswer={onAnswer} />);
    await user.click(screen.getByRole("button", { name: "Empty state" }));
    expect(onAnswer).toHaveBeenCalledWith("Empty state");
  });

  it("calls onAnswer with typed text on Enter", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ResponseCard data={clarify} onAnswer={onAnswer} />);
    await user.type(screen.getByPlaceholderText(/describe the component/i), "Login form error");
    await user.keyboard("{Enter}");
    expect(onAnswer).toHaveBeenCalledWith("Login form error");
  });

  it("does not call onAnswer when input is empty", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ResponseCard data={clarify} onAnswer={onAnswer} />);
    await user.keyboard("{Enter}");
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

// ─── Ticket: grammar "No issues found" empty state ───────────────────────────

describe("Grammar & Style section", () => {
  it('shows "No issues found" when fixes is empty', () => {
    render(<ResponseCard data={{ ...base, fixes: [] }} />);
    expect(screen.getByText(/no issues found/i)).toBeInTheDocument();
  });

  it("renders fix cards when fixes are present", () => {
    const fixes = [
      { original: "Don't forget", rule: "No reminder phrasing", corrected: "Update definitions" },
    ];
    render(<ResponseCard data={{ ...base, fixes }} />);
    expect(screen.getByText("Don't forget")).toBeInTheDocument();
    expect(screen.getByText("Update definitions")).toBeInTheDocument();
    expect(screen.getByText("No reminder phrasing")).toBeInTheDocument();
  });
});

// ─── Ticket: "Already correct" badge ─────────────────────────────────────────

describe('"Already correct" badge', () => {
  it("shows badge when variant headline matches data.original", () => {
    render(
      <ResponseCard
        data={{
          ...base,
          original: "Service Created",
          variants: [
            { headline: "Service Created", ctas: [] },
            { headline: "Done", ctas: [] },
          ],
        }}
      />
    );
    expect(screen.getByText("Already correct")).toBeInTheDocument();
  });

  it("shows badge when variant matches quoted text in prompt", () => {
    render(
      <ResponseCard
        data={{
          ...base,
          variants: [
            { headline: "Service Created", ctas: [] },
            { headline: "Done", ctas: [] },
          ],
        }}
        prompt='"Service Created"'
      />
    );
    expect(screen.getByText("Already correct")).toBeInTheDocument();
  });

  it("does not show badge when no variant matches", () => {
    render(<ResponseCard data={base} />);
    expect(screen.queryByText("Already correct")).not.toBeInTheDocument();
  });
});

// ─── Ticket: collapsible "Why" reasoning ─────────────────────────────────────

describe('Collapsible "Why" reasoning', () => {
  it("renders Why toggles for present reasoning sections", () => {
    render(<ResponseCard data={base} />);
    const whys = screen.getAllByText("Why");
    expect(whys.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render Why toggle when reasoning section is absent", () => {
    render(<ResponseCard data={{ ...base, reasoning: {} }} />);
    expect(screen.queryByText("Why")).not.toBeInTheDocument();
  });
});

// ─── Ticket: adaptive format rendering ───────────────────────────────────────

describe("Adaptive format rendering", () => {
  it("renders body-only section for tooltip format", () => {
    const data: GenerateCopyResponse = {
      format: "tooltip",
      recommended: 0,
      variants: [{ body: "Limits HSA contributions per year.", ctas: [] }],
      fixes: [],
      reasoning: { body: "Sentence style." },
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Limits HSA contributions per year.")).toBeInTheDocument();
    expect(screen.queryByText(/headline/i)).not.toBeInTheDocument();
  });

  it("renders CTA chip for button format", () => {
    const data: GenerateCopyResponse = {
      format: "button",
      recommended: 0,
      variants: [{ ctas: ["Submit Reimbursement"] }],
      fixes: [],
      reasoning: {},
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Submit Reimbursement")).toBeInTheDocument();
  });

  it("renders headline-only for label format", () => {
    const data: GenerateCopyResponse = {
      format: "label",
      recommended: 0,
      variants: [
        { headline: "Supporting Documents", ctas: [] },
        { headline: "Attachments", ctas: [] },
      ],
      fixes: [],
      reasoning: {},
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Supporting Documents")).toBeInTheDocument();
    expect(screen.queryByText(/body text/i)).not.toBeInTheDocument();
  });

  it("renders headline for status format", () => {
    const data: GenerateCopyResponse = {
      format: "status",
      recommended: 0,
      variants: [{ headline: "Payment Processed", ctas: [] }],
      fixes: [],
      reasoning: {},
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Payment Processed")).toBeInTheDocument();
  });

  it("does not crash when formatNote is present", () => {
    const data: GenerateCopyResponse = {
      ...base,
      format: "warning",
      formatNote: "This reads as a warning, not an info message.",
    };
    expect(() => render(<ResponseCard data={data} />)).not.toThrow();
  });
});

// ─── Ticket: adaptive variant count ──────────────────────────────────────────

describe("Adaptive variant count", () => {
  it("renders a single variant without crashing", () => {
    const data: GenerateCopyResponse = {
      format: "tooltip",
      recommended: 0,
      variants: [{ body: "Only one variant.", ctas: [] }],
      fixes: [],
      reasoning: {},
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Only one variant.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /rewrite/i })).toHaveLength(1);
  });

  it("renders three variants correctly", () => {
    const data: GenerateCopyResponse = {
      format: "status",
      recommended: 0,
      variants: [
        { headline: "Variant A", ctas: [] },
        { headline: "Variant B", ctas: [] },
        { headline: "Variant C", ctas: [] },
      ],
      fixes: [],
      reasoning: {},
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Variant A")).toBeInTheDocument();
    expect(screen.getByText("Variant B")).toBeInTheDocument();
    expect(screen.getByText("Variant C")).toBeInTheDocument();
  });
});

// ─── Ticket: Rewrite button ───────────────────────────────────────────────────

describe("Rewrite panel", () => {
  it("opens panel on Rewrite click", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    expect(screen.getByPlaceholderText(/or describe what to change/i)).toBeInTheDocument();
  });

  it("closes panel on second Rewrite click (toggle)", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    const [first] = screen.getAllByRole("button", { name: /rewrite/i });
    await user.click(first);
    await user.click(first);
    expect(screen.queryByPlaceholderText(/or describe what to change/i)).not.toBeInTheDocument();
  });

  it("only one panel open at a time", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    const rewrites = screen.getAllByRole("button", { name: /rewrite/i });
    await user.click(rewrites[0]);
    await user.click(rewrites[1]);
    expect(screen.getAllByPlaceholderText(/or describe what to change/i)).toHaveLength(1);
  });

  it("shows all four quick action chips", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    expect(screen.getByRole("button", { name: "Make it shorter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make it longer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make it more formal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simplify the language" })).toBeInTheDocument();
  });

  it("calls onAnswer with variant text and quick action on chip click", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ResponseCard data={base} onAnswer={onAnswer} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    await user.click(screen.getByRole("button", { name: "Make it shorter" }));
    expect(onAnswer).toHaveBeenCalledWith(expect.stringContaining("Make it shorter"));
    expect(onAnswer).toHaveBeenCalledWith(expect.stringContaining("Service Created"));
  });

  it("calls onAnswer with custom instruction on Enter", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ResponseCard data={base} onAnswer={onAnswer} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    await user.type(screen.getByPlaceholderText(/or describe what to change/i), "Use active voice");
    await user.keyboard("{Enter}");
    expect(onAnswer).toHaveBeenCalledWith(expect.stringContaining("Use active voice"));
    expect(onAnswer).toHaveBeenCalledWith(expect.stringContaining("Service Created"));
  });

  it("submit button is disabled when input is empty", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("closes panel after submitting via quick action", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} onAnswer={vi.fn()} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    await user.click(screen.getByRole("button", { name: "Make it shorter" }));
    expect(screen.queryByPlaceholderText(/or describe what to change/i)).not.toBeInTheDocument();
  });
});
