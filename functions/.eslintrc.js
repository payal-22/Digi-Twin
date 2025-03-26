module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    "ecmaVersion":12, // Updated to match Node.js 22
    sourceType: 'script', // Changed from 'module' to 'script'
  },
  
  ignorePatterns: [
    '/node_modules/**/',
    '/build/**/',
  ],
  rules: {
    // "no-restricted-globals": ["error", "name", "length"],
    // "prefer-arrow-callback": "error",
    // "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    // "semi": ["error", "always"], // Enforce semicolons
    // 'no-undef': 'error',
    'no-undef': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console':'warn',
    'indent': ['error', 2], // Enforce 2-space indentation
  },
  // overrides: [
  //   {
  //     files: ["**/*.spec.*"],
  //     env: {
  //       mocha: true,
  //     },
  //     rules: {},
  //   },
  // ],
 
};