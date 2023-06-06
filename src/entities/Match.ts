import Player from "./Player";

export default class Match {

   constructor(
      public id: string,
      public players: Player[]
   ) {
      this.players[0].initMatch(this);
      this.players[1].initMatch(this);
   }

   finish() {
      this.players[0].leaveMatch();
      this.players[1].leaveMatch();
   }
   
}