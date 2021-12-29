/**
 * @module core/HOST
 */

import * as anim from "./animpack";
import * as aws from "./awspack";
import { Deferred } from "./Deferred";
import { DefaultGestureWords, GestureFeature } from "./GestureFeature";
import { env } from "./HostEnvironment";
import { HostObject } from "./HostObject";
import { DefaultVisemeMap, LipsyncFeature } from "./LipsyncFeature";
import { MathUtils } from "./MathUtils";
import { Messenger } from "./Messenger";
import { AxisMap, PointOfInterestFeature } from "./PointOfInterestFeature";
import { Utils } from "./Utils";

export {
  env,
  /**
   * @see Utils
   */
  Utils,
  /**
   * @see MathUtils
   */
  MathUtils,
  /**
   * @see Deferred
   */
  Deferred,
  /**
   * @see core/Messenger
   */
  Messenger,
  /**
   * @see core/HostObject
   */
  HostObject,
  /**
   * @see core/LipsyncFeature
   */
  LipsyncFeature,
  /**
   * @see GestureFeature
   */
  GestureFeature,
  /**
   * @see core/PointOfInterestFeature
   */
  PointOfInterestFeature,
  /**
   * @see DefaultVisemeMap
   */
  DefaultVisemeMap,
  /**
   * @see DefaultGestureWords
   */
  DefaultGestureWords,
  /**
   * @see AxisMap
   */
  AxisMap,
  /**
   * @see module:core/awspack
   */
  aws,
  /**
   * @see module:core/animpack
   */
  anim,
};
