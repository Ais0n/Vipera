import styles from '../styles/SearchBar.module.css';

function SearchBar() {
    return (
      <div className={styles.searchContainer}> {/* This container should be positioned relative */}
        
        <label className={styles.generateLabel}>Generate</label>
        
        <input
            type="text"
            className={styles.searchBar}
            placeholder="Write prompt here"
        />

        <div className={styles.searchButtonContainer}>
            <button className={styles.searchButton}>
                <span className={styles.searchButtonText}>Generate</span>
            </button>
        </div>

        <div className={styles.sdButtonContainer}>
            <button className={styles.sdButton}>
                <span className={styles.sdButtonText}>Stable Diffusion</span>
            </button>
        </div>
    </div>
        
    );
}

export default SearchBar;
