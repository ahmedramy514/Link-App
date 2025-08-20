import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalProps,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { ObservableStore } from "../lib/observableStore";

let modalStore = new ObservableStore<any>({ modalContent: null });

const VModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [state, setState] = useState({ modalContent: null, props: {} });

  useEffect(() => {
    if (state.modalContent) {
      onOpen();
    }
  }, [state]);

  useEffect(() => {
    return modalStore.subscribe(setState);
  }, []);
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        modalStore.set({ modalContent: null, props: {} });
      }}
      size={"xs"}
      {...state.props}
    >
      <ModalOverlay />
      <ModalContent className="border">{state.modalContent}</ModalContent>
    </Modal>
  );
};

export function modal(
  modalContent: React.JSX.Element,
  props?: Partial<ModalProps>,
) {
  modalStore.set({ modalContent: modalContent, props: props });
}

export default VModal;
