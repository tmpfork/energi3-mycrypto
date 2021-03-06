import * as R from 'ramda';

import { LSKeys, DataStore, DataStoreEntry, DataStoreItem, TUuid, Network } from 'v2/types';

export enum ActionT {
  ADD_ITEM = 'ADD_ITEM',
  DELETE_ITEM = 'DELETE_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  UPDATE_NETWORK = 'UPDATE_NETWORK',
  ADD_ENTRY = 'ADD_ENTRY',
  RESET = 'RESET'
}

export interface ActionPayload<T> {
  model: LSKeys;
  data: T;
}

export interface ActionV {
  type: keyof typeof ActionT;
  payload: ActionPayload<DataStoreItem | DataStoreEntry | DataStore> | ActionPayload<TUuid>;
}

// Handler to facilitate initial store state and reset.
export function init(initialState: DataStore) {
  return initialState;
}

export function appDataReducer(state: DataStore, { type, payload }: ActionV) {
  switch (type) {
    case ActionT.ADD_ITEM: {
      const { model, data } = payload;
      if (model === LSKeys.SETTINGS) {
        throw new Error('[AppReducer: use ADD_ENTRY to change SETTINGS');
      } else {
        return {
          ...state,
          [model]: [...new Set([...state[model], data])]
        };
      }
    }
    case ActionT.DELETE_ITEM: {
      const { model, data } = payload;
      if (model === LSKeys.SETTINGS || model === LSKeys.NETWORKS) {
        throw new Error(`[AppReducer: cannot call DELETE_ITEM for ${model}`);
      }

      const predicate = R.eqBy(R.prop('uuid'));

      return {
        ...state,
        [model]: R.symmetricDifferenceWith(predicate, [data], state[model])
      };
    }
    case ActionT.UPDATE_ITEM: {
      const { model, data } = payload;
      if (model === LSKeys.SETTINGS) {
        throw new Error('[AppReducer: use ADD_ENTRY to update SETTINGS');
      }
      const predicate = R.eqBy(R.prop('uuid'));
      return {
        ...state,
        // Find item in array by uuid and replace.
        [model]: R.unionWith(predicate, [data], state[model])
      };
    }
    case ActionT.UPDATE_NETWORK: {
      const { data } = payload;
      const predicate = R.eqBy(R.prop('id'));
      const networks = state.networks;
      return {
        ...state,
        // Find network in array by id and replace.
        [LSKeys.NETWORKS]: R.unionWith(predicate, [data as Network], networks)
      };
    }

    case ActionT.ADD_ENTRY: {
      const { model, data } = payload;
      return {
        ...state,
        [model]: data
      };
    }
    case ActionT.RESET: {
      const { data } = payload;
      return init(data as DataStore);
    }
    default: {
      throw new Error('[AppReducer]: missing action type');
    }
  }
}
