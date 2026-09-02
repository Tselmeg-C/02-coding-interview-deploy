const PYODIDE_BASE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/';
let pyodidePromise;

function format(values) {
  return values.map((value) => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }).join(' ');
}

async function getPyodide() {
  if (!pyodidePromise) {
    self.postMessage({ type: 'loading', message: 'Loading Python runtime…' });
    pyodidePromise = import(PYODIDE_BASE_URL + 'pyodide.mjs')
      .then(({ loadPyodide }) => loadPyodide({ indexURL: PYODIDE_BASE_URL }));
  }
  return pyodidePromise;
}

async function runJavaScript(code) {
  const output = [];
  const consoleProxy = {
    log: (...values) => output.push(format(values)),
    info: (...values) => output.push(format(values)),
    warn: (...values) => output.push(format(values)),
    error: (...values) => output.push(format(values)),
  };
  const execute = new Function('console', '"use strict";\n' + code);
  const result = execute(consoleProxy);
  if (result instanceof Promise) await result;
  return output.join('\n');
}

async function runPython(code) {
  const pyodide = await getPyodide();
  const output = [];
  const errors = [];
  pyodide.setStdout({ batched: (message) => output.push(message) });
  pyodide.setStderr({ batched: (message) => errors.push(message) });
  await pyodide.runPythonAsync(code);
  if (errors.length > 0) output.push(errors.join('\n'));
  return output.join('\n');
}

self.onmessage = async ({ data }) => {
  if (data.type !== 'run') return;
  try {
    const output = data.language === 'python'
      ? await runPython(data.code)
      : await runJavaScript(data.code);
    self.postMessage({ type: 'result', output });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Code execution failed.',
    });
  }
};
