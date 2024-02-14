// pages/generate.js

import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

import NavBar from '../components/NavBar';
import NavStyles from '../styles/NavStyles.module.css'
import Analyze from '../components/Analyze';
import AnalyzeStyle from '../styles/Analyze.module.css';

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skintone: {} });
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'

  const handleGenerateClick = async (userInput) => {
    if (isGenerating || userInput.trim() === "") {
      console.log("Either generation in progress or user input is empty.");
      return;
    }

    setIsGenerating(true);
    setError('');

    // Define the data structure for the API request
    const requestData = {
      promptStr: userInput
    };

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
      <div className={NavStyles.CenterNav}>
        <NavBar />
      </div>
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      {error && <p>{error}</p>}
      {isGenerating ? (
        <div className={AnalyzeStyle.loadingContainer}>
          <img src={'/loading_image1.gif'} alt="LoadingGIF" />
        </div>
      ) : (
        images.length > 0 && (
          <>
            <Analyze
              images={images}
              distribution={distribution}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </>
        )
      )}
    </div>
  );
};

export default Generate;
