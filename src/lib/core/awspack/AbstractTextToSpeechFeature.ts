import type * as AWS from "aws-sdk";
import { AbstractHostFeature } from "../AbstractHostFeature";
import { AnimationUtils } from "../animpack/AnimationUtils";
import { Deferred } from "../Deferred";
import { HostObject } from "../HostObject";
import { MathUtils } from "../MathUtils";
import { AbstractSpeech, AbstractSpeech as Speech } from "./AbstractSpeech";
import { TextToSpeechUtils } from "./TextToSpeechUtils";

/**
 * The Amazon Polly service object.
 * @external Polly
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html
 */

/**
 * The presigner object that can be used to generate presigned urls for the Polly service.
 * @external Presigner
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly/Presigner.html
 */

// Available options for Polly
const engines = ["standard", "neural"];
const audioFormats = ["mp3", "ogg_vorbis", "pcm"];
const speechmarkTypes = ["sentence", "ssml", "viseme", "word"];

interface SampleRate {
  rates: string[];
  defaults: {
    standard: string;
    neural: string;
  };
}
const sampleRates: { [key: string]: SampleRate } = {
  mp3: {
    rates: ["8000", "16000", "22050", "24000"],
    defaults: {
      standard: "2050",
      neural: "2400",
    },
  },
  pcm: {
    rates: ["8000", "16000"],
    defaults: {
      standard: "1600",
      neural: "1600",
    },
  },
};

sampleRates.ogg_vorbis = sampleRates.mp3;
let awsVersion: string;

interface SpeechData {
  config?: {
    Engine: string;
    LanguageCode: string;
    OutputFormat: string;
    SampleRate: string;
    VoiceId: string;
  };
  promise?: Promise<any>;
}

