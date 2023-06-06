import { WebSocket } from "ws";
import { v4 as uuid } from 'uuid';
import Match from "./Match";

export enum PlayerStatus {
   IN_MATCH,
   WAITING_ON_QUEUE,
   UNDEFINED
}

export default class Player {

   constructor(
      public id: string,
      public ws: WebSocket,
      public status: PlayerStatus = PlayerStatus.WAITING_ON_QUEUE,
      public currentMatch: Match | null = null 
   ) {}

   initMatch(match: Match) {
      this.currentMatch = match;
      this.status = PlayerStatus.IN_MATCH;
   }

   leaveMatch() {
      this.currentMatch = null;
      this.status = PlayerStatus.UNDEFINED;
   }

   static createPlayer(id: string, ws: WebSocket): Player {
      let player = new this(id, ws);
      return player;
   }

}