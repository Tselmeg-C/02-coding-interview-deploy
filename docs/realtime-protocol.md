# Real-time Room Protocol

Socket.IO supplies the live collaboration channel. The HTTP API in
openapi.yaml remains the source of truth for the room resource itself.

## Transport

- The client connects to the Socket.IO server at the configured backend URL.
- Clients join exactly one room at a time.
- The server broadcasts events only to the matching Socket.IO room.
- No event accepts code for execution. Code is data only.

## Client-to-server events

### room:join

Sent after the Socket.IO connection succeeds.

~~~json
{ "roomId": "7f3a9d2b" }
~~~

If the room exists, the server joins the socket to it and responds with the
current state. If it does not exist, the server emits room:error.

### room:update

Sends a full replacement document and/or selected language. The initial
implementation uses last-write-wins behavior.

~~~json
{
  "roomId": "7f3a9d2b",
  "code": "console.log('hello');",
  "language": "javascript"
}
~~~

At least one of code or language is required. The server validates the payload
against the corresponding fields in the RoomUpdate schema.

## Server-to-client events

### room:state

Emitted to a joining client after a successful room:join. The payload is the
current Room object from the HTTP contract.

### room:updated

Broadcast to every connected client in the room, including the sender, after a
valid room:update. The payload is the complete updated Room object.

### room:error

Emitted only to the affected socket.

~~~json
{
  "error": "room_not_found",
  "message": "This interview room does not exist."
}
~~~

## Connection state mapping

The frontend maps Socket.IO lifecycle events to the product UI:

| Socket.IO condition | UI status |
| --- | --- |
| Initial connection attempt | connecting |
| Connected and room state received | connected |
| Connection lost | disconnected |
| Reconnection attempt | reconnecting |
