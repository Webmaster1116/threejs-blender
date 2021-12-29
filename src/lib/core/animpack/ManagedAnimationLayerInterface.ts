import {
  AnimationFeatureDependentInterface,
  AnimationFeatureDependentInterfaceMixin,
} from "../animpack/AnimationFeatureDependentInterface";
import { Constructor } from "../types/common.types";

/**
 * Class factory interface for that keeps track of layers and animations on a host.
 * Tracked assets are marked as inactive until layers and animations with matching
 * names are detected as present on the host.
 *
 * @interface
 * @extends AnimationFeatureDependentInterface
 *
 * @property {Object} DEFAULT_LAYER_OPTIONS - Default options to use when executing
 * {@link AnimationLayer} methods.
 * @property {number} [DEFAULT_LAYER_OPTIONS.blendTime=0.5] - Default time in seconds
 * to use when executing {@link AnimationLayer.setBlendWeight}.
 * @property {Object} [DEFAULT_LAYER_OPTIONS.animations={}] - Maps animation names
 * to default options objects to use for managed animations.
 */
export interface ManagedAnimationLayerInterface
  extends AnimationFeatureDependentInterface {
  /**
   * Start tracking keeping track of whether a layer with the given name is present
   * on the host.
   *
   * @param {string} name - Name of the layer to keep track of.
   * @param {Object=} options - Options for the layer.
   * @param {number=} options.blendTime - Default amount of time to use when
   * manipulating layer weights on this layer.
   * @param {Function=} options.easingFn - Default easing function to use when
   * manipulating layer weights on this layer.
   * @param {Object=} options.animations - Animations to keep track of on the layer.
   * Animations are represented as key/value pairs of animation names and their
   * options.
   */
  registerLayer(
    name: string,
    options: {
      blendTime?: number;
      easingFn?: (k: number) => number;
      animations?: any;
    }
  ): void;

  /**
   * Start tracking keeping track of whether an animation with the given name is
   * present on the host.
   *
   * @param {string} layerName - Name of the layer that will own the animation.
   * @param {string} animationName - Name of the animation to keep track of.
   * @param {Object=} options - Options for the animation.
   */
  registerAnimation(
    layerName: string,
    animationName: string,
    options: any
  ): void;

  /**
   * Set layer weights on tracked layers.
   *
   * @param {Function=} nameFilter - Predicate function to test each tracked layer
   * with. By default all layers will pass.
   * @param {number} weight - Weight value to set on layers.
   * @param {number=} seconds - Number of seconds it will take to reach the weight
   * on each layer. If undefined, each layers' blendTime option is used.
   * @param {Function=} easingFn - Easing function to use when setting weight
   * on each layer. If undefined, each layers' easingFn option is used.
   */
  setLayerWeights(
    nameFilter: () => boolean,
    weight: number,
    seconds?: number,
    easingFn?: (k: number) => number
  ): void;

  /**
   * Set all tracked layers' weights to 1.
   *
   * @param {number=} seconds - Number of seconds it will take to reach the weight
   * on each layer. If undefined, each layers' blendTime option is used.
   * @param {Function=} easingFn - Easing function to use when setting weight
   * on each layer. If undefined, each layers' easingFn option is used.
   */
  enable(seconds?: number, easingFn?: (k: number) => number): void;

  /**
   * Set all tracked layers' weights to 0.
   *
   * @param {number=} seconds - Number of seconds it will take to reach the weight
   * on each layer. If undefined, each layers' blendTime option is used.
   * @param {Function=} easingFn - Easing function to use when setting weight
   * on each layer. If undefined, each layers' easingFn option is used.
   */
  disable(seconds?: number, easingFn?: (k: number) => number): void;
}

export const ManagedAnimationLayerInterface_DEFAULT_LAYER_OPTIONS = {
  blendTime: 0.5,
  animations: {} as any,
};

/**
 * Creates a class that implements {@link ManagedAnimationLayerInterface}
 * and extends a specified base class.
 *
 */
