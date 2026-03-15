import { Tooltip } from "@/components/ui/Tooltip";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.useFakeTimers();

afterEach(() => {
  vi.clearAllTimers();
});

describe("Tooltip", () => {
  it("renders children without showing tooltip initially", () => {
    render(
      <Tooltip content="Hello">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders string children without showing tooltip initially", () => {
    render(<Tooltip content="Hello">Plain text</Tooltip>);
    expect(screen.getByText("Plain text")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders number children", () => {
    render(<Tooltip content="Count">{42}</Tooltip>);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip after hovering with delay", () => {
    render(
      <Tooltip content="Tooltip text" delay={400}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("does not show tooltip before delay has elapsed", () => {
    render(
      <Tooltip content="Tooltip text" delay={400}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip when mouse leaves", () => {
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not show tooltip when disabled", () => {
    render(
      <Tooltip content="Should not appear" disabled>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not show tooltip when showWhen is false", () => {
    render(
      <Tooltip content="Should not appear" showWhen={false}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip by default when showWhen is not provided", () => {
    render(
      <Tooltip content="Default visible" delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides tooltip immediately when showWhen changes to false while visible", () => {
    const { rerender } = render(
      <Tooltip content="Tooltip text" delay={0} showWhen={true}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    rerender(
      <Tooltip content="Tooltip text" delay={0} showWhen={false}>
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("accepts rich ReactNode content", () => {
    render(
      <Tooltip content={<span data-testid="rich-content">Rich</span>} delay={0}>
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByTestId("rich-content")).toBeInTheDocument();
  });

  it("shows tooltip on focus and hides on blur", () => {
    render(
      <Tooltip content="Focus tooltip" delay={0}>
        <button>Focus me</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.blur(screen.getByRole("button"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("positions tooltip via portal into document.body", () => {
    vi.useFakeTimers();
    const { getByText } = render(
      <Tooltip content="Portal tip" delay={0}>
        <button>hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getByText("hover me"));
    act(() => {
      vi.runAllTimers();
    });
    // The tooltip renders into a portal — it's in the document even if not in the component tree
    expect(document.body.textContent).toContain("Portal tip");
    vi.useRealTimers();
  });

  it("hides tooltip immediately when showWhen becomes false while visible", () => {
    vi.useFakeTimers();
    const { getByText, rerender, queryByText } = render(
      <Tooltip content="Live tip" delay={0} showWhen={true}>
        <button>target</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getByText("target"));
    act(() => {
      vi.runAllTimers();
    });
    expect(document.body.textContent).toContain("Live tip");

    // Now flip showWhen to false — tooltip should vanish immediately
    rerender(
      <Tooltip content="Live tip" delay={0} showWhen={false}>
        <button>target</button>
      </Tooltip>,
    );
    expect(queryByText("Live tip")).toBeNull();
    vi.useRealTimers();
  });

  it("renders on 'bottom' position without throwing", () => {
    vi.useFakeTimers();
    const { getByText } = render(
      <Tooltip content="Bottom tip" position="bottom" delay={0}>
        <button>target</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getByText("target"));
    act(() => {
      vi.runAllTimers();
    });
    expect(document.body.textContent).toContain("Bottom tip");
    vi.useRealTimers();
  });

  it("renders on 'left' and 'right' positions without throwing", () => {
    vi.useFakeTimers();
    const { getByText, unmount } = render(
      <Tooltip content="Left tip" position="left" delay={0}>
        <button>target</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getByText("target"));
    act(() => {
      vi.runAllTimers();
    });
    expect(document.body.textContent).toContain("Left tip");
    unmount();

    const { getByText: getByText2 } = render(
      <Tooltip content="Right tip" position="right" delay={0}>
        <button>target2</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getByText2("target2"));
    act(() => {
      vi.runAllTimers();
    });
    expect(document.body.textContent).toContain("Right tip");
    vi.useRealTimers();
  });
});
