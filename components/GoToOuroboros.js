// components/GoToOuroboros.js

import React from 'react';
import styles from '../styles/HomeButton.module.css';

const GoToOuroboros = () => {
    return (
      <>
      <a className={styles.no_underline} href="decoupled">
        <div className={styles.container_ouroboros}>
            <div className={styles.icon}>
                <img src={'/Obby.svg'} alt="obby" />
            </div>
            <div className={styles.text_ouroboros}>
              Go to Ouroboros
            </div>
        </div>
      </a>
      </>
    );
};

export default GoToOuroboros;
