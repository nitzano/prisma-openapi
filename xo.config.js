/** @type {import('xo').Options} */
const xoConfig = {
	prettier: true,
	ignores: ['dist'],
	rules: {
		'@typescript-eslint/consistent-type-assertions': 'warn',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-unsafe-call': 'off',
		'@typescript-eslint/no-unsafe-member-access': 'off',
	},
};

export default xoConfig;
