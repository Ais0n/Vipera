// pages/generate.js
import APIService from '../api/APIService';
import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

import Header from '../components/Header';
import Analyze from '../components/Analyze';
import AnalyzeStyle from '../styles/Analyze.module.css';

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skintone: {} });
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'
  const [promptStr, setPromptStr] = useState('');

  const handleGenerateClick = async (userInput) => {
    if (isGenerating || userInput.trim() === "") {
      console.log("Either generation in progress or user input is empty.");
      return;
    }

    setIsGenerating(true);
    setError('');

    // @Chloe: Here's the code to fetch images from another model that is much faster with higher quality results as opposed to the ouroboros API
    // console.debug("Generating images for prompt:", userInput);
    // const apiService = new APIService();
    // const resultA = await apiService.subscribeToModel(prompt);
    // const resultB = await apiService.subscribeToModel(prompt);
    // const result = [].concat(resultA.images, resultB.images); // 16 images expected

    // Note: result is an array of objects, where each object contains the image URL and its dimensions
    /* ex: [
      {
        url: "https://fal-cdn.batuhan-941.workers.dev/files/panda/ia1VUJaMbSoqYjGXRfZwt.jpeg", 
        width: 1024, height: 1024, 
        content_type: "image/jpeg"
      }
    ]
      */
    // console.debug("Getting images from model:", result, result[0].url); // , result[0].url
    // --- EMD ---- //
    console.log("printing check")
    
    // ----- Decoupled Images API Logic ----- //
    //Getting the list of images - would be replaced by the new model later on
    // const predict_lambda_url = "https://vtsuohpeo0.execute-api.us-east-1.amazonaws.com/Prod/predict"
    const ouroboros_api_new_url = "http://18.224.86.65:5002/ouroborosp" 
    //"http://18.224.86.65:5002/ouroborosnp" for non parallelized

    // const predictRequestData = {
    //   promptStr: userInput,
    //   num: 16
    // };
    // setPromptStr(userInput);
    try {
    //   const predictResponse = await fetch(predict_lambda_url, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify(predictRequestData)
    //   });

    //   if (!predictResponse.ok) {
    //     throw new Error(`HTTP error! status: ${predictResponse.status}`);
    //   }

      // const predictData = await predictResponse.json();
      // console.log("Predict API Response:", predictData); // Print the entire API response

      // const predictResult = predictData[0];
      // setImages(predictResult.imgs); // Update the img data
      
      /*testing*/
      const imgs = ["https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/D2PNBXYCDE52.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/JOB1MELWFN9O.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/OZMBL5KNA0KC.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/B7R70L1P2L43.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/ID437Y9727LA.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/8BDXCVXYY24B.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/EZPJM7ZHPRQM.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/F27MQHRSYVAH.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/NW0MNSFEYV3K.png","https://weaudit-stablediffusion-imagebucket.s3.amazonaws.com/IVFFFOYIW9DL.png"]
      setImages(imgs);
      
      //start of ouroboros api 
      //currently, both api calls are in the same try catch statment but could be separated in the future
      const oroRequestData = {
        imgs: imgs//predictResult.imgs
      };
      const oroResponse = await fetch(ouroboros_api_new_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(oroRequestData)
      });

      if (!oroResponse.ok) {
        throw new Error(`HTTP error! status: ${oroResponse.status}`);
      }

      const oroData = await oroResponse.json();
      console.debug("Oro API Response:", oroData); // Print the entire API response

      const oroResult = oroData[0];

      setDistribution({ 
        age: oroResult.age,
        gender: oroResult.gender,
        skinTone: oroResult.skinTone
      });

    } catch (error) {
      console.error("API Error:", error);
      setError('Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
    }
    // ----- END Decoupled Images API Logic ----- //
  
    /*
    // ----- Original Images API Logic ----- //
    // Define the data structure for the API request
    const requestData = {
      promptStr: userInput
    };

    setPromptStr(userInput); // Set the prompt string when generation is initiated

    try {
      const response = await fetch("http://18.224.86.65:5001/ouroboros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data); // Print the entire API response

      const result = data[0];

      setImages(result.imgs); // Update the img data
      
      setDistribution({ // Update the distribution data
        age: result.age,
        gender: result.gender,
        skinTone: result.skinTone
      });

    } catch (error) {
      console.error("API Error:", error);
      setError('Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
    }

    // ----- END Original Images API Logic ----- //
    */
  };

  return (
    <div>
      <Header />
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      {error && <p>{error}</p>}
      {isGenerating ? (
        <div className={AnalyzeStyle.loadingContainer}>
          <div className={AnalyzeStyle.loadingGIF}>
            <img src={'/loading_image1.gif'} alt="LoadingGIF" />
          </div>
          <div className={AnalyzeStyle.loadingText}>
              Loading...Stable Diffusion is working hard to generate realistic images for you! Wait for 1 min!
          </div>
      </div>
      ) : (
        images.length > 0 && (
          <>
            <Analyze
              images={images}
              distribution={distribution}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              resultPrompt={promptStr}
            />
          </>
        )
      )}
    </div>
  );
};

export default Generate;
