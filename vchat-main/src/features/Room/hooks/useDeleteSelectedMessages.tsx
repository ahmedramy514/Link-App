import { useMessagesContext } from "@/context/MessagesContext";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useChatsContext } from "../../../context/ChatsContext";
import { useRoomContext } from "../../../context/Room/RoomContext";
import useSWROptimistic from "../../../lib/hooks/useSWROptimistic";
import { deleteSelectedDirectChatMessages } from "../../../services/chatMessageServices";
import { deleteSelectedGroupMessages } from "../../../services/groupMessageServices";
import {
  ChatMessage,
  DirectMessageDetails,
  GroupMessageDetails,
} from "../../../types/interfaces";

export default function useDeleteSelectedMessages() {
  const { currentUserDetails } = useAuth();
  const { selectedChat } = useChatsContext();
  const { isGroup, roomMessagesKey, roomState, dispatch } = useRoomContext();
  const { update: updateRoomMessages } = useSWROptimistic(roomMessagesKey);
  const { messages } = useMessagesContext();

  if (!selectedChat || !currentUserDetails)
    throw new Error("No user details found");

  const isAdmin =
    isGroup && selectedChat.admins.includes(currentUserDetails.$id);

  function canDeleteBasedOnPermissions(messages: ChatMessage[]) {
    if (isGroup) {
      if (isAdmin) {
        return true;
      }
    }
    return messages.every((msg) => msg.senderID === currentUserDetails?.$id);
  }

  async function deleteSelectedMessages() {
    if (!currentUserDetails || !selectedChat || !roomMessagesKey) return;
    const selectedMessageIds = roomState.selectedMessages.map((msg) => msg.$id);
    if (canDeleteBasedOnPermissions(roomState.selectedMessages)) {
      //optimistic update
      updateRoomMessages(
        messages.filter((msg) => !selectedMessageIds.includes(msg.$id)),
      );

      //actual update
      let promise: Promise<void>;
      if (isGroup) {
        promise = deleteSelectedGroupMessages({
          deleter: currentUserDetails.$id,
          groupID: selectedChat.$id,
          messages: roomState.selectedMessages as GroupMessageDetails[],
        });
      } else {
        promise = deleteSelectedDirectChatMessages({
          deleter: currentUserDetails.$id,
          groupID: selectedChat.$id,
          messages: roomState.selectedMessages as DirectMessageDetails[],
        });
      }

      promise
        .then(() => {
          toast.success("Messages deleted");
        })
        .catch((e) => {
          toast.error("Something went wrong");
          updateRoomMessages(messages);
        });
    }
  }

  return {
    deleteSelectedMessages,
    canDeleteBasedOnPermissions,
  };
}
