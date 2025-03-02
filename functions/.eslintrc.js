module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended"
  ],
  ignorePatterns: ["node_modules/**", "coverage/**", "*.min.js"],
  rules: {
    // Turn off rules that are causing issues
    "indent": "off",
    "quotes": "off",
    "comma-dangle": "off",
    "object-curly-spacing": "off",
    "valid-jsdoc": "off",
    "new-cap": "off",
    "max-len": "off",
    "no-trailing-spaces": "off",
    "eol-last": "off",
    "arrow-parens": "off",
    "no-unused-vars": "warn"
  },
  parserOptions: {
    ecmaVersion: 2020
  }
};