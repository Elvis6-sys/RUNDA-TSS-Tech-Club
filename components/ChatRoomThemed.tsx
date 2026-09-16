"use client";

import ChatRoom from "./ChatRoom";

type Props = {
  room: { id: string; name: string };
  allRooms?: any[];
  initialMessages: any[];
  currentUser: { id: string; name: string | null; role: string };
};

export default function ChatRoomThemed(props: Props) {
  return (
    <div className="relative h-full">
      {/* WhatsApp-style solid background - NO images, NO theme switcher */}
      <style jsx global>{`
        /* Solid WhatsApp dark background - clean and simple */
        .chat-messages-area {
          background-color: #0B141A !important;
          background-image: none !important;
        }
        
        /* Main container background */
        .chat-container {
          background-color: #0B141A !important;
        }
      `}</style>

      <ChatRoom {...props} />
    </div>
  );
}
