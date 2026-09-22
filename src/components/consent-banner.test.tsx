import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const posthogMock = vi.hoisted(() => ({
  set_config: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthogMock }));

async function renderBanner() {
  const { ConsentBanner } = await import("@/components/consent-banner");
  return render(<ConsentBanner />);
}

describe("ConsentBanner", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders nothing when no PostHog key is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const { container } = await renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once a decision was stored", async () => {
    window.localStorage.setItem("ds_analytics_consent", "granted");
    const { container } = await renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the banner when no decision was made yet", async () => {
    await renderBanner();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opts in, persists the decision, and hides on accept", async () => {
    await renderBanner();
    fireEvent.click(screen.getByText("Accepter"));

    expect(posthogMock.set_config).toHaveBeenCalledWith({
      persistence: "localStorage+cookie",
    });
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem("ds_analytics_consent")).toBe("granted");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opts out, persists the decision, and hides on refuse", async () => {
    await renderBanner();
    fireEvent.click(screen.getByText("Refuser"));

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem("ds_analytics_consent")).toBe("denied");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