/**
 * Base class for turning text input into playable audio. There should be one instance
 * per speaker, each instance can play only one piece of text at a time.
 *
 * @extends AbstractHostFeature
 * @abstract
 *
 * @property {(number|undefined)} AWS_VERSION - Gets the version of AWS SDK being
 * used. Will be undefined until [initializeService]{@link AbstractTextToSpeechFeature.initializeService}
 * has been successfully executed.
 * @property {string} [POLLY_MIN_NEURAL_VERSION='2.503'] - Gets the minimum version
 * of the AWS SDK that is necessary to use neural voices with AWS Polly.
 * @property {Object} POLLY_DEFAULTS - Default values to use with calls to {@link external:Polly}.
 * @property {string} [POLLY_DEFAULTS.Engine='standard']
 * @property {Array.<string>} [POLLY_DEFAULTS.LexiconNames=[]]
 * @property {string} [POLLY_DEFAULTS.OutputFormat='mp3']
 * @property {string} [POLLY_DEFAULTS.SampleRate='22050']
 * @property {string} [POLLY_DEFAULTS.Text='']
 * @property {string} [POLLY_DEFAULTS.TextType='ssml']
 * @property {string} [POLLY_DEFAULTS.VoiceId='Amy']
 * @property {string} [POLLY_DEFAULTS.LanguageCode='en-GB']
 * @property {string} [POLLY_DEFAULTS.LanguageName='British English']
 * @property {Array.<string>} [POLLY_VOICES=[]] - An array of voices available in
 * Polly. Will be empty until [initializeService]{@link AbstractTextToSpeechFeature.initializeService}
 * has been successfully executed. See [Polly Documentation]{@link https://docs.aws.amazon.com/polly/latest/dg/voicelist.html}
 * for a full list of available voices.
 * @property {Object} [POLLY_LANGUAGES={}] - An object that maps language names
 * to language codes that are available in Polly. Will be empty until
 * [initializeService]{@link AbstractTextToSpeechFeature.initializeService}
 * has been successfully executed. See [Polly Documentation]{@link https://docs.aws.amazon.com/polly/latest/dg/SupportedLanguage.html}
 * for a full list of available languages and corresponding codes.
 * @property {Object} [POLLY_LANGUAGE_CODES={}] - An object that maps language codes
 * to language names that are available in Polly. Will be empty until
 * [initializeService]{@link AbstractTextToSpeechFeature.initializeService}
 * has been successfully executed. See [Polly Documentation]{@link https://docs.aws.amazon.com/polly/latest/dg/SupportedLanguage.html}
 * for a full list of available languages and corresponding codes.
 * @property {Object} EVENTS - Built-in messages that the feature emits. When the
 * feature is added to a {@link core/HostObject}, event names will be prefixed by the
 * name of the feature class + '.'.
 * @property {string} [EVENTS.ready=onReadyEvent] - Message that is emitted after
 * [initializeService]{@link AbstractTextToSpeechFeature.initializeService} has been
 * successfully executed.
 * @property {string} [EVENTS.play=onPlayEvent] - Message that is emitted after
 * each call to [play]{@link AbstractTextToSpeechFeature#play}. The speech that was played
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.pause=onPauseEvent] - Message that is emitted after
 * each call to [pause]{@link AbstractTextToSpeechFeature#pause}. The speech that was paused
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.resume=onResumeEvent] - Message that is emitted after
 * each call to [resume]{@link AbstractTextToSpeechFeature#resume}. The speech that was
 * resumed is supplied as an argument to listener functions.
 * @property {string} [EVENTS.interrupt=onInterruptEvent] - Message that is emitted
 * if there is a current speech in progress and [play]{@link AbstractTextToSpeechFeature#play}
 * or [resume]{@link AbstractTextToSpeechFeature#resume} are executed for a new speech.
 * The speech that was interrupted is supplied as an argument to listener functions.
 * @property {string} [EVENTS.stop=onStopEvent] - Message that is emitted after
 * each call to [stop]{@link AbstractTextToSpeechFeature#stop} and when a speech reaches
 * the end of playback. The speech that was stopped is supplied as an argument
 * to listener functions.
 * @property {string} [EVENTS.sentence=onSentenceEvent] - Message that is emitted
 * each time a sentence speechmark is encountered whose timestamp matches up with
 * the speech audio's current time. The sentence speechmark object is supplied as
 * an argument to listener functions.
 * @property {string} [EVENTS.word=onWordEvent] - Message that is emitted
 * each time a word speechmark is encountered whose timestamp matches up with
 * the speech audio's current time. The word speechmark object is supplied as
 * an argument to listener functions.
 * @property {string} [EVENTS.viseme=onVisemeEvent] - Message that is emitted
 * each time a viseme speechmark is encountered whose timestamp matches up with
 * the speech audio's current time. The viseme speechmark object is supplied as
 * an argument to listener functions.
 * @property {string} [EVENTS.ssml=onSsmlEvent] - Message that is emitted
 * each time a ssml speechmark is encountered whose timestamp matches up with
 * the speech audio's current time. The ssml speechmark object is supplied as
 * an argument to listener functions.
 * @property {Object} SERVICES - AWS services that are necessary for the feature
 * to function.
 * @property {external:Polly} SERVICES.polly - The Polly service that is used
 * to synthesize speechmarks. Will be undefined until [initializeService]{@link AbstractTextToSpeechFeature.initializeService}
 * has been successfully executed
 * @property {external:Presigner} SERVICES.presigner - The Polly Presigner
 * object that is used to synthesize speech audio. Will be undefined until
 * [initializeService]{@link AbstractTextToSpeechFeature.initializeService}
 * has been successfully executed.
 */

export class AbstractTextToSpeechFeature extends AbstractHostFeature {
  static featureName = "AbstractTextToSpeechFeature";
  static _isReady = false;
  static SERVICES = {
    ...Object.getPrototypeOf(AbstractHostFeature).SERVICES,
    polly: undefined,
    presigner: undefined,
  };
  static POLLY_VOICES: any[] = [];
  static POLLY_LANGUAGES: any = {};
  static POLLY_LANGUAGE_CODES: any = {};
  static POLLY_MIN_NEURAL_VERSION = "2.503";
  static EVENTS = {
    ...Object.getPrototypeOf(AbstractHostFeature).EVENTS,
    ready: "onReadyEvent",
    play: "onPlayEvent",
    pause: "onPauseEvent",
    resume: "onResumeEvent",
    interrupt: "onInterruptEvent",
    stop: "onStopEvent",
    sentence: "onSentenceEvent",
    word: "onWordEvent",
    viseme: "onVisemeEvent",
    ssml: "onSsmlEvent",
  };
  static POLLY_DEFAULTS = {
    Engine: "standard",
    LexiconNames: [],
    OutputFormat: "mp3",
    SampleRate: "22050",
    Text: "",
    TextType: "ssml",
    VoiceId: "Amy",
    LanguageCode: "en-GB",
    LanguageName: "British English",
  };
  static get AWS_VERSION(): string {
    return awsVersion;
  }
  _speechCache: { [key: string]: SpeechData } = {};
  _currentSpeech?: AbstractSpeech;
  _currentPromise?: { play: Deferred; speech: Deferred };
  _isValidated: boolean;
  _promises: { volume: Deferred };
  _volumePaused: boolean;
  _voice: any;
  _language: any;
  _engine: "standard" | "neural";
  _audioFormat: keyof typeof sampleRates;
  _sampleRate: any;

