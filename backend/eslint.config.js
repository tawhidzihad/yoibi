module.exports = [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                console: "readonly",
                process: "readonly",
                __dirname: "readonly",
                module: "readonly",
                require: "readonly",
                exports: "writable",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly"
            }
        },
        rules: {
            "indent": ["error", 4, { "SwitchCase": 1 }],
            "no-tabs": "error",
            "semi": ["error", "always"],
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
        }
    },
    {
        ignores: ["node_modules/**"]
    }
];
