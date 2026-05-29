import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';

import type { AppActionButtonState } from './MediaCallAppActionsContext';

/**
 * Holds a stable mutable Map of button states keyed by `${appId}-${actionId}`.
 *
 * The ref is owned by MediaCallWidget (which stays mounted for the entire duration
 * of the widget's presence in the DOM) and is provided here so that AppActionButton
 * instances can survive the view-swaps driven by the call-state machine
 * (NewCall → OutgoingCall → OngoingCall, etc.) without losing the state that
 * resulted from a previous user interaction.
 *
 * Using a ref instead of useState means writing to the map never triggers
 * re-renders in unrelated consumers.
 */
const AppActionButtonStatesContext = createContext<MutableRefObject<Map<string, AppActionButtonState>> | null>(null);

export const useAppActionButtonStates = () => useContext(AppActionButtonStatesContext);

export default AppActionButtonStatesContext;
