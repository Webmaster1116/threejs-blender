import { AbstractHostFeature } from "../AbstractHostFeature";
import { TextToSpeechFeatureDependentInterfaceMixin } from "../awspack/TextToSpeechFeatureDependentInterface";
import { Constructor } from "../types/common.types";

/**
 * Class factory interface for that registers callback method when a ssml speechmark event is emitted.
 *
 * @interface
 * @extends TextToSpeechFeatureDependentInterface
 */

interface SpeechMark {
  feature: string;
  method: string;
  args: [string, number];
}
export interface SSMLSpeechmarkInterface {
  /**
   * When ssml events are caught, this will try to parse the speech mark value and execute any function which meets criteria defined in the value.
   * Speech mark value will be treated as stringified json format containing required feature name, function name and argument array to pass in.
   * Example speech mark value might look like: '{"feature":"GestureFeature", "method":"switchToGesture", "args":["genricA", 0.5]}'
   *
   */
  _onSsml(opt: { mark: { value: string } }): void;
}

/**
 * Creates a class that implements {@link SSMLSpeechmarkInterface}
 * and extends a specified base class.
 *
 */
export const SSMLSpeechmarkInterfaceMixin = <TBase extends Constructor>(
  Base: TBase
) => {
  const Parent = TextToSpeechFeatureDependentInterfaceMixin(Base);
  class SSMLSpeechMarkMixin extends Parent implements SSMLSpeechmarkInterface {
    _onSsml({ mark }: { mark: { value: string } }): void {
      const ctor = this.constructor as any as typeof AbstractHostFeature;
      try {
        const { feature, method, args } = JSON.parse(mark.value) as SpeechMark;
        if (ctor.featureName === feature) {
          const callback = this[method];
          if (callback && typeof callback === "function") {
            (callback as (x: string, y: number) => any).apply(this, args);
          } else {
            console.warn(
              `Function ${method} does not exist within feature ${feature}`
            );
          }
        }
      } catch (e) {
        // todo Implement
      }
    }
  }

  return SSMLSpeechMarkMixin;
};
