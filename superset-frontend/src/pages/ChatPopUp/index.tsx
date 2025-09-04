import React, { useState, useRef, useEffect } from "react";
import { styled } from "@superset-ui/core";
import ReactMarkdown from "react-markdown";
import { ClearOutlined } from "@ant-design/icons";

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

    const clearChat=()=>{
        setChatText('');
        setMessageLoader(false);
        setShowGreeting(true);
        setMessages([]); 
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

    const [bearerToken,setBearerToken]=useState(null);

    const handleSend = async () => {
        if (!chatText.trim()) return;
        setMessages(prev => [...prev, { role: "user", text: chatText }]);
        setChatText("");
        setShowGreeting(false);
        setMessageLoader(true);

        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");

        let user = null;
        let project = null;

        if (userEncoded) {
            user = JSON.parse(atob(userEncoded)); 
        }
        if (projectEncoded) {
            project = JSON.parse(atob(projectEncoded));
        }

        if(bearerToken == null){
            getBearerToken(user.email_ID,user.ApiKey);
        }


        try {
            let payload = {
                contextId: crypto.randomUUID(),
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
                const lines = chunk.split("\n");

                for (let line of lines) {
                    if (line.startsWith("data:")) {
                        const data = line.replace("data:", "").trim();

                        if (data === "[DONE]") {
                            setMessageLoader(false);
                        } else if (data) {
                            assistantReply += data;

                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    role: "assistant",
                                    text: assistantReply,
                                };
                                return updated;
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Stream failed:", err);
            setMessages(prev => [
                ...prev,
                { role: "assistant", text: " Something went wrong." },
            ]);
            setMessageLoader(false);
        }
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
            return ;

        } catch (error) {
            console.error("Failed to fetch bearer token:", error);
            return null;
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
                        {!showGreeting && <button className="close-modal-btn" onClick={()=>clearChat() }>
                                    <ClearOutlined />
                                    </button>}
                        <button className="close-modal-btn" onClick={() => {onClose()}}>✕</button>
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

                            <p className="main-request">
                                How can I help you?
                            </p>
                        </div>
                    )}

                    {!showGreeting &&
                        messages.map((m, i) => (
                            <div className={`msg ${m.role}`}>
                                <div className="msg-img">
                                    {m.role == 'assistant' ? <img className='wilfred-image'
                                        src="/static/assets/images/wilfred.png"
                                        alt="Chat"
                                    /> : ''}
                                </div>
                                <div key={i} className="msg-bubble">
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
