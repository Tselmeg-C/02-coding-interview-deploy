import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';

const extensionsFor = {
  javascript: [javascript()],
  python: [python()],
};

export default function CodeEditor({ code, language, onChange }) {
  return (
    <CodeMirror
      aria-label="Shared code editor"
      value={code}
      height="420px"
      theme="dark"
      extensions={extensionsFor[language]}
      onChange={onChange}
    />
  );
}
