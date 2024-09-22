import { useState } from "react";
import axios from "axios";
import Markdown from "./MarkDown";
import "./app.css";

const App = () => {
  const [thinking, setThinking] = useState(false);
  const [data, setData] = useState([]);
  const [err, setErr] = useState("")
  const [errState, setErrState] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const prompt = form.get("prompt");
    if (!prompt.trim()) {
      return
    }
    setThinking(true);
    try {
      const result = await axios.post(`${API_URL}/api/prompt`, { prompt });
      result.data.timer = `Thought for: ${result.data.timer}s`
      setErrState(false)
      setData(result.data);
    } catch (error) {
      setErrState(true)
      setData([])
      setErr(error.response.data.error)
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="app-container">
      <form onSubmit={handleSubmit} className="chat-form">
        <textarea
          className="chat-input"
          type="text"
          name="prompt"
          placeholder="Type your message here..." required
        />
        <input className="send-btn" type="submit" value="Send" />
      </form>
      <div className="chat-output">
        {thinking && <p className="thinking">Thinking...</p>}
        {!thinking && (
          <>
            <p className="hardness">{data?.timer}</p>
            <Markdown content={data?.message} />
          </>
        )}
        {errState && <p>{err }</p>}
      </div>
    </div>
  );
};

export default App;
