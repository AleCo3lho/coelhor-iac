// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config({
  files: ["src/**/*.ts", "src/**/*.js"],
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
});