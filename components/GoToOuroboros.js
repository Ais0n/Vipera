// components/GoToOuroboros.js

import React from 'react';
import styles from '../styles/HomeButton.module.css';

const GoToOuroboros = () => {
    return (
      <>
        <a href="generate">
            <div class={styles.container_ouroboros}>
                <div className={styles.icon}>
                    <img src={'/Obby.svg'} alt="obby" />
                </div>
                <p className={styles.text_ouroboros}>
                    Go to Ouroboros
                </p>
            </div>
        </a>
      </>
    );
};

export default GoToOuroboros;