  _speechmarkOffset: any;
  _minEndMarkDuration!: number;
  _volume!: number;
  // _host: any;
  /**
   * @constructor
   *
   * @param {core/HostObject} host - Host object managing the feature.
   * @param {Object=} options - Options that will be sent to Polly for each speech.
   * @param {string=} options.voice - The name of the Polly voice to use for all speech.
   * @param {string=} options.engine - The name of the Polly engine to use for all speech.
   * @param {string=} options.language - The name of the language to use for all speech.
   * @param {audioFormat} [options.audioFormat='mp3'] - The format to use for generated
   * audio for all speeches.
   * @param {string=} options.sampleRate - The sample rate for audio files for all
   * speeches.
   * @param {number} [options.speechmarkOffset=0] - Amount of time in seconds to
   * offset speechmark event emission from the audio.
   * @param {number} [options.minEndMarkDuration=.05] - The minimum amount of time
   * in seconds that the last speechmark of each type in a speech can have its
   * duration property set to.
   * @param {number} [options.volume=1] - The default volume to play speech audio
   * with.
   */

  constructor(
    host: HostObject,
    options: {
      voice?: string;
      engine?: string;
      language?: string;
      audioFormat?: string;
      sampleRate?: string;
      speechmarkOffset?: number;
      minEndMarkDuration?: number;
      volume?: number;
    } = {
      audioFormat: "mp3",
      speechmarkOffset: 0,
      minEndMarkDuration: 0.05,
      volume: 1,
    }
  ) {
    super(host);

    this._speechCache = {};
    this._currentSpeech = undefined;
    this._currentPromise = undefined;
    this._isValidated = false;
    this.speechmarkOffset = Number.isNaN(Number(options.speechmarkOffset))
      ? 0
      : Number(options.speechmarkOffset);
    this.minEndMarkDuration = Number.isNaN(Number(options.minEndMarkDuration))
      ? 0
      : Number(options.minEndMarkDuration);
    this.volume = Number.isNaN(Number(options.volume))
      ? 1
      : Number(options.volume);
    this._promises = {
      volume: Deferred.resolve(),
    };
    this._volumePaused = false;
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    // Set default options for each speech
    this._voice = options.voice || ctor.POLLY_DEFAULTS.VoiceId;
    this._language = options.language || ctor.POLLY_DEFAULTS.LanguageName;
    this._engine = (
      engines.includes(options.engine || "")
        ? options.engine
        : ctor.POLLY_DEFAULTS.Engine
    ) as any;
    this._audioFormat = (
      audioFormats.includes(options.audioFormat || "")
        ? options.audioFormat
        : ctor.POLLY_DEFAULTS.OutputFormat
    ) as any;
    this._sampleRate = sampleRates[this._audioFormat].rates.includes(
      options.sampleRate || "0"
    )
      ? options.sampleRate
      : ctor.POLLY_DEFAULTS.SampleRate;
  }

  /**
   * Store Polly, Presigner and AWS SDK Version for use across all instances.
   *
   * @param {external:Polly} polly - Polly instance to use to generate speechmarks.
   * @param {external:Presigner} presigner - Presigner instance to use to generate
   * audio URLs.
   * @param {string} version - Version of the AWS SDK to use to validate voice options.
   */
  static initializeService(
    polly?: AWS.Polly,
    presigner?: any,
    version?: string
  ) {
    // Make sure all were defined
    if (
      polly === undefined ||
      presigner === undefined ||
      version === undefined
    ) {
      throw new Error(
        "Cannot initialize TextToSpeech feature. All arguments must be defined."
      );
    }

    // Add sumerian hosts user-agent
    if (polly.config) {
      polly.config.customUserAgent = this._withCustomUserAgent(
        polly.config.customUserAgent || ""
      );
    }
    if (presigner.service && presigner.service.config) {
      presigner.service.config.customUserAgent = this._withCustomUserAgent(
        presigner.service.config.customUserAgent
      );
    }

    this._isReady = false;

    // Store parameters
    this.SERVICES.polly = polly;
    this.SERVICES.presigner = presigner;
    awsVersion = version;

    // Clear the current polly objects
    const availableVoices = this.POLLY_VOICES;
    availableVoices.length = 0;

    const availableLanguages = this.POLLY_LANGUAGES;
    Object.keys(availableLanguages).forEach((name) => {
      delete availableLanguages[name];
    });

    const availableLanguageCodes = this.POLLY_LANGUAGE_CODES;
    Object.keys(availableLanguageCodes).forEach((name) => {
      delete availableLanguageCodes[name];
    });

    // Re-populate according to version
    const minNeuralSdk = this.POLLY_MIN_NEURAL_VERSION;

    return this.SERVICES.polly
      .describeVoices()
      .promise()
      .then((response: any) => {
        const allCodes: any = {};

        response.Voices.forEach((voice: any) => {
          if (
            voice.SupportedEngines.includes("standard") ||
            version >= minNeuralSdk
          ) {
            availableVoices.push(voice);
          }

          availableVoices.forEach((voice: any) => {
            availableLanguages[voice.LanguageName] = voice.LanguageCode;
            allCodes[voice.LanguageCode] = voice.LanguageName;
          });
        });

        Object.entries(availableLanguages).forEach(([name, code]) => {
          availableLanguageCodes[code as string] = name;
        });

        // Notify that we're ready to generate speeches
        this._isReady = true;
        this.emit(this.EVENTS.ready);
      });
  }

