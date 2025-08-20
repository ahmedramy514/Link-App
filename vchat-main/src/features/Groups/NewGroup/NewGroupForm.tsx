import { useState } from "react";

import { useChatsContext } from "@/context/ChatsContext";
import { SERVER } from "@/lib/config";
import { sendSystemMessage } from "@/services/systemMessageService";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { createGroup } from "../../../services/groupMessageServices";
import { IUserDetails } from "../../../types/interfaces";
import FormStepper from "./FormStepper";
import AddMembersForm from "./NewGroupAddMembersForm";
import GroupDetailsForm from "./NewGroupDetailsForm";

const NewGroupForm = ({ onClose }: { onClose: () => void }) => {
  const { currentUserDetails } = useAuth();
  if (!currentUserDetails) return null;
  const { addConversation } = useChatsContext();

  const [groupDetails, setGroupDetails] = useState<{
    name: string;
    description: string;
    members: IUserDetails[];
    avatar: File | null;
  }>({
    name: "",
    description: "",
    members: [currentUserDetails] as IUserDetails[],
    avatar: null,
  });
  const handleSubmit = () => {
    let promise = createGroup({
      name: groupDetails.name,
      description: groupDetails.description,
      members: groupDetails.members.map((member) => member.$id),
      admins: [currentUserDetails.$id],
      avatar: groupDetails.avatar,
    });
    toast.promise(promise, {
      loading: "Creating group",
      success: "Group created",
      error: "Couldn't create group",
    });
    promise.then((doc) => {
      addConversation(doc);
      sendSystemMessage(
        SERVER.DATABASE_ID,
        SERVER.COLLECTION_ID_GROUP_MESSAGES,
        {
          body: `${currentUserDetails.name} created the group`,
          groupDoc: doc.$id,
        },
      );
    });
    promise.finally(() => onClose());
  };

  const handleChange = (e: any) => {
    setGroupDetails((d) => {
      return { ...d, [e.target.name]: e.target.value };
    });
  };
  const handleAvatar = (avatar: File | null) => {
    setGroupDetails((prev) => {
      return { ...prev, avatar: avatar };
    });
  };

  return (
    <FormStepper handleSubmit={handleSubmit}>
      <GroupDetailsForm
        description={groupDetails.description}
        name={groupDetails.name}
        onChange={handleChange}
        handleAvatar={handleAvatar}
      />
      <AddMembersForm
        members={groupDetails.members}
        setGroupDetails={setGroupDetails}
        handleSubmit={handleSubmit}
      />
    </FormStepper>
  );
};

export default NewGroupForm;
