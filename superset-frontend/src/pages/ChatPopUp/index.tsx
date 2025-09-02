import React, { useState, useRef, useEffect } from "react";
import { styled } from "@superset-ui/core";

type Msg = { role: "user" | "assistant"; text: string };

const PopupContainer = styled.div`
  .popUp {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 35vw;
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
    padding: 0.75rem 1rem;
    color: black;
    height: 5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .popupBody {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #fafafa;
  }
  .greeting {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;   /* take full height of popup body */
}
.greeting h2 {
  margin: 2rem 0 1rem 0;
}
.greeting p {
  margin: 0.5rem 0;
}

  .msg {
  display: inline-block;
  max-width: 50%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  word-break: break-word;
  white-space: pre-wrap;
}

.msg.user {
  background: #e8f4f6;
  align-self: flex-end;   
}

.msg.assistant {
  background: #f1f1f1;
  align-self: flex-start; 
}

.popupBody {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

  .popupFooter {
    display: flex;
    padding: 0.5rem;
    border-top: 1px solid #ddd;
    gap: 0.5rem;
  }
  .input-wilfred {
    flex: 1;
    resize: none;
    border-radius: 8px;
    padding: 1rem;
    border: none;
    font-size: 0.875rem;
  }
  .btn_speek_msg_wilfred {
    color: #fff !important;
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #4192AA !important;
    border-radius: 1rem;
    border: 1px solid #116173;
    cursor: pointer;
  }

   .askBtn{
      display:flex;
      justify-content:end;
    }
`;

const ChatPopup = ({ onClose }: { onClose: () => void }) => {
    const [chatText, setChatText] = useState("");
    const [messages, setMessages] = useState<Msg[]>([]);
    const [showGreeting, setShowGreeting] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const [bearerToken,setBearerToken]=useState(null);

    const handleSend = async () => {
        if (!chatText.trim()) return;
        setMessages(prev => [...prev, { role: "user", text: chatText }]);
        setChatText("");
        setShowGreeting(false);

        const userEncoded = localStorage.getItem("UserDTO");
        const projectEncoded = localStorage.getItem("ProjectDTO");

        let user = null;
        let project = null;

        if (userEncoded) {
            user = JSON.parse(btoa(userEncoded)); 
        }
        if (projectEncoded) {
            project = JSON.parse(btoa(projectEncoded));
        }

        console.log("Decoded user:", user);
        console.log("Decoded project:", project);

        if(bearerToken ==null){
            getBearerToken(user.userEmail,user.apiKey);
        }

        // const user = JSON.parse(localStorage.getItem("UserDTO") || "{}");
        // const project = JSON.parse(localStorage.getItem("ProjectDTO") || "{}");
        // console.log(user + '---- ' + project);


        try {
            let payload = {
                contextId: crypto.randomUUID(),
                userEmail: user.email,
                projectName: project.name,
                projectId: project.id,
                domainName: window.location.origin,
                text: chatText,
                agentType: "BI_AGENT",
                temporaryFilePath: "",
                extra_metadata: {
                    // artifact_id: "ca65a139-4878-4818-8721-f4eef1d7d5b5",
                    // current_url:
                    //     "https://myqlm.preprod.opkeyone.com/opkeyone/myspace/wilfred/",
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
                        if (data && data !== "[DONE]") {
                            assistantReply += data;

                            setMessages((prev) => {
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
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: "⚠️ Something went wrong." },
            ]);
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
            console.log("Bearer token:", bearerToken);
            return ;

            // store in localStorage (encrypted if you want)
            // localStorage.setItem("BearerToken", .bearerToken);

            // return result.bearerToken;

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
                    <h3>Ask Wilfred </h3>
                    <button onClick={(e) => {
                        e.preventDefault();
                        onClose
                    }
                    }>✕</button>
                </div>

                <div className="popupBody" ref={messagesEndRef}>
                    {showGreeting && (
                        <div className="greeting">
                            <h4>
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return "Good Morning";
                                    if (hour < 18) return "Good Afternoon";
                                    return "Good Evening";
                                })()}, {"there"} 
                            </h4>

                            <p>{today}</p>

                            <div style={{ flexGrow: 1 }}></div>

                            <p style={{ fontWeight: "500", marginTop: "2rem" }}>
                                How can I help you?
                            </p>
                        </div>
                    )}

                    {!showGreeting &&
                        messages.map((m, i) => (
                            <div key={i} className={`msg ${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                </div>

                <div className="popupFooter">
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
                            Ask Wilfred
                        </button>
                    </div>
                </div>
            </div>
        </PopupContainer>
    );
};

export default ChatPopup;
