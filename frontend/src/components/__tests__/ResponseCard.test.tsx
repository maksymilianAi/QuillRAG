import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResponseCard } from "../ResponseCard";
import * as api from "../../api";
import type { GenerateCopyResponse } from "../../types";

vi.mock("../../api");

// ─── Fixtures ────────────────────────────────────────────────────────────────

const base: GenerateCopyResponse = {
  format: "confirmation_success",
  recommended: 0,
  variants: [
    {
      headline: "Your request has been submitted",
      body: "You can check the status under expense details.",
      ctas: [],
    },
    {
      headline: "Request submitted!",
      body: "Check the status anytime under expense details.",
      ctas: [],
    },
  ],
  reasoning: {
    headline: "Sentence case for 5-word title with personal framing.",
    body: "Capability framing — 'you can check' instead of imperative.",
  },
};

const rewriteResponse: GenerateCopyResponse = {
  format: "confirmation_success",
  recommended: 0,
  variants: [{ headline: "Request received", ctas: [] }],
  reasoning: {},
};

beforeEach(() => {
  vi.mocked(api.generateCopy).mockResolvedValue(rewriteResponse);
});

// ─── Approved state ──────────────────────────────────────────────────────────

describe("Approved state", () => {
  it("shows approvalNote and hides variants", () => {
    render(
      <ResponseCard
        data={{ ...base, approved: true, approvalNote: "Sentence case, present perfect, personal framing." }}
      />
    );
    expect(screen.getByText("Sentence case, present perfect, personal framing.")).toBeInTheDocument();
    expect(screen.queryByText(base.variants[0].headline)).not.toBeInTheDocument();
  });

  it("falls back to default note when approvalNote is absent", () => {
    render(<ResponseCard data={{ ...base, approved: true }} />);
    expect(screen.getByText(/no changes needed/i)).toBeInTheDocument();
  });
});

// ─── Clarification mode ──────────────────────────────────────────────────────

describe("Clarification mode", () => {
  const clarify: GenerateCopyResponse = {
    format: "confirmation_success",
    needsClarification: true,
    clarifyingQuestions: [
      "Which modal subtype is this?",
      "What action just completed?",
    ],
    recommended: 0,
    variants: [],
    reasoning: {},
  };

  it("renders all clarifying questions", () => {
    render(<ResponseCard data={clarify} />);
    expect(screen.getByText("Which modal subtype is this?")).toBeInTheDocument();
    expect(screen.getByText("What action just completed?")).toBeInTheDocument();
  });
});

// ─── "Already correct" badge ─────────────────────────────────────────────────

describe('"Already correct" badge', () => {
  it("shows badge when variant headline matches data.original", () => {
    render(
      <ResponseCard
        data={{
          ...base,
          original: "Your request has been submitted",
          variants: [
            { headline: "Your request has been submitted", ctas: [] },
            { headline: "Request submitted!", ctas: [] },
          ],
        }}
      />
    );
    expect(screen.getByText("Already correct")).toBeInTheDocument();
  });

  it("does not show badge when no variant matches", () => {
    render(<ResponseCard data={base} />);
    expect(screen.queryByText("Already correct")).not.toBeInTheDocument();
  });
});

// ─── Collapsible "Why" reasoning ─────────────────────────────────────────────

describe('Collapsible "Why" reasoning', () => {
  it("renders Why toggles for present reasoning sections", () => {
    render(<ResponseCard data={base} />);
    const whys = screen.getAllByText("Why this copy?");
    expect(whys.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render Why toggle when reasoning is empty", () => {
    render(<ResponseCard data={{ ...base, reasoning: {} }} />);
    expect(screen.queryByText("Why this copy?")).not.toBeInTheDocument();
  });
});

// ─── Subtype badge ───────────────────────────────────────────────────────────

describe("Subtype badge", () => {
  it("shows the detected subtype label", () => {
    render(<ResponseCard data={base} />);
    expect(screen.getByText("Confirmation · Success")).toBeInTheDocument();
  });

  it("shows formatNote when present", () => {
    render(<ResponseCard data={{ ...base, formatNote: "Auto-detected as success." }} />);
    expect(screen.getByText("Auto-detected as success.")).toBeInTheDocument();
  });
});

// ─── Adaptive variant count ──────────────────────────────────────────────────

describe("Adaptive variant count", () => {
  it("renders a single variant without crashing", () => {
    const data: GenerateCopyResponse = {
      format: "confirmation_success",
      recommended: 0,
      variants: [{ headline: "Saved", ctas: [] }],
      reasoning: {},
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /rewrite/i })).toHaveLength(1);
  });

  it("renders three variants correctly", () => {
    const data: GenerateCopyResponse = {
      format: "confirmation_success",
      recommended: 0,
      variants: [
        { headline: "Variant A", ctas: [] },
        { headline: "Variant B", ctas: [] },
        { headline: "Variant C", ctas: [] },
      ],
      reasoning: {},
    };
    render(<ResponseCard data={data} />);
    expect(screen.getByText("Variant A")).toBeInTheDocument();
    expect(screen.getByText("Variant B")).toBeInTheDocument();
    expect(screen.getByText("Variant C")).toBeInTheDocument();
  });
});

// ─── Rewrite panel ───────────────────────────────────────────────────────────

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
    expect(screen.getByRole("button", { name: "Make it more formal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simplify the language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make it more direct" })).toBeInTheDocument();
  });

  it("calls generateCopy with variant text and instruction on chip click", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    await user.click(screen.getByRole("button", { name: "Make it shorter" }));
    await waitFor(() => {
      const call = vi.mocked(api.generateCopy).mock.calls[0][0];
      expect(call.prompt).toContain("Make it shorter");
      expect(call.prompt).toContain(base.variants[0].headline);
    });
  });

  it("calls generateCopy with custom instruction on Enter", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    await user.type(screen.getByPlaceholderText(/or describe what to change/i), "Use active voice");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      const call = vi.mocked(api.generateCopy).mock.calls[0][0];
      expect(call.prompt).toContain("Use active voice");
      expect(call.prompt).toContain(base.variants[0].headline);
    });
  });

  it("submit button is disabled when input is empty", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    expect(screen.getByRole("button", { name: /submit rewrite/i })).toBeDisabled();
  });

  it("closes panel after submitting via quick action", async () => {
    const user = userEvent.setup();
    render(<ResponseCard data={base} />);
    await user.click(screen.getAllByRole("button", { name: /rewrite/i })[0]);
    await user.click(screen.getByRole("button", { name: "Make it shorter" }));
    expect(screen.queryByPlaceholderText(/or describe what to change/i)).not.toBeInTheDocument();
  });
});
