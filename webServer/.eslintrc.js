module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // Basic TypeScript rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error'
  },
  env: {
    node: true,
    es6: true,
    jest: true
  }
};
