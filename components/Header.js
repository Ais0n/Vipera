// components/Header.js

import style from '../styles/Header.module.css';
import { Popover, Radio } from 'antd';
import { useEffect, useState } from 'react';

const Header = ({ mode = null, setMode = () => { } }) => {

    const popoverContent = (
        <div>
            {
                mode ? <Radio.Group
                    style={style}
                    onChange={(e) => setMode(e.target.value)}
                    value={mode}
                    options={[
                        { value: 'A', label: 'A' }, // Without scene graph and AI auditing support
                        { value: 'B', label: 'B' }, // With scene graph
                        { value: 'C', label: 'C' }, // With AI auditing support
                        { value: 'D', label: 'D' }, // With scene graph and AI auditing support
                    ]}
                /> : <div>Not Supported</div>
            }

        </div>
    )

    return (
        <nav className={style.navBar}>
            <div className={style.leftTabs}>
                <a href="https://forum.weaudit.org/" className={style.navWeaudit}>WeAudit</a>
                <Popover content={popoverContent} title="System Mode" trigger="click" style={{ "color": "black" }}>
                    <a className={style.navItem} style={{ cursor: "pointer" }}>
                        Settings
                    </a>
                </Popover>
            </div>
            <div className={style.rightTabs}>
                <a href="https://forum.weaudit.org/about" className={style.navItem}>About</a>
                <a href="https://taiga.weaudit.org/" className={style.navItem}>TAIGA</a>
                <a href="" className={style.navOuro}>Vipera</a>
                <a href="https://forum.weaudit.org/c/stable-diffusion/46" className={style.navItem}>Discussions</a>
                <a href="" className={style.navIcon}>
                    <img src={'/ico-search.svg'} alt="search-icon" />
                </a>
            </div>
        </nav>
    );
};

export default Header;
