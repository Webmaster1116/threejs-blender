/**
 * The built-in class for asynchronous Promises.
 * @external Promise
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

/**
 * A Promise object that can be resolved, rejected or canceled at any time by the
 * user.
 *
 * @extends external:Promise
 */
export class Deferred {
  _status: {
    resolved: boolean;
    rejected: boolean;
    canceled: boolean;
    pending: boolean;
  };
  promise: Promise<any>;
  _resolve!: (x: any) => any;
  _reject!: (x: any) => any;
  _cancel!: (x: any) => any;
  _executable: (x?: any, y?: any, z?: any, ...args: any[]) => any;
  // then(arg0: (result: any) => Promise<unknown>): Promise<any> {
  //   throw new Error('Method not implemented.');
  // }
  /**
   * @constructor
   *
   * @param {Function} [executable=() => {}] - The function to be executed by the
   * constructor, during the process of constructing the promise. The signature
   * of this is expected to be: executable(  resolutionFunc, rejectionFunc, cancellationFunc ).
   * @param {Function=} onResolve - Optional function to execute once the promise
   * is resolved.
   * @param {Function=} onReject - Optional function to execute once the promise
   * is rejected.
   * @param {Function=} onCancel - Optional function to execute if the user cancels
   * the promise. Canceling results in the promise having a status of 'resolved'.
   */
  constructor(
    executable: (
      x?: (p: any) => any,
      y?: (p: any) => any,
      z?: (p: any) => any
    ) => any = (x?: any) => void {},
    onResolve?: (x: any) => any,
    onReject?: (x: any) => any,
    onCancel?: (x: any) => any
  ) {
    if (typeof executable !== "function") {
      throw new Error(
        `Cannot create new Deferred. Executable must be a function.`
      );
    }

    if (typeof onResolve !== "undefined" && typeof onResolve !== "function") {
      throw new Error(
        `Cannot create new Deferred. OnResolve must be a function.`
      );
    }

    if (typeof onReject !== "undefined" && typeof onReject !== "function") {
      throw new Error(
        `Cannot create new Deferred. OnReject must be a function.`
      );
    }

    if (typeof onCancel !== "undefined" && typeof onCancel !== "function") {
      throw new Error(
        `Cannot create new Deferred. OnCancel must be a function.`
      );
    }

    const status = {
      resolved: false,
      rejected: false,
      canceled: false,
      pending: true,
    };

    const promise = new Promise(
      (resolve: (x: any) => any, reject: (x: any) => any) => {
        // Store the resolver
        this._resolve = (value: any) => {
          if (status.pending) {
            status.resolved = true;
            status.pending = false;

            if (typeof onResolve === "function") {
              value = onResolve(value);
            }

            return resolve(value);
          }
        };

        // Store the rejecter
        this._reject = (value: any) => {
          if (status.pending) {
            status.rejected = true;
            status.pending = false;

            if (typeof onReject === "function") {
              value = onReject(value);
            }

            return reject(value);
          }
        };

        // Store the canceler
        this._cancel = (value: any) => {
          if (status.pending) {
            status.canceled = true;
            status.pending = false;

            if (typeof onCancel === "function") {
              value = onCancel(value);
            }

            return resolve(value);
          }
        };

        // Run the executable with custom resolver and rejecter
        executable(this._resolve, this._reject, this._cancel);
      }
    );
    this.promise = promise;
    this._status = status;
    this._executable = executable;
  }

  /**
   * Return a canceled deferred promise.
   *
   * @param {any=} value - Value to cancel the promise with.
   *
   * @returns {Deferred}
   */
  static cancel(value?: any): Deferred {
    return new Deferred((_resolve, _reject, cancel) => cancel?.(value));
  }

  /**
   * Return a new Deferred promise that will resolve or reject once all promises
   * in the input array have been resolved or one promise is canceled or rejected.
   * Promises in the array that are Deferred promises will be manually resolved,
   * rejected or canceled when calling resolve, reject or cancel on the return promise.
   *
   * @param {Array.<any>} iterable - An iterable such as an array.
   * @param {Function=} onResolve - Optional function to execute once the promise
   * is resolved.
   * @param {Function=} onReject - Optional function to execute once the promise
   * is rejected.
   * @param {Function=} onCancel - Optional function to execute if the user cancels
   * the promise. Canceling results in the promise having a status of 'canceled'.
   *
   * @returns Deferred
   */

