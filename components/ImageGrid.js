// components/ImageGrid.js

import React from 'react';
import styles from '../styles/ImageGrid.module.css';

const ImageGrid = ({ images }) => {
    return (
      <>
        <div class={styles.imageBox}>
          <div className={styles.lightBulb}>
            <img src={'/LightBulbOutline-grey.svg'} alt="lightBulb" />
          </div>
          <p className={styles.imageBoxText}>
              Images are generated with text-to-image Stable diffusion model. Results may slightly vary on regeneration.
              {' '}<a href="https://forum.weaudit.org/t/learn-about-algorithmic-bias-categories-with-real-life-examples/307" className={styles.learnMoreLink}>Learn more about AI bias</a>
          </p>
        </div>
        <div className={styles.imageGrid}>
          {images.map((src, index) => (
            <img key={index} src={src} alt={`Generated image ${index + 1}`} className={styles.imageCell} />
          ))}
        </div>
      </>
    );
};

export default ImageGrid;
