# Testing

Install dependencies with `npm install`, then run the application checks:

```bash
npm test
npm run lint
npm run typecheck
```

The full local release gate uses the same Docker image and PostgreSQL service
as deployment:

```bash
npm run compose:up
npm run test:integration
npm run test:e2e
npm run compose:down
```

`integration/compose-smoke.mjs` checks health, room creation, update, and
retrieval. `e2e/two-session.spec.js` checks room collaboration in two browser
sessions. The disposable backup/restore check is available as
`npm run test:backup-restore` while Compose is running.

For a deployed environment, set its public URL explicitly:

```bash
APP_URL=https://<environment-url> npm run test:integration
APP_URL=https://<environment-url> npm run test:e2e
```

Never run participant code on the backend. JavaScript and Python execution
remain inside browser workers.
