// components/Header.js

import style from '../styles/Header.module.css';

const Header = () => {
    return (
        <nav className={style.navBar}>
            <div className={style.leftTabs}>
                <a href="" className={style.navWeaudit}>WeAudit</a>
                <a href="" className={style.navItem}>Ouroboros</a>
            </div>
            <div className={style.rightTabs}>
                <a href="" className={style.navItem}>About</a>
                <a href="" className={style.navItem}>TAIGA</a>
                <a href="" className={style.navOuro}>Ouroboros</a>
                <a href="" className={style.navItem}>Discussions</a>
                <a href="" className={style.navIcon}>
                    <img src={'/ico-search.svg'} alt="search-icon" />
                </a>
            </div>
        </nav>
    );
};

export default Header;
