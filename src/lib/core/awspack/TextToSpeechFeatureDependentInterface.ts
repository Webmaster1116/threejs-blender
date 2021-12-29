/* eslint-disable max-classes-per-file */
import { FeatureDependentInterfaceMixin } from "../FeatureDependentInterface";
import { Constructor } from "../types/common.types";

/**
 * Class factory interface for features that are dependent on the TextToSpeechFeature
 * being present on the host. Speech events will automatically be listened for once a
 * TextToSpeechFeature is added to the host and stopped once it is removed.
 *
 * @interface
 * @extends FeatureDependentInterface
 *
 * @property {Object} EVENT_DEPENDENCIES - Events that the feature should start/stop
 * listening for when a feature of type FeatureName is added/removed from the host.
 * @property {Object} EVENT_DEPENDENCIES.TextToSpeechFeature - Events that are
 * specific to the TextToSpeechFeature.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.play='_onPlay'] -
 * The name of the method that will be executed when TextToSpeechFeature play
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.pause='_onPause'] -
 * The name of the method that will be executed when TextToSpeechFeature pause
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.resume='_onResume'] -
 * The name of the method that will be executed when TextToSpeechFeature resume
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.stop='_onStop'] -
 * The name of the method that will be executed when TextToSpeechFeature stop
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.sentence='_onSentence'] -
 * The name of the method that will be executed when TextToSpeechFeature sentence
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.word='_onWord'] -
 * The name of the method that will be executed when TextToSpeechFeature word
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.viseme='_onViseme'] -
 * The name of the method that will be executed when TextToSpeechFeature viseme
 * events are emitted.
 * @property {string} [EVENT_DEPENDENCIES.TextToSpeechFeature.ssml='_onSsml'] -
 * The name of the method that will be executed when TextToSpeechFeature ssml
 * events are emitted.
 */
export interface TextToSpeechFeatureDependentInterface {
  /**
   * Executed when speech play events are caught.
   *
   * @private
   */
  _onPlay(): void;

  /**
   * Executed when speech pause events are caught.
   *
   * @private
   */
  _onPause(): void;

  /**
   * Executed when speech resume events are caught.
   *
   * @private
   */
  _onResume(): void;

  /**
   * Executed when speech stop events are caught.
   *
   * @private
   */
  _onStop(): void;

  /**
   * Executed when speech sentence events are caught.
   *
   * @private
   */
  _onSentence(): void;

  /**
   * Executed when speech word events are caught.
   *
   * @private
   */
  _onWord(): void;

  /**
   * Executed when speech viseme events are caught.
   *
   * @private
   */
  _onViseme(x: any): Promise<void>;

  /**
   * Executed when speech ssml events are caught.
   *
   * @private
   */
  _onSsml(): void;
}

const TextToSpeechFeatureDependentInterface_EVENT_DEPENDENCIES = {
  TextToSpeechFeature: {
    play: "_onPlay",
    pause: "_onPause",
    resume: "_onResume",
    stop: "_onStop",
    sentence: "_onSentence",
    word: "_onWord",
    viseme: "_onViseme",
    ssml: "_onSsml",
  },
};

/**
 * Creates a class that implements {@link TextToSpeechFeatureDependentInterface}
 * and extends a specified base class.
 *
 * @param {Class} Base - The class to extend.
 *
 * @return {Class} A class that extends `BaseClass` and implements {@link TextToSpeechFeatureDependentInterface}.
 */
export const TextToSpeechFeatureDependentInterfaceMixin = <
  TBase extends Constructor
>(
  Base: TBase
) => {
  const Parent = FeatureDependentInterfaceMixin(Base);
  class TextToSpeechFeatureDependentMixin
    extends Parent
    implements TextToSpeechFeatureDependentInterface
  {
    static EVENT_DEPENDENCIES = {
      ...Parent.EVENT_DEPENDENCIES,
      ...TextToSpeechFeatureDependentInterface_EVENT_DEPENDENCIES,
    };
    // _onPlay() {}

    // _onPause() {}

    // _onResume() {}

    // _onStop() {}

    // _onSentence() {}

    // _onWord() {}

    // async _onViseme(x: any): Promise<void> {}

    // _onSsml() {}
  }

  return TextToSpeechFeatureDependentMixin;
};
