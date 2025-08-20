import { useEffect, useState } from "react";
import { ObservableStore } from "../../lib/observableStore";

export type Alert = {
  isShown: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  cancelText?: string;
};

let initialState = {
  isShown: false,
  title: "",
  message: "",
  confirmText: "Yes, I'm sure",
  onConfirm: () => {},
  onCancel: () => {},
  cancelText: "",
};

let alertStore = new ObservableStore(initialState);

export const useAlert: () => Alert = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    return alertStore.subscribe(setState);
  }, []);
  return state;
};

export const clearAlert = () => {
  alertStore.set(initialState);
};

export const confirmAlert = (options: Omit<Alert, "isShown">) => {
  let newAlert = { ...options, isShown: true };
  alertStore.set(newAlert);
};
