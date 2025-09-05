import React, { useState, useRef, useEffect } from "react";
import { styled } from "@superset-ui/core";
import ReactMarkdown from "react-markdown";
import { ClearOutlined, CloseOutlined } from "@ant-design/icons";
import { Tooltip } from 'src/components/Tooltip';

type Msg = { role: "user" | "assistant"; text: string };

const PopupContainer = styled.div`
  .popUp {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 43rem;
    height: 100vh;
    background: #fff;
    box-shadow: -2px 0 8px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    animation: slideIn 200ms ease-out;
    z-index: 4000;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .popupHeader {
    padding: 1rem;
    color: black;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom:1px solid #ddd;

    .main-header {
        display: flex;
        align-items: center;

        .title_img {
            width: 2.5rem;
            height: 2.5rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background-color: #fff;
            margin-right: 0.75rem;
            position: relative;

            .sparkler-image-header {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                padding: 0.125rem;
            }
        }

        .modal_title {
            font-size: 1rem;
            color: #101828;
            font-weight: 500;
            margin:0px;
            line-height: 1.5;
        }

        .modal_sub_title {
            font-size: .875rem;
            font-weight: 400;
            margin: 0px;
            line-height: normal;
            color: #344054;
        }
    }

    .close-modal-btn {
        border: 1px solid transparent;
        background-color: #fff;
        font-size: 1.25rem;
    }
  }
  

//   .msg {
//     display: inline-block;
//     max-width: 50%;
//     padding: 0.75rem;
//     border-radius: 1rem;
//     margin-bottom: 0.5rem;
//     word-break: break-word;
//     white-space: pre-wrap;
// }

// .msg.user {
//     background: #299BB5;
//     color: #fff;
//     border-bottom-right-radius: 0;
//     align-self: flex-end;   
// }

// .msg.assistant {
//     border-top-left-radius: 0;
//     background-color: #eaf2f3;
//     color: #344054;
//     align-self: flex-start; 
// }

.msg {
    display: flex;
    margin-bottom: 2.75rem;
    width: 100%;
    position: relative;

    &.user {
        flex-direction: row-reverse;

        .msg-bubble {
            background: #299bb5;
            color: #fff;
            border-bottom-right-radius: 0;
        }
    }

    &.assistant {
        .msg-bubble {
            border-top-left-radius: 0;
            background-color: #eaf2f3;
            color: #344054;
        }

        .msg-img {
            width: 2rem;
            height: 2rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background-color: #fff;
            margin-right: .5rem;

            img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                padding: .125rem;
            }
        }
    }

    .msg-bubble {
        max-width: calc(100% - 3rem);
        padding: .875rem;
        border-radius: 1rem;
        background: #ececec;
        font-size: 1rem;
        word-wrap: break-word;

        p,h1,h2,h3,h4,h5,h6 {
            margin: 0px !important;
        }
    }
}

.popupBody {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;

   .greeting {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        height: 100%;

        .greetings-body {
            height:100%;
                display: flex;
                align-items: center;
                justify-content: center;

            .greetings-body-center {

                .header {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #004352;
                    margin-bottom: .75rem;
                }

                .date-text {
                    color: #004352;
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: .2rem;
                    margin-bottom: .25rem;
                }
            }
        }

        .main-request {
            text-align: center;
            font-size: 1.5rem;
            font-weight: 600;
        }
    }


    .greeting p {
        margin: 0.5rem 0;
    }
}

  .popupFooter {
    padding:1rem;

    .footer-main {
        font-size: .875rem !important;
        border-radius: 1rem;
        box-shadow: rgba(60, 64, 67, .3) 0 1px 2px 0, rgba(60, 64, 67, .15) 0 1px 3px 1px;
    }

    .footer-main:focus, .footer-main:focus-visible , .footer-main:focus-within {
        outline:#116173 auto 1px!important;
    }
  }
  .input-wilfred {
    flex: 1;
    resize: none;
    border-radius: 8px;
    padding: 1rem;
    max-height: 10rem !important;
    min-height: 5rem !important;
    background: 0 0;
    border: 0 solid transparent !important;
    box-shadow: none !important;
    padding-top: .75rem;
    overflow-y: auto !important;
    font-size: .875rem !important;
    padding-bottom: 0;
    width:100%;
  }

  .input-wilfred:focus-visible {
    outline: 0px !important;
  }
  .btn_speek_msg_wilfred {
    color: #fff !important;
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #4192AA;
    border-radius: 1rem;
    border: 1px solid transparent;
    cursor: pointer;

    &:hover {
        background-color: #166d87 !important;
    }
  }

   .askBtn{
      display:flex;
      justify-content:end;
      padding:0.5rem;

      .sparkler-image {
      width:1.5rem;
      margin-right:0.5rem;
      }
    }
`;

