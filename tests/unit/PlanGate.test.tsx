import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/usePlan", () => ({
  usePlan: vi.fn(),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return { ...actual };
});

import { PlanGate } from "@/components/ui/PlanGate";
import { usePlan } from "@/hooks/usePlan";
import type { Plan } from "@/lib/plans";
import { planMeetsRequirement } from "@/lib/plans";

function mockPlan(plan: Plan) {
  (usePlan as ReturnType<typeof vi.fn>).mockReturnValue({
    plan,
    features: {},
    can: (required: Plan) => planMeetsRequirement(plan, required),
  });
}

describe("PlanGate", () => {
  it("renders children when plan requirement is met", () => {
    mockPlan("pro");
    render(
      <PlanGate requires="pro">
        <div data-testid="protected-content">Secret content</div>
      </PlanGate>,
    );
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("renders children when user exceeds the required plan", () => {
    mockPlan("agency");
    render(
      <PlanGate requires="starter">
        <div data-testid="protected-content">Premium content</div>
      </PlanGate>,
    );
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("renders locked state (badge) when plan requirement is NOT met", () => {
    mockPlan("free");
    render(
      <PlanGate requires="pro">
        <div data-testid="protected-content">Secret content</div>
      </PlanGate>,
    );
    // Children still render but dimmed — the lock badge is visible
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    // Plan badge shows the required plan name
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("does not grant access on the boundary plan below requirement", () => {
    mockPlan("starter");
    render(
      <PlanGate requires="pro">
        <div>Locked</div>
      </PlanGate>,
    );
    // Lock badge present — "Pro" label visible
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("opacity is applied to the locked preview wrapper", () => {
    mockPlan("free");
    const { container } = render(
      <PlanGate requires="pro">
        <div data-testid="child">Content</div>
      </PlanGate>,
    );
    // The dimmed wrapper is the first child of the outer relative div
    const outerWrapper = container.firstChild as HTMLElement;
    const dimWrapper = outerWrapper.firstChild as HTMLElement;
    expect(dimWrapper).toHaveStyle("opacity: 0.4");
    expect(dimWrapper).toHaveStyle("pointer-events: none");
  });

  it("clicking the locked area opens the upgrade dialog", async () => {
    mockPlan("free");
    render(
      <PlanGate requires="pro">
        <div>Content</div>
      </PlanGate>,
    );
    // Dialog not present before click — the upgrade button lives inside it
    expect(screen.queryByRole("button", { name: /upgrade/i })).toBeNull();

    // Click the locked wrapper to open the dialog
    const lockedWrapper = screen.getByText("Content").closest(".relative");
    await userEvent.click(lockedWrapper!);

    // Dialog is now open
    expect(
      screen.getByRole("button", { name: /upgrade/i }),
    ).toBeInTheDocument();
  });

  it("upgrade dialog contains an upgrade button", async () => {
    mockPlan("free");
    // Mock useApi so it doesn't throw
    vi.mock("@/hooks/useApi", () => ({
      useApi: () => ({ api: { billing: { checkout: { post: vi.fn() } } } }),
    }));
    render(
      <PlanGate requires="starter">
        <div>Content</div>
      </PlanGate>,
    );
    const lockedWrapper = screen.getByText("Content").closest(".relative");
    await userEvent.click(lockedWrapper!);

    expect(
      screen.getByRole("button", { name: /upgrade/i }),
    ).toBeInTheDocument();
  });

  it("featureName prop appears in the dialog message", async () => {
    mockPlan("free");
    render(
      <PlanGate requires="pro" featureName="Custom theme builder">
        <div>Content</div>
      </PlanGate>,
    );
    const lockedWrapper = screen.getByText("Content").closest(".relative");
    await userEvent.click(lockedWrapper!);

    // The full sentence is split across elements — query the paragraph node directly
    const messageParagraph = screen.getByText(/requires the/i).closest("p")!;
    expect(messageParagraph.textContent).toMatch(/Custom theme builder/i);
    expect(messageParagraph.textContent).toMatch(/pro/i);
  });

  it("shows generic message when featureName is not provided", async () => {
    mockPlan("free");
    render(
      <PlanGate requires="starter">
        <div>Content</div>
      </PlanGate>,
    );
    const lockedWrapper = screen.getByText("Content").closest(".relative");
    await userEvent.click(lockedWrapper!);

    const messageParagraph = screen.getByText(/requires the/i).closest("p")!;
    expect(messageParagraph.textContent).toMatch(/This feature/i);
    expect(messageParagraph.textContent).toMatch(/starter/i);
  });

  it("plan label in dialog badge is capitalised correctly", async () => {
    mockPlan("free");
    render(
      <PlanGate requires="agency">
        <div>Content</div>
      </PlanGate>,
    );
    const lockedWrapper = screen.getByText("Content").closest(".relative");
    await userEvent.click(lockedWrapper!);

    // The <p> badge inside the dialog shows "Agency Plan"
    expect(screen.getByText("Agency Plan")).toBeInTheDocument();
  });

  it("clicking Cancel closes the dialog", async () => {
    mockPlan("free");
    render(
      <PlanGate requires="pro">
        <div>Content</div>
      </PlanGate>,
    );
    const lockedWrapper = screen.getByText("Content").closest(".relative");
    await userEvent.click(lockedWrapper!);

    // Dialog open
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Cancel"));

    // Dialog closed
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("clicking the backdrop closes the dialog", async () => {
    mockPlan("free");
    render(
      <PlanGate requires="pro">
        <div>Content</div>
      </PlanGate>,
    );
    const lockedWrapper = screen.getByText("Content").closest(".relative");
    await userEvent.click(lockedWrapper!);

    expect(screen.getByText("Cancel")).toBeInTheDocument();

    // The backdrop is the fixed overlay div — click outside the inner modal card
    const backdrop = screen.getByText("Cancel").closest(".fixed")!;
    await userEvent.click(backdrop);

    expect(screen.queryByText("Cancel")).toBeNull();
  });
});
