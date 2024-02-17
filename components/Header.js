// components/Header.js

import styles from '../styles/Header.module.css';

const Header = () => {
    return (
        <div className={styles.centerNav}>
            <nav className={styles.navBar}>
                <div className={styles.leftTabs}>
                    <a href="" className={styles.selectedNavItem}>WeAudit</a>
                    <a href="" className={styles.navItem}>Ouroboros</a>
                </div>
                <div className={styles.rightTabs}>
                    <a href="" className={styles.navItem}>About</a>
                    <a href="" className={styles.navItem}>TAIGA</a>
                    <a href="" className={styles.selectedNavItem}>Ouroboros</a>
                    <a href="" className={styles.navItem}>Discussions</a>
                    <a href="" className={styles.navItem}>
                        <img src={'/ico-search.svg'} alt="search-icon" />
                    </a>
                </div>
            </nav>
        </div>
    );
};

export default Header;
