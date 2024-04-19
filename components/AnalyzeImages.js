
import React, { useState } from 'react';

import Category from './CategoryButton';
import ImageGrid from './ImageGrid';
import Distributions from './Distributions';
import Discussion from './Discussion';

import style from '../styles/Analyze.module.css';
import generateStyle from '../styles/GeneratePage.module.css';

const AnalyzeImages = ({ images, distribution, selectedCategory, onSelectCategory, resultPrompt, onRefreshClick }) => {
    return (
        <section className={style.analyzeSection}>
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
                            {/* <div className={style.analyzeIcon}>
                                <img src={'/trash.svg'} alt="trash" />
                            </div> */}
                        </div>
                    </div>

                    <Category onSelectCategory={onSelectCategory} selectedCategory={selectedCategory} />
                    {selectedCategory === 'images' ? (
                        <ImageGrid images={images} />
                    ) : (
                        <div className={generateStyle.loadingContainer}>
                            <div className={generateStyle.loadingSnake}></div>
                            <div className={generateStyle.loadingText}>
                            Generating a graph that you can analyze to discover potential biases!
                            </div>
                        </div>
                    )}
                </div>

                <div className={style.discussionContainer}>
                    <Discussion resultPrompt={resultPrompt} />
                </div>
            </div>
        </section>
    );
};

export default AnalyzeImages;
