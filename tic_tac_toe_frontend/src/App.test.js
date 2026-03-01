import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

/**
 * Click a square by its 1-based label (Square 1..Square 9).
 * @param {number} n
 */
function clickSquare(n) {
  fireEvent.click(screen.getByRole("gridcell", { name: new RegExp(`Square ${n}\\b`, "i") }));
}

describe("Tic Tac Toe App", () => {
  test("renders the game title and initial status", () => {
    render(<App />);
    expect(screen.getByText(/tic tac toe/i)).toBeInTheDocument();
    expect(screen.getByText(/next player:\s*x/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /restart/i })).toBeInTheDocument();
  });

  test("players alternate turns and a win is detected", () => {
    render(<App />);

    // X wins across the top row: 1,2,3
    clickSquare(1); // X
    clickSquare(4); // O
    clickSquare(2); // X
    clickSquare(5); // O
    clickSquare(3); // X -> win

    expect(screen.getByText(/winner:\s*x/i)).toBeInTheDocument();

    // After win, further clicks should not change board.
    clickSquare(6);
    expect(screen.queryByLabelText(/Square 6:\s*(X|O)/i)).not.toBeInTheDocument();
  });

  test("detects a draw", () => {
    render(<App />);

    /**
     * Draw sequence (no 3-in-a-row):
     * X:1 O:2 X:3
     * O:5 X:4 O:6
     * X:8 O:7 X:9
     */
    clickSquare(1); // X
    clickSquare(2); // O
    clickSquare(3); // X
    clickSquare(5); // O
    clickSquare(4); // X
    clickSquare(6); // O
    clickSquare(8); // X
    clickSquare(7); // O
    clickSquare(9); // X

    expect(screen.getByText(/^draw!$/i)).toBeInTheDocument();
  });

  test("restart resets the game", () => {
    render(<App />);

    clickSquare(1); // X
    clickSquare(2); // O
    expect(screen.getByText(/next player:\s*x/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /restart/i }));

    // Board should be cleared (Square 1 label should not include ": X" anymore)
    expect(screen.queryByLabelText(/Square 1:\s*X/i)).not.toBeInTheDocument();
    expect(screen.getByText(/next player:\s*x/i)).toBeInTheDocument();
  });
});
