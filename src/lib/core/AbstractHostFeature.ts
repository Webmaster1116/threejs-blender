import { HostObject } from "./HostObject";
import { Messenger } from "./Messenger";

/**
 * Base class for all host features. Keeps a reference to the host object managing
 * the feature.
 *
 * @abstract
 *
 * @property {Object} EVENTS - Built-in messages that the feature emits. When the
 * feature is added to a {@link core/HostObject}, event names will be prefixed by the
 * name of the feature class + '.'.
 * @property {string} [EVENTS.update=onUpdate] - Message that is emitted after
 * each call to [update]{@link AbstractHostFeature#update}.
 * @property {Object} SERVICES - Any AWS services that are necessary for the
 * feature to function.
 */
export class AbstractHostFeature {
  static featureName = "AbstractHostFeature";
  static EVENTS: { [key: string]: string } = { update: "onUpdate" };
  static SERVICES: any = {};
  _host?: HostObject;
  /**
   * @constructor
   *
   * @param {core/HostObject} host - The HostObject managing the feature.
   */
  constructor(host: HostObject) {
    this._host = host;
  }

  /**
   * Listen to a feature message from the global messenger. Feature messages will
   * be prefixed with the class name of the feature.
   *
   * @param {string} message - Message to listen for.
   * @param {Function} callback - The callback to execute when the message is received.
   */
  static listenTo(message: string, callback: (e: any) => void) {
    message = `${this.featureName}.${message}`;
    Messenger.listenTo(message, callback);
  }

  /**
   * Stop listening to a message from the global messenger.
   *
   * @param {string} message - Message to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  static stopListening(message: string, callback: (e: any) => void) {
    message = `${this.featureName}.${message}`;
    Messenger.stopListening(message, callback);
  }

  /**
   * Stop listening to a message matching the given regular expression from the
   * global messenger.
   *
   * @param {Regexp} regexp - The regular expression to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  static stopListeningByRegexp(regexp: RegExp, callback: (e: any) => void) {
    regexp = new RegExp(
      `^${this.featureName}.${regexp.source.replace(/\^/, "")}`
    );
    Messenger.stopListeningByRegexp(regexp, callback);
  }

  /**
   * Stop listening to all feature messages.
   */
  static stopListeningToAll() {
    Messenger.stopListeningByRegexp(new RegExp(`^${this.featureName}.`));
  }

  /**
   * Emit feature messages from the global messenger. Feature messages will be prefixed
   * with the class name of the feature.
   *
   * @param {string} message - The message to emit.
   * @param {any=} value - Optional parameter to pass to listener callbacks.
   */
  static emit(message: string, value?: any) {
    message = `${this.featureName}.${message}`;
    Messenger.emit(message, value);
  }

  /**
   * Adds a namespace to the host with the name of the feature to contain properties
   * and methods from the feature that users of the host need access to.
   */
  installApi() {
    const ctor = this.constructor as any as typeof AbstractHostFeature;
    const events: any = {};
    const api = { EVENTS: events };
    // Add the class name to event names
    Object.entries(ctor.EVENTS).forEach(([name, value]) => {
      events[name] = `${ctor.featureName}.${value}`;
    });
    this._host ||= {} as any;
    (this._host as any)[ctor.featureName] = api;

    return api;
  }

  /**
   * Gets the host that manages the feature.
   *
   * @readonly
   */
  get host() {
    return this._host;
  }

  /**
   * Gets the engine owner object of the host.
   *
   * @readonly
   */
  get owner() {
    return (this._host as any).owner;
  }

  /**
   * Listen to a feature message from the host object.
   *
   * @param {string} message - Message to listen for.
   * @param {Function} callback - The callback to execute when the message is received.
   */
  listenTo(message: string, callback: (e: any) => void) {
    (this._host as any)?.listenTo(message, callback);
  }

  /**
   * Stop listening to a message from the host object.
   *
   * @param {string} message - Message to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  stopListening(message: string, callback: (e: any) => void) {
    (this._host as any).stopListening(message, callback);
  }

  /**
   * Stop listening to a message matching the given regular expression from the
   * host object.
   *
   * @param {Regexp} regexp - The regular expression to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  stopListeningByRegexp(regexp: RegExp, callback: (e: any) => void) {
    (this._host as any).stopListeningByRegexp(regexp, callback);
  }

  /**
   * Stop listening to all messages.
   */
  stopListeningToAll() {
    (this._host as any).stopListeningToAll();
  }

  /**
   * Emit feature messages from the host. Feature messages will be prefixed with
   * the class name of the feature.
   *
   * @param {string} message - The message to emit.
   * @param {any=} value - Optional parameter to pass to listener callbacks.
   */
  emit(message: string, value?: any) {
    const ctor = this.constructor as typeof AbstractHostFeature;
    message = `${ctor.featureName}.${message}`;
    (this._host as any).emit(message, value);
  }

  /**
   * Executes each time the host is updated.
   *
   * @param {number} deltaTime - Amount of time since the last host update was
   * called.
   */
  update(deltaTime: number) {
    const ctor = this.constructor as typeof AbstractHostFeature;
    this.emit(ctor.EVENTS.update, deltaTime);
  }

  /**
   * Clean up once the feature is no longer in use. Remove the feature namespace
   * from the host and remove reference to the host.
   */
  discard() {
    const ctor = this.constructor as typeof AbstractHostFeature;
    Object.keys((this._host as any)[ctor.featureName]).forEach((name) => {
      delete (this._host as any)[ctor.featureName][name];
    });

    delete (this._host as any)[ctor.featureName];
    this._host = undefined;
  }

  // /**
  //  * Applies a sequence of mixin class factory functions to this class and
  //  * returns the result. Each function is expected to return a class that
  //  * extends the class it was given. The functions are applied in the order
  //  * that parameters are given, meaning that the first factory will
  //  * extend this base class.
  //  *
  //  * @param {...Function} mixinClassFactories Class factory functions that will
  //  * be applied.
  //  *
  //  * @returns {Class} A class that is the result of applying the factory functions.
  //  * The resulting class will always inherit from AbstractHostFeature.
  //  */
  // static mix(...mixinClassFactories: any[]) {
  //   let ResultClass = this;

  //   mixinClassFactories.forEach((mixinClassFactory) => {
  //     ResultClass = mixinClassFactory(ResultClass);
  //   });

  //   return ResultClass;
  // }
}
