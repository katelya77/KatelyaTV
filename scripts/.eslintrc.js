module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off', // 允许在脚本中使用 console
    'no-unused-vars': 'off', // 暂时忽略未使用变量
    '@typescript-eslint/no-var-requires': 'off', // 允许 require
    'import/no-import-module-exports': 'off',
  },
};
