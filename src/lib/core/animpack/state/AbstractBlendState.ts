import { Deferred } from "../../Deferred";
import { MathUtils } from "../../MathUtils";
import { AbstractState } from "./AbstractState";
import {
  StateContainerInterface,
  StateContainerInterfaceMixin,
} from "./StateContainerInterface";

/**
 * Base class for a state that blends a collection of {@link AbstractState}.
 *
 * @abstract
 * @implements StateContainerInterface
 */
export class AbstractBlendState
  extends StateContainerInterfaceMixin(AbstractState)
  implements StateContainerInterface, AbstractState
{
  static stateName = "AbstractBlendState";

  constructor(
    options: any = {},
    blendStates: AbstractState[] = [],
    ...args: any[]
  ) {
    super(...[options, ...args]);
    blendStates.forEach((state) => {
      this.addState(state);
    });
  }

  /**
   * Gets the sum of internal weights of the sub-states.
   *
   * @readonly
   * @type {number}
   */
  get internalWeight() {
    let blendWeights = 0;
    this._states.forEach((state: any) => {
      blendWeights += state.internalWeight;
    });
    return blendWeights;
  }

  /**
   * Returns the weight of a state controlled by the container.
   *
   * @param {string} name - Name of the state to return the weight from.
   *
   * @returns {number} - Weight of the state.
   */
  getBlendWeight(name: string) {
    // Make sure the name is valid
    const state = this.getState(name);
    if (state === undefined) {
      throw new Error(
        `Cannot get weight of state ${name} from BlendState ${this.name}. No state exists with this name.`
      );
    }

    return state.weight;
  }

  /**
   * Sets the weight of a state controlled by the container.
   *
   * @param {string} name - Name of the state to set the weight of.
   * @param {number} weight - Weight value to set on the state.
   *
   * @returns {Deferred}
   */
  setBlendWeight(
    name: string,
    weight: number,
    seconds = 0,
    easingFn: any
  ): Deferred {
    // Make sure the name is valid
    const state = this.getState(name);

    if (state === undefined) {
      throw new Error(
        `Cannot set weight of state ${name} from BlendState ${this.name}. No state exists with this name.`
      );
    }

    weight = MathUtils.clamp(weight);
    return state.setWeight(weight, seconds, easingFn);
  }

  /**
   * Multiplies the weight of each sub-state by a factor to determine the internal weight.
   *
   * @param {number} factor - 0-1 multiplier to apply to the user weight.
   */
  updateInternalWeight(factor: number) {
    super.updateInternalWeight(factor);

    this._states.forEach((state) => {
      state.updateInternalWeight(this._internalWeight);
    });
  }
  // _internalWeight(_internalWeight: any) {
  //   throw new Error('Method not implemented.');
  // }

  /**
   * Update any values of the sub-states that need to be evaluated every frame.
   *
   * @param {number} deltaTime - Time in milliseconds since the last update.
   */
  update(deltaTime: any) {
    super.update(deltaTime);

    this._states.forEach((state) => {
      state.update(deltaTime);
    });
  }

  /**
   * Start playback of the sub-states from the beginning.
   *
   * @param {Function=} onFinish - Function to execute when the state finishes.
   * @param {Function=} onError - Function to execute if the state encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   *
   * @returns {Deferred}
   */
  play(
    onFinish?: (x?: any) => void,
    onError?: (x?: any) => void,
    onCancel?: (x?: any) => void
  ): Deferred {
    const promises = [super.play()];

    this._states.forEach((state) => {
      promises.push(state.play());
    });
    return Deferred.all(promises, onFinish, onError, onCancel);
  }

  /**
   * Pause playback of the sub-states. This prevents pending promises from being executed.
   *
   * @returns {boolean}
   */
  pause() {
    this._states.forEach((state) => {
      state.pause();
    });
    return super.pause();
  }

  /**
   * Resume playback of the sub-states.
   *
   * @param {Function=} onFinish - Function to execute when the state finishes.
   * @param {Function=} onError - Function to execute if the state encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   *
   * @returns {Deferred}
   */
  resume(
    onFinish?: (x?: any) => void,
    onError?: (x?: any) => void,
    onCancel?: (x?: any) => void
  ): Deferred {
    const promises = [super.resume()];

    this._states.forEach((state) => {
      promises.push(state.resume());
    });
    return Deferred.all(promises, onFinish, onError, onCancel);
  }

  /**
   * Cancel playback of the sub-states and cancel any pending promises.
   *
   * @returns {boolean}
   */
  cancel(): boolean {
    this._states.forEach((state) => {
      state.cancel();
    });
    return super.cancel();
  }

  /**
   * Stop playback of the sub-states and resolve any pending promises.
   *
   * @returns {boolean}
   */
  stop(): boolean {
    this._states.forEach((state) => {
      state.stop();
    });
    return super.stop();
  }

  /**
   * Discards all sub-state resources.
   *
   * @returns {boolean}
   */
  discard(): void {
    super.discard();

    this.discardStates();
  }
}
