function createWorker() {
  return new Worker(new URL('../workers/codeRunner.worker.js', import.meta.url), {
    type: 'module',
  });
}

export function createExecutionService() {
  /** @type {Worker | null} */
  let worker = null;
  /** @type {{ reject: (reason?: unknown) => void } | null} */
  let active = null;

  function ensureWorker() {
    if (!worker) worker = createWorker();
    return worker;
  }

  function clearActive() {
    active = null;
  }

  return {
    execute({ language, code, onLoading }) {
      if (active) {
        return Promise.reject(new Error('Code is already running.'));
      }

      return new Promise((resolve, reject) => {
        const currentWorker = ensureWorker();
        active = { reject };

        currentWorker.onmessage = ({ data }) => {
          if (data.type === 'loading') {
            onLoading?.(data.message);
            return;
          }
          if (data.type === 'result') {
            clearActive();
            resolve(data.output || '(No output)');
            return;
          }
          if (data.type === 'error') {
            clearActive();
            reject(new Error(data.message));
          }
        };

        currentWorker.onerror = () => {
          clearActive();
          reject(new Error('The browser could not start the code runner.'));
        };

        currentWorker.postMessage({ type: 'run', language, code });
      });
    },

    stop() {
      if (!worker) return;
      const pending = active;
      worker.terminate();
      worker = null;
      clearActive();
      pending?.reject(new Error('Execution stopped by user.'));
    },

    dispose() {
      this.stop();
    },
  };
}
