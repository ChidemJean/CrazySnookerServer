export abstract class Collection<T> {
   protected storage: T[] = [];

   size(): number {
      return this.storage.length;
   }
   isEmpty(): boolean {
      return this.size() == 0;
   }
   remove(obj: T) {
      const index = this.storage.indexOf(obj, 0);
      if (index > -1) {
         this.storage.splice(index, 1);
      }
   }
   abstract isFull(): boolean;
}