// components/Header.js

import style from '../styles/Header.module.css';
import { Popover, Radio } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import SettingsModal from './SettingsModal';
import { useState } from 'react';

const Header = ({ mode = null, setMode = () => {}, llmConfig = {}, setLlmConfig = () => {}, saveMode = true, setSaveMode = () => {} }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const popoverContent = (
        <div>
            {
                mode ? <Radio.Group
                    style={style}
                    onChange={(e) => setMode(e.target.value)}
                    value={mode}
                    options={[
                        { value: 'A', label: 'A' },
                        { value: 'B', label: 'B' },
                        { value: 'C', label: 'C' },
                        { value: 'D', label: 'D' },
                    ]}
                /> : <div>Not Supported</div>
            }
        </div>
    )

    return (
        <>
            <nav className={style.navBar}>
                <div className={style.leftTabs}>
                    <a href="https://forum.weaudit.org/" className={style.navWeaudit}>WeAudit</a>
                    <Popover content={popoverContent} title="System Mode" trigger="click" style={{ "color": "black" }}>
                        <a className={style.navItem} style={{ cursor: "pointer" }}>
                            Mode
                        </a>
                    </Popover>
                    <a className={style.navItem} style={{ cursor: "pointer" }} onClick={() => setSettingsOpen(true)}>
                        <SettingOutlined style={{ marginRight: 4 }} />
                        Settings
                    </a>
                </div>
                <div className={style.rightTabs}>
                    <a href="https://forum.weaudit.org/about" className={style.navItem}>About</a>
                    <a href="https://taiga.weaudit.org/" className={style.navItem}>TAIGA</a>
                    <a href="" className={style.navOuro}>Vipera</a>
                    <a href="https://forum.weaudit.org/c/stable-diffusion/46" className={style.navItem}>Discussions</a>
                    <a href="" className={style.navIcon}>
                        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/ico-search.svg`} alt="search-icon" />
                    </a>
                </div>
            </nav>
            <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                llmConfig={llmConfig}
                setLlmConfig={setLlmConfig}
                saveMode={saveMode}
                setSaveMode={setSaveMode}
            />
        </>
    );
};

export default Header;
