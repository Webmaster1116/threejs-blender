/**
 * @module core/animpack
 */

import { AnimationFeature, AnimationTypes } from "./AnimationFeature";
import {
  AnimationLayer,
  DefaultLayerBlendMode,
  LayerBlendModes,
} from "./AnimationLayer";
import { AnimationUtils } from "./AnimationUtils";
import {
  Back,
  Bounce,
  Circular,
  Cubic,
  Elastic,
  Exponential,
  Linear,
  Quadratic,
  Quartic,
  Quintic,
  Sinusoidal,
} from "./Easing";
import { Blend1dState } from "./state/Blend1dState";
import { Blend2dState } from "./state/Blend2dState";
import { FreeBlendState } from "./state/FreeBlendState";
import { QueueState } from "./state/QueueState";
import { RandomAnimationState } from "./state/RandomAnimationState";
import { SingleState } from "./state/SingleState";
import { TransitionState } from "./state/TransitionState";

/**
 * @namespace
 */
const Easing = {
  /**
   * @see Linear
   */
  Linear,
  /**
   * @see Quadratic
   */
  Quadratic,
  /**
   * @see Cubic
   */
  Cubic,
  /**
   * @see Quartic
   */
  Quartic,
  /**
   * @see Quintic
   */
  Quintic,
  /**
   * @see Sinusoidal
   */
  Sinusoidal,
  /**
   * @see Exponential
   */
  Exponential,
  /**
   * @see Circular
   */
  Circular,
  /**
   * @see Elastic
   */
  Elastic,
  /**
   * @see Back
   */
  Back,
  /**
   * @see Bounce
   */
  Bounce,
};
export {
  AnimationFeature,
  /**
   * @see AnimationLayer
   */
  AnimationLayer,
  /**
   * @see core/SingleState
   */
  SingleState,
  /**
   * @see TransitionState
   */
  TransitionState,
  /**
   * @see FreeBlendState
   */
  FreeBlendState,
  /**
   * @see QueueState
   */
  QueueState,
  /**
   * @see RandomAnimationState
   */
  RandomAnimationState,
  /**
   * @see Blend1dState
   */
  Blend1dState,
  /**
   * @see Blend2dState
   */
  Blend2dState,
  /**
   * @see AnimationUtils
   */
  AnimationUtils,
  Easing,
  /**
   * @see LayerBlendModes
   */
  LayerBlendModes,
  /**
   * @see DefaultLayerBlendMode
   */
  DefaultLayerBlendMode,
  /**
   * @see AnimationTypes
   */
  AnimationTypes,
};
