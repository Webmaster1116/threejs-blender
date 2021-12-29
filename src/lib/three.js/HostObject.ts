import * as THREE from "three";
import { HostObject as CoreHostObject } from "../core/HostObject";

export class HostObject extends CoreHostObject {
  private _clock?: THREE.Clock;
  constructor(options: { clock?: THREE.Clock; owner?: string } = {}) {
    super(options);
    this._clock = options.clock;
    if (this._clock) {
      this._lastUpdate = this.now || 0;
    }
  }

  get now() {
    return (this._clock?.getElapsedTime() || 0) * 1000;
  }
}
