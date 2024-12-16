// components/HomeDescription.js

import React from 'react';
import styles from '../styles/HomeDescription.module.css';

const HomeDescription = () => {
    return (
      <>
        <div className={styles.imageBox}>
            <div className={styles.lightBulb}>
              <img src={'/LightBulbOutline.svg'} alt="lightBulb" />
            </div>
            <p className={styles.imageBoxText}>
                Stable Diffusion is a way to use AI to generate realistic images from text prompts. Vipera is a tool that evaluates these images using Computer Vision and creates graphs about the distribution of identified parameters, for example the skin tones, so you can visualize potential biases.  
            </p>
        </div>
      </>
    );
};

export default HomeDescription;
