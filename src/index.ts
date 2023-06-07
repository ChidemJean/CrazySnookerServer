import WebSocket, { WebSocketServer } from 'ws';
import Player from './entities/Player';
import Queue from './Queue';
import Match from './entities/Match';

export enum MessageType {
   INIT_MATCH = 1,
   UPDATE_ID = 2,
   PASS_TURN = 3,
   UPDATE_BALLS = 4,
   MOVE_CUE = 5,
   ROTATE_CUE = 6,
   SHOT = 7,
}

function heartbeat(this: any) {
   this.isAlive = true;
}

const wss = new WebSocketServer({ port: 21106 });
console.log("Running CrazySnooker WebSocket...")

const players = new Map<string, Player>();
const matches = new Map<string, Match>();
const playersQueue = new Queue<Player>();

wss.on('connection', function connection(ws: any, req) {
   const ip = req.socket.remoteAddress; //req.headers['x-forwarded-for'].split(',')[0].trim();
   ws.isAlive = true;

   const idNewPlayer = (players.size + 1).toString();
   const newPlayer = Player.createPlayer(idNewPlayer, ws);
   players.set(idNewPlayer, newPlayer);
   ws.send(JSON.stringify({ type: MessageType.UPDATE_ID, id: idNewPlayer }));

   if (playersQueue.isEmpty) {
      playersQueue.enqueue(newPlayer);
   } else {
      const player = playersQueue.dequeue();
      if (player.ws.readyState === WebSocket.OPEN) {
         const idNewMatch = matches.size.toString();
         const newMatch = new Match(idNewMatch, [ newPlayer, player ]);
         matches.set(idNewMatch, newMatch);
         const idTurn = player.id;
         newPlayer.ws.send(JSON.stringify({ type: MessageType.INIT_MATCH, id: player.id, idTurn }));
         player.ws.send(JSON.stringify({ type: MessageType.INIT_MATCH, id: newPlayer.id, idTurn }));
      }
   }
   
   ws.on('message', (data: any, isBinary: any) => {
      // let message = JSON.parse(data);

      players.forEach(player => {
         if (player.currentMatch == null) return;
         player.currentMatch.players.forEach(playerInMatch => {
            if (playerInMatch.ws !== ws && playerInMatch.ws.readyState === WebSocket.OPEN) {
               playerInMatch.ws.send(data);
            }
         });
      });
   });

   ws.on("close", (code: any, reason: any) => {
      console.log(`player ${reason} disconnected: ${code}`);
      players.forEach(player => {
         if (player.ws === ws) {
            if (player.currentMatch != null) {
               player.currentMatch.finish();
            }
            players.delete(player.id);
         }
      });
   });

   ws.on('error', console.error);
   ws.on('pong', heartbeat);

});

// CHECK BROKEN CONNECTIONS
const interval = setInterval(function ping() {
   wss.clients.forEach(function each(ws: any) {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
   });
}, 30000);

wss.on('close', function close() {
   clearInterval(interval);
});