// components/Analyze.js

import React from 'react';
import Category from './CategoryButton';
import ImageGrid from './ImageGrid';
import Distributions from './Distributions';
import Discussion from './Discussion';

import style from '../styles/Analyze.module.css';

const Analyze = ({ images, distribution, selectedCategory, onSelectCategory }) => {
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
                    <Discussion />
                </div>
            </div>
        </section>
    );
};

export default Analyze;
