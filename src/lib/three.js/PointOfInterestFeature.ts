import * as THREE from "three";
import {
  AxisMap,
  PointOfInterestFeature as CorePointOfInterestFeature,
} from "../core/PointOfInterestFeature";

/**
 * @extends core/PointOfInterestFeature
 * @alias three.js/PointOfInterestFeature
 */
export class PointOfInterestFeature extends CorePointOfInterestFeature {
  _scene!: THREE.Scene;
  static _getWorldPosition(obj: THREE.Object3D): number[] {
    obj.updateWorldMatrix(true, false);
    return obj.matrixWorld.elements.slice(12, 15);
  }

  static _getWorldMatrix(obj: THREE.Object3D) {
    obj.updateWorldMatrix(true, false);
    return [...obj.matrixWorld.elements];
  }

  _validateTransformObject(obj: THREE.Object3D) {
    return obj instanceof THREE.Object3D;
  }

  setTargetByName(name: string) {
    super.setTargetByName(name);
    if (!name) {
      return;
    }

    this.target = this._scene.getObjectByName(name);
  }

  setTargetById(id: number) {
    super.setTargetByName(id);
    if (!id) {
      return;
    }

    this.target = this._scene.getObjectById(id);
  }
}

export { AxisMap };
