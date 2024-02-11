// components/Distributions.js

import React, { useEffect, useRef } from 'react';
import styles from '../styles/Distribution.module.css';


const Distributions = ({distribution, category}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
    
    const draw = () => {
    const canvas = canvasRef.current;
      if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const display = (att, dist) => {
            if (att == 'gender'){
                var colors = [['Female','#FDBB84'],['Male','#E5604B']];
            }
            else if (att == 'age'){
                var colors = [['70+','#08519C'],['60-69','#08519C'],['50-59','#2C7FB8'],['40-49','#2C7FB8'],['30-39','#41B6C4'],['20-29','#41B6C4'],['10-19','#A1DAB4'],['3-9','#FFFFCC'],['0-2','#FFFFCC']];
            }                                                                                      
            else if (att == 'skinTone'){
                var colors = [['VI','#27190F'],['V','#58402E'],['IV','#766043'],['III','#9D7961'],['II','#CAB4A5'],['I','#E7CBBA']];
            }
            var catamts = [];
            var displayratios = []
            for (let i = 0; i < colors.length; i++){
                var cat = colors[i][0];
                var amount = dist[colors[i][0]] * 225;
                if (i != 0){
                    amount += catamts[i-1];
                }
                catamts.push(amount);
                displayratios.push(cat + ': ' + (Math.round(dist[cat] * 100) / 100).toString())
            }
            var x = 0;
            var y = 0;
            var k = 0;
            for (let i = 0; i < 15; i++) {
                y = i * 51;
                x = 0;
                for (let j = 0; j < 15; j++) {
                    x = j * 51;
                    var curSquare = i*15 + j;
                    if (curSquare > catamts[k]){
                        k += 1;
                    }
                    ctx.fillStyle = colors[k][1];
                    ctx.fillRect(x, y, 50, 50);
                }
            }
            ctx.fillStyle = "black";
            for (let i = 0; i < displayratios.length; i++) {
                var cat = displayratios[i];
                if (dist[colors[i][0]] != 0) {
                    ctx.fillText(cat, 200, catamts[i]*2.5);
                }
            }
        } 
        display(category, distribution[category]);
      } else {
        alert('Browser not supported');
      }
    };

    draw();
  }, [distribution, category]);

  return (
    <canvas ref={canvasRef} className={styles.canvas} width={762} height={765}></canvas>
  );
};

export default Distributions;