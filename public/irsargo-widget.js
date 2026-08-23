/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * IRSARGO Standalone Embeddable Assistant Widget (Zero-Dependency Web Component)
 * Usage in any internal portal:
 * <script src="http://irsargo.internal/irsargo-widget.js" data-api-url="http://localhost:3001" defer></script>
 */

(function () {
  if (customElements.get('irsargo-assistant')) return;

  class IRSARGOAssistantElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.apiUrl = this.getAttribute('api-url') || 
                    document.currentScript?.getAttribute('data-api-url') || 
                    'http://localhost:3001';
      this.isOpen = false;
      this.messages = [];
      this.isQuerying = false;
    }

    connectedCallback() {
      this.render();
    }

    toggleOpen() {
      this.isOpen = !this.isOpen;
      this.render();
    }

    async sendMessage(text) {
      if (!text || !text.trim() || this.isQuerying) return;
      
      const queryText = text.trim();
      const userMsg = { sender: 'user', text: queryText, timestamp: new Date().toLocaleTimeString() };
      this.messages.push(userMsg);
      this.isQuerying = true;
      this.render();

      try {
        const response = await fetch(`${this.apiUrl}/api/v1/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryText })
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        this.messages.push({
          sender: 'IRSARGO',
          text: data.answer || 'Query completed.',
          metrics: data.metrics,
          timestamp: new Date().toLocaleTimeString()
        });
      } catch (err) {
        this.messages.push({
          sender: 'IRSARGO',
          text: `Error connecting to IRSARGO Engine: ${err.message || 'Service unavailable'}. Ensure API backend is online.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } finally {
        this.isQuerying = false;
        this.render();
      }
    }

    render() {
      const styles = `
        :host {
          all: initial;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .widget-launcher {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #09090b;
          border: 1.5px solid rgba(249, 115, 22, 0.6);
          box-shadow: 0 10px 35px rgba(234, 88, 12, 0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .widget-launcher:hover {
          transform: scale(1.08);
          box-shadow: 0 15px 45px rgba(6, 182, 212, 0.7);
        }
        .widget-icon {
          width: 36px;
          height: 36px;
          object-fit: contain;
          user-select: none;
        }
        .status-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #34d399;
          border: 2px solid #09090b;
        }
        .chat-window {
          position: fixed;
          bottom: 90px;
          right: 24px;
          z-index: 999999;
          width: 380px;
          max-width: calc(100vw - 32px);
          height: 540px;
          max-height: 80vh;
          background: #09090b;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #f4f4f5;
        }
        .chat-header {
          padding: 12px 16px;
          background: #18181b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-title {
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.5px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }
        .close-btn:hover { color: #f43f5e; }
        .chat-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .message-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 12px;
          line-height: 1.5;
          max-width: 85%;
          word-break: break-word;
        }
        .message-user {
          align-self: flex-end;
          background: linear-gradient(135deg, #ea580c, #d97706);
          color: #ffffff;
          border-bottom-right-radius: 2px;
        }
        .message-bot {
          align-self: flex-start;
          background: #18181b;
          border: 1px solid #27272a;
          color: #e4e4e7;
          border-bottom-left-radius: 2px;
        }
        .chat-footer {
          padding: 12px;
          background: #18181b;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 8px;
        }
        .chat-input {
          flex: 1;
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 8px 12px;
          color: #ffffff;
          font-size: 12px;
          outline: none;
        }
        .chat-input:focus { border-color: #ea580c; }
        .send-btn {
          background: #ea580c;
          border: none;
          color: #ffffff;
          border-radius: 8px;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `;

      let messagesHtml = '';
      if (this.messages.length === 0) {
        messagesHtml = `
          <div style="text-align:center; margin:auto; color:#a1a1aa;">
            <img src="${this.apiUrl}/chatbot-icon.png" style="width:48px;height:48px;margin-bottom:8px;opacity:0.8;" />
            <div style="font-size:12px;font-weight:700;color:#fff;">IRSARGO Embedded Assistant</div>
            <div style="font-size:10px;margin-top:4px;">Ask questions directly from your workspace.</div>
          </div>
        `;
      } else {
        messagesHtml = this.messages.map(m => `
          <div class="message-bubble ${m.sender === 'user' ? 'message-user' : 'message-bot'}">
            <div>${this.escapeHtml(m.text)}</div>
            <div style="font-size:9px;opacity:0.6;margin-top:4px;text-align:right;">${m.timestamp}</div>
          </div>
        `).join('');
      }

      if (this.isQuerying) {
        messagesHtml += `
          <div class="message-bubble message-bot" style="font-style:italic;color:#fbbf24;">
            IRSARGO processing multi-agent SMT proof...
          </div>
        `;
      }

      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="widget-launcher" id="launcherBtn" title="IRSARGO Assistant">
          <img src="${this.apiUrl}/chatbot-icon.png" class="widget-icon" alt="IRSARGO Robot" />
          <div class="status-dot"></div>
        </div>

        ${this.isOpen ? `
          <div class="chat-window">
            <div class="chat-header">
              <div class="header-title">
                <img src="${this.apiUrl}/chatbot-icon.png" style="width:20px;height:20px;" />
                IRSARGO AI Assistant
              </div>
              <button class="close-btn" id="closeBtn">✕</button>
            </div>
            <div class="chat-body" id="chatBody">
              ${messagesHtml}
            </div>
            <form class="chat-footer" id="chatForm">
              <input type="text" class="chat-input" id="chatInput" placeholder="Ask IRSARGO AI..." ${this.isQuerying ? 'disabled' : ''} />
              <button type="submit" class="send-btn" ${this.isQuerying ? 'disabled' : ''}>Send</button>
            </form>
          </div>
        ` : ''}
      `;

      const launcherBtn = this.shadowRoot.getElementById('launcherBtn');
      if (launcherBtn) {
        launcherBtn.addEventListener('click', () => this.toggleOpen());
      }

      const closeBtn = this.shadowRoot.getElementById('closeBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleOpen());
      }

      const chatForm = this.shadowRoot.getElementById('chatForm');
      if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = this.shadowRoot.getElementById('chatInput');
          if (input && input.value) {
            const val = input.value;
            input.value = '';
            this.sendMessage(val);
          }
        });
      }

      const chatBody = this.shadowRoot.getElementById('chatBody');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }

    escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  customElements.define('irsargo-assistant', IRSARGOAssistantElement);

  // Auto-inject element into body if not already present
  if (!document.querySelector('irsargo-assistant')) {
    const el = document.createElement('irsargo-assistant');
    document.body.appendChild(el);
  }
})();