  static resolve(x?: any) {
    return new Deferred((res) => res?.(x));
  }

  static reject(x?: any) {
    return new Deferred((_res, rej) => rej?.(x));
  }

  static all(
    iterable: Array<any>,
    onResolve?: (x?: any) => any,
    onReject?: (x?: any) => any,
    onCancel?: (x?: any) => any
  ) {
    if (iterable == null || typeof iterable[Symbol.iterator] !== "function") {
      let e = `Cannot execute Deferred.all. First argument must be iterable.`;

      if (typeof onReject === "function") {
        e = onReject(e);
      }

      return Deferred.reject(e);
    }

    const array = [...iterable];
    const deferred = array.filter((item) => item instanceof Deferred);

    const result = new Deferred(
      undefined,
      (resolveValue) => {
        deferred.forEach((item) => {
          item.resolve(resolveValue);
        });
        deferred.length = 0;

        if (typeof onResolve === "function") {
          return onResolve(resolveValue);
        } else {
          return resolveValue;
        }
      },
      (error) => {
        deferred.forEach((item) => {
          item.reject(error);
        });
        deferred.length = 0;

        if (typeof onReject === "function") {
          return onReject(error);
        } else {
          return error;
        }
      },
      (cancelValue) => {
        deferred.forEach((item) => {
          item.cancel(cancelValue);
        });
        deferred.length = 0;

        if (typeof onCancel === "function") {
          return onCancel(cancelValue);
        } else {
          return cancelValue;
        }
      }
    );

    const numItems = array.length;
    const itemTracker = {
      failed: false,
      numResolved: 0,
      resolutions: [] as number[],
    };

    array.forEach((item, index) => {
      if (itemTracker.failed) {
        return;
      } else if (item instanceof Deferred || item instanceof Promise) {
        const aItem: any = item instanceof Deferred ? item.promise : item;
        // if (item instanceof Promise) {
        //   console.log('itemPromise', item);
        // }

        aItem.then(
          (value: any) => {
            if (!itemTracker.failed && !aItem.canceled) {
              itemTracker.resolutions[index] = value;
              itemTracker.numResolved += 1;

              if (itemTracker.numResolved === numItems) {
                result.resolve(itemTracker.resolutions);
              }
            } else if (!itemTracker.failed) {
              itemTracker.failed = true;
              result.cancel(value);
            }
          },
          (error: any) => {
            if (!itemTracker.failed) {
              itemTracker.failed = true;
              result.reject(error);
            }
          }
        );
      } else if (!(item instanceof Promise)) {
        itemTracker.resolutions[index] = item;
        itemTracker.numResolved += 1;

        if (itemTracker.numResolved === numItems) {
          result.resolve(itemTracker.resolutions);
        }
        return;
      }
    });

    return result;
  }

  /**
   * Gets the resolved state of the promise.
   *
   * @readonly
   */
  get resolved() {
    return this._status.resolved;
  }

  /**
   * Gets the rejected state of the promise.
   *
   * @readonly
   */
  get rejected() {
    return this._status.rejected;
  }

  /**
   * Gets the canceled state of the promise.
   *
   * @readonly
   */
  get canceled() {
    return this._status.canceled;
  }

  /**
   * Gets the pending state of the promise.
   *
   * @readonly
   */
  get pending() {
    return this._status.pending;
  }

  /**
   * Force the promise to resolve.
   *
   * @param {any=} value - Value to pass to the resolver.
   *
   * @returns {any} - The return value of the resolver function.
   */
  resolve(value: any | undefined): any {
    return this._resolve(value);
  }

  /**
   * Force the promise to reject.
   *
   * @param {any=} value - Value to pass to the rejecter.
   *
   * @returns {any} - The return value of the rejecter function.
   */
  reject(value: any | undefined): any {
    return this._reject(value);
  }

  /**
   * Force the promise to resolve and set the canceled state to true.
   *
   * @param {any=} value - Value to pass to the canceller.
   *
   * @returns {any} - The return value of the canceller function.
   */
  cancel(value?: any): any {
    return this._cancel(value);
  }

  /**
   * Run the promise function to try to resolve the promise. Promise must be
   * pending.
   *
   * @param {...any} args - Optional arguments to pass after resolve and reject.
   */
  execute(...args: any[]) {
    if (this.pending) {
      this._executable(this._resolve, this._reject, this._cancel, ...args);
    }
  }
}
