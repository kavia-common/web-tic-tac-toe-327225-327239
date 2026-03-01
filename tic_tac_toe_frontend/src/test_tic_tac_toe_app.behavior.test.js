import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "./App";

/**
 * Click a square by its 1-based label (Square 1..Square 9).
 * @param {number} n
 */
function clickSquare(n) {
  fireEvent.click(
    screen.getByRole("gridcell", { name: new RegExp(`Square ${n}\\b`, "i") })
  );
}

/**
 * Switch game mode using the mode dropdown.
 * @param {"HUMAN"|"AI"} mode
 */
function setMode(mode) {
  fireEvent.change(screen.getByLabelText(/select game mode/i), {
    target: { value: mode },
  });
}

/**
 * Advance the AI "thinking" delay.
 * App currently uses 250ms; we advance a bit more for stability.
 */
function flushAiMove() {
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

describe("Tic Tac Toe App (expanded behaviors)", () => {
  test("theme toggle updates document theme attribute", () => {
    render(<App />);

    // Default is light
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    fireEvent.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    fireEvent.click(screen.getByRole("button", { name: /switch to light mode/i }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  test("switching modes resets an in-progress game", () => {
    render(<App />);

    // Start in HUMAN mode and make a move.
    setMode("HUMAN");
    clickSquare(1);
    expect(screen.getByLabelText(/Square 1:\s*X/i)).toBeInTheDocument();

    // Switching to AI should reset board and status.
    setMode("AI");
    expect(screen.queryByLabelText(/Square 1:\s*(X|O)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/your turn\s*\(X\)/i)).toBeInTheDocument();

    // Make a move again to ensure new game works.
    jest.useFakeTimers();
    clickSquare(1);
    flushAiMove();
    expect(screen.getByLabelText(/Square 5:\s*O/i)).toBeInTheDocument();
    jest.useRealTimers();
  });

  test("Human vs AI: AI chooses a winning move when available", () => {
    jest.useFakeTimers();
    render(<App />);
    setMode("AI");

    /**
     * Goal: Create a position where O can win immediately on its turn.
     * Sequence:
     * 1) X plays 1, AI plays 5 (center)
     * 2) X plays 2, AI should play 3 (corner/edge selection; with 5 taken, corners are prioritized -> 3)
     * Now O has {3,5}. If X plays 9, O can win by playing 7 to complete diagonal 3-5-7.
     */
    clickSquare(1); // X
    flushAiMove(); // O at 5
    clickSquare(2); // X
    flushAiMove(); // O expected at 3 (corner)

    // Confirm AI's corner choice happened so the win is deterministic for this test.
    expect(screen.getByLabelText(/Square 3:\s*O/i)).toBeInTheDocument();

    clickSquare(9); // X
    flushAiMove(); // O should win by playing 7

    expect(screen.getByLabelText(/Square 7:\s*O/i)).toBeInTheDocument();
    expect(screen.getByText(/winner:\s*O/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("Human vs AI: AI blocks an immediate human win", () => {
    jest.useFakeTimers();
    render(<App />);
    setMode("AI");

    /**
     * Sequence:
     * X:1, AI:5
     * X:2 -> now X threatens 3 to win across top row.
     * AI should block at 3.
     */
    clickSquare(1); // X
    flushAiMove(); // O at 5
    clickSquare(2); // X
    flushAiMove(); // O should block at 3

    expect(screen.getByLabelText(/Square 3:\s*O/i)).toBeInTheDocument();
    expect(screen.getByText(/your turn\s*\(X\)/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("Human vs Human: winning line squares get the win highlight class", () => {
    render(<App />);
    setMode("HUMAN");

    // X wins across the top row: 1,2,3
    clickSquare(1); // X
    clickSquare(4); // O
    clickSquare(2); // X
    clickSquare(5); // O
    clickSquare(3); // X -> win

    expect(screen.getByText(/winner:\s*x/i)).toBeInTheDocument();

    const sq1 = screen.getByRole("gridcell", { name: /^Square 1\b/i });
    const sq2 = screen.getByRole("gridcell", { name: /^Square 2\b/i });
    const sq3 = screen.getByRole("gridcell", { name: /^Square 3\b/i });

    expect(sq1.className).toMatch(/square--win/);
    expect(sq2.className).toMatch(/square--win/);
    expect(sq3.className).toMatch(/square--win/);

    const sq4 = screen.getByRole("gridcell", { name: /^Square 4\b/i });
    expect(sq4.className).not.toMatch(/square--win/);
  });

  test("Human vs AI: after game ends, no further moves occur (including AI)", () => {
    jest.useFakeTimers();
    render(<App />);
    setMode("AI");

    // Drive toward a quick X win by exploiting AI's deterministic responses.
    // X:1, O:5, X:9, O:3, X:7 -> X wins on diagonal 1-5-9 is blocked since O has 5.
    // Instead, we can win on column 1 with X at 1,4,7 while AI plays 5 and then a corner.
    clickSquare(1); // X
    flushAiMove(); // O at 5
    clickSquare(4); // X
    flushAiMove(); // O chooses corner 3
    clickSquare(7); // X wins column 1

    expect(screen.getByText(/winner:\s*x/i)).toBeInTheDocument();

    // Attempt to click an empty square; should not change.
    clickSquare(2);
    expect(screen.queryByLabelText(/Square 2:\s*(X|O)/i)).not.toBeInTheDocument();

    // Even if timers advance, AI should not play after game ended.
    flushAiMove();
    expect(screen.queryByLabelText(/Square 2:\s*(X|O)/i)).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
