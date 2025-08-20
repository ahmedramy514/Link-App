import React from "react";
import { useAuth } from "../contexts/AuthContext";
import ChatList from "../components/ChatList";
import MessageInput from "../components/MessageInput";

const Chats: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return <div>Loading chats...</div>;

  return (
    <div className="flex h-screen">
      <ChatList currentUser={currentUser} />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {/* رسائل الدردشة هنا */}
        </div>
        <MessageInput currentUser={currentUser} />
      </div>
    </div>
  );
};

export default Chats;
