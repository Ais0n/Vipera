// pages/decoupled.js

import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import AnalyzeImages from '../components/AnalyzeImages';
import AnalyzeDistribution from '../components/AnalyzeDistribution';
import GenerateState from '../components/GenerateState';
import Footer from '../components/Footer';
import style from '../styles/GeneratePage.module.css';

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDoneGenerating, setIsDoneGenerating] = useState(false);
  const [isDoneImage, setIsDoneImage] = useState(false);
  const [isDoneDistribution, setIsDoneDistribution] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skinTone: {}, faceDetectedCount: 0, faceNotDetectedCount: 0});
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'
  const [promptStr, setPromptStr] = useState('');

  const TRENDING_IMAGES = [
    { id: 'post1', src: '/post1.svg', alt: 'Post 1' },
    { id: 'post2', src: '/post2.svg', alt: 'Post 2' },
    { id: 'post3', src: '/post3.svg', alt: 'Post 3' }
  ];

  const ensureImagesSelected = () => {
    setSelectedCategory('images');
  };

  const handleRefreshClick = () => {
    handleGenerateClick(promptStr);
    ensureImagesSelected();
  };


  // Assume all images contains a face for testing, let the new_face_detected_count be the number of images 12
  const combineDistributions = (combinedDistribution, newDistribution) => {
    const totalFaces = combinedDistribution.faceDetectedCount + 12;

    // Helper function to combine two distributions
    const combineCounts = (combDist, newDist, field) => {
      for (const [key, value] of Object.entries(newDist[field])) {
        if (combDist[field][key]) {
          combDist[field][key] = ((combDist[field][key] * combinedDistribution.faceDetectedCount) + (value * 12)) / totalFaces;
        } else {
          combDist[field][key] = (value * 12) / totalFaces;
        }
      }
      // To Ensure the sum is 100%
      let sum = Object.values(combDist[field]).reduce((acc, val) => acc + val, 0);
      let diff = 1 - sum;
      
      // Find the key with the maximum value and adjust it by the difference, to be improved if needed
      let maxKey = Object.keys(combDist[field]).reduce((a, b) => combDist[field][a] > combDist[field][b] ? a : b);
      combDist[field][maxKey] += diff;
    };

    combineCounts(combinedDistribution, newDistribution, 'age');
    combineCounts(combinedDistribution, newDistribution, 'gender');
    combineCounts(combinedDistribution, newDistribution, 'skinTone');

    combinedDistribution.faceDetectedCount += 12;
    combinedDistribution.faceNotDetectedCount += 0;
  };

  /********** The actual function after backend is ready **********/
  // const combineDistributions = (combinedDistribution, newDistribution) => {
  //   const totalFaces = combinedDistribution.faceDetectedCount + newDistribution.face_detected_count;

  //   // Helper function to combine two distributions
  //   const combineCounts = (combDist, newDist, field) => {
  //     for (const [key, value] of Object.entries(newDist[field])) {
  //       if (combDist[field][key]) {
  //         combDist[field][key] = ((combDist[field][key] * combinedDistribution.faceDetectedCount) + (value * newDistribution.face_detected_count)) / totalFaces;
  //       } else {
  //         combDist[field][key] = (value * newDistribution.face_detected_count) / totalFaces;
  //       }
  //     }
      // // Ensure the sum is 100%
      // let sum = Object.values(combDist[field]).reduce((acc, val) => acc + val, 0);
      // let diff = 1 - sum;
      
      // // Find the key with the maximum value and adjust it by the difference, to be improved if needed
      // let maxKey = Object.keys(combDist[field]).reduce((a, b) => combDist[field][a] > combDist[field][b] ? a : b);
      // combDist[field][maxKey] += diff;
  //   };

  //   combineCounts(combinedDistribution, newDistribution, 'age');
  //   combineCounts(combinedDistribution, newDistribution, 'gender');
  //   combineCounts(combinedDistribution, newDistribution, 'skinTone');

  //   combinedDistribution.faceDetectedCount += newDistribution.face_detected_count;
  //   combinedDistribution.faceNotDetectedCount += newDistribution.face_not_detected_count;
  // };


  const handleGenerateClick = async (userInput, append = false) => {
    if (isGenerating || userInput.trim() === "") {
      console.debug("Either generation in progress or user input is empty.");
      return;
    }

    setIsGenerating(true);
    setIsDoneGenerating(false);
    setIsDoneImage(false); 
    setIsDoneDistribution(false); 

    setError('');
    
    // ----- Decoupled Images API Logic ----- //
    //Getting the list of images - would be replaced by the new model later on
    const generate_url = "https://vtsuohpeo0.execute-api.us-east-1.amazonaws.com/Prod/generate"
    const generate_with_id_url = "https://vtsuohpeo0.execute-api.us-east-1.amazonaws.com/Prod/generate_with_ids"
    const ouroboros_api_new_url = "http://18.224.86.65:5001/ouroborosSkin"
    //"http://18.224.86.65:5001/ouroborosp" for parallelized without skintone
    //"http://18.224.86.65:5001/ouroborosnp" for non parallelized without skintone

    const generateRequestData = {
      num: 24,
      prompt: "clear natural portrait or photograph of " + userInput,
      width: 512,
      height: 512,
      num_inference_steps: 31,
      guidance_scale: 12,
      scheduler: "DPMSolverMultistep", 
      negative_prompt: "blurry, black and white image, cartoon, text, painting, building",
    };
    let generateData;
    let predictData;
    let generateWithIdsResponse;
    let generateWithIdsData;
    setPromptStr(userInput);
    try {
      const generateResponse = await fetch(generate_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(generateRequestData)
      });

      if (!generateResponse.ok) {
        throw new Error(`HTTP generate error! status: ${generateResponse.status}`);
      }

      generateData = await generateResponse.json();
      const predictionIDs = generateData;
      while (true) {
        generateWithIdsResponse = await fetch(generate_with_id_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ids: predictionIDs })
        });

        if (!generateWithIdsResponse.ok) {
          throw new Error(`HTTP generate_with_ids error! status: ${generateWithIdsResponse.status}`);
        }
        generateWithIdsData = await generateWithIdsResponse.json();
        if (generateWithIdsData.status === "Images still not processed, please try again in sometime") {
          console.debug("Images still not processed, waiting...");
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
        } else {
          break;
        }
      }

      predictData = generateWithIdsData;
      //predict data is a list of strings (urls of images)
      console.debug("Generate with IDs API Response:", predictData);
      if (append) {
        setImages(prevImages => [...prevImages, ...predictData]); // Append new images
      } else {
        setImages(predictData); // Replace with new images
      }

      setIsDoneGenerating(true);
      //image done generating, display immediately
      setIsDoneImage(true); 
    }
    catch{
      console.error("API Error:", error);
      setError('Failed to generate images. Please try again.');
    }

    // generating distribution
    try {
      const batchSize = 12; // Process images in batches of 20
      const batches = [];
      for (let i = 0; i < predictData.length; i += batchSize) {
        batches.push(predictData.slice(i, i + batchSize));
      }

      const combinedDistribution = { age: {}, gender: {}, skinTone: {}, faceDetectedCount: 0, faceNotDetectedCount: 0 };

      for (const batch of batches) {
        const oroRequestData = {
          imgs: batch
        };
        console.debug("OuroborosAPI Input:", JSON.stringify(oroRequestData));
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
        console.debug("success in oro response");

        const oroData = await oroResponse.json();
        console.debug("Oro API Response:", oroData); // Print the entire API response

        const oroResult = oroData[0];

        // Combine distributions
        combineDistributions(combinedDistribution, oroResult);
      }

      if (append) {
        setDistribution(prevDistribution => {
          const newDistribution = { ...prevDistribution };
          combineDistributions(newDistribution, combinedDistribution);
          return newDistribution;
        });
      }
      else{
        setDistribution(combinedDistribution);
      }
      setIsDoneDistribution(true); 
    } catch (error) {
      console.error("API Error:", error);
      setError('Failed to generate distribution. Please try again.');
    } finally {
      setIsGenerating(false);
    }
    
  };

  const handleGenerateMoreClick = () => {
    handleGenerateClick(promptStr, true);
  };

  return (
    <div>
      <Header />
      <h1 className={style.mainTitle}>Ouroboros</h1>
      <GenerateState isGenerating={isGenerating} isDoneGenerating={isDoneGenerating}/>
      {/* {images.length <= 0 && (
        <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      )} */}
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} ensureImagesSelected={ensureImagesSelected}/>
      {error && <p>{error}</p>}
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
      {isDoneDistribution ? (
        <AnalyzeDistribution
          images={images}
          distribution={distribution}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          resultPrompt={promptStr}
          onRefreshClick={handleRefreshClick}
          onGenerateMoreClick={handleGenerateMoreClick}
          isGenerating={isGenerating}
        />
      ) : isDoneImage ? (
        <AnalyzeImages
          images={images}
          distribution={distribution}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          resultPrompt={promptStr}
          onRefreshClick={handleRefreshClick}
          onGenerateMoreClick={handleGenerateMoreClick}
          isGenerating={isGenerating}
        />
      ) : (
        isGenerating && (
          <div className={style.loadingContainer}>
            <div className={style.loadingSnake}></div>
            <div className={style.loadingText}>
              Please wait...Stable Diffusion is working hard to generate realistic images. May take up to a minute.
            </div>
          </div>
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
