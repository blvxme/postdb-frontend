"use client";

import type * as monacoEditor from "monaco-editor";

const POST_LANGUAGE_ID = "poST";

const KEYWORDS = [
  "PROCESS",
  "STATE",
  "IF",
  "THEN",
  "TRUE",
  "FALSE",
  "SET",
  "NEXT",
  "END_IF",
  "RESET",
  "TIMER",
  "END_STATE",
  "END_PROCESS",
  "TIMEOUT",
  "END_TIMEOUT",
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
