import { HostObject } from "./HostObject";
import { Constructor } from "./types/common.types";

/**
 * Class factory interface for features that are dependent on other features being
 * present on the host. Event dependencies will be listened for when a feature of
 * matching type is added to the host and will stop being listened for when one
 * is removed. If the feature is already present when constructed, events will
 * be listened for right away.
 *
 * @interface
 *
 * @property {Object} EVENT_DEPENDENCIES - Events that the feature should start/stop
 * listening for when a feature of type FeatureName is added/removed from the host.
 * Event dependencies should follow the signature:
 *  { FeatureName: { eventName: callbackName, ... }, ... }
 */
export interface FeatureDependentInterface {
  /**
   * Start listening for event dependencies that match the given feature type.
   *
   * @private
   *
   * @param {string} typeName - type of feature to listen for.
   */
  _onFeatureAdded(typeName: string): any;

  /**
   * Stop listening for event dependencies that match the given feature type.
   *
   * @private
   *
   * @param {string} typeName - type of feature to stop listening for.
   */
  _onFeatureRemoved(typeName: string): any;

  /**
   * @augments {@link AbstractHostFeature#discard}
   */
  discard(): void;
}

/**
 * Creates a class that implements {@link FeatureDependentInterface} and extends
 * a specified base class.
 *
 * @param {Class} Base - The class to extend.
 *
 * @return {Class} A class that extends `BaseClass` and implements {@link FeatureDependentInterface}.
 */

export const FeatureDependentInterfaceMixin = <TBase extends Constructor>(
  Base: TBase
) => {
  class FeatureDependentMixin
    extends Base
    implements FeatureDependentInterface
  {
    static EVENT_DEPENDENCIES = {
      ...((Base as any).EVENT_DEPENDENCIES || {}),
    };
    constructor(...args: any[]) {
      const host: HostObject = args[0];
      super(host);
      this._host = host;

      // No need to listen for events if the mixin is in the prototype chain multiple times
      if (!this._initialized) {
        this._initialized = true;

        // Start listening for feature events
        this._onFeatureAdded = this._onFeatureAdded.bind(this);
        this._onFeatureRemoved = this._onFeatureRemoved.bind(this);

        this._host.listenTo(HostObject.EVENTS.addFeature, this._onFeatureAdded);
        this._host.listenTo(
          HostObject.EVENTS.removeFeature,
          this._onFeatureRemoved
        );

        // Register features that already exist
        const ctor = this.constructor as typeof FeatureDependentMixin;
        Object.keys(ctor.EVENT_DEPENDENCIES).forEach((typeName) => {
          if (this._host[typeName] !== undefined) {
            this._onFeatureAdded(typeName);
          }
        });
      }
    }

    _onFeatureAdded(typeName: string) {
      const ctor = this.constructor as typeof FeatureDependentMixin;
      if (ctor.EVENT_DEPENDENCIES[typeName] !== undefined) {
        const events = ctor.EVENT_DEPENDENCIES[typeName];
        (Object.entries(events) as [string, string][]).forEach(
          ([eventName, callback]) => {
            if (this[callback]) {
              this[callback] = this[callback].bind(this);
              this._host.listenTo(
                this._host[typeName].EVENTS[eventName],
                this[callback]
              );
            }
          }
        );
      }
    }

    _onFeatureRemoved(typeName: string) {
      const ctor = this.constructor as typeof FeatureDependentMixin;
      if (ctor.EVENT_DEPENDENCIES[typeName] !== undefined) {
        const events = ctor.EVENT_DEPENDENCIES[typeName];
        (Object.entries(events) as [string, string][]).forEach(
          ([eventName, callback]) => {
            this._host.stopListening(
              this._host[typeName].EVENTS[eventName],
              this[callback]
            );
          }
        );
      }
    }

    discard() {
      // Stop listening for feature events
      this._host.stopListening(
        HostObject.EVENTS.addFeature,
        this._onFeatureAdded
      );
      this._host.stopListening(
        HostObject.EVENTS.removeFeature,
        this._onFeatureRemoved
      );
      const ctor = this.constructor as typeof FeatureDependentMixin;
      // Stop listening to feature-specific events
      Object.keys(ctor.EVENT_DEPENDENCIES).forEach((typeName) => {
        if (this._host[typeName] !== undefined) {
          this._onFeatureRemoved(typeName);
        }
      });

      super.discard();
    }
  }

  return FeatureDependentMixin;
};

/**
 * Event dependencies should follow the signature:
 * {
 *  FeatureName: {
 *    // Events that the feature should start/stop listening for when a feature
 *    // of type FeatureName is added/removed from the host
 *    {
 *      eventName: callbackName,
 *      ...
 *    },
 *  }
 * }
 */
