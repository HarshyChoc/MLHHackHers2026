const messages = [
  {
    id: 1,
    author: "coach",
    text: "Good morning! Want to log your stretch or update your energy?"
  },
  {
    id: 2,
    author: "user",
    text: "Energy is medium. I did the stretch and started deep work."
  },
  {
    id: 3,
    author: "coach",
    text: "Logged stretch as done and marked deep work in progress. Want a 10 minute walk reminder at 3 PM?"
  }
];

const actions = ["Logged habit: Morning stretch", "Updated mood: Medium", "Created commitment: 3 PM walk"];

export default function ChatPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="pill">Coach chat</span>
          <h1>Your AI listener</h1>
          <p className="muted">Talk through blockers, log habits, and adjust your plan in real time.</p>
        </div>
        <div className="thread-actions">
          <button className="button secondary" type="button">
            New thread
          </button>
          <button className="button" type="button">
            Continue thread
          </button>
        </div>
      </section>

      <section className="card chat-shell">
        <div className="chat-thread">
          {messages.map((message) => (
            <div key={message.id} className={`chat-msg ${message.author}`}>
              <div className="bubble">
                <p>{message.text}</p>
              </div>
            </div>
          ))}
          <div className="chat-actions">
            {actions.map((action) => (
              <span key={action} className="chip">
                {action}
              </span>
            ))}
          </div>
        </div>

        <form className="chat-input">
          <input className="input input-block" type="text" placeholder="Tell the coach what happened..." />
          <button className="button" type="submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
