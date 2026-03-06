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
    // format: "EEE, MMM d" → e.g. "Fri, Mar 15"
    expect(screen.getByText("Fri, Mar 15")).toBeInTheDocument();
  });
});
