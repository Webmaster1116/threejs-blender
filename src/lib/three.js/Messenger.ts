import * as THREE from "three";
import { Messenger as CoreMessenger } from "../core/Messenger";

export class Messenger extends CoreMessenger {
  static GlobalMessenger: Messenger;
  constructor(id?: string) {
    super(id);
    // this._dispatcher = this; //ankit
  }
  // addEventListener<T extends string>(
  //   type: T,
  //   listener: THREE.EventListener<THREE.Event, T, this>
  // ): void {
  //   throw new Error('Method not implemented.');
  // }
  // hasEventListener<T extends string>(
  //   type: T,
  //   listener: THREE.EventListener<THREE.Event, T, this>
  // ): boolean {
  //   throw new Error('Method not implemented.');
  // }
  // removeEventListener<T extends string>(
  //   type: T,
  //   listener: THREE.EventListener<THREE.Event, T, this>
  // ): void {
  //   throw new Error('Method not implemented.');
  // }
  // dispatchEvent(event: THREE.Event): void {
  //   throw new Error('Method not implemented.');
  // }

  // _createEvent(message: string, value?: any) {
  //   return { detail: value, type: message } as any;
  // }
}

// Assign Three.js EventDispatcher functionality to the Messenger class
// const prop = [
//   'addEventListener',
//   'hasEventListener',
//   'removeEventListener',
//   'dispatchEvent',
//   '_createEvent',
// ] as any[];
// prop.forEach((prop) => {
//   (Messenger as any).prototype[prop] = (THREE as any).EventDispatcher.prototype[
//     prop
//   ];
// });
Object.getOwnPropertyNames(THREE.EventDispatcher.prototype)
  .filter((prop) => prop !== "constructor")
  .forEach((prop: any) => {
    (Messenger as any).prototype[prop] = (
      THREE as any
    ).EventDispatcher.prototype[prop];
  });

Messenger.GlobalMessenger = new Messenger();
