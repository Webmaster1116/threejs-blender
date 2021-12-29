import {
  FeatureDependentInterface,
  FeatureDependentInterfaceMixin,
} from "../FeatureDependentInterface";
import { Constructor } from "../types/common.types";

/**
 * Class factory interface for features that are dependent on the AnimationFeature
 * being present on the host. Layer and animation events will automatically be
 * listened for once a AnimationFeature is added to the host and stopped once it
 * is removed.
 *
 * @interface
 * @extends FeatureDependentInterface
 *
 * @property {Object} EVENT_DEPENDENCIES - Events that the feature should start/stop
 * listening for when a feature of type FeatureName is added/removed from the host.
 * @property {Object} EVENT_DEPENDENCIES.AnimationFeature - Events that are
 * specific to the AnimationFeature.
 * @property {string} [EVENT_DEPENDENCIES.AnimationFeature.addLayer='_onLayerAdded'] -
 * The name of the method that will be executed when AnimationFeature addLayer
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.AnimationFeature.removeLayer='_onLayerRemoved'] -
 * The name of the method that will be executed when AnimationFeature removeLayer
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.AnimationFeature.renameLayer='_onLayerRenamed'] -
 * The name of the method that will be executed when AnimationFeature renameLayer
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.AnimationFeature.addAnimation='_onAnimationAdded'] -
 * The name of the method that will be executed when AnimationFeature addAnimation
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.AnimationFeature.removeAnimation='_onAnimationRemoved'] -
 * The name of the method that will be executed when AnimationFeature removeAnimation
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.AnimationFeature.renameAnimation='_onAnimationRenamed'] -
 * The name of the method that will be executed when AnimationFeature renameAnimation
 * events are emitted.
 */
export interface AnimationFeatureDependentInterface
  extends FeatureDependentInterface {
  /**
   * Executed when animation layer added events are caught.
   *
   * @private
   *
   * @param {string} name - Name of the layer that was added.
   */
  _onLayerAdded({ name }: { name: string }): void;

  /**
   * Executed when animation layer removed events are caught.
   *
   * @private
   *
   * @param {string} name - Name of the layer that was removed.
   */
  _onLayerRemoved({ name }: { name: string }): void;

  /**
   * Executed when animation layer renamed events are caught.
   *
   * @private
   *
   * @param {string} oldName - Name of the layer that was renamed.
   * @param {string} newName - New name of the layer.
   */
  _onLayerRenamed({
    oldName,
    newName,
  }: {
    oldName: string;
    newName: string;
  }): void;

  /**
   * Executed when animation added events are caught.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that an animation was added to.
   * @param {string} animationName - Name of the animation that was added.
   */
  _onAnimationAdded({
    layerName,
    animationName,
  }: {
    layerName: string;
    animationName: string;
  }): void;

  /**
   * Executed when animation removed events are caught.
   *
   */
  _onAnimationRemoved(opt: { layerName: string; animationName: string }): void;

  /**
   * Executed when animation renamed events are caught.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that an animation belongs to.
   * @param {string} oldName - Name of the animation that was renamed.
   * @param {string} newName - New name of the animation.
   */
  _onAnimationRenamed({
    layerName,
    oldName,
    newName,
  }: {
    layerName: string;
    oldName: string;
    newName: string;
  }): void;
}

const AnimationFeatureDependentInterface_EVENT_DEPENDENCIES = {
  AnimationFeature: {
    addLayer: "_onLayerAdded",
    removeLayer: "_onLayerRemoved",
    renameLayer: "_onLayerRenamed",
    addAnimation: "_onAnimationAdded",
    removeAnimation: "_onAnimationRemoved",
    renameAnimation: "_onAnimationRenamed",
  },
};

/**
 * Creates a class that implements {@link AnimationFeatureDependentInterface}
 * and extends a specified base class.
 *
 * @param {Class} BaseClass - The class to extend.
 *
 * @return {Class} A class that extends `BaseClass` and implements {@link AnimationFeatureDependentInterface}.
 */
export const AnimationFeatureDependentInterfaceMixin = <
  TBase extends Constructor
>(
  Base: TBase
) => {
  const Parent = FeatureDependentInterfaceMixin(Base);
  class AnimationFeatureDependentMixin
    extends Parent
    implements AnimationFeatureDependentInterface
  {
    static EVENT_DEPENDENCIES = {
      ...Parent.EVENT_DEPENDENCIES,
      ...AnimationFeatureDependentInterface_EVENT_DEPENDENCIES,
    };
  }

  return AnimationFeatureDependentMixin;
};
