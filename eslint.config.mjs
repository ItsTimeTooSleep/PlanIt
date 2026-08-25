import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: [
			".next/**",
			"node_modules/**",
			"src-tauri/**",
			"*.config.*",
			"public/**",
			"out/**",
			"scripts/**",
			"PlanIt-OfficialWebsite/**",
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.{js,mjs,cjs,ts,tsx}"],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			react: pluginReact,
			"react-hooks": pluginReactHooks,
			"@next/next": pluginNext,
		},
		rules: {
			...pluginReact.configs.recommended.rules,
			...pluginReactHooks.configs.recommended.rules,
			...pluginNext.configs.recommended.rules,
			"react/react-in-jsx-scope": "off",
			"react/prop-types": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
			// 以下规则源于 eslint-plugin-react-hooks v7 针对 React Compiler 的检查。
			// 本项目未启用 React Compiler，这些规则会对既有的合法模式（模态框打开重置表单、
			// store hydration 首次加载、动画高度计算中读取 ref 等）产生误报，故显式关闭。
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/refs": "off",
			"react-hooks/preserve-manual-memoization": "off",
		},
		settings: {
			react: {
				version: "detect",
			},
		},
	},
];
