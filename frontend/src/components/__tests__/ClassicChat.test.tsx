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

// ─── Ticket: clarifying questions — pendingClarification flow ────────────────

describe("ClassicChat – clarification flow", () => {
  beforeEach(() => {
    vi.mocked(api.generateCopy).mockResolvedValue(clarifyResponse);
  });

  it("shows suggestion buttons on empty state", () => {
    render(<ClassicChat />);
    expect(screen.getByText("Write onboarding screen headlines")).toBeInTheDocument();
  });

  it("sends first request via suggestion click and shows clarification UI", async () => {
    const user = userEvent.setup();
    render(<ClassicChat />);

    await user.click(screen.getByText("Write onboarding screen headlines"));

    await waitFor(() => {
      expect(screen.getByText("What type of component is this?")).toBeInTheDocument();
    });
  });

  it("combines original prompt with clarification answer on follow-up", async () => {
    const user = userEvent.setup();
    render(<ClassicChat />);

    // First message → clarification response
    await user.click(screen.getByText("Write onboarding screen headlines"));
    await waitFor(() => {
      expect(screen.getByText("What type of component is this?")).toBeInTheDocument();
    });

    // Second call returns full response
    vi.mocked(api.generateCopy).mockResolvedValue(fullResponse);

    // Answer via quick chip
    await user.click(screen.getByRole("button", { name: "Error message" }));

    await waitFor(() => {
      const secondCall = vi.mocked(api.generateCopy).mock.calls[1][0];
      expect(secondCall.prompt).toContain("Write onboarding screen headlines");
      expect(secondCall.prompt).toContain("Error message");
    });
  });

  it("clears pendingClarification after follow-up so third message is standalone", async () => {
    const user = userEvent.setup();
    render(<ClassicChat />);

    // Trigger → clarify
    await user.click(screen.getByText("Write onboarding screen headlines"));
    await waitFor(() =>
      expect(screen.getByText("What type of component is this?")).toBeInTheDocument()
    );

    // Answer → full response
    vi.mocked(api.generateCopy).mockResolvedValue(fullResponse);
    await user.click(screen.getByRole("button", { name: "Error message" }));
    await waitFor(() => expect(screen.getByText("Done")).toBeInTheDocument());

    // Third message should NOT combine with prior clarification
    vi.mocked(api.generateCopy).mockResolvedValue(fullResponse);
    const textarea = screen.getByPlaceholderText(/write your request/i);
    await user.type(textarea, "Improve error messages for a login form");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const thirdCall = vi.mocked(api.generateCopy).mock.calls[2][0];
      expect(thirdCall.prompt).not.toContain("Write onboarding screen headlines");
      expect(thirdCall.prompt).toBe("Improve error messages for a login form");
    });
  });
});
