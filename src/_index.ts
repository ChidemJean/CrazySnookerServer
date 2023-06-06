import session from 'express-session';
import express from 'express';
import http from 'http';
import { v4 as uuid } from 'uuid';

import { WebSocket, WebSocketServer } from 'ws';

function onSocketError(err: Error) {
   console.error(err);
}

const app = express();
const map = new Map<string, WebSocket>();

const sessionParser = session({
   saveUninitialized: false,
   secret: '$eCuRiTy',
   resave: false
});

app.use(express.static('public'));
app.use(sessionParser);

app.post('/login', function (req, res) {
   const id = uuid();

   console.log(`Updating session for user ${id}`);
   req.session.userId = id;
   res.send({ result: 'OK', message: 'Session updated' });
});

app.delete('/logout', function (request, response) {
   const ws = map.get(request.session.userId);

   console.log('Destroying session');
   request.session.destroy(function () {
      if (ws) ws.close();

      response.send({ result: 'OK', message: 'Session destroyed' });
   });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ clientTracking: false, noServer: true });

server.on('upgrade', function (request, socket, head) {
   socket.on('error', onSocketError);

   console.log('Parsing session from request...');

   sessionParser(request, {} as any, () => {
      if (!request.session.userId) {
         socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
         socket.destroy();
         return;
      }

      console.log('Session is parsed!');

      socket.removeListener('error', onSocketError);

      wss.handleUpgrade(request, socket, head, function (ws) {
         wss.emit('connection', ws, request);
      });
   });
});

wss.on('connection', function (ws, request) {
   const userId = request.session.userId;

   map.set(userId, ws);

   ws.on('error', console.error);

   ws.on('message', function (message) {
      console.log(`Received message ${message} from user ${userId}`);
   });

   ws.on('close', function () {
      map.delete(userId);
   });
});

server.listen(8080, function () {
   console.log('Listening on http://localhost:8080');
});