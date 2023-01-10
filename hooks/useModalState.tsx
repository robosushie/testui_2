import * as React from "react";

export type useModelStateHandlers = [boolean, (ocid?: string) => void, () => void, string | null];

/**
 * Hook that tracks modal state and provides parameter-less open and close handlers
 * so that we don't have to use lambdas in onClick handlers, and other callbacks to
 * set the true/false state for.
 *
 * @param initiallyOpen true if the isOpen state should start opened, false otherwise
 * @returns [isOpen: boolean, open: () => void, close: () => void, ocid: string]
 */
export const useModalState = (initiallyOpen = false): useModelStateHandlers => {
  const [isOpen, setIsOpen] = React.useState(initiallyOpen);
  const [ocid, setOcid] = React.useState(null);

  const open = React.useCallback(
    (ocid) => {
      setOcid(ocid);
      setIsOpen(true);
    },
    [setIsOpen]
  );

  const close = React.useCallback(() => {
    setIsOpen(false);
    setOcid(null);
  }, [setIsOpen]);

  return [isOpen, open, close, ocid];
};
