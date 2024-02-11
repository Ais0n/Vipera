// components/SearchBar.js

import React, { useState } from 'react';
import styles from '../styles/SearchBar.module.css';

function SearchBar({ onGenerateClick, isGenerating }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onGenerateClick(inputValue);
  };

  return (
    <div className={styles.searchContainer}>
      <label className={styles.generateLabel}>Generate</label>
      <div className={styles.inputAndButtonsContainer}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
          <input
            type="text"
            className={styles.searchBar}
            placeholder="Write prompt here"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isGenerating}
          />
          <div className={styles.buttonsContainer}>
            {/* sdButton can also be sued to search, need fix it */}
            <button className={styles.sdButton}>
              <span className={styles.sdButtonText}>Stable Diffusion</span>
            </button>
            <button type="submit" className={styles.searchButton} disabled={isGenerating}>
              <span className={styles.searchButtonText}>Generate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SearchBar;
