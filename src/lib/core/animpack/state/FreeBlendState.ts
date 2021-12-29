import { AbstractBlendState } from "./AbstractBlendState";
import { AbstractState } from "./AbstractState";

/**
 * Class for blending N number of blend states.
 *
 * @extends AbstractBlendState
 */
export class FreeBlendState extends AbstractBlendState {
  static stateName = "FreeBlendState";
  // _states: any;
  // _weight: any;
  /**
   * @constructor
   *
   * @param {Object} [options={}] - Options for the container state.
   * @param {Array.<AbstractState>} [blendStates=[]] - Blend states to be controlled by
   * this container.
   */
  constructor(options: any = {}, blendStates: Array<AbstractState> = []) {
    super(options, blendStates);
  }

  updateInternalWeight(factor: number): void {
    super.updateInternalWeight(factor);

    // Determine the total active weight of blend states
    let sumWeights = 0;

    this._states.forEach((state) => {
      sumWeights += state.weight;
    });

    // Ensure the sum of blend state internal weights does not exceed container internal weight
    factor /= Math.max(sumWeights, 1);

    // Sum of blend state internal weights should not exceed container internal weight
    this._states.forEach((state) => {
      state.updateInternalWeight(factor * this._weight);
    });
  }
}
