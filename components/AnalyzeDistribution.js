
import React, { useState } from 'react';

import Category from './CategoryButton';
import ImageGrid from './ImageGrid';
import Distributions from './Distributions';
import Discussion from './Discussion';

import style from '../styles/Analyze.module.css';

const AnalyzeDistribution = ({ images, distribution, selectedCategory, onSelectCategory, resultPrompt, onRefreshClick, onGenerateMoreClick, isGenerating}) => {
    return (
        <section className={style.analyzeSection}>
            <div className={style.greyBg}>
                <div className={style.greyBgContent}>
                    <div className={style.analyzeContent}>
                        <div className={style.analyzeText}>Analyze</div>
                        <div className={style.promptIconContainer}>
                            <div className={style.analyzePrompt}>
                                Results:&nbsp;<span className={style.promptResult}> [{resultPrompt}]</span>
                            </div>
                            <div className={style.analyzeIconContainer}>
                                <div className={style.analyzeIcon} onClick={onRefreshClick}>
                                    <img src={'/refresh-cw.svg'} alt="refresh" />
                                </div>
                                <button onClick={onGenerateMoreClick} className={style.generateMoreButton} disabled={isGenerating}>
                                    Generate More Images
                                </button>
                                {/* <div className={style.analyzeIcon}>
                                    <img src={'/trash.svg'} alt="trash" />
                                </div> */}
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
                        <Discussion resultPrompt={resultPrompt} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AnalyzeDistribution;
