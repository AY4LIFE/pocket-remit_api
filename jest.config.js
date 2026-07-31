// ------------------------------------
// JEST CONFIG
// This tells Jest HOW to run your tests.
//
// Since your project uses ESM ("type": "module" in package.json),
// we need ts-jest configured specifically for ESM support —
// otherwise Jest will throw "Cannot use import statement" errors.
// ------------------------------------

export default {
    // Use ts-jest ESM preset so Jest understands
    // TypeScript files and import/export synthax
    preset: 'ts-jest/presets/default-esm',
    // Tell Jest we're working in a Node environment
    testEnvironment: 'node',
    // Jest need to know which file extensions count as ESM
    extensionsToTreatAsEsm: ['.ts'],
    // This tells ts-jest to compile .ts files using ESM module syntax
    transform: {
        '^.+\\.ts': [
            'ts-jest',
            {
                useESM: true
            }
        ]
    },
    // When your code imports something like './user.js'
  // (even though the actual file is user.ts), this rule
  // tells Jest "treat .js imports as their .ts equivalent"
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Only look for test files inside the tests/ folder
  testMatch: ['**/tests/**/*.test.ts'],

  silent: true,
  verbose: true // 👈 suppresses console.log during tests
}