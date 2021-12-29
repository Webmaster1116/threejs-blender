import { Deferred } from "../Deferred";
import { Constructor } from "../types/common.types";
import { AbstractState } from "./state/AbstractState";
import { TransitionState } from "./state/TransitionState";

/**
 * Class factory interface for controlling playback of a collection of animations.
 * One animation can be played at any given time, crossfading between animations
 * will result in playing a {@link TransitionState}.
 *
 * @interface
 */
export interface AnimationPlayerInterface {
  /**
   * Gets whether or not the player is updating states.
   *
   * @readonly
   * @type {boolean}
   */
  get paused(): boolean;

  /**
   * Gets and sets the default number of seconds it takes to transition to a new
   * animation.
   *
   * @type {number}
   */
  get transitionTime(): number;

  set transitionTime(seconds: number);
  /**
   * Gets and sets the default easing function to use when transitioning and
   * setting weights.
   *
   * @type {Function}
   */
  get easingFn(): (k: number) => number;

  set easingFn(fn: (k: number) => number);

  /**
   * Gets the state the layer is currently in control of.
   *
   * @readonly
   * @type {AbstractState}
   */
  get currentState(): TransitionState | undefined;

  /**
   * Gets the name of the state the layer is currently in control of.
   *
   * @readonly
   * @type {string}
   */
  get currentAnimation(): string;

  /**
   * Gets whether or not the layer is currently transitioning to a new animation.
   *
   * @readonly
   * @type {boolean}
   */
  get isTransitioning(): boolean;

  /**
   * Update the layer's current state to a new value. If transitionTime is defined
   * and greater than zero, perform a smooth blend between any states that currently
   * have non-zero weight values and the new state.
   *
   * @private
   *
   * @param {(string|null)} name - Name of the state to transition to.
   * @param {string} playMethod - Name of the operation being prepared for, to be
   * used in error messaging.
   * @param {number=} transitionTime - Amount of time in seconds it will take to
   * switch to the new state.
   * @param {Function=} easingFn - Easing function to use when transitioning to a
   * new state over time.
   * @param {Function=} onError - Function to execute if an error is encountered.
   */
  _prepareCurrentState(
    name: string,
    playMethod: string,
    transitionTime?: number,
    easingFn?: (k: number) => number,
    onError?: (x?: any) => any
  ): void;

  /**
   * Start playback an animation from the beginning.
   *
   * @param {string} name - Name of the animation to play.
   * @param {number=} transitionTime - Amount of time it will take before the
   * new state has full influence for the layer.
   * @param {Function=} easingFn - Easing function to use for blending if transitionTime
   * is greater than zero.
   * @param {Function=} onFinish - Function to execute when the animation finishes.
   * @param {Function=} onError - Function to execute if the animation encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   * @param {Function=} onNext - Function to execute if an animation queue is
   * played and it advances to the next animation.
   *
   * @returns {Deferred}
   */
  playAnimation(
    name?: string,
    transitionTime?: number,
    easingFn?: (k: number) => number,
    onFinish?: (x?: any) => any,
    onError?: (x?: any) => any,
    onCancel?: (x?: any) => any,
    onNext?: (x?: any) => any
  ): Deferred;

  /**
   * Cancel playback of the current animation.
   *
   * @returns {boolean}
   */
  cancelAnimation(): boolean;

  /**
   * Pause playback of the current animation.
   *
   * @returns {boolean}
   */
  pauseAnimation(): boolean;

  /**
   * Resume playback of an animation.
   *
   * @param {string=} name - Name of the animation to resume playback for. Default
   * is the layer's current animation name.
   * @param {number=} transitionTime - Amount of time it will take before the
   * new state has full influence for the layer.
   * @param {Function=} onFinish - Function to execute when the state finishes.
   * @param {Function=} onError - Function to execute if the state encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   * @param {Function=} onNext - Function to execute if an animation queue is
   * played and it advances to the next animation.
   *
   * @returns {Deferred}
   */
  resumeAnimation(
    name?: string,
    transitionTime?: number,
    easingFn?: (k: number) => number,
    onFinish?: (x?: any) => any,
    onError?: (x?: any) => any,
    onCancel?: (x?: any) => any,
    onNext?: (x?: any) => any
  ): Deferred;

  /**
   * Stop playback of the current animation.
   *
   * @returns {boolean}
   */
  stopAnimation(): boolean;

  /**
   * Update the current animation.
   *
   * @param {number} deltaTime - Time in milliseconds since the last update.
   */
  update(deltaTime: number): void;

  /**
   * Discard the transition state.
   */
  discard(): void;
}
/**
 * Creates a class that implements {@link AnimationPlayerInterface} and extends
 * a specified base class.
 *
 * @param {Class} [BaseClass = class{}] - The class to extend.
 *
 * @return {Class} A class that extends `BaseClass` and implements {@link AnimationPlayerInterface}.
 */

