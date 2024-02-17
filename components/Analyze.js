// components/Analyze.js

import React, { useState } from 'react';

import Category from './CategoryButton';
import ImageGrid from './ImageGrid';
import Distributions from './Distributions';
import Discussion from './Discussion';
import Thread from './Thread';

import style from '../styles/Analyze.module.css';
import threadStyle from '../styles/Thread.module.css';

const Analyze = ({ images, distribution, selectedCategory, onSelectCategory }) => {

    const [isThreadVisible, setThreadVisible] = useState(false);

    // click "Start a discussion" button to show the thread
    const handleStartDiscussion = () => setThreadVisible(true);

    // click '-' to close the thread
    const handleCloseThread = () => setThreadVisible(false);

    return (
        <section className={style.analyzeSection}>
            <div className={style.greyBg}>
                <div className={style.analyzeContent}>
                    <div className={style.analyzeText}>Analyze</div>
                    <Category onSelectCategory={onSelectCategory} selectedCategory={selectedCategory} />
                    {selectedCategory === 'images' ? (
                    <ImageGrid images={images} />
                    ) : (
                    <Distributions distribution={distribution} category={selectedCategory} />
                    )}
                </div>

                <div className={style.discussionContainer}>
                    <Discussion onStartDiscussion={handleStartDiscussion} />
                </div>

                {isThreadVisible && (
                    <Thread onCloseThread={handleCloseThread} />
                )}
        </div>
        </section>
    );
};

export default Analyze;