  /**
   * Indicates whether or not the class is capable of generating speech audio. Polly,
   * Presigner and AWS SDK version number must have been defined using
   * [initializeService]{@link AbstractTextToSpeechFeature.initializeService}.
   *
   * @readonly
   * @type {boolean}
   */
  static get isReady() {
    return this._isReady;
  }

  /**
   * Gets the text of the currently playing speech.
   *
   * @readonly
   * @type {string}
   */
  get currentSpeech() {
    if (this._currentSpeech) {
      return this._currentSpeech.text;
    } else {
      return null;
    }
  }

  /**
   * Gets and sets the number of seconds to offset speechmark emission.
   *
   * @type {number}
   */
  get speechmarkOffset() {
    return this._speechmarkOffset;
  }

  set speechmarkOffset(offset) {
    this._speechmarkOffset = offset;

    if (this._currentSpeech) {
      this._currentSpeech.speechmarkOffset = offset;
    }
  }

  /**
   * Gets and sets the The minimum amount of time in seconds that the last
   * speechmark of each type in a speech can have its duration property set to.
   *
   * @type number
   */
  get minEndMarkDuration() {
    return this._minEndMarkDuration / 1000;
  }

  set minEndMarkDuration(duration) {
    this._minEndMarkDuration = duration * 1000;
  }

  /**
   * Appends the Sumerian Hosts custom user-agent to a string if it is not
   * already present.
   *
   * @private
   *
   * @param {string} currentUserAgent - String to append to if needed.
   *
   * @returns {string}
   */
  static _withCustomUserAgent(currentUserAgent: string): string {
    const sumerianHostsUserAgent = "request-source/SumerianHosts";

    if (currentUserAgent == null) {
      return sumerianHostsUserAgent;
    }

    if (currentUserAgent.indexOf(sumerianHostsUserAgent) !== -1) {
      return currentUserAgent;
    }

    return currentUserAgent.concat(" ", sumerianHostsUserAgent);
  }

