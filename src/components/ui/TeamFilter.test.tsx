import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamFilter } from "./TeamFilter";

const teams = [
  { name: "Team Alpha", acronym: "TA", imageUrl: "https://img.example.com/alpha.png" },
  { name: "Team Bravo", acronym: "TB", imageUrl: null },
  { name: "Natus Vincere", acronym: "NAVI", imageUrl: "https://img.example.com/navi.png" },
];

describe("TeamFilter", () => {
  it("shows team list on focus", async () => {
    const user = userEvent.setup();
    render(<TeamFilter teams={teams} selectedTeam={null} onChange={() => {}} />);

    await user.click(screen.getByPlaceholderText("Filter by team..."));

    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    expect(screen.getByText("Team Bravo")).toBeInTheDocument();
    expect(screen.getByText("Natus Vincere")).toBeInTheDocument();
  });

  it("filters teams as user types", async () => {
    const user = userEvent.setup();
    render(<TeamFilter teams={teams} selectedTeam={null} onChange={() => {}} />);

    await user.type(screen.getByPlaceholderText("Filter by team..."), "navi");

    expect(screen.getByText("Natus Vincere")).toBeInTheDocument();
    expect(screen.queryByText("Team Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Team Bravo")).not.toBeInTheDocument();
  });

  it("filters teams by name", async () => {
    const user = userEvent.setup();
    render(<TeamFilter teams={teams} selectedTeam={null} onChange={() => {}} />);

    await user.type(screen.getByPlaceholderText("Filter by team..."), "bravo");

    expect(screen.getByText("Team Bravo")).toBeInTheDocument();
    expect(screen.queryByText("Team Alpha")).not.toBeInTheDocument();
  });

  it("calls onChange with team name on selection", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TeamFilter teams={teams} selectedTeam={null} onChange={handleChange} />);

    await user.click(screen.getByPlaceholderText("Filter by team..."));
    await user.click(screen.getByText("Team Alpha"));

    expect(handleChange).toHaveBeenCalledWith("Team Alpha");
  });

  it("calls onChange with null when clear is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TeamFilter teams={teams} selectedTeam="Team Alpha" onChange={handleChange} />);

    await user.click(screen.getByLabelText("Clear filter"));

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("shows selected team name as placeholder", () => {
    render(<TeamFilter teams={teams} selectedTeam="Team Alpha" onChange={() => {}} />);

    expect(screen.getByPlaceholderText("Team Alpha")).toBeInTheDocument();
  });
});
