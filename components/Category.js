// components/Category.js

import React from 'react';
// import styles from '../styles/Category.module.css';

const Category = ({ onSelectCategory }) => {
  return (
    <div>
      <button onClick={() => onSelectCategory('age')}>Age</button>
      <button onClick={() => onSelectCategory('gender')}>Gender</button>
      <button onClick={() => onSelectCategory('skinTone')}>Skin Tone</button>
      <button onClick={() => onSelectCategory('images')}>Images</button>
    </div>
  );
};

export default Category;