  /**
   * Checks if a given engine type is compatible with the AWS SDK version. If it
   * is, return the original value. Otherwise return a default.
   *
   * @private
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateEngine(engine: string): string {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    // Default to the standard engine if neural is not available for this version
    if (
      engine === undefined ||
      ctor.AWS_VERSION < ctor.POLLY_MIN_NEURAL_VERSION
    ) {
      engine = ctor.POLLY_DEFAULTS.Engine;
    }

    return engine;
  }

  /**
   * Checks if a given audio format type is compatible with Polly. If it is, return
   * the original value. Otherwise return a default.
   *
   * @private
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateFormat(format: string): string {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    if (format === undefined || !audioFormats.includes(format)) {
      format = ctor.POLLY_DEFAULTS.OutputFormat;
    }

    return format;
  }

  /**
   * Checks if a given audio sampling rate is compatible with the current audio
   * format. If it is, return the original value. Otherwise return a default.
   *
   * @private
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateRate(rate: string): string {
    // Use default if specified sample rate is not valid for the audio format
    if (
      rate === undefined ||
      !sampleRates[this._audioFormat].rates.includes(rate)
    ) {
      rate = sampleRates[this._audioFormat].defaults[this._engine];
    }

    return rate;
  }

  /**
   * Checks if a given Polly voice id is compatible with the current Polly engine.
   * If it is, return the original value. Otherwise return a default.
   *
   * @private
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateVoice(voiceId: string): string {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    const voice = ctor.POLLY_VOICES.find((v) => v.Id === voiceId);
    // Use the default voice if the voice isn't supported by the engine
    if (voice === undefined || !voice.SupportedEngines.includes(this._engine)) {
      voiceId = ctor.POLLY_DEFAULTS.VoiceId;
    }

    return voiceId;
  }

  /**
   * Checks if a given Polly language is compatible with the current Polly voice.
   * If it is, return the original value. Otherwise return a default.
   *
   * @private
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateLanguage(language: string): string {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    const voice = ctor.POLLY_VOICES.find((v) => v.Id === this._voice);
    const languageCode = ctor.POLLY_LANGUAGES[language];

    // Find the languages available for the current voice
    const availableCodes = [voice.LanguageCode];
    if (voice.AdditionalLanguageCodes) {
      availableCodes.push(...voice.AdditionalLanguageCodes);
    }

    // If the current voice doesn't support the language, use its default
    if (!availableCodes.includes(languageCode)) {
      language = ctor.POLLY_LANGUAGE_CODES[voice.LanguageCode];
    }

    return language;
  }

  /**
   * Validate the current Polly options to make sure they are compatible with each
   * other.
   *
   * @private
   */
  _validate() {
    // Validate speech parameters
    this._engine = this._validateEngine(this._engine) as "standard" | "neural";
    this._audioFormat = this._validateFormat(
      this._audioFormat as string
    ) as any;
    this._sampleRate = this._validateRate(this._sampleRate);
    this._voice = this._validateVoice(this._voice);
    this._language = this._validateLanguage(this._language);
    this._isValidated = true;
  }

  /**
   * Return an object containing parameters compatible with Polly.synthesizeSpeech.
   *
   * @private
   *
   * @returns {Object}
   */
  _getConfig(): any {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    // Make sure parameters have been validated
    if (ctor.isReady && !this._isValidated) {
      this._validate();
    }

    // Create a config object compatible with Polly
    return {
      Engine: this._engine,
      OutputFormat: this._audioFormat,
      SampleRate: this._sampleRate,
      VoiceId: this._voice,
      LanguageCode: ctor.POLLY_LANGUAGES[this._language],
    };
  }

  /**
   * Update Polly parameters with options from a given config. All stored speeches
   * will be updated to use the new parameters, unless the speech text is contained
   * in the 'skipSpeeches' parameter.
   *
   * @private
   *
   * @param {Object} config - Polly parameter options to overwrite.
   * @param {Array.<string>} skipSpeeches - Text of any speeches that should not
   * have parameters updated.
   *
   * @returns {Object}
   */
  _updateConfig(config: any, skipSpeeches: Array<string> = []): any {
    const currentConfig = this._getConfig();
    if (!config) {
      return currentConfig;
    }

    this._isValidated = false;
    const currentConfigStr = JSON.stringify(currentConfig);

    // Update options
    if (config.Engine) {
      this._engine = config.Engine;
    }

    if (config.audioFormat) {
      this._audioFormat = config.audioFormat;
    }

    if (config.SampleRate) {
      this._sampleRate = config.SampleRate;
    }

    if (config.VoiceId) {
      this._voice = config.VoiceId;
    }

    if (config.Language) {
      this._language = config.Language;
    }

    // Validate the config
    const validConfig = this._getConfig();

    // Exit if nothing has changed
    const configStr = JSON.stringify(validConfig);
    if (currentConfigStr === configStr) {
      this._isValidated = true;
      return validConfig;
    }

    // Update all cached configs
    Object.entries(this._speechCache).forEach(([text, speech]) => {
      // Check if this is a skipped speech
      if (skipSpeeches.includes(text)) {
        return;
      }

      const speechConfigStr = JSON.stringify(speech.config);

      // Update the speech with new parameters
      if (speechConfigStr !== configStr) {
        this._updateSpeech(text, validConfig);
      }
    });

    return validConfig;
  }

