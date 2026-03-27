"use client";

import type * as monacoEditor from "monaco-editor";

const POST_LANGUAGE_ID = "poST";

const KEYWORDS = [
  "PROGRAM",
  "END_PROGRAM",

  "PROCESS",
  "END_PROCESS",

  "STATE",
  "END_STATE",

  "TIMEOUT",
  "END_TIMEOUT",
  "RESET",
  "TIMER",

  "VAR_INPUT",
  "VAR_OUTPUT",
  "END_VAR",

  "BOOL",
  "TRUE",
  "FALSE",

  "IF",
  "THEN",
  "END_IF",

  "SET",
  "NEXT",
  "START",
];

let isLanguageRegistered = false;

export function configurePostLanguage(monaco: typeof monacoEditor) {
  if (isLanguageRegistered) {
    return;
  }

  monaco.languages.register({ id: POST_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(POST_LANGUAGE_ID, {
    ignoreCase: true,
    keywords: KEYWORDS,
    tokenizer: {
      root: [
        [
          /[a-z_$][\w$]*/,
          { cases: { "@keywords": "keyword", "@default": "identifier" } },
        ],
        [
          /[A-Z_$][\w$]*/,
          { cases: { "@keywords": "keyword", "@default": "identifier" } },
        ],
        [/\d+(?:\.\d+)?/, "number"],
        [/".*?"/, "string"],
        [/'[^']*'/, "string"],
        [/\/\/.*$/, "comment"],
        [/\(\*/, "comment", "@comment"],
        [/[;,.]/, "delimiter"],
        [/[()]/, "@brackets"],
        [/[<>]=?|:=|=|\+|-|\*|\/|AND|OR|NOT/i, "operator"],
      ],
      comment: [
        [/[^\(*]+/, "comment"],
        [/\*\)/, "comment", "@pop"],
        [/[\(*]/, "comment"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration(POST_LANGUAGE_ID, {
    comments: {
      lineComment: "//",
      blockComment: ["(*", "*)"],
    },
    brackets: [
      ["(", ")"],
      ["[", "]"],
    ],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: "(*", close: "*)" },
    ],
    surroundingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  isLanguageRegistered = true;
}

export { POST_LANGUAGE_ID };
