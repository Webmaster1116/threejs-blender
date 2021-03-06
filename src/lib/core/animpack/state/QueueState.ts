import { Deferred } from "../../Deferred";
import { AnimationPlayerInterfaceMixin } from "../AnimationPlayerInterface";
import { AbstractState } from "./AbstractState";
import { SingleState } from "./SingleState";
import {
  StateContainerInterface,
  StateContainerInterfaceMixin,
} from "./StateContainerInterface";

/**
 * Class for playing an ordered array of animation states in sequence.
 *
 * @extends AbstractState
 * @implements @AnimationPlayerInterface
 */
export class QueueState
  extends AnimationPlayerInterfaceMixin(
    StateContainerInterfaceMixin(AbstractState)
  )
  implements StateContainerInterface, AbstractState
{
  static stateName = "QueueState";
  _queue: any;
  _done: boolean;

  /**
   * @constructor
   *
   * @param {Object} [options={}] - Options for the state.
   * @param {boolean} [options.autoAdvance=true] - Whether to autmatically advance
   * to the next state in the queue as each state completes.
   * @param {Array.<AbstractState>} [queueStates=[]] - Array of states to be played
   * in order.
   */
  constructor(options: any = {}, queueStates = []) {
    super(options);

    queueStates.forEach((state) => {
      this.addState(state);
    });

    this._queue = this._states.keys();
    this._done = true;
  }
  // addState(state: any) {
  //   throw new Error('Method not implemented.');
  // }

  /**
   * Gets whether the animation queue has reached the end.
   */
  get done() {
    return this._done;
  }

  /**
   * Gets the internal weight.
   *
   * @readonly
   * @type {number}
   */
  get internalWeight() {
    return this._currentState
      ? this._currentState.internalWeight * this._internalWeight
      : 0;
  }

  /**
   * Restart the queue iterator.
   *
   * @private
   */
  _reset() {
    this._queue = this._states.keys();
    const { value, done } = this._queue.next();
    this._done = done;

    return value || null;
  }

  /**
   * Multiplies the user weight by a factor to determine the internal weight.
   *
   * @param {number} factor - 0-1 multiplier to apply to the user weight.
   */
  updateInternalWeight(factor: number) {
    super.updateInternalWeight(factor);

    if (this._currentState) {
      this._currentState.updateInternalWeight(this._internalWeight);
    }
  }

  /**
   * Start the next animation in the queue.
   *
   * @param {Function=} onNext - Function to execute each time an animation completes
   * and the queue moves to the next animation.
   * @param {boolean} [wrap=false] - Whether or not to start the queue from the
   * beginning again if the end has been reached.
   *
   * @returns {Deferred}
   */
  next(onNext?: (x?: any) => any, wrap = false): Deferred {
    // Move the queue forward
    const { value: name, done } = this._queue.next();
    this._done = done;
    this._paused = false;

    // The queue has reached the end
    if (done) {
      // Start the queue over
      if (wrap) {
        return this.play(
          this._playCallbacks.onFinish,
          this._playCallbacks.onError,
          this._playCallbacks.onCancel,
          onNext
        );
      }
      // Stop the queue
      else {
        this._promises.finish.resolve(void 0);
        return this._promises.finish;
      }
    }

    // Signal the next animation is starting
    if (typeof onNext === "function") {
      const lastName = [...this._states.keys()][this._states.size - 1];
      const isQueueEnd = name === lastName;
      onNext({
        name,
        canAdvance:
          (this.getState(name) as SingleState).loopCount !== Infinity &&
          !isQueueEnd,
        isQueueEnd,
      });
    }

    // Start the next animation
    this.playAnimation(
      name,
      this._transitionTime,
      this._easingFn,
      () => {
        if (!this._paused && !this.isTransitioning) {
          this.next(onNext);
        }
      },
      this._playCallbacks.onError
    );

    return this._promises.finish;
  }

  play(
    onFinish?: (x?: any) => void,
    onError?: (x?: any) => void,
    onCancel?: (x?: any) => void,
    onNext?: (x?: any) => any
  ) {
    const name = this._reset();
    super.play(onFinish, onError, onCancel);

    if (this._done) {
      this._promises.finish.resolve(void 0);
    } else {
      // Signal the next animation is starting
      if (name !== this.currentAnimation && typeof onNext === "function") {
        const lastName = [...this._states.keys()][this._states.size - 1];
        const isQueueEnd = name === lastName;
        onNext({
          name,
          canAdvance: name
            ? (this.getState(name) as SingleState).loopCount !== Infinity &&
              !isQueueEnd
            : true,
          isQueueEnd: !name || isQueueEnd,
        });
      }

      // Start the next animation
      this.playAnimation(
        name,
        this._currentState ? this._transitionTime : 0,
        this._easingFn,
        () => {
          if (!this._paused && !this.isTransitioning) {
            this.next(onNext);
          }
        },
        onError
      );
    }

    return this._promises.finish;
  }

  pause() {
    const paused = super.pause();
    this.pauseAnimation();
    return paused;
  }

  resume(
    onFinish?: (x?: any) => void,
    onError?: (x?: any) => void,
    onCancel?: (x?: any) => void,
    onNext?: (x?: any) => void
  ) {
    if (this._done) {
      return this.play(onFinish, onError, onCancel, onNext);
    } else {
      super.resume(onFinish, onError, onCancel);
      this.resumeAnimation(
        this._currentState?.name,
        this._transitionTime,
        this._easingFn,
        () => {
          if (!this._paused && !this.isTransitioning) {
            this.next(onNext);
          }
        },
        onError
      );

      return this._promises.finish;
    }
  }

  cancel() {
    const canceled = super.cancel();
    if (this._currentState) {
      this._currentState.cancel();
    }
    return canceled;
  }

  stop() {
    const stopped = super.stop();
    this.stopAnimation();
    this._done = true;
    return stopped;
  }

  discard() {
    super.discard();
    this.discardStates();
  }
}
