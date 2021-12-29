/**
 * @module three/animpack
 */

import {
  AnimationLayer,
  DefaultLayerBlendMode,
  LayerBlendModes,
} from "../../core/animpack/AnimationLayer";
import { AnimationUtils } from "../../core/animpack/AnimationUtils";
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
} from "../../core/animpack/Easing";
import { Blend1dState } from "../../core/animpack/state/Blend1dState";
import { Blend2dState } from "../../core/animpack/state/Blend2dState";
import { FreeBlendState } from "../../core/animpack/state/FreeBlendState";
import { QueueState } from "../../core/animpack/state/QueueState";
import { RandomAnimationState } from "../../core/animpack/state/RandomAnimationState";
import { TransitionState } from "../../core/animpack/state/TransitionState";
import { AnimationFeature, AnimationTypes } from "./AnimationFeature";
import { SingleState } from "./state/SingleState";

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
   * @see three.js/SingleState
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
  /**
   * @see Easing
   */
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
