# Product Specification: Online Coding Interview Platform

## Overview

Build a lightweight web application for conducting online coding interviews.
An interviewer creates an interview room and shares its link with a candidate.
Everyone who opens the same room works in one shared code editor and sees edits
from other connected participants in real time.

The first release supports JavaScript and Python syntax highlighting and lets
participants execute code safely in their own browser. The backend must never
run submitted code.

## Users

### Interviewer

The interviewer creates an interview room, shares the room link, and
collaborates with candidates in the shared editor.

### Candidate

The candidate receives a room link, opens it in a browser, collaborates in the
shared editor, and runs code locally to inspect its output.

## User stories

1. As an interviewer, I can create a new room and receive a unique, shareable
   URL.
2. As an interviewer, I can send that URL to a candidate so they can open the
   same interview room.
3. As a participant, I can edit the code in a room and see edits from other
   connected participants without refreshing the page.
4. As a participant, I can select JavaScript or Python and see appropriate
   syntax highlighting in the editor.
5. As a participant, I can run the current code in my browser and see its
   standard output or an execution error.
6. As a participant, I receive understandable feedback while connecting,
   reconnecting, loading the Python runtime, or when an operation fails.

## Functional requirements

### Rooms and sharing

- The home page provides a control to create a new interview room.
- Creating a room generates a unique room identifier and routes the user to a
  URL such as `/room/:roomId`.
- The room page displays a copyable share link.
- Opening the same valid room URL in another browser joins the same room.
- Room code and language persist after a backend restart.

### Collaborative editor

- Each room contains one shared code document and one selected language.
- A participant's edits are broadcast only to other participants in the same
  room.
- New participants receive the room's current code and selected language after
  joining.
- The interface identifies connection status, including connecting, connected,
  disconnected, and reconnecting states.
- The initial version may use last-write-wins synchronization; conflict-free
  collaborative editing is not required.

### Languages and syntax highlighting

- The editor supports JavaScript and Python.
- Participants can switch between these languages.
- Switching language updates syntax highlighting for all participants in the
  room.
- The initial code template is appropriate for the selected language.

### Browser-only execution

- JavaScript executes on the client, isolated from the UI in a Web Worker.
- Python executes on the client using Pyodide in a Web Worker.
- The backend accepts and broadcasts editor changes only; it never evaluates
  user-provided code.
- The output panel displays captured standard output and clear execution
  errors.
- A participant can stop or reset a non-responsive execution by terminating
  and recreating its worker.
- Code execution is local to each participant; its output is not broadcast to
  the room.

### Error and empty states

- If a room cannot be found, the page displays an actionable error and a way
  to return home.
- If the real-time connection fails, the UI reports the failure and offers a
  reconnect action where possible.
- While Pyodide is loading, Python execution controls show progress and avoid
  accepting duplicate execution requests.

## Acceptance criteria

- Creating a room produces a unique URL that can be copied and opened in a
  second browser session.
- Two sessions connected to the same room see each other's code changes without
  a page reload.
- Changes in one room are never shown in a different room.
- A participant joining an existing room receives the current code and selected
  language.
- The editor provides syntax highlighting for both JavaScript and Python.
- Running valid JavaScript displays its output in that participant's output
  panel.
- Running valid Python displays its output in that participant's output panel.
- JavaScript and Python errors are displayed without crashing the application.
- Submitted code is never executed by the backend.
- The application starts locally using the commands documented in `README.md`
  and its automated tests pass.

## Non-goals

- User registration, login, accounts, or user profiles.
- Interview-history retention policies, scheduled room cleanup, or a complete
  audit trail.
- Video, audio, chat, screen sharing, or scheduling.
- Production-grade permissions, access control, rate limiting, or audit logs.
- Real-time multiplayer games, payments, or social login.
- Advanced operational transformation or CRDT-based editing.
- Executing user code on the server, in a container, or in any remote sandbox.
- Production deployment in the initial implementation phase.

## Technical constraints

- Use JavaScript for the frontend.
- Use React with Vite for the frontend and Node.js with Express for the backend.
- Use Socket.IO for room-scoped real-time communication.
- Keep frontend HTTP and Socket.IO behavior in a centralized service/client
  layer; React components must not call APIs or sockets directly.
- Use CodeMirror 6 for the editor and language syntax highlighting.
- Use Pyodide in a Web Worker for Python execution; use a Web Worker for
  JavaScript execution as well.
- Use SQLite for local durable room state and keep the data-access layer
  database-agnostic so PostgreSQL can be selected through configuration.
- Create an `openapi.yaml` for the HTTP API before the backend is treated as
  complete.
- Add frontend tests, backend endpoint tests, and client/server integration
  tests for the core room flow.
- Document local setup, development, and test commands in `README.md`.
- Use `concurrently` to provide one root `npm run dev` command that starts
  frontend and backend together.

## Initial implementation boundary

The first implementation must result in a locally runnable frontend and
backend with in-memory rooms and real-time shared editing. It must not defer
the room flow or browser-only execution architecture to a later rewrite.
