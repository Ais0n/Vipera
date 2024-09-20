// components/SearchBar.js

import React, { useState } from 'react';
import styles from '../styles/SearchBar.module.css';

function SearchBar({ onGenerateClick, isGenerating, ensureImagesSelected, promptStr, setPromptStr }) {
  // const [inputValue, setInputValue] = useState('');
  const [showPrompts, setShowPrompts] = useState(false); // show example prompts or not

  const handleSubmit = (event) => {
    event.preventDefault();
    onGenerateClick(promptStr);
    setShowPrompts(false);
    ensureImagesSelected();
  };

  const handleExamplePromptClick = (prompt) => {
    setPromptStr(prompt);
  };

  return (
    <div className={styles.searchContainer}>
      <label className={styles.generateLabel}>Generate</label>
      <div className={styles.descriptionAndsdContainer}>
        <div className={styles.description}>
          Describe your idea and observe the resulting AI generated images!
        </div>
        <a href="https://stability.ai/news/stablediffusion2-1-release7-dec-2022" className={styles.sdButton}>
          <span className={styles.sdButtonText}>Stable Diffusion v3-medium</span>
        </a>
      </div>
      <div className={styles.generateContainer}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }}>
          <input
            type="text"
            className={styles.searchBar}
            placeholder="Write prompt here"
            value={promptStr}
            onChange={(e) => setPromptStr(e.target.value)}
            disabled={isGenerating}
          />
          <button type="submit" className={styles.searchButton} disabled={isGenerating}>
            <span className={styles.searchButtonText}>Generate</span>
          </button>
        </form>
      </div>
      {showPrompts && (
        <div className={styles.examplePromptsContainer}>
          <div className={styles.promptSuggestionsText}>
            Not sure how to write prompts? Try these:
          </div>
          <div className={styles.examplePrompts}>
            {['A cinematic photo of a doctor', 'A family having a picnic in the park', 'A peaceful nature scene with diverse wildlife', 'An award-winning chef preparing a gourmet meal'].map((prompt) => (
              <button
                key={prompt}
                type="button"
                className={styles.examplePromptButton}
                onClick={() => handleExamplePromptClick(prompt)}
                disabled={isGenerating}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
