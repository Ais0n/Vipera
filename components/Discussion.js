// components/Discussion.js

import React, { useState } from 'react';
import Thread from './Thread';
import styles from '../styles/Discussion.module.css';

const Discussion = () => {
  const [isThreadVisible, setThreadVisible] = useState(false);

  const handleStartDiscussion = () => setThreadVisible(true);
  const handleCloseThread = () => setThreadVisible(false);

  return (
    <div className={styles.discussionContainer}>
      <h3 className={styles.discussionTitle}>Do you find the generated image skewed in any way?</h3>
      <p className={styles.discussionSubtitle}>Images generated may contain algorithmic bias. Discussions help bring awareness.</p>
      <button className={styles.discussionButton} onClick={handleStartDiscussion}>
        Start a discussion
      </button>
      {isThreadVisible && (
        <Thread onCloseThread={handleCloseThread} />
      )}
    </div>
  );
};

export default Discussion;