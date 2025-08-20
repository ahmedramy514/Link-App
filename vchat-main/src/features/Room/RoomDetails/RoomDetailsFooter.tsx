import { Button, HStack } from "@chakra-ui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid";
import { TrashIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { confirmAlert } from "../../../components/Alert/alertStore";
import { useAuth } from "../../../context/AuthContext";
import { useChatsContext } from "../../../context/ChatsContext";
import { SERVER } from "../../../lib/config";
import {
  deleteGroup,
  leaveGroup,
} from "../../../services/groupMessageServices";
import { deleteContact } from "../../../services/userDetailsService";
import { DirectChatDetails, GroupChatDetails } from "../../../types/interfaces";

export const RoomDetailsFooter = () => {
  const { recepient, setSelectedChat, selectedChat, deleteConversation } =
    useChatsContext();

  if (selectedChat === undefined) return null;
  const { currentUserDetails } = useAuth();
  const isGroup = !!(
    selectedChat?.$collectionId === SERVER.COLLECTION_ID_GROUPS
  );
  const isAdmin =
    isGroup &&
    (selectedChat as GroupChatDetails).admins.includes(currentUserDetails!.$id);

  function removeConversation() {
    let chatID = selectedChat!.$id;
    deleteConversation(chatID);
    setSelectedChat(undefined);
  }
  function handleDeleteChat() {
    let promise: Promise<void>;
    removeConversation();
    if (isGroup) {
      promise = deleteGroup(selectedChat.$id);
    } else {
      promise = deleteContact(
        (selectedChat as DirectChatDetails).$id,
        (recepient as any).$id,
      );
    }
    promise.catch(() => {
      toast.error("Something went wrong");
    });
  }
  async function handleExitGroup() {
    let chatID = selectedChat!.$id;
    removeConversation();
    let promise = leaveGroup(currentUserDetails!.$id, chatID);

    promise.catch(() => {
      toast.error("Something went wrong! ");
    });
  }
  return (
    <HStack>
      <Button
        as={motion.button}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        hidden={!isGroup}
        size={"sm"}
        variant={"outline"}
        leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
        onClick={() => {
          confirmAlert({
            message: `Are you sure you want to leave this conversation?`,
            title: `Exit Discussion `,
            confirmText: `Yes, I'm sure`,
            onConfirm: () => handleExitGroup(),
          });
        }}
      >
        Leave
      </Button>
      <Button
        as={motion.button}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        hidden={isGroup ? !isAdmin : false}
        size={"sm"}
        variant={"outline"}
        colorScheme="red"
        leftIcon={<TrashIcon className="h-4 w-4" />}
        onClick={() => {
          confirmAlert({
            message: `Are you sure you want to delete this ${
              isGroup ? "group" : "chat"
            } ? All records of this conversation will be removed from our servers `,
            title: `Delete conversation `,
            confirmText: `Yes, I'm sure`,
            onConfirm: () => {
              handleDeleteChat();
            },
            cancelText: `No, keep conversation`,
          });
        }}
      >
        Delete
      </Button>
    </HStack>
  );
};
