// components/ImageGrid.js

import React from 'react';
import styles from '../styles/ImageGrid.module.css';

const ImageGrid = ({ images }) => {
    return (
      <div className={styles.imageGrid}>
        {images.map((src, index) => (
          <img key={index} src={src} alt={`Generated image ${index + 1}`} className={styles.imageCell} />
        ))}
      </div>
    );
};

export default ImageGrid;