const ChatPopup = ({ onClose }: { onClose: () => void }) => {
    const [chatText, setChatText] = useState("");
    const [messages, setMessages] = useState<Msg[]>([]);
    const [showGreeting, setShowGreeting] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [messageLoader,setMessageLoader]=useState(false);
    const [bearerToken,setBearerToken]=useState(null);
    const [contextId, setContextId] = useState<string | null>(null);
    const [isContinueConversation, setIsContinueConversation] = useState(false);
    const [disableChat,setDisableChat]=useState(false);

    const newThread = () => {
        setChatText('');
        setMessages([]);
        setMessageLoader(false);
        setShowGreeting(true);

        setIsContinueConversation(false);
        setContextId(crypto.randomUUID()); 

        localStorage.setItem("continue_chat_key", "false");
    };


    const clearChat=()=>{
        setChatText('');
        setMessageLoader(false);
        setShowGreeting(true);
        setMessages([]); 
    }
    function parseEventData(data: string): { text: string; done: boolean } {
        let parsedData = "";
        let nextlinefound = 0;
        let done = false;

        data.split("\n").forEach((line) => {
            const [key, value] = line.split(": ");
            console.log(key,'--------',value)
            if (value !== undefined) {
                if (value === "[DONE]") {
                    done = true;
                } else {
                    nextlinefound = 0;
                    parsedData += value;
                }
            } else {
                if (nextlinefound > 0) {
                    parsedData += "\n";
                }
                nextlinefound++;
            }
        });

        return { text: parsedData, done };
    }


    useEffect(() => {
        if (messagesEndRef.current) {
            console.log('----------'+messagesEndRef );
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        console.log(messagesEndRef);

        const userEncoded = localStorage.getItem("UserDTO");
        if (userEncoded) {
            try {
                const decoded = JSON.parse(atob(userEncoded)); 
                setUserName(decoded.Name || decoded.UserName || decoded.email_ID || "there");
            } catch (err) {
                console.error("Failed to decode user:", err);
            }
        }
    }, [messages]);

    useEffect(() => {
        getLastChatData();
     
    }, []);


    // const startNewChat = () => {
    //     setMessages([]);
    //     setShowGreeting(true);
    //     setContextId(crypto.randomUUID());
    //     getRecentChatData(); 
    // };

    const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
    const CONTINUE_CHAT_KEY = "continue_chat";

    const getLastChatData = async () => {
        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");
        if (!userEncoded || !projectEncoded) return;

        const user = JSON.parse(atob(userEncoded));
        const project = JSON.parse(atob(projectEncoded));

        try {
            const url = "/api/WilfredConversation/LastConversationByUserId";
            const payload = {
                userId: user.U_ID,
                projectId: project.P_ID,
            };

            const resp = await fetch(url, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) throw new Error(`Error ${resp.status}`);
            const result = await resp.json();
      
            if (result.conversation_id === EMPTY_GUID) {
                setMessages([]);
                setShowGreeting(true);
                setContextId(crypto.randomUUID());
                getRecentChatData();
                localStorage.setItem(CONTINUE_CHAT_KEY, "false");
            } else {
                const isContinueChat = localStorage.getItem(CONTINUE_CHAT_KEY);
                if (isContinueChat == "true") {
                    console.log(" Resuming chat", result.conversation_id);
                    getSessionChatData(result.conversation_id);
                    localStorage.setItem(CONTINUE_CHAT_KEY, "true");
                } else {
                    console.log(" Forcing new chat");
                    setMessages([]);
                    setShowGreeting(true);
                    setContextId(crypto.randomUUID());
                    localStorage.setItem(CONTINUE_CHAT_KEY, "false");
                    getRecentChatData();
                }

            }
        } catch (err) {
            console.error("getLastChatData failed:", err);
        }
    };

    // const curdRecentChat = async (item: any, actionType: "delete") => {
    //     const userEncoded = localStorage.getItem("UserDTO");
    //     const projectEncoded = localStorage.getItem("ProjectDTO");
    //     if (!userEncoded || !projectEncoded) return;

    //     const user = JSON.parse(atob(userEncoded));
    //     const project = JSON.parse(atob(projectEncoded));

    //     try {
    //         const url = "/api/WilfredConversation/RenameDeleteOrPinConversationInWilfred";
    //         const payload = {
    //             conversation_id: item.conversation_id,
    //             action: actionType,
    //             value: "", 
    //             username: user.email_ID,
    //             projectId: project.P_ID,
    //         };

    //         const resp = await fetch(url, {
    //             method: "POST",
    //             headers: {
    //                 accept: "application/json",
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(payload),
    //         });

    //         if (!resp.ok) {
    //             throw new Error(`Error: ${resp.status} ${resp.statusText}`);
    //         }

    //         const result = await resp.json();

    //         if (result.status === "fail") {
    //             console.error("Delete failed:", result.message);
    //         } else {
    //             console.log("Delete success:", result.message);
    //             setRecentChats([]);
    //             // setMsgOffset(0);
    //             await getRecentChatData();
                
    //         }
    //     } catch (err) {
    //         console.error("curdRecentChat failed:", err);
    //     }
    // };



    const handleSend = async () => {
        if (!chatText.trim()) return;
        setMessages(prev => [...prev, { role: "user", text: chatText }]);
        const user_msg_timestamp = new Date();
        setChatText("");
        setShowGreeting(false);
        setMessageLoader(true);
        setDisableChat(true);

        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");

        let user = null;
        let project = null;

        if (userEncoded) {
            try { user = JSON.parse(atob(userEncoded)); } catch (e) { console.warn("Invalid UserDTO encoding", e); }
        }
        if (projectEncoded) {
            try { project = JSON.parse(atob(projectEncoded)); } catch (e) { console.warn("Invalid ProjectDTO encoding", e); }
        }

        if (!bearerToken ) {
           await getBearerToken(user.email_ID, user.ApiKey); 
        }
        const newContextId = crypto.randomUUID();

        try {
            let payload = {
                contextId: newContextId,
                userEmail: user.email_ID,
                projectName: project.Name,
                projectId: project.P_ID,
                domainName: window.location.origin,
                text: chatText,
                agentType: "BI_AGENT",
                temporaryFilePath: "",
                extra_metadata: {
                },
            };

            setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

            const response = await fetch("/wilfred_v4/chat", {
                method: "POST",
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${bearerToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantReply = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const { text, done: isDone } = parseEventData(chunk);

                if (text) {
                    assistantReply += text;

                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            role: "assistant",
                            text: assistantReply,
                        };
                        return updated;
                    });
                }

                if (isDone) {
                    setMessageLoader(false);
                    setDisableChat(false);
                    const wilfred_response_timestamp = new Date();
                    const chatId = crypto.randomUUID();

                    await saveResponseChat(
                        chatText,                 
                        user_msg_timestamp,       
                        chatId,                   
                        assistantReply,           
                        wilfred_response_timestamp
                    );
                }
            }
        } catch (err) {
            console.error("Stream failed:", err);
            setMessages(prev => [
                ...prev,
                { role: "assistant", text: " Something went wrong." },
            ]);
            setMessageLoader(false);
            setDisableChat(false);
        }
    };

    const getBearerToken = async (userEmail: string, apiKey: string) => {
        try {
            const url =`/api/WilfredSearchAPI/GetAuthToken?username=${encodeURIComponent(userEmail)}&apikey=${encodeURIComponent(apiKey)}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({}) 
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            let bearerToken = await response.json();
            setBearerToken(bearerToken);
            return bearerToken;

        } catch (error) {
            console.error("Failed to fetch bearer token:", error);
            return null;
        }
    };

    // const saveResponseChat = async (
    //     user_msg: string,
    //     user_msg_timestamp: Date,
    //     chatId: string,
    //     wilfred_resp: string,
    //     wilfred_response_timestamp: Date,
    // ) => {
    //     const userEncoded = localStorage.getItem("UserDTO");
    //     const projectEncoded = localStorage.getItem("ProjectDTO");
    //     if (!userEncoded || !projectEncoded) return;

    //     const user = JSON.parse(atob(userEncoded));
    //     const project = JSON.parse(atob(projectEncoded));

    //     const url = isContinueConversation
    //         ? "/api/WilfredConversation/ResumeConversation"
    //         : "/api/WilfredConversation/CreateNewConversation";

    //     const payload = {
    //         projectId: project.P_ID,
    //         userId: user.U_ID,
    //         conversationId: contextId,
    //         chatId,
    //         user_msg,
    //         wilfred_resp,
    //         user_msg_timestamp,
    //         wilfred_response_timestamp,
    //         persona_type: "BI_AGENT",
    //         WorkerID: "00000000-0000-0000-0000-000000000000",
    //         dbid: "00000000-0000-0000-0000-000000000000",
    //         feature: "",
    //         user_msg_summerised: user_msg,
    //     };

    //     try {
    //         const resp = await fetch(url, {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json", accept: "application/json" },
    //             body: JSON.stringify(payload),
    //         });

    //         if (!resp.ok) throw new Error(`Error ${resp.status}`);
    //         const result = await resp.json();

    //         if (result.status === "success") {
    //             setIsContinueConversation(true);
    //         } else {
    //             setIsContinueConversation(false);
    //         }
    //     } catch (err) {
    //         console.error("saveResponseChat failed:", err);
    //     }
    // };
    const saveResponseChat = async (
        userMsg: string,
        userMsgTimestamp: Date,
        chatId: string,
        wilfredResp: string,
        wilfredRespTimestamp: Date,
    ) => {
        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");

        let user = userEncoded ? JSON.parse(atob(userEncoded)) : {};
        let project = projectEncoded ? JSON.parse(atob(projectEncoded)) : {};

        const formUrl = isContinueConversation
            ? "/api/WilfredConversation/ResumeConversation"
            : "/api/WilfredConversation/CreateNewConversation";

        const payload = {
            projectId: project.P_ID,
            userId: user.U_ID,
            conversationId: contextId,
            chatId: chatId,
            user_msg: userMsg,
            wilfred_resp: wilfredResp,
            user_msg_timestamp: userMsgTimestamp,
            wilfred_resp_timestamp: wilfredRespTimestamp,
            persona_type: "BI_AGENT",
            WorkerID: "00000000-0000-0000-0000-000000000000",
            dbid: "00000000-0000-0000-0000-000000000000",
            feature: "",
            user_msg_summerised: userMsg,
        };

        try {
            const response = await fetch(formUrl, {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save chat");

            const result = await response.json();
            console.log(result)
            setIsContinueConversation(true);
            localStorage.setItem("continue_chat_key", "true");
        } catch (err) {
            console.error("Save response failed:", err);
        }
    };

    
    const getSessionChatData = async (conversationId: string) => {
        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");
        if (!userEncoded || !projectEncoded) return;

        const user = JSON.parse(atob(userEncoded));
        const project = JSON.parse(atob(projectEncoded));

        try {
            const url = "/api/WilfredConversation/ConversationSessionByConversationId";
            const payload = {
                conversation_id: conversationId,
                username: user.email_ID,
                projectId: project.P_ID,
            };

            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) throw new Error(`Error: ${resp.status} ${resp.statusText}`);
            const result = await resp.json();

            console.log("result.userConversationDto ====", result.userConversationDto);

            setContextId(conversationId);

            if (result.userConversationDto && result.userConversationDto.length > 0) {
                const restoredMessages: Msg[] = result.userConversationDto.map((c: any) => [
                    { role: "user", text: c.user_msg },
                    { role: "assistant", text: c.wilfred_resp },
                ]).flat();

                setMessages(restoredMessages);
                setShowGreeting(false);
            }
        } catch (err) {
            console.error("getSessionChatData failed:", err);
        }
    };

    const [recentChats, setRecentChats] = useState<any[]>([]);
    // const [totalRecentCount, setTotalRecentCount] = useState(0);
    // const [msgOffset, setMsgOffset] = useState(0);
    // const msgLimit = 6; 

    const getRecentChatData = async () => {
        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");
        if (!userEncoded || !projectEncoded) return;

        const user = JSON.parse(atob(userEncoded));
        const project = JSON.parse(atob(projectEncoded));

        try {
            const url = "/api/WilfredConversation/GetConversationByUserId";
            const payload = {
                userId: user.U_ID,
                projectId: project.P_ID,
                dbId: "00000000-0000-0000-0000-000000000000", 
                feature: "",
                offset: 0,
                limit: 5,
            };

            const resp = await fetch(url, {
                method: "GET", 
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) throw new Error(`Error: ${resp.status} ${resp.statusText}`);
            const result = await resp.json();

            if (result.data) {
                setRecentChats(prev => [...prev, ...result.data]);
            }
            // setTotalRecentCount(result.total_count || 0);

        } catch (err) {
            console.error("getRecentChatData failed:", err);
        }
    };



    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <PopupContainer>
            <div className="popUp">
                <div className="popupHeader">
                   
                    <div className="main-header">
                        <div className="title_img">
                            <img className='sparkler-image-header'
                            src="/static/assets/images/sparkler.svg"
                            alt="Chat"
                            />
                        </div>

                        <div>
                            <h4 className="modal_title">Ask Wilfred AI</h4>
                            <h3 className="modal_sub_title">Your AI assistant for BI Studio</h3>
                        </div>
                    </div>
                    
                    
                    <div>
                        {!showGreeting && (
                            <>
                                <Tooltip title="New Thread">
                                    <button className="close-modal-btn" onClick={() => newThread()}>
                                        new thread
                                    </button>
                                </Tooltip>
                                <Tooltip title="Clear Thread">
                                    {/* <button className="close-modal-btn" onClick={() => curdRecentChat(chat, "delete")}>
                                        <ClearOutlined />
                                    </button> */}
                                    <button className="close-modal-btn" onClick={() => clearChat()}>
                                        <ClearOutlined />
                                    </button>
                                </Tooltip>
                            </>
                        )}
                        <Tooltip title="Close">
                            <button className="close-modal-btn" onClick={() => onClose()}>
                                <CloseOutlined />
                            </button>
                        </Tooltip>
                    </div>

                </div>

                <div className="popupBody" >
                    {showGreeting && (
                        <div className="greeting">
                            <div className="greetings-body">
                               <div className="greetings-body-center">
                                    <h4 className="header">
                                        {(() => {
                                            const hour = new Date().getHours();
                                            if (hour < 12) return "Good Morning";
                                            if (hour < 18) return "Good Afternoon";
                                            return "Good Evening";
                                        })()}, {userName  || "there"} 
                                    </h4>

                                    <p className="date-text">{today}</p>
                               </div>
                            </div>
                            <div className="recent-threads">
                                <h4>Recent Threads</h4>
                                {recentChats.length === 0 ? (
                                    <p>No recent threads available</p>
                                ) : (
                                    <ul>
                                        {recentChats.map((chat) => (
                                            <li key={chat.conversation_id} className="recent-item">
                                                <span>{chat.summarized_name || "Untitled Chat"}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>


                            <p className="main-request">
                                How can I help you?
                            </p>
                        </div>
                    )}

                    {!showGreeting &&
                        messages.map((m, i) => (
                            <div  key={i} className={`msg ${m.role}`}>
                                <div className="msg-img">
                                    {m.role == 'assistant' ? <img className='wilfred-image'
                                        src="/static/assets/images/wilfred.png"
                                        alt="Chat"
                                    /> : ''}
                                </div>
                                <div className="msg-bubble">
                                    <ReactMarkdown>{m.text}</ReactMarkdown>
                                    {messageLoader && m.role === "assistant" && i === messages.length - 1 && (
                                        <img alt="" src="/static/assets/images/loader2.gif" />
                                    )}
                                </div>

                                <div ref={messagesEndRef}></div>

                            </div>
                        ))}
                </div>

                <div className="popupFooter">
                   <div className="footer-main">
                         <textarea
                        placeholder="Ask me anything..."
                        value={chatText}
                        disabled={disableChat}
                        className="input-wilfred"
                        onChange={e => setChatText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    <div className="askBtn">
                        <button
                            onClick={handleSend}
                            className="btn_speek_msg_wilfred"
                            disabled={disableChat}
                        >

                             <img className='sparkler-image'
                            src="/static/assets/images/sparkler-white.svg"
                            alt="Chat"
                            />
                            Ask Wilfred
                        </button>
                    </div>
                   </div>
                    
                </div>
            </div>
        </PopupContainer>
    );
};

export default ChatPopup;
