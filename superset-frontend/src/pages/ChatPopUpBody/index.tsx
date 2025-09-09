import React from "react";
import ReactMarkdown from "react-markdown";
import { MessageOutlined } from "@ant-design/icons";

type Msg = { role: "user" | "assistant"; text: string };

interface PopupBodyProps {
    // showGreeting: boolean;
    messages: Msg[];
    messageLoader: boolean;
    recentChats: any[];
    totalRecentCount: number;
    userName: string | null;
    // today: string;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    onOpenRecentChat: (conversationId: string) => void;
    showMoreData: () => void;
}
const ChatPopupBody: React.FC<PopupBodyProps> = ({
    // showGreeting,
    messages,
    messageLoader,
    recentChats,
    totalRecentCount,
    userName,
    // today,
    messagesEndRef,
    onOpenRecentChat,
    showMoreData
}) => {
    return (
        <div className="popupBody">
            {/* 1. Greeting screen */}
            {/* {showGreeting && messages.length == 0 && (
                <div className="greeting">
                    <div className="greetings-body">
                        <div className="greetings-body-center">
                            <h4 className="header">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return "Good Morning";
                                    if (hour < 18) return "Good Afternoon";
                                    return "Good Evening";
                                })()}, {userName || "there"}
                            </h4>
                            <p className="date-text">{today}</p>
                        </div>
                    </div>
                    <p className="main-request">How can I help you?</p>
                </div>
            )} */}

            {/* 2. Chat messages */}
            {messages.length > 0 && (
                <div className="chat-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`msg ${m.role}`}>
                            <div className="msg-img">
                                {m.role === "assistant" && (
                                    <img
                                        className="wilfred-image"
                                        src="/static/assets/images/wilfred.png"
                                        alt="Chat"
                                    />
                                )}
                            </div>
                            <div className="msg-bubble">
                                <ReactMarkdown>{m.text}</ReactMarkdown>
                                {messageLoader &&
                                    m.role === "assistant" &&
                                    i === messages.length - 1 && (
                                        <img alt="" src="/static/assets/images/loader2.gif" />
                                    )}
                            </div>
                            <div ref={messagesEndRef}></div>
                        </div>
                    ))}
                </div>
            )}

            {/* 3. Recent chats */}
            {messages.length == 0 && (
                <div className="recent-details-body">
                    <div className="recent-user-details">
                        <div className="recent-user-img">
                            <img
                                className="wilfred-image"
                                src="/static/assets/images/wilfred.png"
                                alt="Chat"
                            />
                        </div>
                        <div className="recent-user-name">
                            <h4 className="header">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return "Good Morning";
                                    if (hour < 18) return "Good Afternoon";
                                    return "Good Evening";
                                })()}, {userName || "there"}
                            </h4>
                            <p>How can I help you?</p>
                        </div>
                    </div>

                    <div className="recent-chat">
                        <h5>Recent chats</h5>
                        <div className="recent-chat-body">
                            <div className="recent-chat-history">
                                <ul>
                                    {totalRecentCount == 0 ?
                                        <div className="no-recent-chat">
                                            <span className="recent-text">
                                                No recent thread available
                                            </span>
                                        </div>
                                        :
                                        (
                                            <>
                                                {recentChats.map((chat) => (
                                                    <li
                                                        key={chat.conversation_id}
                                                        onClick={() => onOpenRecentChat(chat.conversation_id)}
                                                        className="recent-main-text">

                                                        <a className="recent-text-details">
                                                            <span className="msg-icon">
                                                                <MessageOutlined />
                                                            </span>
                                                            <span className="text-ellipsis">
                                                                {chat.summarized_name || "Untitled Chat"}
                                                            </span>
                                                        </a>
                                                    </li>
                                                ))}
                                                {recentChats.length < totalRecentCount && (
                                                    <li>
                                                        <div className="recent-showmore">
                                                            <button onClick={showMoreData} className="recent-showmore-btn">
                                                                Show More
                                                            </button>
                                                        </div>
                                                    </li>
                                                )}
                                            </>
                                        )
                                    }
                                </ul>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPopupBody;