  /**
   * Update an existing speech, or add a new speech with new Polly parameters with
   * options from a given config.
   *
   * @private
   *
   * @param {string} text - The text of the speech to update.
   * @param {Object} config - Polly parameter options to update.
   * @param {boolean} [force=false] - Whether to force the speech to be updated
   * if no parameters have changes.
   *
   * @returns {AbstractSpeech}
   */
  _updateSpeech(text: string, config: any, force: boolean = false) {
    const speech: SpeechData = this._speechCache[text] || {};
    // console.log('speech-speech', speech);
    // Exit if nothing has changed and force is false
    if (
      !force &&
      config !== undefined &&
      speech.config &&
      JSON.stringify(config) === JSON.stringify(speech.config)
    ) {
      return speech;
    }

    // Create separate parameters for audio and speechmark generation
    const audioParams = {
      ...config,
      Text: text,
      TextType: "ssml",
    };
    const speechmarkParams = {
      ...audioParams,
      OutputFormat: "json",
      SpeechMarkTypes: speechmarkTypes,
    };

    // Generate audio and speechmarks
    speech.config = config;
    speech.promise = Promise.all([
      this._synthesizeSpeechmarks(speechmarkParams),
      this._synthesizeAudio(audioParams),
    ]).then((results) => {
      return this._createSpeech(text, ...results);
    });
    this._speechCache[text] = speech;

    return speech;
  }

  /**
   * Create a new Speech object for the speaker.
   *
   * @private
   *
   * @param {TextToSpeech} speaker - The TextToSpeech instance that will own the speech.
   * @param {string} text - Text of the speech.
   * @param {Object} speechmarks - Speechmarks for the speech.
   * @param {Object} audioConfig - Audio for the speech.
   *
   * @returns {AbstractSpeech}
   */
  _createSpeech(
    text: string,
    speechmarks: any,
    audioConfig: any
  ): AbstractSpeech {
    return new Speech(this as any, text, speechmarks);
  }

  /**
   * Create presigned URL of speech audio for the given speech text.
   *
   * @private
   *
   * @param {Object} params - Parameters object compatible with Polly.synthesizeSpeech.
   *
   * @returns {Deferred} Resolves with an object containing the audio URL.
   */
  _synthesizeAudio(params: any) {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    return new Promise((resolve, reject) => {
      ctor.SERVICES.presigner.getSynthesizeSpeechUrl(
        params,
        (error: any, url: string) => {
          if (!error) {
            resolve?.({ url });
          } else {
            reject?.(error);
          }
        }
      );
    });
  }

