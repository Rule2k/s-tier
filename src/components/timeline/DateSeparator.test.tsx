import { render, screen } from "@testing-library/react";
import { DateSeparator } from "./DateSeparator";
import { addDays, subDays } from "date-fns";

describe("DateSeparator", () => {
  it("displays 'Today' for today's date", () => {
    render(<DateSeparator date={new Date()} />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("displays 'Tomorrow' for tomorrow's date", () => {
    render(<DateSeparator date={addDays(new Date(), 1)} />);
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("displays 'Yesterday' for yesterday's date", () => {
    render(<DateSeparator date={subDays(new Date(), 1)} />);
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("displays formatted date for other dates", () => {
    // Use a fixed date far enough from today
    const date = new Date("2024-03-15T12:00:00Z");
    render(<DateSeparator date={date} />);
    // format: "EEEE, MMMM d" → e.g. "Friday, March 15"
    expect(screen.getByText("Friday, March 15")).toBeInTheDocument();
  });

  it("can render as a sticky separator", () => {
    const { container } = render(<DateSeparator date={new Date("2024-03-15T12:00:00Z")} sticky stickyTop="120px" />);
    const separator = container.querySelector("[data-date-separator]");

    expect(separator).toHaveClass("sticky");
    expect(separator).toHaveStyle({ top: "120px" });
  });
});
