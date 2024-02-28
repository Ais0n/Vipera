// components/GoToDiscussionForum.js

import React from 'react';
import styles from '../styles/HomeButton.module.css';

const GoToDiscussionForum = () => {
    return (
      <>
        <div class={styles.container_discussion}>
            <div className={styles.icon_df}>
              <img src={'/discussionforumbutton.svg'} alt="discussionforum" />
            </div>
            <a href="https://forum.weaudit.org/c/stable-diffusion/46" className={styles.text_df}>
              Discussion Forum
            </a>
        </div>
      </>
    );
};

export default GoToDiscussionForum;
