import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierPlugin from "eslint-plugin-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**", "out/**", "build/**", "next-env.d.ts",
    "node_modules/**", "dist/**", "playwright-report/**", "test-results/**",
    "storybook-static/**", ".install-scripts/**", "*.config.js", "*.config.mjs",
    // Integration-test repositories have their own lint configuration.
    // Never let frontend generator hooks lint or rewrite their source files.
    "backend/**", "brocoders-api/**", "nestjs-boilerplate/**",
  ]),
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": ["error", { tabWidth: 2, semi: true, endOfLine: "auto", singleQuote: false, trailingComma: "es5" }],
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "array-callback-return": "error",
      eqeqeq: "error",
      "no-alert": "error",
      "no-return-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-unsafe-optional-chaining": "error",
      "no-empty-pattern": "error",
      "no-unused-vars": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name=required][callee.object.callee.property.name=nullable]",
          message: ".nullable() should be after .required() for correct validation and type inference. Example: id: yup.string().required().nullable()",
        },
        {
          selector: "CallExpression[callee.name=watch], MemberExpression[object.name=methods][property.name=watch]",
          message: '"watch" re-render the whole form component. Use hook "useWatch" instead.',
        },
        {
          selector: "VariableDeclarator > ObjectPattern > Property[key.name=formState]",
          message: '"formState" re-render the whole form component. Use hook "useFormState" instead.',
        },
        {
          selector: "MemberExpression[object.name=React][property.name=/^use/]",
          message: 'Use hooks without "React" prefix. For avoid using both import styles. Example: "useEffect" instead of "React.useEffect".',
        },
        {
          selector: "ConditionalExpression[consequent.type=Literal][consequent.value=true][alternate.type=Literal][alternate.value=false]",
          message: 'Do not use "condition ? true : false". Simplify "someVariable === 42 ? true : false " to "someVariable === 42"',
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next/link", message: 'Please use "import Link from "@/components/link"" instead. This is need for "leave page" logic' },
            { name: "radix-ui", message: "Please use \"import * as ComponentName from '@radix-ui/react-component-name'\" instead to avoid bundle size increase." },
            { name: "lucide-react", message: "Please use \"import IconName from 'lucide-react/dist/esm/icons/icon-name'\" instead to avoid bundle size increase." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
