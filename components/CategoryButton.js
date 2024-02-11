// components/CategoryButton.js

import React from 'react';
import styles from '../styles/Category.module.css';

const Category = ({ onSelectCategory, selectedCategory }) => {
  return (
    <div className={styles.buttonContainer}>
      <button
        className={selectedCategory === 'images' ? `${styles.selected}` : ''}
        onClick={() => onSelectCategory('images')}
      >
        Images
      </button>
      <button
        className={selectedCategory === 'skinTone' ? `${styles.selected}` : ''}
        onClick={() => onSelectCategory('skinTone')}
      >
        Skin Tone
      </button>
      <button
        className={selectedCategory === 'gender' ? `${styles.selected}` : ''}
        onClick={() => onSelectCategory('gender')}
      >
        Gender
      </button>
      <button
        className={selectedCategory === 'age' ? `${styles.selected}` : ''}
        onClick={() => onSelectCategory('age')}
      >
        Age
      </button>
    </div>
  );
};

export default Category;