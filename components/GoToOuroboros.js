// components/GoToOuroboros.js

import React from 'react';
import styles from '../styles/HomeButton.module.css';

const GoToOuroboros = () => {
    return (
      <>
        <div class={styles.container_ouroboros}>
            <div className={styles.icon}>
                <img src={'/Obby.svg'} alt="obby" />
            </div>
            <a href="generate" className={styles.text_ouroboros}>
                Go to Ouroboros
            </a>
        </div>
      </>
    );
};

export default GoToOuroboros;
