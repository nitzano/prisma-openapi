/** @type {import('xo').Options} */
const xoConfig = {
	// Enable Prettier integration
	prettier: true,
	// Set Node.js environment
	envs: ['node'],
	// Apply XO to TypeScript files
	extensions: ['ts'],
	// Ignore the compiled output
	ignores: ['dist'],
	// Disable specific rules
	rules: {
		'@typescript-eslint/consistent-type-assertions': 'warn',
	},
};

export default xoConfig;
