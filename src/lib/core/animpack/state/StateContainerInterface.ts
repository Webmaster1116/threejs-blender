import { Constructor } from "../../types/common.types";
import { Utils } from "../../Utils";
import { AbstractState } from "./AbstractState";

/**
 * Class factory interface for manipulating a collection of {@link AbstractState}.
 *
 * @interface
 */
export interface StateContainerInterface {
  /**
   * Return the state with the given name.
   *
   * @param {string} name - Name of the state.
   *
   * @returns {AbstractState}
   */
  getState(name: string): AbstractState;

  /**
   * Gets an array of the names of all states in the container.
   *
   * @type {Array.<string>}
   */
  getStateNames(): string[];

  /**
   * Add a new state to be controlled by the container. States are stored keyed
   * by their name property, which must be unique. If it isn't, a number will
   * be added or incremented until a unique key is generated.
   *
   * @param {AbstractState} state - State to add to the container.
   *
   * @returns {string} - Unique name of the state.
   */
  addState(state: AbstractState): string;

  /**
   * Removes a state with the given name from the container.
   *
   * @param {string} name - Name of the state to remove.
   *
   * @returns {boolean} - Whether or not a state was removed.
   */
  removeState(name: string): boolean;

  /**
   * Renames a state with the given name in the container. Name must be unique
   * to the container, if it isn't the name will be incremented until it is unique.
   *
   * @param {string} currentName - Name of the state to rename.
   * @param {string} newName - Name to update the state with.
   *
   * @returns {string} - Updated name for the state.
   */
  renameState(currentName: string, newName: string): string;

  /**
   * Discards all states.
   */
  discardStates(): void;
}

/**
 * Creates a class that implements {@link StateContainerInterface} and extends
 * a specified base class.
 */
export const StateContainerInterfaceMixin = <TBase extends Constructor>(
  BaseClass: TBase
) => {
  /**
   * This mixin adds functionality for manipulating uniquely-named animation states in
   * a map.
   */
  class StateContainerMixin
    extends BaseClass
    implements StateContainerInterface
  {
    declare _states: Map<string, AbstractState>;
    declare name: string;

    constructor(...args: any[]) {
      super(...args);

      this._states = this._states !== undefined ? this._states : new Map();
    }

    getState(name: string) {
      return this._states.get(name) as AbstractState;
    }

    getStateNames(): string[] {
      return [...this._states.keys()];
    }

    addState(state: AbstractState) {
      // Make sure the state is not already in this container
      if ([...this._states.values()].includes(state)) {
        console.warn(
          `Cannot add animation to state ${this.name}. Animation was already added.`
        );
        return state.name;
      }

      // Make sure the state name is unique
      const uniqueName = Utils.getUniqueName(state.name, [
        ...this._states.keys(),
      ]);

      if (state.name !== uniqueName) {
        console.warn(
          `Animation name ${state.name} is not unique for state ${this.name}. New animation will be added with name ${uniqueName}.`
        );
        state.name = uniqueName;
      }

      this._states.set(state.name, state);

      return state.name;
    }

    removeState(name: string) {
      // Check if the state is in this container
      if (!this._states || !this._states.has(name)) {
        console.warn(
          `Did not remove animation ${name} from state ${this.name}. No animation exists with this name.`
        );
        return false;
      }

      this._states.get(name)?.discard();
      this._states.delete(name);
      return true;
    }

    renameState(currentName: string, newName: string) {
      // Make sure the state is in this container
      if (!this._states || !this._states.has(currentName)) {
        throw new Error(
          `Cannot rename animation ${currentName} in ${this.name}. No animation exists with this name.`
        );
      }

      const state = this._states.get(currentName) as AbstractState;

      // Exit if the names are the same
      if (currentName === newName) {
        return currentName;
      }

      // Make sure the name is unique
      const uniqueName = Utils.getUniqueName(
        newName,
        [...this._states.keys()].filter((s) => s !== currentName)
        // [...this._states.keys()].filter((s) => s.name !== currentName)
      );

      if (newName !== uniqueName) {
        console.warn(
          `Animation name ${newName} is not unique in state ${this.name}. Animation will be renamed to ${uniqueName}.`
        );
        newName = uniqueName;
      }

      state.name = newName;
      this._states.delete(currentName);
      this._states.set(state.name, state);

      return state.name;
    }

    discardStates() {
      this._states.forEach((state) => {
        state.discard();
      });

      this._states = new Map();
    }
  }
  return StateContainerMixin;
};
