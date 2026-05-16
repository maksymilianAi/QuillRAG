import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClassicChat } from "../ClassicChat";
import * as api from "../../api";
import type { GenerateCopyResponse } from "../../types";

vi.mock("../../api");

// ─── Fixtures ────────────────────────────────────────────────────────────────

const clarifyResponse: GenerateCopyResponse = {
  format: "full",
  needsClarification: true,
  clarifyingQuestions: ["What type of component is this?"],
  quickOptions: ["Error message", "Success confirmation"],
  recommended: 0,
  variants: [],
  fixes: [],
  reasoning: {},
};

const fullResponse: GenerateCopyResponse = {
  format: "full",
  recommended: 0,
  variants: [{ headline: "Done", ctas: [] }],
  fixes: [],
  reasoning: {},
};

const fullResponse2: GenerateCopyResponse = {
  format: "full",
  recommended: 0,
  variants: [{ headline: "Standalone", ctas: [] }],
  fixes: [],
  reasoning: {},
};

async function typeAndSend(user: ReturnType<typeof userEvent.setup>, text: string) {
  await waitFor(() =>
    expect(screen.getByPlaceholderText(/write your request/i)).not.toBeDisabled()
  );
  const textarea = screen.getByPlaceholderText(/write your request/i);
  await user.click(textarea);
  await user.type(textarea, text);
  await user.keyboard("{Enter}");
}

// ─── Ticket: clarifying questions — pendingClarification flow ────────────────

describe("ClassicChat – clarification flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.generateCopy).mockResolvedValue(clarifyResponse);
  });

  it("shows suggestion buttons on empty state", () => {
    render(<ClassicChat />);
    expect(screen.getByText("Rewrite a page or modal copy")).toBeInTheDocument();
  });

  it("sends first request via suggestion click and shows clarification UI", async () => {
    const user = userEvent.setup();
    render(<ClassicChat />);

    await user.click(screen.getByText("Rewrite a page or modal copy"));

    await waitFor(() => {
      expect(screen.getByText("What type of component is this?")).toBeInTheDocument();
    });
  });

  it("combines original prompt with follow-up answer", async () => {
    const user = userEvent.setup();
    render(<ClassicChat />);

    // First message → clarification
    await user.click(screen.getByText("Rewrite a page or modal copy"));
    await waitFor(() =>
      expect(screen.getByText("What type of component is this?")).toBeInTheDocument()
    );

    // Follow-up via quick option chip (calls onAnswer → handleSend)
    vi.mocked(api.generateCopy).mockResolvedValue(fullResponse);
    await user.click(screen.getByRole("button", { name: "Error message" }));

    await waitFor(() => expect(screen.getAllByText("Done").length).toBeGreaterThanOrEqual(1));

    const secondCall = vi.mocked(api.generateCopy).mock.calls[1][0];
    expect(secondCall.prompt).toContain("Rewrite a page or modal copy");
    expect(secondCall.prompt).toContain("Error message");
  });

  it("clears pendingClarification after follow-up so third message is standalone", async () => {
    const user = userEvent.setup();
    render(<ClassicChat />);

    // Trigger → clarify
    await user.click(screen.getByText("Rewrite a page or modal copy"));
    await waitFor(() =>
      expect(screen.getByText("What type of component is this?")).toBeInTheDocument()
    );

    // Follow-up via quick option chip → full response
    vi.mocked(api.generateCopy).mockResolvedValue(fullResponse);
    await user.click(screen.getByRole("button", { name: "Error message" }));
    await waitFor(() => expect(screen.getAllByText("Done").length).toBeGreaterThanOrEqual(1));

    // Third message via ChatInput — should NOT combine with prior clarification
    vi.mocked(api.generateCopy).mockResolvedValue(fullResponse2);
    await typeAndSend(user, "Improve error messages for a login form");
    await waitFor(() => expect(screen.getByText("Standalone")).toBeInTheDocument());

    const thirdCall = vi.mocked(api.generateCopy).mock.calls[2][0];
    expect(thirdCall.prompt).not.toContain("Rewrite a page or modal copy");
    expect(thirdCall.prompt).toBe("Improve error messages for a login form");
  });
});
