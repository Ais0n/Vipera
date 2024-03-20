// pages/decoupled.js

import APIService from '../api/APIService';
import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

import Header from '../components/Header';
import Analyze from '../components/Analyze';
import GenerateState from '../components/GenerateState';
import style from '../styles/GeneratePage.module.css';

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDoneGenerating, setIsDoneGenerating] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skintone: {} });
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'
  const [promptStr, setPromptStr] = useState('');

  const handleRefreshClick = () => {
    handleGenerateClick(promptStr);
  };

  const handleGenerateClick = async (userInput) => {
    if (isGenerating || userInput.trim() === "") {
      console.log("Either generation in progress or user input is empty.");
      return;
    }

    setIsGenerating(true);
    setIsDoneGenerating(false);
    setError('');
    
    // ----- Decoupled Images API Logic ----- //
    //Getting the list of images - would be replaced by the new model later on
    const predict_lambda_url = "https://vtsuohpeo0.execute-api.us-east-1.amazonaws.com/Prod/predict"
    const ouroboros_api_new_url = "http://18.224.86.65:5002/ouroborosp" 
    //"http://18.224.86.65:5002/ouroborosnp" for non parallelized

    const predictRequestData = {
      prompt: userInput,
      num: 9
    };
    let predictData;
    setPromptStr(userInput);
    try {
      const predictResponse = await fetch(predict_lambda_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(predictRequestData)
      });

      if (!predictResponse.ok) {
        throw new Error(`HTTP predict error! status: ${predictResponse.status}`);
      }

      predictData = await predictResponse.json();
      console.log("Predict API Response:", predictData); // Print the entire API response
      //predict data is a list of strings (urls of images)
      setImages(predictData); // Update the img data
      setIsDoneGenerating(true);
    }
    catch{
      console.error("API Error:", error);
      setError('Failed to generate images. Please try again.');
    }


    //generating distribution
    try{
      const oroRequestData = {
        imgs: predictData
      };
      console.log("OuroborosAPI Input:", JSON.stringify(oroRequestData)); // Print the entire API response
      const oroResponse = await fetch(ouroboros_api_new_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(oroRequestData)
      });

      if (!oroResponse.ok) {
        throw new Error(`HTTP oroboros error! status: ${oroResponse.status}`);
      }
      console.log("success in oro response");

      const oroData = await oroResponse.json();
      console.log("Oro API Response:", oroData); // Print the entire API response

      const oroResult = oroData[0];

      setDistribution({ 
        age: oroResult.age,
        gender: oroResult.gender,
        skinTone: oroResult.skinTone
      });

    } catch (error) {
      console.error("API Error:", error);
      setError('Failed to generate distribution. Please try again.');
    } finally {
      setIsGenerating(false);
    }
    
  };

  return (
    <div>
      <Header />
      <h1 className={style.mainTitle}>Ouroboros</h1>
      <GenerateState isGenerating={isGenerating} isDoneGenerating={isDoneGenerating}/>
      {/* {images.length <= 0 && (
        <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      )} */}
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      {error && <p>{error}</p>}
      {isGenerating ? (
        <>
          <div className={style.loadingContainer}>
            <div className={style.loadingSnake}></div>
            <div className={style.loadingText}>
                Loading...Stable Diffusion is working hard to generate realistic images for you! Wait for 1 min!
            </div>
          </div>
        </>
      ) : (
        images.length > 0 && (
          <>
            <Analyze
              images={images}
              distribution={distribution}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              resultPrompt={promptStr}
              onRefreshClick={handleRefreshClick}
            />
          </>
        )
      )}
    </div>
  );
};

export default Generate;
