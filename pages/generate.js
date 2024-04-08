// pages/generate.js
import APIService from '../api/APIService';
import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

import Header from '../components/Header';
import Analyze from '../components/Analyze';
import GenerateState from '../components/GenerateState';
import Footer from '../components/Footer';
import style from '../styles/GeneratePage.module.css';

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDoneGenerating, setIsDoneGenerating] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skintone: {} });
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'
  const [promptStr, setPromptStr] = useState('');
  const [postDone, setPostDone] = useState(false);

  const TRENDING_IMAGES = [
    { id: 'post1', src: '/post1.svg', alt: 'Post 1' },
    { id: 'post2', src: '/post2.svg', alt: 'Post 2' },
    { id: 'post3', src: '/post3.svg', alt: 'Post 3' }
  ];

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

    // @Chloe: Here's the code to fetch images from another model that is much faster with higher quality results as opposed to the ouroboros API
    // console.debug("Generating images for prompt:", userInput);
    // const apiService = new APIService();
    // const resultA = await apiService.subscribeToModel(prompt);
    // const resultB = await apiService.subscribeToModel(prompt);
    // const new_result = [].concat(resultA.images, resultB.images); // 16 images expected
    
    // const imageLinks = [];
    // new_result.forEach(item => {
    //   imageLinks.push(item.url); // Add the new image URL to the array
    // });


    // Note: result is an array of objects, where each object contains the image URL and its dimensions
    /* ex: [
      {
        url: "https://fal-cdn.batuhan-941.workers.dev/files/panda/ia1VUJaMbSoqYjGXRfZwt.jpeg", 
        width: 1024, height: 1024, 
        content_type: "image/jpeg"
      }
    ]
      */
    // console.debug("Getting images from model:", new_result, new_result[0].url); // , result[0].url
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

      // const allImages = [].concat(result.imgs, imageLinks);
      setImages(result.imgs); // Update the img data
      // setImages(imageLinks);
      // setImages(allImages);
      setIsDoneGenerating(true);
      
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
  //document.body.style.margin = 0;

  return (
    <div>
      <Header />
      <h1 className={style.mainTitle}>Ouroboros</h1>
      <GenerateState isGenerating={isGenerating} isDoneGenerating={isDoneGenerating} isPostDone={postDone} />
      {/* {images.length <= 0 && (
        <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      )} */}
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      {!isGenerating && images.length <= 0 && (
        <div className={style.trendingContainer}>
          <h2 className={style.trendingTitle}>Trending discussion posts</h2>
          <div className={style.trendingPosts}>
            {TRENDING_IMAGES.map(image => (
              <div key={image.id} className={style.trendingImageWrapper}>
                <img src={image.src} alt={image.alt} className={style.trendingImage} />
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p>{error}</p>}
      {isGenerating ? (
        <>
          <div className={style.loadingContainer}>
            <div className={style.loadingSnake}></div>
            <div className={style.loadingText}>
                <div className={style.loadingTextItem}>Loading...</div>
                <div className={style.loadingTextItem}>Stable Diffusion is working hard to generate realistic images for you!</div>
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
      <Footer />

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>

    
  );
};

export default Generate;
