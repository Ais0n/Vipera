import React from 'react';

const ProcessingIndicator = ({ containerStyle }) => {
  return (
    <div className="processing-indicator" style={containerStyle}>
      <div className="spinner"></div>
      <p>Processing...</p>
      <style jsx>{`
        .processing-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.8);
          z-index: 9999;
          width: 100%;
          height: 100%;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProcessingIndicator;