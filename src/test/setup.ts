// Registers jest-dom matchers (toBeInTheDocument, toHaveAttribute, ...) on Vitest's expect.
// Testing Library cleans up the DOM after each test on its own, since `globals: true` exposes afterEach.
import '@testing-library/jest-dom/vitest'