export const AnimationPlayerInterfaceMixin = <TBase extends Constructor>(
  BaseClass: TBase
) => {
  class AnimationPlayerMixin
    extends BaseClass
    implements AnimationPlayerInterface
  {
    declare _states: Map<string, TransitionState>;
    _transitionState = new TransitionState();
    _currentState?: TransitionState;
    _paused = false;
    _transitionTime: number;
    _easingFn: (K: number) => number;

    constructor(...args: any[]) {
      super(...args);
      const options = (args[0] ||= {});
      this._states = this._states !== undefined ? this._states : new Map();

      this._transitionTime =
        Number(options.transitionTime) >= 0
          ? Number(options.transitionTime)
          : 0;

      this._easingFn =
        typeof options.easingFn === "function" ? options.easingFn : undefined;
    }

    get paused() {
      return this._paused;
    }

    get transitionTime() {
      return this._transitionTime;
    }

    set transitionTime(seconds) {
      seconds = Number(seconds);

      if (!(seconds >= 0)) {
        throw new Error(
          `Cannot set transition time for ${this.constructor.name} to ${seconds}. Seconds must be a numeric value greather than or equal to zero.`
        );
      }

      this._transitionTime = seconds;
    }

    get easingFn() {
      return this._easingFn;
    }

    set easingFn(fn) {
      this._easingFn = fn;
    }

    get currentState() {
      return this._currentState;
    }

    get currentAnimation() {
      if (this._currentState) {
        return this._currentState?.name;
      }

      return undefined;
    }

    get isTransitioning() {
      return this._currentState === this._transitionState;
    }

    _prepareCurrentState(
      name: string,
      playMethod: string,
      transitionTime?: number,
      easingFn?: (k: number) => number,
      onError?: (x?: any) => any
    ): void {
      transitionTime ??= -1;
      if (name !== null && !this._states.has(name)) {
        const e = new Error(
          `Cannot ${playMethod} animation ${name}. No animation exists with this name.`
        );

        if (typeof onError === "function") {
          onError(e);
        }

        throw e;
      }

      const targetState =
        name !== undefined ? this._states.get(name) : undefined;

      // Make sure the new state isn't already playing
      if (this.currentAnimation !== name) {
        // Switch to the new state immediately
        if (transitionTime <= 0) {
          // Cancel the current state and set its weight to 0
          if (this._currentState) {
            this._currentState.cancel();
            this._currentState.weight = 0;
            this._currentState.deactivate();
          }

          this._currentState = targetState;
        }
        // Blend to the new state over time
        else {
          // Make sure to transition out of any states with non-zero weight
          const currentStates = [...this._states.values()].filter(
            (s) => s !== targetState && (s.weight || s.weightPending)
          );

          // Update the transition state with new inputs
          this._transitionState.configure(
            currentStates,
            targetState as AbstractState,
            transitionTime,
            easingFn,
            () => {
              this._currentState = targetState;
              this._transitionState.weight = 0;
            }
          );

          this._currentState = this._transitionState;
        }
      } else if (playMethod === "play") {
        this._currentState?.cancel();

        if (this._currentState === this._transitionState) {
          this._transitionState.reset(transitionTime, easingFn, () => {
            this._currentState = targetState;
            this._transitionState.weight = 0;
          });
        }
      }

      // Update weight for the new current state so it has full influence for the player
      if (this._currentState) {
        this._currentState.weight = 1;
      }
      this._currentState?.updateInternalWeight(this._internalWeight);
    }

    playAnimation(
      name?: string,
      transitionTime?: number,
      easingFn?: (k: number) => number,
      onFinish?: (x?: any) => any,
      onError?: (x?: any) => any,
      onCancel?: (x?: any) => any,
      onNext?: (x?: any) => any
    ) {
      let error;
      let reject = false;
      try {
        this._prepareCurrentState(
          name || "",
          "play",
          transitionTime !== undefined ? transitionTime : this._transitionTime,
          easingFn !== undefined ? easingFn : this._easingFn,
          onError
        );
      } catch (e) {
        error = e;
        reject = true;
      }

      if (reject) {
        return Deferred.reject(error);
      }

      return this._currentState?.play(
        onFinish,
        onError,
        onCancel,
        onNext
      ) as Deferred;
    }

    pauseAnimation() {
      if (this._currentState) {
        return this._currentState.pause();
      } else {
        return false;
      }
    }

    resumeAnimation(
      name?: string,
      transitionTime?: number,
      easingFn?: (k: number) => number,
      onFinish?: (x?: any) => any,
      onError?: (x?: any) => any,
      onCancel?: (x?: any) => any,
      onNext?: (x?: any) => any
    ) {
      if (name === undefined && this._currentState) {
        name = this._currentState.name;
      }

      let error;
      let reject = false;
      try {
        this._prepareCurrentState(
          name || "",
          "resume",
          transitionTime !== undefined ? transitionTime : this._transitionTime,
          easingFn !== undefined ? easingFn : this._easingFn,
          onError
        );
      } catch (e) {
        error = e;
        reject = true;
      }

      if (reject) {
        return Deferred.reject(error);
      }

      return this._currentState?.resume(
        onFinish,
        onError,
        onCancel,
        onNext
      ) as Deferred;
    }

    cancelAnimation() {
      return this._currentState?.cancel() ?? false;
    }

    stopAnimation() {
      if (this._currentState) {
        return this._currentState.stop();
      } else {
        return false;
      }
    }

    update(deltaTime: number) {
      super.update?.(deltaTime);
      this._currentState?.update(deltaTime);
    }

    discard() {
      super.discard?.();
      this._transitionState.discard();
      this._transitionState = new TransitionState();
    }
  }

  return AnimationPlayerMixin;
};
