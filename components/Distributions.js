//Distributions.js
import React from 'react';
import styles from '../styles/Distribution.module.css';

const Distributions = ({ distribution, category }) => {
    const getColor = (att) => {
        // Define colors based on distribution data
        if (att === 'gender') {
            return [['Female', '#FDBB84'], ['Male', '#E5604B']];
        } else if (att === 'age') {
            return [['70+', '#08519C'], ['60-69', '#08519C'], ['50-59', '#2C7FB8'], ['40-49', '#2C7FB8'], ['30-39', '#41B6C4'], ['20-29', '#41B6C4'], ['10-19', '#A1DAB4'], ['3-9', '#FFFFCC'], ['0-2', '#FFFFCC']];
        } else if (att === 'skinTone') {
            return [['VI', '#27190F'], ['V', '#58402E'], ['IV', '#766043'], ['III', '#9D7961'], ['II', '#CAB4A5'], ['I', '#E7CBBA']];
        }
    };

    const getCategory = (att) => {
        if (att === 'gender') {
            return {
                '#FDBB84': 'Female',
                '#E5604B': 'Male'
            };
        } else if (att === 'age') {
            return {
                '#08519C': '60+',
                '#2C7FB8': '40-59',
                '#41B6C4': '20-39',
                '#A1DAB4': '10-19',
                '#FFFFCC': '0-9'
            };
        } else if (att === 'skinTone') {
            return {
                '#27190F': 'VI',
                '#58402E': 'V',
                '#766043': 'IV',
                '#9D7961': 'III',
                '#CAB4A5': 'II',
                '#E7CBBA': 'I'
            };
        }
    }

    const renderGrid = () => {
        const grid = [];
        const colors = getColor(category);
        const totalSquares = 100; // Total number of squares in the grid
        let currentIndex = 0;

        // Group categories by color
        const groupedCategories = colors.reduce((acc, [cat, color]) => {
            if (!acc[color]) {
                acc[color] = [];
            }
            acc[color].push(cat);
            return acc;
        }, {});

        // Calculate total counts for each group
        const totalCounts = Object.values(groupedCategories).map(group => {
            return group.reduce((sum, cat) => sum + Math.round(distribution[category][cat] * totalSquares), 0);
        });
        // Generate new labels for each group using the mapped labels
        const newLabels = Object.keys(groupedCategories).map(color => {
            const newLabel = getCategory(category)[color];
            return [newLabel, color];
        });

        let sum = totalCounts.reduce((a, b) => a + b, 0);
        if (sum > totalSquares) {
            // Find the index of the category with the most count
            let maxIndex = totalCounts.indexOf(Math.max(...totalCounts));
            // Reduce the count of the category with the most count by 1
            totalCounts[maxIndex] -= 1;
            // Re-calculate the sum to ensure it's 100
            sum = totalCounts.reduce((a, b) => a + b, 0);
            // Adjust the count of the category with the most count if necessary
            if (sum > totalSquares) {
                totalCounts[maxIndex] -= (sum - totalSquares);
            }
        }
        if (sum < totalSquares) {
            // Find the index of the category with the most count
            let max = totalCounts.indexOf(Math.max(...totalCounts));
            // Reduce the count of the category with the most count by 1
            totalCounts[max] += 1;
            // Re-calculate the sum to ensure it's 100
            sum = totalCounts.reduce((a, b) => a + b, 0);
            // Adjust the count of the category with the most count if necessary
            if (sum > totalSquares) {
                totalCounts[maxIndex] -= (sum - totalSquares);
            }
        }

        const percentages = totalCounts.map(count => (count / totalSquares) * 100);

         // Iterate through new labels and populate the grid
        newLabels.forEach(([newLabel, color], index) => {
            const count = totalCounts[index];
            const percentage = percentages[index];
            for (let i = 0; i < count; i++) {
                if (i == Math.floor(count/2)) {
                    grid.push(
                        <div key={currentIndex++} className={styles.gridSquareContainer}>
                            <div className={styles.label} style={{ left: '49%'}}>{`${newLabel}: ${percentage.toFixed(0)}%`}</div>
                            <div className={styles.gridSquare} style={{ backgroundColor: color }}></div>
                        </div>
                    );
                } else {
                    grid.push(
                        <div key={currentIndex++} className={styles.gridSquareContainer}>
                            <div className={styles.gridSquare} style={{ backgroundColor: color }}></div>
                        </div>
                    );
                }
            }
        });

        return grid;
    };


    const categoryTexts = {
        gender: "Gender Scale: Computer Vision models being used can only classify images as men, women or ambiguous. This can be inaccurate and misleading.",
        skinTone: "Fitzpatrick Skin Scale is a classification system based on the amount of melanin present in the skin and has 6 shades. Monk Skin Tone scale has 10 shades.",
        age: "Age Scale: Computer Vision models being used can only classify images in ranges of age. This can be inaccurate and misleading."
    };

    return (
      <>
          <div className={styles.distributionBox}>
              <div className={styles.lightBulb}>
                  <img src={'/LightBulbOutline-grey.svg'} alt="lightBulb" />
              </div>
              <p className={styles.distributionBoxText}>
                  {categoryTexts[category]}
                  {' '}<a href="https://forum.weaudit.org/t/learn-about-algorithmic-bias-categories-with-real-life-examples/307" className={styles.learnMoreLink}>Learn more about AI bias</a>
              </p>
          </div>
          <div className={styles.gridContainer}>
              {renderGrid()}   
          </div>
      </>
    );
};

export default Distributions;