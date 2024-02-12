// components/SearchBar.js

import React from 'react';
import styles from '../styles/NavBar.module.css';
import searchLogo from '../public/ico-search.svg';

const NavBar = () => {
    return (
        <nav className={styles.navbar}>
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
                    <img src={searchLogo}/>
                </a>
            </div>
        </nav>
    );
};

export default NavBar;

