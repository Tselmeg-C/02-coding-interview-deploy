import React, { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import { createExecutionService } from './services/executionService';
import { roomService } from './services/roomService';

function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  async function createRoom() {
    setIsCreating(true);
    setError('');
    try {
      const room = await roomService.createRoom();
      navigate('/room/' + room.id);
    } catch {
      setError('We could not create an interview room. Please try again.');
      setIsCreating(false);
    }
  }

  return (
    <main className="landing">
      <p className="eyebrow">PAIRCODE</p>
      <h1>Make the interview about the problem, not the setup.</h1>
      <p className="lede">Create a shared coding space and send one link to your candidate.</p>
      <button type="button" onClick={createRoom} disabled={isCreating}>
        {isCreating ? 'Creating room…' : 'Create interview room'}
      </button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}

function RoomPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [output, setOutput] = useState('Run code to see output here.');
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const connection = useRef(null);
  const executor = useRef(createExecutionService());

  useEffect(() => {
    connection.current = roomService.joinRoom(roomId, {
      onStatus: setStatus,
      onRoom: setRoom,
      onError: (roomError) => setError(roomError.message),
    });
    return () => connection.current?.disconnect();
  }, [roomId]);

  useEffect(() => () => executor.current.dispose(), []);

  function applyChange(patch) {
    connection.current?.update(patch);
  }

  async function changeLanguage(event) {
    const language = event.target.value;
    applyChange({ language, code: roomService.templateFor(language) });
    setOutput('Language changed. Run code to see output here.');
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
  }

  async function runCode() {
    setIsRunning(true);
    setOutput('Starting code runner…');
    try {
      const result = await executor.current.execute({
        language: room.language,
        code: room.code,
        onLoading: setOutput,
      });
      setOutput(result);
    } catch (executionError) {
      setOutput('Error: ' + executionError.message);
    } finally {
      setIsRunning(false);
    }
  }

  function stopCode() {
    executor.current.stop();
  }

  if (error) {
    return <main className="message"><h1>Room unavailable</h1><p>{error}</p><Link to="/">Create a new room</Link></main>;
  }
  if (!room) {
    return <main className="message"><p>Connecting to interview room…</p></main>;
  }

  return (
    <main className="room-shell">
      <header>
        <Link className="brand" to="/">PAIRCODE</Link>
        <span className={'status ' + status}>{status}</span>
      </header>
      <section className="room-toolbar" aria-label="Room controls">
        <div>
          <label htmlFor="language">Language</label>
          <select id="language" value={room.language} onChange={changeLanguage}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>
        <div className="share">
          <span>Share this room</span>
          <button type="button" className="secondary" onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</button>
        </div>
      </section>
      <section className="workspace">
        <div className="editor-panel">
          <h2>Shared editor</h2>
          <CodeEditor code={room.code} language={room.language} onChange={(code) => applyChange({ code })} />
        </div>
        <aside className="output-panel">
          <h2>Output</h2>
          <pre>{output}</pre>
          <div className="execution-controls">
            <button type="button" onClick={runCode} disabled={isRunning}>
              {isRunning ? 'Running…' : 'Run code'}
            </button>
            <button type="button" className="secondary" onClick={stopCode} disabled={!isRunning}>
              Stop
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="*" element={<main className="message"><h1>Page not found</h1><Link to="/">Go home</Link></main>} />
    </Routes>
  );
}
