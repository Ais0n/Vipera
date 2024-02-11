// components/Discussion.js

import React from 'react';
import styles from '../styles/Discussion.module.css';

const Discussion = () => {
  const handleButtonClick = () => {
    console.log('Button clicked to start a discussion.');
  };

  return (
    <div className={styles.discussionContainer}>
      <h3 className={styles.discussionTitle}>Do you find the generated image skewed in any way?</h3>
      <p className={styles.discussionSubtitle}>Images generated may contain algorithmic bias. Discussions help bring awareness.</p>
      <button className={styles.discussionButton} onClick={handleButtonClick}>
        Start a discussion
      </button>
    </div>
  );
};

export default Discussion;
