// components/Analyze.js

import React, { useState } from 'react';

import Category from './CategoryButton';
import ImageGrid from './ImageGrid';
import Distributions from './Distributions';
import Discussion from './Discussion';

import style from '../styles/Analyze.module.css';

const Analyze = ({ images, distribution, selectedCategory, onSelectCategory, resultPrompt}) => {
    return (
        <section className={style.analyzeSection}>
            <div className={style.greyBg}>
                <div className={style.analyzeContent}>
                    <div className={style.analyzeText}>Analyze</div>
                    <div className={style.promptIconContainer}>
                        <div className={style.analyzePrompt}>
                            Results:&nbsp;<span className={style.promptResult}> [{resultPrompt}]</span>
                        </div>
                        <div className={style.analyzeIconContainer}>
                            <div className={style.analyzeIcon}>
                                <img src={'/refresh-cw.svg'} alt="refresh" />
                            </div>
                            <div className={style.analyzeIcon}>
                                <img src={'/trash.svg'} alt="trash" />
                            </div>
                        </div>
                    </div>

                    <Category onSelectCategory={onSelectCategory} selectedCategory={selectedCategory} />
                    {selectedCategory === 'images' ? (
                    <ImageGrid images={images} />
                    ) : (
                    <Distributions distribution={distribution} category={selectedCategory} />
                    )}
                </div>

                <div className={style.discussionContainer}>
                    <Discussion />
                </div>
            </div>
        </section>
    );
};

export default Analyze;
