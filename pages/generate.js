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
    console.debug("Generating images for prompt:", userInput);
    const apiService = new APIService();
    const result = await apiService.subscribeToModel(prompt);
    // Note: result is an array of objects, where each object contains the image URL and its dimensions
    /* ex: [
      {
        url: "https://fal-cdn.batuhan-941.workers.dev/files/panda/ia1VUJaMbSoqYjGXRfZwt.jpeg", 
        width: 1024, height: 1024, 
        content_type: "image/jpeg"
      }
    ]
      */
    console.debug("Getting images from model:", result.images, result.images[0].url);
    // --- EMD ---- //


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
