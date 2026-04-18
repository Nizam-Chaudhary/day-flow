import { defineConfig } from 'oxfmt';

export default defineConfig({
    singleQuote: true,
    bracketSameLine: true,
    jsxSingleQuote: true,
    sortImports: {
        groups: [
            'type-import',
            ['value-builtin', 'value-external'],
            'type-internal',
            'value-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['value-parent', 'value-sibling', 'value-index'],
            'unknown',
        ],
    },
    sortTailwindcss: {
        // "stylesheet": "./src/index.css",
        attributes: ['class', 'className'],
        functions: ['clsx', 'cn', 'cva'],
        preserveWhitespace: true,
    },
});
