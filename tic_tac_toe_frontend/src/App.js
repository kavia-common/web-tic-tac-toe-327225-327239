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

/**
 * Choose a move for the AI player given the current board.
 *
 * Contract:
 * - Inputs:
 *   - board: Array(9) of "X" | "O" | null
 *   - aiMark: "X" | "O" (the mark the AI will play)
 * - Output:
 *   - number | null: the index (0..8) where the AI should play, or null if no move is possible.
 * - Invariants:
 *   - Never returns an index for a non-empty cell.
 * - Error handling:
 *   - Returns null for any non-playable state (full board / game ended).
 *
 * This is intentionally deterministic and side-effect free so it is testable and
 * debuggable without React.
 *
 * @param {Array<"X"|"O"|null>} board
 * @param {"X"|"O"} aiMark
 * @returns {number|null}
 */
function chooseAiMove(board, aiMark) {
  const { winner } = getGameResult(board);
  if (winner || isDraw(board)) return null;

  const humanMark = aiMark === "X" ? "O" : "X";
  const emptyIndices = board
    .map((v, idx) => (v === null ? idx : null))
    .filter((v) => v !== null);

  if (emptyIndices.length === 0) return null;

  /**
   * @param {Array<"X"|"O"|null>} b
   * @param {number} index
   * @param {"X"|"O"} mark
   * @returns {Array<"X"|"O"|null>}
   */
  const applyMove = (b, index, mark) => {
    const next = b.slice();
    next[index] = mark;
    return next;
  };

  // 1) Winning move (if exists)
  for (const idx of emptyIndices) {
    const candidate = applyMove(board, idx, aiMark);
    if (getGameResult(candidate).winner === aiMark) return idx;
  }

  // 2) Blocking move (prevent human from winning next)
  for (const idx of emptyIndices) {
    const candidate = applyMove(board, idx, humanMark);
    if (getGameResult(candidate).winner === humanMark) return idx;
  }

  // 3) Center
  if (board[4] === null) return 4;

  // 4) Corners
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) return corners[0];

  // 5) Edges
  const edges = [1, 3, 5, 7].filter((i) => board[i] === null);
  if (edges.length > 0) return edges[0];

  return null;
}

/**
 * Canonical move-application flow for the game.
 *
 * Contract:
 * - Inputs:
 *   - state: { board, xIsNext }
 *   - index: number (0..8)
 * - Output:
 *   - nextState: { board, xIsNext } (no mutation of input)
 * - Validation:
 *   - If move is illegal (game ended / cell non-empty), returns the original state unchanged.
 *
 * @param {{board: Array<"X"|"O"|null>, xIsNext: boolean}} state
 * @param {number} index
 * @returns {{board: Array<"X"|"O"|null>, xIsNext: boolean}}
 */
function applyPlayerMove(state, index) {
  const { board, xIsNext } = state;
  const { winner } = getGameResult(board);
  const draw = isDraw(board);

  if (winner || draw) return state;
  if (board[index] !== null) return state;

  const next = board.slice();
  next[index] = xIsNext ? "X" : "O";

  return { board: next, xIsNext: !xIsNext };
}

// PUBLIC_INTERFACE
function App() {
  /** Theme toggle preserved from template */
  const [theme, setTheme] = useState("light");

  /**
   * Game mode:
   * - "HUMAN": Human vs Human (default; preserves original behavior)
   * - "AI": Human (X) vs AI (O)
   */
  const [mode, setMode] = useState("HUMAN");

  /** Game state */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const { winner, winningLine } = useMemo(() => getGameResult(board), [board]);
  const draw = useMemo(() => isDraw(board), [board]);

  const aiEnabled = mode === "AI";
  const humanMark = "X";
  const aiMark = "O";

  const isAiTurn = useMemo(() => {
    if (!aiEnabled) return false;
    if (winner || draw) return false;
    const nextMark = xIsNext ? "X" : "O";
    return nextMark === aiMark;
  }, [aiEnabled, winner, draw, xIsNext]);

  const statusText = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (draw) return "Draw!";

    if (aiEnabled) {
      const next = xIsNext ? "X" : "O";
      if (next === humanMark) return "Your turn (X)";
      return "AI is thinking… (O)";
    }

    return `Next player: ${xIsNext ? "X" : "O"}`;
  }, [winner, draw, xIsNext, aiEnabled]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  // PUBLIC_INTERFACE
  const handleModeChange = (event) => {
    const nextMode = event.target.value;
    setMode(nextMode);
    // Switching modes should start a fresh game to avoid confusing mid-game role changes.
    resetGame();
  };

  /**
   * Apply AI move whenever it's AI's turn.
   * This keeps the "one canonical path per behavior" invariant:
   * both human clicks and AI moves go through applyPlayerMove().
   */
  useEffect(() => {
    if (!isAiTurn) return;

    const aiIndex = chooseAiMove(board, aiMark);
    if (aiIndex === null) return;

    // Small delay improves perceived responsiveness ("thinking") and makes UI stable for tests.
    const t = window.setTimeout(() => {
      const nextState = applyPlayerMove({ board, xIsNext }, aiIndex);
      setBoard(nextState.board);
      setXIsNext(nextState.xIsNext);
    }, 250);

    return () => window.clearTimeout(t);
  }, [isAiTurn, board, xIsNext]);

  // PUBLIC_INTERFACE
  const handleSquareClick = (index) => {
    // In AI mode, ignore clicks while it's AI's turn.
    if (isAiTurn) return;

    const nextState = applyPlayerMove({ board, xIsNext }, index);
    if (nextState === { board, xIsNext }) return;

    setBoard(nextState.board);
    setXIsNext(nextState.xIsNext);
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
              <p className="subtitle">
                {aiEnabled
                  ? "Play against an AI opponent."
                  : "A simple 3×3 game for two players."}
              </p>
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

          <div className="status-row" style={{ marginBottom: 10 }}>
            <div className="status-card" aria-label="Game mode selector">
              <span className="status-label">Mode</span>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="status-text" style={{ fontSize: 14, fontWeight: 800 }}>
                  Game:
                </span>
                <select
                  aria-label="Select game mode"
                  value={mode}
                  onChange={handleModeChange}
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontWeight: 800,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <option value="HUMAN">Human vs Human</option>
                  <option value="AI">Human vs AI</option>
                </select>
              </label>
            </div>
          </div>

          <div className="board" role="grid" aria-label="Tic Tac Toe board">
            {board.map((value, idx) => {
              const isWinning = Boolean(winningLine?.includes(idx));
              const isDisabled = Boolean(winner || draw || value !== null || isAiTurn);

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
