// components/GoToDiscussionForum.js

import React from 'react';
import styles from '../styles/HomeButton.module.css';

const GoToDiscussionForum = () => {
    return (
      <>
        <a href="https://forum.weaudit.org/c/stable-diffusion/46" className={styles.container_discussion}>
            <div className={styles.icon_df}>
              <img src={'/discussionforumbutton.svg'} alt="discussionforum" />
            </div>
            <div className={styles.text_df}>Discussion Forum</div>
        </a>
      </>
    );
};

export default GoToDiscussionForum;
