import { randomUUID } from 'node:crypto';
import { roomsCreated } from '../telemetry.js';

const templates = {
  javascript: 'function solve(input) {\n  // Write your solution here.\n  return input;\n}\n\nconsole.log(solve("Hello, interview!"));\n',
  python: 'def solve(value):\n    # Write your solution here.\n    return value\n\nprint(solve("Hello, interview!"))\n',
};

function now() {
  return new Date().toISOString();
}

function toRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    language: row.language,
    code: row.code,
    updatedAt: row.updated_at,
  };
}

export class RoomRepository {
  constructor(database) {
    this.database = database;
  }

  async create() {
    const room = {
      id: randomUUID().slice(0, 8),
      language: 'javascript',
      code: templates.javascript,
      updatedAt: now(),
    };
    await this.database('rooms').insert({
      id: room.id,
      language: room.language,
      code: room.code,
      updated_at: room.updatedAt,
    });
    roomsCreated.add(1);
    return room;
  }

  async get(id) {
    return toRoom(await this.database('rooms').where({ id }).first());
  }

  async update(id, patch) {
    const count = await this.database('rooms')
      .where({ id })
      .update({
        ...(patch.code === undefined ? {} : { code: patch.code }),
        ...(patch.language === undefined ? {} : { language: patch.language }),
        updated_at: now(),
      });
    if (count === 0) return null;
    return this.get(id);
  }
}

export function isRoomUpdate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0 || keys.some((key) => key !== 'code' && key !== 'language')) return false;
  if ('code' in value && typeof value.code !== 'string') return false;
  if ('language' in value && value.language !== 'javascript' && value.language !== 'python') return false;
  return true;
}
