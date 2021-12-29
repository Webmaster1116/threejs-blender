import * as THREE from "three";
import {
  AnimationFeature as CoreAnimationFeature,
  AnimationTypes,
} from "../../core/animpack/AnimationFeature";
import { HostObject } from "../../core/HostObject";
import { SingleState } from "./state/SingleState";

/**
 * Threejs AnimationMixer object
 * @external "THREE.AnimationMixer"
 * @see https://threejs.org/docs/#api/en/animation/AnimationMixer
 */
(AnimationTypes as any).single = SingleState;
export { AnimationTypes };

/**
 * @extends core/AnimationFeature
 * @alias three.js/AnimationFeature
 */
export class AnimationFeature extends CoreAnimationFeature {
  _mixer: THREE.AnimationMixer;
  // _paused: any;
  /**
   * @constructor
   *
   * @param {three.js/HostObject} host - Host object that owns the feature.
   */
  constructor(host: HostObject) {
    super(host);

    this._mixer = new THREE.AnimationMixer(host.owner);
  }

  _createSingleState(options: any = {}) {
    // Duplicate the clip if it is already in use by another three action
    let { clip } = options;
    if (this._mixer.existingAction(clip)) {
      clip = clip.clone();
    }

    const threeAction = this._mixer.clipAction(clip);
    return new SingleState(options, threeAction);
  }

  /**
   * Gets the THREE.AnimationMixer for the host.
   *
   * @readonly
   * @type {external:"THREE.AnimationMixer"}
   */
  get mixer() {
    return this._mixer;
  }

  update(deltaTime: number) {
    super.update(deltaTime);

    if (!this._paused) {
      this._mixer.update(deltaTime / 1000); // THREE.AnimationMixer requires delta time in seconds
    }
  }

  discard() {
    // Release THREE animation resources
    this._mixer.uncacheRoot(this._host?.owner);

    super.discard();
  }
}