// components/Footer.js

import style from '../styles/Footer.module.css';

const Footer = () => {
    return (
        <div className={style.footerContainer}>
            <div className={style.leftFrame}>
                <div className={style.firstLine}>
                    <div className={style.title1}> WeAudit </div>
                    <div className={style.firstLineItem}> About us </div>
                    <div className={style.firstLineItem}> Projects </div>
                    <div className={style.firstLineItem}> FAQ </div>
                </div>
                <div className={style.spacing1}></div>
                <div className={style.secondLine}>
                    <div className={style.secondLineItem1}>Terms & Conditions</div>
                    <div className={style.secondLineItem2}>Privacy Policy</div>
                </div>
            </div>
            <div className={style.spacing2}></div>
            <div className={style.rightFrame}>
                <div className={style.signup}>Sign up for a weekly summary!</div>
                    <form className={style.emailContainer}>
                        <div>
                            <input
                                type="email"
                                className={style.enterEmail}
                                placeholder="Your email here"
                                required
                            />
                        </div>
                        <div>
                            <button type="submit" className={style.emailButton}>Submit</button>
                        </div>
                    </form> 
            </div>

        </div>


        // <nav className={style.navBar}>
        //     <div className={style.leftTabs}>
        //         <a href="https://forum.weaudit.org/" className={style.navWeaudit}>WeAudit</a>
        //         <a href="/" className={style.navItem}>Ouroboros</a>
        //     </div>
        //     <div className={style.rightTabs}>
        //         <a href="https://forum.weaudit.org/about" className={style.navItem}>About</a>
        //         <a href="https://taiga.weaudit.org/" className={style.navItem}>TAIGA</a>
        //         <a href="" className={style.navOuro}>Ouroboros</a>
        //         <a href="https://forum.weaudit.org/c/stable-diffusion/46" className={style.navItem}>Discussions</a>
        //         <a href="" className={style.navIcon}>
        //             <img src={'/ico-search.svg'} alt="search-icon" />
        //         </a>
        //     </div>
        // </nav>
    );
};

export default Footer;
