import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/**
 * Winning line indices for a 3x3 Tic Tac Toe board.
 * Board layout indices:
 * 0 | 1 | 2
 * 3 | 4 | 5
 * 6 | 7 | 8
 */
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6],
];

/**
 * @param {Array<"X"|"O"|null>} board
 * @returns {{winner: "X"|"O"|null, winningLine: number[]|null}}
 */
function getGameResult(board) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, winningLine: line };
    }
  }
  return { winner: null, winningLine: null };
}

/**
 * @param {Array<"X"|"O"|null>} board
 * @returns {boolean}
 */
function isDraw(board) {
  // A draw occurs if the board is full and there is no winner.
  return board.every((cell) => cell !== null) && !getGameResult(board).winner;
}

// PUBLIC_INTERFACE
function App() {
  /** Theme toggle preserved from template */
  const [theme, setTheme] = useState("light");

  /** Game state */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const { winner, winningLine } = useMemo(() => getGameResult(board), [board]);
  const draw = useMemo(() => isDraw(board), [board]);

  const statusText = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (draw) return "Draw!";
    return `Next player: ${xIsNext ? "X" : "O"}`;
  }, [winner, draw, xIsNext]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  const handleSquareClick = (index) => {
    // Prevent moves after game end.
    if (winner || draw) return;

    // Prevent overwriting a filled square.
    if (board[index] !== null) return;

    const next = board.slice();
    next[index] = xIsNext ? "X" : "O";
    setBoard(next);
    setXIsNext((v) => !v);
  };

  // PUBLIC_INTERFACE
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="App">
      <main className="app-shell" aria-label="Tic Tac Toe App">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              TTT
            </div>
            <div className="brand-text">
              <h1 className="title">Tic Tac Toe</h1>
              <p className="subtitle">A simple 3×3 game for two players.</p>
            </div>
          </div>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            type="button"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </header>

        <section className="game" aria-label="Game Area">
          <div className="status-row">
            <div className="status-card" role="status" aria-live="polite">
              <span className="status-label">Status</span>
              <span className="status-text">{statusText}</span>
            </div>

            <button className="btn btn-primary" onClick={resetGame} type="button">
              Restart
            </button>
          </div>

          <div className="board" role="grid" aria-label="Tic Tac Toe board">
            {board.map((value, idx) => {
              const isWinning = Boolean(winningLine?.includes(idx));
              const isDisabled = Boolean(winner || draw || value !== null);

              return (
                <button
                  key={idx}
                  className={`square ${isWinning ? "square--win" : ""}`}
                  type="button"
                  role="gridcell"
                  aria-label={`Square ${idx + 1}${value ? `: ${value}` : ""}`}
                  aria-disabled={isDisabled ? "true" : "false"}
                  onClick={() => handleSquareClick(idx)}
                >
                  <span className={`mark ${value ? `mark--${value}` : ""}`}>
                    {value ?? ""}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="hint">
            Tip: Get three in a row to win. Click Restart to play again.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