  /**
   * Retrieves and parses speechmarks for the given speech text.
   *
   * @private
   *
   * @param {Object} params - Parameters object compatible with Polly.synthesizeSpeech.
   *
   * @returns {Deferred} Resolves with an array of speechmark objects
   */
  _synthesizeSpeechmarks(params: any): any {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    return ctor.SERVICES.polly
      .synthesizeSpeech(params)
      .promise()
      .then((result: any) => {
        // Convert charcodes to string
        const jsonString = JSON.stringify(result.AudioStream);
        const json = JSON.parse(jsonString);
        const dataStr = json.data
          .map((c: number) => String.fromCharCode(c))
          .join("");

        const markTypes = {
          sentence: [] as any[],
          word: [] as any[],
          viseme: [] as any[],
          ssml: [] as any[],
        };
        const endMarkTypes = {
          sentence: null as any,
          word: null as any,
          viseme: null as any,
          ssml: null as any,
        };

        // Split by enclosing {} to create speechmark objects
        const speechMarks = [...dataStr.matchAll(/\{.*?\}(?=\n|$)/gm)].map(
          (match) => {
            const mark = JSON.parse(match[0]);

            // Set the duration of the last speechmark stored matching this one's type
            const numMarks =
              markTypes[mark.type as keyof typeof markTypes].length;
            if (numMarks > 0) {
              const lastMark =
                markTypes[mark.type as keyof typeof markTypes][numMarks - 1];
              lastMark.duration = mark.time - lastMark.time;
            }

            markTypes[mark.type as keyof typeof markTypes].push(mark);
            endMarkTypes[mark.type as keyof typeof markTypes] = mark;
            return mark;
          }
        );

        // Find the time of the latest speechmark
        const endTimes = [];
        if (endMarkTypes.sentence) {
          endTimes.push(endMarkTypes.sentence.time);
        }
        if (endMarkTypes.word) {
          endTimes.push(endMarkTypes.word.time);
        }
        if (endMarkTypes.viseme) {
          endTimes.push(endMarkTypes.viseme.time);
        }
        if (endMarkTypes.ssml) {
          endTimes.push(endMarkTypes.ssml.time);
        }
        const endTime = Math.max(...endTimes);

        // Calculate duration for the ending speechMarks of each type
        if (endMarkTypes.sentence) {
          endMarkTypes.sentence.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.sentence.time
          );
        }
        if (endMarkTypes.word) {
          endMarkTypes.word.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.word.time
          );
        }
        if (endMarkTypes.viseme) {
          endMarkTypes.viseme.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.viseme.time
          );
        }
        if (endMarkTypes.ssml) {
          endMarkTypes.ssml.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.ssml.time
          );
        }

        return speechMarks;
      });
  }

  /**
   * Returns a Speech object that has the given text.
   *
   * @private
   *
   * @param {string} text - The text content of the Speech.
   * @param {Object=} config - Options to update the Speech with.
   *
   * @returns {Deferred} Resolves with Speech or null;
   */
  _getSpeech(text: string, config?: any): Promise<any> {
    const ctor = this.constructor as any as typeof AbstractTextToSpeechFeature;
    // Make sure AWS services exist
    if (!ctor.isReady) {
      const e = "AWS services have not been initialized.";
      return Promise.reject(e);
    }

    // Make sure its possible to generate speeches
    if (!text) {
      const e = "Cannot play a speech with no text.";
      return Promise.reject(e);
    }

    // Update the speech with options
    text = TextToSpeechUtils.validateText(text);
    config = this._updateConfig(config, []); //ankit

    return this._updateSpeech(text, config).promise as Promise<any>;
  }

  /**
   * Adds a namespace to the host with the name of the feature to contain properties
   * and methods from the feature that users of the host need access to.
   *
   * @see TextToSpeechFeature
   */
  installApi() {
    /**
     * @inner
     * @namespace TextToSpeechFeature
     */
    const api = super.installApi();

    Object.assign(api, {
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#play
       */
      play: this.play.bind(this),
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#pause
       */
      pause: this.pause.bind(this),
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#resume
       */
      resume: this.resume.bind(this),
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#stop
       */
      stop: this.stop.bind(this),
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#getVolume
       */
      getVolume: this.getVolume.bind(this),
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#setVolume
       */
      setVolume: this.setVolume.bind(this),
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#pauseVolume
       */
      pauseVolume: this.pauseVolume.bind(this),
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @method
       * @see AbstractTextToSpeechFeature#resumeVolume
       */
      resumeVolume: this.resumeVolume.bind(this),
    });

    Object.defineProperties(api, {
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @see AbstractTextToSpeechFeature#speechmarkOffset
       */
      speechmarkOffset: {
        get: () => this.speechmarkOffset,
        set: (offset) => {
          this.speechmarkOffset = offset;
        },
      },
    });

    return api;
  }

  /**
   * Gets and sets the volume used for all audio clips played by the speaker.
   *
   * @type {number}
   */
  set volume(volume) {
    this._volume = MathUtils.clamp(volume);
  }

  get volume() {
    return this._volume;
  }

  /**
   * Gets whether or not the speaker's volume value is currently being tweened.
   *
   * @readonly
   * @type {boolean}
   */
  get volumePending() {
    return this._promises.volume && this._promises.volume.pending;
  }

  /**
   * Gets the volume used for all audio clips played by the speaker.
   *
   * @returns {number}
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Updates the volume used for all audio clips played by the speaker over time.
   *
   * @param {number} volume - Target volume value.
   * @param {number} [seconds=0] - Amount of time it will take to reach the target
   * volume.
   * @param {Function=} easingFn - Easing function used for interpolation.
   *
   * @returns {Deferred}
   */
  setVolume(
    volume: number,
    seconds: number = 0,
    easingFn?: (k: number) => number
  ): Deferred {
    if (this.volumePending) {
      this._promises.volume.cancel();
    }

    volume = MathUtils.clamp(volume);
    this._promises.volume = AnimationUtils.interpolateProperty(
      this,
      "volume",
      volume,
      {
        seconds,
        easingFn,
      }
    );

    return this._promises.volume;
  }

  /**
   * Pause interpolation happening on the speaker's volume property.
   *
   * @returns {boolean}
   */
  pauseVolume(): boolean {
    this._volumePaused = true;

    return this.volumePending;
  }

  /**
   * Resume any interpolation happening on the speaker's volume property.
   *
   * @returns {boolean}
   */
  resumeVolume(): boolean {
    this._volumePaused = false;

    return this.volumePending;
  }

  /**
   * Update the currently playing speech.
   *
   * @param {number} deltaTime - Time since the last update.
   */
  update(deltaTime: number) {
    if (!this._volumePaused) {
      this._promises.volume.execute(deltaTime);
    }

    if (this._currentSpeech && this._currentSpeech.playing) {
      (this._currentSpeech as any).volume = this._volume;
      this._currentSpeech.update(this._host?.now || 0);
      super.update(deltaTime);
    }
  }

  /**
   * Set the current speech to a new asset and update the speech's speechmark
   * offset value to match that of the feature.
   *
   * @private
   *
   * @param {AbstractSpeech} speech - Speech to set as current.
   */
  _setCurrentSpeech(speech: AbstractSpeech) {
    speech.speechmarkOffset = this._speechmarkOffset;
    this._currentSpeech = speech;
  }

  /**
   * Create a promise that will play/resume a speech with the given text after
   * the audio context attempts to resume and speech audio is retrieved from Polly.
   *
   * @private
   *
   * @param {string} text - The text of the new speech to play.
   * @param {Object=} config - Optional parameters for the speech.
   * @param {string} [playMethod = 'play'] - Method to execute on the resulting
   * Speech object. Valid options are 'play' and 'resume'.
   */
  _startSpeech(text: string, config?: any, playMethod: string = "play") {
    // If no text is provided, try to use the current speech
    if (text === undefined && playMethod === "resume" && this._currentSpeech) {
      text = this._currentSpeech.text;
    }

    const currentPromise = this._currentPromise || {
      play: new Deferred(
        undefined,
        () => currentPromise.speech.cancel(),
        () => currentPromise.speech.cancel(),
        () => currentPromise.speech.cancel()
      ),
      speech: new Deferred(),
    };
    this._currentPromise = currentPromise;
    this._getSpeech(text, config)
      .then((speech) => {
        // Exit if the promise is no longer pending because of user interaction
        if (!currentPromise.play.pending) {
          return;
        } else if (this._currentPromise !== currentPromise) {
          // Cancel if another call to play has already been made
          currentPromise.play.cancel();
          return;
        }

        // Reset current speech when the speech ends
        const onFinish = () => {
          this._currentSpeech = undefined;
          this._currentPromise = undefined;
        };

        // Cancel the currently playing speech
        if (this._currentSpeech && this._currentSpeech.playing) {
          if (playMethod === "play") {
            this._currentSpeech.cancel();
          } else if (
            playMethod === "resume" &&
            (this._currentSpeech as any).audio !== speech.audio
          ) {
            this._currentSpeech.cancel();
          }
        }

        this._setCurrentSpeech(speech);

        // Play the speech

        currentPromise.speech = speech[playMethod](
          this._host?.now,
          onFinish,
          onFinish,
          onFinish
        );
        ((currentPromise as any).speech as Deferred).promise
          .then(() => {
            if (currentPromise.speech.resolved) {
              currentPromise.play.resolve(undefined);
            } else {
              currentPromise.play.cancel();
            }
          })
          .catch((error) => {
            currentPromise.play.reject(error);
          });
      })
      .catch((e) => {
        e = `Cannot ${playMethod} speech ${text} on host ${this.host?.id}. ${e}`;
        // console.log(e);
        currentPromise.play.reject(e);
      });

    return currentPromise.play;
  }

  /**
   * Stop any speeches currently playing and play a new speech from the beginning.
   *
   * @param {string} text - The text of the new speech to play.
   * @param {Object=} config - Optional parameters for the speech.
   *
   * @returns {Deferred}
   */
  play(text: string, config?: any): Deferred {
    return this._startSpeech(text, config, "play");
  }

  /**
   * If a speech is currently playing, pause it at the current time.
   */
  pause() {
    if (this._currentSpeech && this._currentSpeech.playing) {
      this._currentSpeech.pause(this._host?.now as number);
    } else {
      console.warn(
        `Cannot pause speech on host ${this.host?.id}. No speech is currently playing`
      );
    }
  }

  /**
   * Stop any speeches currently playing and resume a new speech from the current
   * time.
   *
   * @param {string=} text - The text of the new speech to play. If undefined and
   * there is a current speech that is paused, the current speech will be resumed.
   * @param {Object=} config - Optional parameters for the speech.
   *
   * @returns {Deferred}
   */
  resume(text: string, config: any): Deferred {
    return this._startSpeech(text, config, "resume");
  }

  /**
   * If a speech is currently playing, stop playback and reset time.
   */
  stop() {
    if (this._currentSpeech && this._currentSpeech.playing) {
      this._currentSpeech.stop();
      this._currentSpeech = undefined;
    } else {
      console.warn(
        `Cannot stop speech on host ${this.host?.id}. No speech is currently playing.`
      );
    }
  }

  discard() {
    if (this._currentSpeech && this._currentSpeech.playing) {
      this._currentSpeech.stop();
    }
    this._speechCache;
    super.discard();
  }
}