export const ManagedAnimationLayerInterfaceMixin = <TBase extends Constructor>(
  Base: TBase
) => {
  const Parent = AnimationFeatureDependentInterfaceMixin(Base);
  class ManagedAnimationLayerMixin
    extends Parent
    implements ManagedAnimationLayerInterface
  {
    static DEFAULT_LAYER_OPTIONS = {
      ...ManagedAnimationLayerInterface_DEFAULT_LAYER_OPTIONS,
    };

    _managedLayers: { [key: string]: any } = {};

    constructor(...args: any[]) {
      super(...args);
    }

    _onFeatureAdded(typeName: string): void {
      super._onFeatureAdded(typeName);

      if (typeName !== "AnimationFeature") {
        return;
      }

      this._managedLayers = this._managedLayers || {};

      // Detect new layers
      this._host.AnimationFeature.layers.forEach((name: any) => {
        this._onLayerAdded({ name });
      });
    }

    _onFeatureRemoved(typeName: string) {
      super._onFeatureRemoved(typeName);

      if (typeName !== "AnimationFeature") {
        return;
      }

      this._managedLayers = this._managedLayers || {};

      // Deactivate the layers
      Object.keys(this._managedLayers).forEach((name) => {
        this._onLayerRemoved({ name });
      });
    }

    _onLayerAdded({ name }: { name: string }) {
      // Mark the layer as active if it is managed
      if (this._managedLayers[name] !== undefined) {
        this._managedLayers[name].isActive = true;

        // Detect new animations
        this._host.AnimationFeature.getAnimations(name).forEach(
          (animName: any) => {
            this._onAnimationAdded({
              layerName: name,
              animationName: animName,
            });
          }
        );
      }
    }

    _onLayerRemoved({ name }: { name: string }) {
      // Deactivate the layer if it is managed
      if (this._managedLayers[name] !== undefined) {
        this._managedLayers[name].isActive = false;

        // Deactivate the animations
        Object.keys(this._managedLayers[name].animations).forEach(
          (animName) => {
            this._onAnimationRemoved({
              layerName: name,
              animationName: animName,
            });
          }
        );
      }
    }

    _onLayerRenamed({
      oldName,
      newName,
    }: {
      oldName: string;
      newName: string;
    }) {
      const layerOptions = this._managedLayers[oldName];

      // Replace the layer key with the new name
      if (layerOptions !== undefined) {
        delete this._managedLayers[oldName];
        this._managedLayers[newName] = layerOptions;
      }
    }

    _onAnimationAdded({
      layerName,
      animationName,
    }: {
      layerName: string;
      animationName?: string;
    }) {
      // Mark the animation as active if it is managed
      if (
        this._managedLayers[layerName] !== undefined &&
        this._managedLayers[layerName].animations[animationName || ""] !==
          undefined
      ) {
        this._managedLayers[layerName].animations[
          animationName || ""
        ].isActive = true;
      }
    }

    _onAnimationRemoved({
      layerName,
      animationName,
    }: {
      layerName: string;
      animationName: string;
    }): void {
      // Deactivate the animation if it is managed
      if (
        this._managedLayers[layerName] !== undefined &&
        this._managedLayers[layerName].animations[animationName] !== undefined
      ) {
        this._managedLayers[layerName].animations[animationName].isActive =
          false;
      }
    }

    _onAnimationRenamed({
      layerName,
      oldName,
      newName,
    }: {
      layerName: string;
      oldName: string;
      newName: string;
    }) {
      if (
        this._managedLayers[layerName] !== undefined &&
        this._managedLayers[layerName].animations[oldName] !== undefined
      ) {
        // Replace the animation key with the new name
        const animOptions = this._managedLayers[layerName].animations[oldName];
        delete this._managedLayers[layerName].animations[oldName];
        this._managedLayers[layerName].animations[newName] = animOptions;
      }
    }

    registerLayer(name: string | number, options: any = {}) {
      // Start with default options for each new layer
      if (this._managedLayers[name] === undefined) {
        this._managedLayers[name] = {
          ...(this.constructor as typeof ManagedAnimationLayerMixin)
            .DEFAULT_LAYER_OPTIONS,
          animations: {},
        };
      }

      // Update all options except animations
      const layerOptions = this._managedLayers[name];
      options = { ...options };
      const animationOptions = options.animations || {};
      delete options.animations;
      Object.assign(layerOptions, options);

      // Check whether the layer can be manipulated now
      layerOptions.isActive =
        this._host.AnimationFeature !== undefined &&
        this._host.AnimationFeature.layers.includes(name);

      // Register the animations
      Object.entries(animationOptions).forEach(([animName, animOptions]) => {
        this.registerAnimation(name, animName, animOptions);
      });
    }

    registerAnimation(
      layerName: string | number,
      animationName: string,
      options: any = {}
    ) {
      // Register the layer if it hasn't been registered yet
      if (this._managedLayers[layerName] === undefined) {
        this.registerLayer(layerName);
      }

      // Update animation options
      const animOptions =
        this._managedLayers[layerName].animations[animationName] || {};
      Object.assign(animOptions, options);
      this._managedLayers[layerName].animations[animationName] = animOptions;

      // Check whether the animation can be manipulated now
      this._managedLayers[layerName].animations[animationName].isActive =
        this._managedLayers[layerName].isActive &&
        this._host.AnimationFeature.getAnimations(layerName).includes(
          animationName
        );
    }

    setLayerWeights(
      nameFilter = (x: string) => true,
      weight: number,
      seconds: number = 0,
      easingFn?: (k: number) => number
    ) {
      const layerNames = Object.keys(this._managedLayers).filter(nameFilter);

      layerNames.forEach((name) => {
        const layerOptions = this._managedLayers[name];

        if (layerOptions.isActive) {
          this._host.AnimationFeature.setLayerWeight(
            name,
            weight,
            seconds !== undefined ? seconds : layerOptions.blendTime,
            easingFn || layerOptions.easingFn
          );
        }
      });
    }

    enable(seconds: any, easingFn: any) {
      this.setLayerWeights(undefined, 1, seconds, easingFn);
    }

    disable(seconds: any, easingFn: any) {
      this.setLayerWeights(undefined, 0, seconds, easingFn);
    }

    discard() {
      // todo Implement
    }

    installApi() {
      const api = super.installApi();

      Object.assign(api, {
        registerLayer: this.registerLayer.bind(this),
        registerAnimation: this.registerAnimation.bind(this),
        setLayerWeights: this.setLayerWeights.bind(this),
        enable: this.enable.bind(this),
        disable: this.disable.bind(this),
      });

      return api;
    }
  }

  return ManagedAnimationLayerMixin;
};
