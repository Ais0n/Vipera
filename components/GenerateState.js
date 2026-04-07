// components/GenerateState.js

import React, { useState } from 'react';
import styles from '../styles/GenerateState.module.css';

const GenerateState = ({ isGenerating, isDoneGenerating, isPostDone }) => {
    if (!isGenerating && !isDoneGenerating) {
        return (
            <div className={styles.stateContainer}>
                <div className={styles.stateContainerChild}>
                    <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/generate-svg/generateorange.svg`} alt="start generating state" />
                    <div className={styles.stateLabels}>
                        <div className={styles.item1}>
                            Generate
                        </div>
                        <div className={styles.item2}>
                            Analyze
                        </div>
                        <div className={styles.item3}>
                            Post
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    else if (isGenerating && !isDoneGenerating) {
        return (
            <div className={styles.stateContainer}>
                <div className={styles.stateContainerChild}>
                    <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/generate-svg/generateblack-analyseorange.svg`} alt="currently generating state" />
                    <div className={styles.stateLabels}>
                        <div className={styles.item1}>
                            Generate
                        </div>
                        <div className={styles.item2}>
                            Analyze
                        </div>
                        <div className={styles.item3}>
                            Post
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    else if (isDoneGenerating && isPostDone) {
        return (
            <div className={styles.stateContainer}>
                <div className={styles.stateContainerChild}>
                    <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/generate-svg/generateblack-analyseblack-postblack.svg`} alt="finished generating" />
                    <div className={styles.stateLabels}>
                        <div className={styles.item1}>
                            Generate
                        </div>
                        <div className={styles.item2}>
                            Analyze
                        </div>
                        <div className={styles.item3}>
                            Post
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    else {
        return (
            <div className={styles.stateContainer}>
                <div className={styles.stateContainerChild}>
                    <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/generate-svg/generateblack-analyseorange.svg`} alt="currently generating state" />
                    <div className={styles.stateLabels}>
                        <div className={styles.item1}>
                            Generate
                        </div>
                        <div className={styles.item2}>
                            Analyze
                        </div>
                        <div className={styles.item3}>
                            Post
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}

export default GenerateState;
