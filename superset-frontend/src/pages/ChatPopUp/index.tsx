import React, { useState, useRef, useEffect } from "react";
import { styled } from "@superset-ui/core";
import { ClearOutlined, CloseOutlined } from "@ant-design/icons";
import { Tooltip } from 'src/components/Tooltip';
import ChatPopupBody from "../ChatPopUpBody";

type Msg = { role: "user" | "assistant"; text: string };
interface UserDTO {
    U_ID: string;
    email_ID: string;
    ApiKey: string;
}

interface ProjectDTO {
    P_ID: string;
    Name: string;
}
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

    .new-thread-btn {
        background: #116173;
        color: #fff;
        border: 1px solid #116173;
        padding: 0.25rem 0.75rem;
        border-radius: 0.5rem;
        margin-right: 0.5rem;
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

   .greeting-body {
        height:100%;
    }

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

    .recent-details-body {
        height:100%;

        .recent-user-details {
            display: flex;
            align-items:center;
            width:100%;
            margin-bottom:1rem;

            .recent-user-img {
                width: 5rem;
                height: 5rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                margin-right: 1rem;

                img {
                    width: 100%;
                    height:100%;
                    border-radius: 50%;
                    background-color: #e8f4f6;
                }
            }

            .recent-user-name {
                h4 {
                    background: linear-gradient(to right, #2D6571, #59B2C5);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    -webkit-text-fill-color: transparent;
                    font-size: 2rem;
                }

                p {
                    color: #c4c7c5;
                    font-size: 1.25rem;
                    font-weight: 600;
                }
            }
        }

        .recent-chat {
            .recent-chat-body {
                border: 1px solid #ddd;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                cursor: pointer;
                padding: 0rem !important;
                border-left: 5px solid #b27ae7;
                max-height: 22rem;
                min-height: 2rem;
                overflow: auto;

                .no-recent-chat {
                    position: relative;
                    text-align: center;
                    width: 100%;
                    height: 5rem;

                    .recent-text {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 1rem;
                        color: #67748e;
                        font-weight: 500;
                    }
                }

                .recent-chat-history {

                    ul {
                        padding-left: 0rem;
                        margin-bottom:0rem;
                    }

                    .recent-main-text {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding:0.5rem 0.75rem 0rem;

                        &:last-child {
                            padding-bottom: 0.75rem !important;
                        }

                        .recent-text-details {
                            display: flex;
                            align-items: center;
                            width: calc(100% - 3rem);
                           

                            .msg-icon {
                                padding-right: 0.5rem;}

                            .text-ellipsis {
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                                display: inline-block;
                            }
                        }

                        .ant-dropdown-trigger:hover .ant-dropdown {
                            display: block;
                        }
                    }
                }
            }
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
    const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
    const [chatText, setChatText] = useState("");
    const [messages, setMessages] = useState<Msg[]>([]);
    const [showGreeting, setShowGreeting] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [messageLoader, setMessageLoader] = useState(false);
    const [bearerToken, setBearerToken] = useState(null);
    const [contextId, setContextId] = useState<string>(EMPTY_GUID);
    const [isContinueConversation, setIsContinueConversation] = useState(false);
    const [disableChat, setDisableChat] = useState(false);
    const [totalRecentCount,setTotalRecentCount]=useState(0);

    const newThread = () => {
        setChatText('');
        setMessages([]);
        setMessageLoader(false);
        setShowGreeting(true);

        setIsContinueConversation(false);
        setContextId(crypto.randomUUID());
        getRecentChatData(); 
        localStorage.setItem("continue_chat_key", "false");
    };

  
    function parseEventData(data: string): string {
        let parsedData = "";
        data.split('\n').forEach((line) => {
            if (line.startsWith("data: ")) {
                const value = line.slice(6);

                if (value === "[DONE]") return;

                if (value.trim() === "") {
                    parsedData += "\n";
                } else {
                    parsedData += value;
                }
            }
        });

        return parsedData;
    }

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }

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
        getRecentChatData(); 
        getLastChatData();
    }, []);


    // const startNewChat = () => {
    //     setMessages([]);
    //     setShowGreeting(true);
    //     setContextId(crypto.randomUUID());
    //     getRecentChatData(); 
    // };

    
    const CONTINUE_CHAT_KEY = "continue_chat";

    const getLastChatData = async () => {
        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");
        if (!userEncoded || !projectEncoded) return;

        const user = JSON.parse(atob(userEncoded));
        const project = JSON.parse(atob(projectEncoded));

        try {
            const url = `/api/WilfredConversation/LastConversationByUserId?userId=${encodeURIComponent(
                user.U_ID
            )}&projectId=${encodeURIComponent(project.P_ID)}`;

            const resp = await fetch(url, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (!resp.ok) throw new Error(`Error ${resp.status}`);
            const result = await resp.json();

            if (result.conversation_id === EMPTY_GUID) {
                setMessages([]);
                totalRecentCount ==0 ? setShowGreeting(true) :setShowGreeting(false);
                setContextId(crypto.randomUUID());
                // getRecentChatData();
                localStorage.setItem(CONTINUE_CHAT_KEY, "false");
            } else {
                const isContinueChat = localStorage.getItem(CONTINUE_CHAT_KEY);
                if (isContinueChat == "true") {
                    console.log("Resuming chat", result.conversation_id);
                    getSessionChatData(result.conversation_id);
                    localStorage.setItem(CONTINUE_CHAT_KEY, "true");
                } else {
                    console.log("Forcing new chat");
                    setMessages([]);
                    totalRecentCount ==0 ? setShowGreeting(true) :setShowGreeting(false);
                    setContextId(crypto.randomUUID());
                    localStorage.setItem(CONTINUE_CHAT_KEY, "false");
                    // getRecentChatData();
                }
            }
        } catch (err) {
            console.error("getLastChatData failed:", err);
        }
    };


    const curdRecentChat = async (item: { conversation_id: string }, actionType: "delete") => {
        if (!item?.conversation_id) return;

        try {
            const url = "/api/WilfredConversation/RenameDeleteOrPinConversationInWilfred";
            const userEncoded = localStorage.getItem("UserDTO");
            const projectEncoded = localStorage.getItem("ProjectDTO");
            if (!userEncoded || !projectEncoded) return;

            const user = JSON.parse(atob(userEncoded));
            const project = JSON.parse(atob(projectEncoded));

            const payload = {
                conversation_id: item.conversation_id,
                action: actionType,
                value: "",
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

            const result = await resp.json();
            if (result.status !== "fail") {
                getRecentChatData();
                setMessages([]);
                totalRecentCount ==0 ? setShowGreeting(true) :setShowGreeting(false);
                setContextId(EMPTY_GUID);
                setChatText('');
                setMessageLoader(false);
                // setRecentChats([]);
            } else {
                console.error("curdRecentChat failed:", result.message);
            }
        } catch (err) {
            console.error("curdRecentChat error:", err);
        }
    };

    const handleSend = () => {
        if (!chatText.trim()) return;

        const user_msg_timestamp = new Date();
        setMessages((prev: any) => [...prev, { role: "user", text: chatText }]);
        setChatText("");
        setShowGreeting(false);
        setMessageLoader(true);
        setDisableChat(true);

        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");
        // const keycloak_token = localStorage.getItem("keycloak_token");

        let user: UserDTO | null = null;
        let project:ProjectDTO  |null = null;


        if (userEncoded) {
            try {
                user = JSON.parse(atob(userEncoded));
            } catch (e) {
                console.warn("Invalid UserDTO encoding", e);
            }
        }

        if (projectEncoded) {
            try {
                project = JSON.parse(atob(projectEncoded));
            } catch (e) {
                console.warn("Invalid ProjectDTO encoding", e);
            }
        }
        if (!user || !project) {
            console.error("Missing user or project info");
            return;
        }

        const fetchToken = bearerToken
            ? Promise.resolve()
            : getBearerToken(user?.email_ID, user?.ApiKey);

        fetchToken.then(() => {
            let currentContextId = contextId;

            if (currentContextId == EMPTY_GUID) {
                currentContextId = crypto.randomUUID();
                setContextId(currentContextId);
            }

            const payload = {
                contextId: currentContextId,
                userEmail: user?.email_ID,
                projectName: project?.Name,
                projectId: project?.P_ID,
                domainName: window.location.origin,
                text: chatText,
                agentType: "BI_AGENT",
                temporaryFilePath: "",
                extra_metadata: {},
            };

            setMessages((prev: any) => [...prev, { role: "assistant", text: "" }]);

            fetch("/wilfred_v4/chat", {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${bearerToken}`,
                    // "keycloak-token": keycloak_token ? keycloak_token.toString() : "",
                },
                body: JSON.stringify(payload),
            })
                .then((response) => {
                    if (!response.body) throw new Error("No response body");

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let assistantReply = "";

                    const readChunk = () => {
                        return reader.read().then(({ done, value }): any => {
                            if (done) {
                                setMessageLoader(false);
                                setDisableChat(false);

                                const wilfred_response_timestamp = new Date();
                                const chatId = crypto.randomUUID();

                                return saveResponseChat(
                                    chatText,
                                    user_msg_timestamp,
                                    chatId,
                                    assistantReply,
                                    wilfred_response_timestamp,
                                    currentContextId
                                ).then(() => Promise.resolve());

                            }

                            const chunk = decoder.decode(value, { stream: true });

                            const parsedText = parseEventData(chunk);
                            if (parsedText) {
                                assistantReply += parsedText;

                                setMessages((prev: any) => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        role: "assistant",
                                        text: assistantReply,
                                    };
                                    return updated;
                                });
                            }

                            return readChunk();
                        });
                    };

                    return readChunk();
                })
                .catch((err) => {
                    console.error("Stream failed:", err);
                    setMessages((prev: any) => [
                        ...prev,
                        { role: "assistant", text: " Something went wrong." },
                    ]);
                    setMessageLoader(false);
                    setDisableChat(false);
                });
        });
    };

    const getBearerToken = async (userEmail: string, apiKey: string) => {
        try {
            const url = `/api/WilfredSearchAPI/GetAuthToken?username=${encodeURIComponent(userEmail)}&apikey=${encodeURIComponent(apiKey)}`;

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

    const saveResponseChat = async (
        userMsg: string,
        userMsgTimestamp: Date,
        chatId: string,
        wilfredResp: string,
        wilfredRespTimestamp: Date,
        currentContextId : string 
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
            conversationId: currentContextId,
            chatId: chatId,
            user_msg: userMsg,
            wilfred_resp: wilfredResp,
            user_msg_timestamp: userMsgTimestamp,
            wilfred_resp_timestamp: wilfredRespTimestamp,
            persona_type: "BI_AGENT",
            WorkerID: EMPTY_GUID,
            dbid: EMPTY_GUID,
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
            console.log('Save / resume chat result ',result)
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
            const baseUrl = "/api/WilfredConversation/GetConversationByUserId";
            const payload: any = {
                userId: user.U_ID,
                projectId: project.P_ID,
                dbId: EMPTY_GUID,
                feature: "",
                offset: 0,
                limit: 15,
            };

            const queryString = new URLSearchParams(payload).toString();
            const url = `${baseUrl}?${queryString}`;

            const resp = await fetch(url, {
                method: "GET",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (!resp.ok) throw new Error(`Error: ${resp.status} ${resp.statusText}`);
            const result = await resp.json();

            if (result.data) {
                setRecentChats(result.data);
            }

            setTotalRecentCount(result.total_count ?? 0);

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
                                    <button className="new-thread-btn" onClick={() => newThread()}>
                                        New Thread
                                    </button>
                                </Tooltip>
                                <Tooltip title="Clear Thread">
                                    <button
                                        className="close-modal-btn"
                                        onClick={() => curdRecentChat({ conversation_id: contextId }, "delete")}
                                    >
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
                {console.log('chatpopup-----',showGreeting,'--------',totalRecentCount,'--------',messages.length)}
                <ChatPopupBody
                    showGreeting={showGreeting}
                    messages={messages}
                    messageLoader={messageLoader}
                    recentChats={recentChats}
                    totalRecentCount={totalRecentCount}
                    userName={userName}
                    today={today}
                    messagesEndRef={messagesEndRef}
                />

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
