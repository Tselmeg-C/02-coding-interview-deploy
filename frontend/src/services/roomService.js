import { io } from 'socket.io-client';

const STORAGE_KEY = 'paircode.mock.rooms';

const templates = {
  javascript: 'function solve(input) {\n  // Write your solution here.\n  return input;\n}\n\nconsole.log(solve("Hello, interview!"));\n',
  python: 'def solve(value):\n    # Write your solution here.\n    return value\n\nprint(solve("Hello, interview!"))\n',
};

function loadRooms() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveRooms(rooms) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

function newRoomId() {
  return crypto.randomUUID().slice(0, 8);
}

export const mockRoomService = {
  async createRoom() {
    const room = {
      id: newRoomId(),
      language: 'javascript',
      code: templates.javascript,
      updatedAt: new Date().toISOString(),
    };
    const rooms = loadRooms();
    rooms[room.id] = room;
    saveRooms(rooms);
    return room;
  },

  async getRoom(id) {
    const room = loadRooms()[id];
    if (!room) throw new Error('This interview room does not exist yet.');
    return room;
  },

  async updateRoom(id, patch) {
    const rooms = loadRooms();
    const existing = rooms[id];
    if (!existing) throw new Error('This interview room does not exist yet.');
    const room = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    rooms[id] = room;
    saveRooms(rooms);
    return room;
  },

  joinRoom(id, handlers) {
    handlers.onStatus('connecting');
    this.getRoom(id)
      .then((room) => {
        handlers.onStatus('connected');
        handlers.onRoom(room);
      })
      .catch(handlers.onError);

    return {
      update: async (patch) => {
        try {
          handlers.onRoom(await this.updateRoom(id, patch));
        } catch (error) {
          handlers.onError(error);
        }
      },
      disconnect: () => handlers.onStatus('disconnected'),
    };
  },

  templateFor(language) {
    return templates[language];
  },
};

function apiError(response) {
  return response.json()
    .then((body) => new Error(body.message ?? 'The request could not be completed.'))
    .catch(() => new Error('The request could not be completed.'));
}

export function createRealRoomService(baseUrl = '') {
  const apiUrl = baseUrl + '/api';

  return {
    async createRoom() {
      const response = await fetch(apiUrl + '/rooms', { method: 'POST' });
      if (!response.ok) throw await apiError(response);
      return response.json();
    },

    joinRoom(id, handlers) {
      handlers.onStatus('connecting');
      const socket = io(baseUrl || undefined, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => socket.emit('room:join', { roomId: id }));
      socket.on('room:state', (room) => {
        handlers.onStatus('connected');
        handlers.onRoom(room);
      });
      socket.on('room:updated', handlers.onRoom);
      socket.on('room:error', (payload) => {
        handlers.onStatus('disconnected');
        handlers.onError(new Error(payload.message));
      });
      socket.on('disconnect', () => handlers.onStatus('disconnected'));
      socket.io.on('reconnect_attempt', () => handlers.onStatus('reconnecting'));
      socket.on('connect_error', () => handlers.onError(new Error('Could not connect to the interview room.')));

      return {
        update: (patch) => socket.emit('room:update', { roomId: id, ...patch }),
        disconnect: () => socket.disconnect(),
      };
    },

    templateFor(language) {
      return templates[language];
    },
  };
}

export const roomService = import.meta.env.MODE === 'test'
  ? mockRoomService
  : createRealRoomService(import.meta.env.VITE_BACKEND_URL ?? '');
