import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X } from 'lucide-react';

const CHATBOT_URL = 'https://landbot.online/v3/H-3337203-VVIJPE3ZMLNBWXO7/index.html';

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const widgetContent = (
    <>
      {/* Modal overlay - shown when chat is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '420px',
              height: '85vh',
              maxHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(to right, #f59e0b, #d97706)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={24} color="white" />
                <span style={{ fontWeight: 600, color: 'white', fontSize: '16px' }}>
                  Help & Navigation
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  color: 'white',
                  borderRadius: '8px',
                }}
                aria-label="Close chatbot"
              >
                <X size={24} />
              </button>
            </div>
            <iframe
              src={CHATBOT_URL}
              title="Turmeric Supply Chain Assistant"
              style={{
                flex: 1,
                width: '100%',
                border: 'none',
                minHeight: '400px',
              }}
            />
          </div>
        </div>
      )}

      {/* Floating chat button - always visible on every page */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(245, 158, 11, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.4)';
        }}
        aria-label="Open chatbot - Get help navigating the website"
      >
        <MessageCircle size={28} />
      </button>
    </>
  );

  return createPortal(widgetContent, document.body);
}

export default ChatbotWidget;
