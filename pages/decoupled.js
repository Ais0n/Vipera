// pages/decoupled.js

import React, { useEffect, useState, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import AnalyzeImages from '../components/AnalyzeImages';
import AnalyzeDistribution from '../components/AnalyzeDistribution';
import GenerateState from '../components/GenerateState';
import Footer from '../components/Footer';
import style from '../styles/GeneratePage.module.css';
import axios, { all } from 'axios';
import ProcessingIndicator from '../components/Processing.js';
import ImageSummary from '../components/ImageSummary.js';
import * as Utils from '../utils.js';
import * as nanoid from 'nanoid';
import ModalReview from '../components/ModalReview.js';
import { message } from 'antd';

const Generate = () => {
  const [mode, setMode] = useState("A");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDoneGenerating, setIsDoneGenerating] = useState(true);
  const [isDoneImage, setIsDoneImage] = useState(true);
  const [isDoneSceneGraph, setIsDoneSceneGraph] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesRef, setImagesRef] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skinTone: {}, faceDetectedCount: 0, faceNotDetectedCount: 0 });
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'
  const [promptStr, setPromptStr] = useState('');
  const [graph, setGraph] = useState({});
  const [graphSchema, setGraphSchema] = useState({});
  const [metaData, setMetaData] = useState([]);
  const [aggregatedGraph, setAggregatedGraph] = useState({});
  const [badgeContents, setBadgeContents] = useState(undefined);
  const [prompts, setPrompts] = useState([]);
  const [statusInfo, setStatusInfo] = useState(0);
  const [imageNum, setImageNum] = useState(10);
  const [imageIdMap, setImageIdMap] = useState({}); // (For debug mode only) A map that stores for each prompt the IDs of the images that has been used
  const [switchChecked, setSwitchChecked] = useState(false);
  const [groups, setGroups] = useState([]); // Prompt groups
  const [reviewPanelVisible, setReviewPanelVisible] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const [failedImageIds, setFailedImageIds] = useState([]);
  const [retrySceneGraphContext, setRetrySceneGraphContext] = useState(false);
  const [failedImageIdsForMetadata, setFailedImageIdsForMetadata] = useState([]);
  const [retryMetaDataContext, setRetryMetaDataContext] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
  const [tmpSchemaScope, setTmpSchemaScope] = useState(undefined); // Temporary scope for the new node (used in external prompt suggestion)
  const [userModifiedMetadata, setUserModifiedMetadata] = useState(new Set()); // Track user-modified metadata entries by imageId
  
  // Use refs to maintain current state that won't get cleared by React state batching
  const userModifiedMetadataRef = useRef(new Set());
  const metaDataRef = useRef([]); // Ref for metaData to avoid stale closures
  
  // Keep refs in sync with state (but refs take precedence during async operations)
  useEffect(() => {
    userModifiedMetadataRef.current = new Set(userModifiedMetadata);
  }, [userModifiedMetadata]);
  
  useEffect(() => {
    metaDataRef.current = metaData;
    imagesRef.current = images;
  }, [metaData, images]);

  const isDebug = false;
  const baseUrl = '/api';

  const ensureImagesSelected = () => {
    setSelectedCategory('images');
  };

  // Helper function to clear user modifications for specific images or all
  const clearUserModifications = (imageIds = null) => {
    if (imageIds === null) {
      // Clear all user modifications
      setUserModifiedMetadata(new Set());
      userModifiedMetadataRef.current = new Set();
    } else {
      // Clear modifications for specific images
      const newUserModifiedSet = new Set(userModifiedMetadata);
      imageIds.forEach(imageId => newUserModifiedSet.delete(imageId));
      setUserModifiedMetadata(newUserModifiedSet);
      userModifiedMetadataRef.current = new Set(newUserModifiedSet);
    }
  };

  let image_num = imageNum;

  // Function to generate a single image
  async function generateImage(imageId, userInput, maxTries = 10) {
    const genImageUrl = `${baseUrl}/generate-images?prompt=${userInput}&imageId=${imageId}`;
    let tryCount = 0;

    while (tryCount < maxTries) {
      try {
        const response = await axios.get(genImageUrl);
        if (response.status === 200) {
          return response.data.image_path; // Assuming this is an array of image paths
        }
      } catch (error) {
        console.warn(`Attempt ${tryCount + 1} failed for imageId: ${imageId}`, error);
      }
      tryCount++;
    }

    console.error(`Failed to generate image after ${maxTries} tries: imageId ${imageId}`);
    return null; // Indicate failure
  }

  // Function to fetch a single image's data
  async function fetchImageData(imagePath) {
    try {
      const response = await axios.get(imagePath, { responseType: "arraybuffer" });
      return Utils.arrayBufferToBase64(response.data);
    } catch (error) {
      console.error(`Error fetching image data for path: ${imagePath}`, error);
      return null; // Indicate failure
    }
  }

  // Main function to generate new images
  async function generateNewImages(imageIds, userInput, batch) {
    let newImages = [];
    const maxTries = 10;
    const failedImages = []; // Keep track of failed image IDs

    // Generate images in parallel
    let generatedCount = 0;
    const generationResults = await Promise.all(
      imageIds.map(async (imageId) => {
        const imagePath = await generateImage(imageId, userInput, maxTries);

        if (!imagePath) {
          failedImages.push(imageId); // Track failed generation
          return null;
        }

        const base64Data = await fetchImageData(imagePath);
        if (!base64Data) {
          failedImages.push(imageId); // Track failed fetch
          return null;
        }

        setStatusInfo(`Generating images: ${++generatedCount}/${imageIds.length}`);

        return {
          batch,
          imageId,
          data: base64Data,
          path: imagePath,
        };
      })
    );

    // Flatten the results and add to `newImages`
    const successfulImages = generationResults
      .flat()
      .filter((result) => result !== null);

    newImages.push(...successfulImages);

    // Log status
    console.log(
      `Generation complete: ${successfulImages.length} succeeded, ${failedImages.length} failed.`
    );

    // Allow user to regenerate failed images
    if (failedImages.length > 0) {
      console.warn(String(failedImages.length) + " images failed to generate or fetch:", failedImages);
      // messageApi.error(
      //   `${failedImages.length} images failed. You can retry generating the failed ones.`
      // );
    }

    return {
      newImages,
      failedImages, // Return failed images for potential regeneration
    };
  }

  // Retry failed images
  async function retryFailedImages(failedImageIds) {
    if (failedImageIds.length === 0) {
      console.log("No failed images to retry.");
      return;
    }

    try {
      initializeGenerationState();

      console.log(`Retrying failed images: ${failedImageIds}`);
      setStatusInfo("Retrying failed images...");

      const IMAGE_DIR = `/${promptStr.toLowerCase().replace(/ /g, "_")}`

      const { newImages: retriedImages, failedImages: stillFailed } = await generateNewImages(
        failedImageIds,
        promptStr,
        prompts.length
      );

      // Update state
      setImages((prevImages) => [...prevImages, ...retriedImages]);
      setFailedImageIds(stillFailed);

      if (stillFailed.length > 0) {
        console.error("Some images still failed after retry:", stillFailed);
        messageApi.error("Some images still failed after retry. You can retry again.");
      } else {
        messageApi.success("All failed images have been successfully regenerated.");
        // Proceed to further steps only if there are new images
        if (retriedImages.length > 0) {
          // Step 3: Try generating the scene graph
          let updatedGraphSchema = await trySceneGraphGeneration(retriedImages, IMAGE_DIR);

          if (updatedGraphSchema === null) {
            setRetrySceneGraphContext({newImages, IMAGE_DIR});
            throw new Error("Scene graph generation failed. You can retry.");
          } 

          // Update the graph schema by adding the scope of the new prompt to each node
        let schemaScope = tmpSchemaScope ? Utils.lazyPropagate(tmpSchemaScope, retriedImages) : Utils.lazyPropagate(generateSchemaScope(retriedImages, updatedGraphSchema), retriedImages);

        console.log("partial schema:", schemaScope);

          if (schemaScope) {
            Utils.updateGraphSchemaWithScope(updatedGraphSchema, schemaScope, retriedImages.map(image => ({"imageId": image.imageId, "batch": image.batch}))); // add the image IDs to the "_scope" field of all nodes in the graph schema
            console.log("after updating graph schema with scope", updatedGraphSchema);
          
            // Step 4: Try generating metadata
            await tryMetadataGeneration(retriedImages, schemaScope);
          } else {
            console.log("No auto-extended nodes found, skipping metadata generation for retried images");
          }

          // Step 5: Update the graph schema state with the updated schema
          setGraphSchema(updatedGraphSchema); // Trigger re-render
        }
        
        setPrompts((prevPrompts) => [...prevPrompts, promptStr]);
      }
    } catch (error) {
      console.error("Error while retrying failed images:", error);
      messageApi.error("An error occurred while retrying failed images.");
    } finally {
      setIsGenerating(false);
      setIsDoneGenerating(true);
      setTmpSchemaScope(undefined);
    }
  }

  async function getExistingImages(imageIds, IMAGE_DIR) {
    let newImages = [];
    for (let imageId of imageIds) {
      const genImageUrl = `/temp_images${IMAGE_DIR}/${imageId}.png`;
      const imageData = await axios.get(genImageUrl, { responseType: 'arraybuffer' });
      console.log(imageData)
      const base64Image = Utils.arrayBufferToBase64(imageData.data);
      newImages.push({ batch: prompts.length + 1, imageId: imageId, data: base64Image, path: genImageUrl });
    }
    return newImages;
  }

  const generateGraphSchema = async (images, IMAGE_DIR) => {
    /**
     * Generates an initial schema of the scene graph based on provided images.
     * 
     * @param {Array} images - An array of image objects to sample from.
     * @param {string} IMAGE_DIR - The directory path for storing generated graphs.
     * @returns {Object} aggregatedGraph - Merged scene graph data from sampled images.
     * 
     * Example schema of the scene graph:
     * {
     *  "foreground": {
     *    "doctor": {
     *      // children nodes
     *    }
     *  },
     *  "background": {
     *    "office": {},
     *    "light panel": {},
     *    "medical equipment": {}
     *  },
     * }
     */
    
    // randomly sample images
    let sample_size = 1; // could be modified
    let sampleImages = [];
    for (let i = 0; i < sample_size; i++) {
      sampleImages.push(images[i]);
    }

    // check if the scene graph is already generated
    let checkGraphUrl = `${baseUrl}/check-graph?path=/temp_graphs${IMAGE_DIR}.json`;
    let response = await axios.get(checkGraphUrl);
    console.log(response)
    if (response.data.res) {
      return Utils.processSceneGraph(response.data.res, images);
    }

    // get Scene Graph for each image
    let sceneGraphs = [];
    for (let i = 0; i < sampleImages.length; i++) {
      let image = sampleImages[i];
      let genGraphUrl = `${baseUrl}/generate-graph?path=${image.path}&image_dir=${'temp_graphs' + IMAGE_DIR + '.json'}`;
      let response = await axios.get(genGraphUrl);
      console.log(response)
      let metaGraph = response.data.res;
      sceneGraphs.push(Utils.processSceneGraph(metaGraph, images));
    }

    // aggregate the scene graphs, merge leaf values as a list
    let aggregatedGraph = {};
    const aggregateGraphs = (graph, curGraph) => {
      let keys = Object.keys(curGraph);
      for (let key of keys) {
        if (key.startsWith('_')) {
          graph[key] = curGraph[key];
          continue; // skip internal fields
        }
        if (typeof (curGraph[key]) === 'object') {
          if (typeof (graph[key]) === 'undefined') {
            graph[key] = {};
          }
          aggregateGraphs(graph[key], curGraph[key]);
        } else {
          if (typeof (graph[key]) === 'undefined') {
            graph[key] = [];
          }
          graph[key].push(curGraph[key]);
        }
      }
    }
    sceneGraphs.forEach(graph => {
      aggregateGraphs(aggregatedGraph, graph);
    });

    console.log(aggregatedGraph);

    return aggregatedGraph;
  }

  const updateGraphSchemaWithMetaData = (graphSchema, metaData) => {
    let keys = Object.keys(graphSchema);
    for (let key of keys) {
      if (graphSchema[key] instanceof Array) {
        let ok = true;
        for (let item of graphSchema[key]) {
          if (item == metaData[key]) {
            ok = false;
            break;
          }
        }
        if (ok) {
          if (typeof (metaData[key]) != 'undefined') {
            graphSchema[key].push(metaData[key]);
          }
        }
      } else if (typeof (graphSchema[key]) === 'object' && typeof (metaData[key]) !== 'undefined') {
        updateGraphSchemaWithMetaData(graphSchema[key], metaData[key]);
      }
    }
  }

  const generateDataItemForDebug = (schema, imageId, dataItem) => {
    for (let key in schema) {
      if (typeof (schema[key]) === 'object' && !Array.isArray(schema[key])) {
        dataItem[key] = generateDataItemForDebug(schema[key], imageId, dataItem[key] || {});
      } else {
        // randomly choose a value from the array
        if (dataItem && typeof (dataItem[key]) == 'undefined') {
          dataItem[key] = schema[key][Math.floor(Math.random() * schema[key].length)];
        }
      }
    }
    return dataItem;
  }

  const generateMetaData = async (images, graphSchema) => {
    setIsGenerating(true);
    setIsDoneGenerating(false);
    setStatusInfo("Start generating metadata...");

    let _metaData = [], _failedImageIdsForMetadata = [];
    if (isDebug) {
      for (let i = 0; i < metaData.length; i++) {
        _metaData.push(generateDataItemForDebug(graphSchema, "", metaData[i]));
      }
      for (let i = metaData.length; i < images.length; i++) {
        let currentDataItem = generateDataItemForDebug(graphSchema, images[i].imageId, {});
        currentDataItem.batch = prompts.length + 1;
        currentDataItem.metaData = {
          imageId: images[i].imageId,
          batch: prompts.length + 1,
        }
        // currentDataItem.imageId = i;
        _metaData.push(currentDataItem);
      }
    } else {
      console.log("newImages", images);
      const promises = images.map(async (image, index) => {
        let labelFilePath = image.path.replace('temp_images', 'temp_labels');
        labelFilePath = labelFilePath.slice(0, labelFilePath.length - 4) + '.json';
        let checkLabelURL = `${baseUrl}/check-labels?path=${labelFilePath}`;
        let response = await axios.get(checkLabelURL);
        let data, isGenerateNeeded = true;
        if (response.data.res) {
          data = response.data.res;
          isGenerateNeeded = !Utils.isObjectSubset(data, Utils.removeUnderscoreFields(graphSchema));
          console.log(data, graphSchema, isGenerateNeeded);
          // isGenerateNeeded = false;
        }
        
        if (isGenerateNeeded) {
          console.log("wrappedSchema: ", Utils.wrapSchemaForLabeling(graphSchema));
          let getLabelURL = `${baseUrl}/generate-labels?path=${image.path}&schema=${JSON.stringify(Utils.wrapSchemaForLabeling(graphSchema))}&label_dir=${labelFilePath}&feedback=${userFeedback}`;
          try {
            response = await axios.get(getLabelURL);
            data = response.data.res;
          } catch (error) {
            console.error('Error generating labels:', error);
            // messageApi.error('Error generating labels');
            return {
              status: 'failed',
              imageId: image.imageId,
            };
          }
        }

        console.log("before remove", data, graphSchema);
        data = Utils.removeRedundantFields(data, graphSchema); // Sometimes the LLM-generated labels contain redundant fields not in the provided schema, so we need to remove them
        console.log("after remove", data);
        data.batch = image.batch || prompts.length + 1;
        data.metaData = {
          imageId: image.imageId,
          batch: image.batch || prompts.length + 1
        };

        return {
          status: 'success',
          data: data
        };
      });

      let generatedCount = 0, results = [];
      promises.forEach(promise => {
        promise.then(result => {
          generatedCount++;
          if (result.status == 'success') {
            results.push(result.data);
          } else {
            _failedImageIdsForMetadata.push(result.imageId);
          }

          setStatusInfo("Generating metadata: " + generatedCount + "/" + String(promises.length));
        })
      });

      if(_failedImageIdsForMetadata.length > 0) {
        console.error("Some images failed to generate metadata:", _failedImageIdsForMetadata);
        // messageApi.error("Some images failed to generate metadata.");
      }

      // Wait for all promises to complete
      await Promise.all(promises);
      console.log(results)
      _metaData = results;
    }

    setIsGenerating(false);
    setIsDoneGenerating(true);

    return {
      status: _failedImageIdsForMetadata.length > 0 ? 'failed' : 'success',
      data: _metaData,
      failedImageIdsForMetadata: _failedImageIdsForMetadata
    };
  }

  const handleGenerateClick = async (userInput) => {
    console.log("User input:", userInput);

    // Early exit conditions
    if (isGenerating || userInput.trim() === "") {
      alert("Either a generation is in progress or the user input is empty.");
      return;
    }

    // Initialize state
    initializeGenerationState();

    // Format user input for directory
    const IMAGE_DIR = `/${userInput.toLowerCase().replace(/ /g, "_")}`

    try {
      // Step 1: Get or generate image IDs
      const { isImagesExist, imageIds} = await getImageIds(userInput, IMAGE_DIR);

      // Step 2: Generate or fetch images
      const { newImages, failedImages } = await handleImageGeneration(userInput, IMAGE_DIR, isImagesExist, imageIds);

      setImages((prevImages) => [...prevImages, ...newImages]);
      setFailedImageIds(failedImages);

      if (failedImages.length > 0) {
        throw new Error("Some images failed. You can retry generating them.");
      }

      // Proceed to further steps only if there are new images
      if (newImages.length > 0) {
        // Step 3: Try generating the scene graph
        let updatedGraphSchema = await trySceneGraphGeneration(newImages, IMAGE_DIR);

        if(updatedGraphSchema === null) {
          setRetrySceneGraphContext({newImages, IMAGE_DIR});
          throw new Error("Scene graph generation failed. You can retry.");
        } 

        // Update the graph schema by adding the scope of the new prompt to each node
        let schemaScope = tmpSchemaScope ? Utils.lazyPropagate(tmpSchemaScope, newImages) : Utils.lazyPropagate(generateSchemaScope(newImages, updatedGraphSchema), newImages);

        console.log("partial schema:", schemaScope);

        if (schemaScope) {
          Utils.updateGraphSchemaWithScope(updatedGraphSchema, schemaScope, newImages.map(image => ({"imageId": image.imageId, "batch": image.batch}))); // add the image IDs to the "_scope" field of all nodes in the graph schema
          console.log("after updating graph schema with scope", updatedGraphSchema);
          
          // Step 4: Try generating metadata
          await tryMetadataGeneration(newImages, schemaScope);
        } else {
          console.log("No auto-extended nodes found, skipping metadata generation for new prompt");
        }

        // Step 5: Update the graph schema state with the updated schema
        setGraphSchema(updatedGraphSchema); // Trigger re-render
      }
      
      setPrompts((prevPrompts) => [...prevPrompts, userInput]);
    } catch (error) {
      console.error("Error during generation process:", error);
      // messageApi.error(error.message);
    } finally {
      setIsGenerating(false);
      setIsDoneGenerating(true);
      setTmpSchemaScope(undefined);
    }
  };

  //
  // Helper Functions
  //

  // Initialize state for the generation process
  const initializeGenerationState = () => {
    setIsGenerating(true);
    setIsDoneGenerating(false);
    setIsDoneImage(false);
    setIsDoneSceneGraph(false);
    setStatusInfo("Starting image generation...");
    setFailedImageIds([]);
    // Note: We don't clear userModifiedMetadata here to preserve user modifications
    // across different generation sessions
  };

  // Step 1: Get or generate image IDs
  const getImageIds = async (userInput, IMAGE_DIR) => {
    try {
      /* 
        NOTE: For easier debugging, we include a few test prompts (e.g., "A cinematic photo of a doctor").
        All auditing results will be automatically stored if "NEXT_PUBLIC_SAVE_MODE" is set to true in the environmental variables (".env"), so that the results will NOT be calculated again when the test prompts are reused.
      */
      let isImagesExist, imageIds;
      const checkUrl = `${baseUrl}/check-images?path=/temp_images${IMAGE_DIR}`;
      const response = await axios.get(checkUrl);
      console.log("Response from check-images:", response.data);

      if (response.data.res instanceof Array) { // the image ids exist (which means the prompt is a test prompt)
        isImagesExist = true;
        imageIds = response.data.res.map(item => {
          return item.substring(0, item.length - 4); // remove the suffix .png
        });
        if (imageIdMap[userInput] == undefined) { // If the user input is new
          imageIds = imageIds.slice(0, image_num); // get the first image_num images
          let tmp = { ...imageIdMap };
          tmp[userInput] = image_num;
          setImageIdMap(tmp);
        } else {
          imageIds = imageIds.slice(imageIdMap[userInput], imageIdMap[userInput] + image_num); // get the next image_num images starting from the last position
          let tmp = { ...imageIdMap };
          tmp[userInput] += image_num;
          setImageIdMap(tmp);
        }
        return {isImagesExist, imageIds};
      } else if (response.data.res === null) { // the prompt is new; generate new IDs
        isImagesExist = false;
        imageIds = Array.from({ length: image_num }, (_, i) => `${userInput.replace(/ /g, "_")}_${i}`);
      } else {
        throw new Error("Failed to check if the images already exist");
      }
      return {isImagesExist, imageIds};
    } catch (error) {
      console.error("Error fetching image IDs:", error);
      throw new Error("Failed to fetch or generate image IDs.");
    }
  };

  // Step 2: Handle image generation
  const handleImageGeneration = async (userInput, IMAGE_DIR, isImagesExist, imageIds) => {
    try {
      let newImages = [];
      let failedImages = [];

      if (isImagesExist) {
        newImages = await getExistingImages(imageIds, IMAGE_DIR);
      } else {
        const generatedImages = await generateNewImages(imageIds, userInput, prompts.length + 1);
        newImages = generatedImages.newImages;
        failedImages = generatedImages.failedImages;
      }

      return { newImages, failedImages };
    } catch (error) {
      console.error("Error generating images:", error);
      throw new Error("Failed to generate or fetch images.");
    }
  };

  // Step 3: Try generating the scene graph
  async function trySceneGraphGeneration(newImages, IMAGE_DIR) {
    try {
      setStatusInfo("Generating scene graph...");
      let updatedGraphSchema = Utils.deepClone(graphSchema);

      // Generate graph schema only if none exists
      if (Object.keys(graphSchema).length === 0) {
        updatedGraphSchema = await generateGraphSchema(newImages, IMAGE_DIR);
        setGraphSchema(updatedGraphSchema);
        console.log("Updated Graph Schema:", updatedGraphSchema);
      }

      setIsDoneSceneGraph(true);
      return updatedGraphSchema;
    } catch (error) {
      console.error("Error generating scene graph:", error);
      messageApi.error("Scene graph generation failed. You can retry.");
      setIsDoneSceneGraph(false);
      return null;
    }
  }

  // Retry scene graph generation
  async function retrySceneGraphGeneration(newImages, IMAGE_DIR) {
    try {
      initializeGenerationState();
      console.log("Retrying scene graph generation...");
      let updatedGraphSchema = await trySceneGraphGeneration(newImages, IMAGE_DIR);
      if(updatedGraphSchema === null) {
        setRetrySceneGraphContext({newImages, IMAGE_DIR});
        throw new Error("Scene graph generation failed. You can retry.");
      } 
      setRetrySceneGraphContext(undefined);


      // Update the graph schema by adding the scope of the new prompt to each node
      let schemaScope = tmpSchemaScope ? Utils.lazyPropagate(tmpSchemaScope, retriedImages) : Utils.lazyPropagate(generateSchemaScope(retriedImages, updatedGraphSchema), retriedImages);


      console.log("partial schema:", schemaScope);

      if (schemaScope) {
        Utils.updateGraphSchemaWithScope(updatedGraphSchema, schemaScope, newImages.map(image => ({"imageId": image.imageId, "batch": image.batch})));
        console.log("after updating graph schema with scope", updatedGraphSchema);
          
        // Step 4: Try generating metadata
        await tryMetadataGeneration(newImages, schemaScope);
      } else {
        console.log("No auto-extended nodes found, skipping metadata generation for scene graph retry");
      }

      // Step 5: Update the graph schema state with the updated schema
      setGraphSchema(updatedGraphSchema); // Trigger re-render
      
      setPrompts((prevPrompts) => [...prevPrompts, promptStr]);
    } catch (error) {
      console.error("Retry failed for scene graph generation:", error);
      // messageApi.error("Scene graph generation failed again. Please try later.");
    } finally {
      setIsGenerating(false);
      setIsDoneGenerating(true);
      setTmpSchemaScope(undefined);
    }
  }

  // Try generating metadata
  async function tryMetadataGeneration(newImages, partialSchema, newGraph) {
    if (newImages.length == 0) {
      return;
    }
    if(!newGraph) {
      newGraph = Utils.deepClone(graph);
    }
    console.log("tryMetadataGeneration called with:", {
      newImages: newImages.map(img => img.imageId),
      userModifiedMetadata: Array.from(userModifiedMetadata),
      userModifiedMetadataSize: userModifiedMetadata.size
    });
    console.log(newImages, partialSchema)
    try {
      // Generate Meta Data
      let newMetaData, allMetaData = [];
      if (prompts.length > 0) {
        setStatusInfo("Generating metadata...");
        let res = await generateMetaData(newImages, partialSchema);
        setFailedImageIdsForMetadata(res.failedImageIdsForMetadata);
        newMetaData = res.data;
        setRetryMetaDataContext({partialSchema});

        // CRITICAL: Capture the current metaData state RIGHT BEFORE merging
        // Use refs to get the most current state to avoid React state batching issues
        const currentUserModifications = new Set(userModifiedMetadataRef.current);
        let oldMetaData = Utils.deepClone(metaDataRef.current);
        console.log("Current user modifications:", Array.from(currentUserModifications));
        console.log(newMetaData, oldMetaData);
        
        // Custom merge function that preserves user modifications while adding new fields
        const mergePreservingUserModifications = (userModifiedData, newData) => {
          const merged = Utils.deepClone(newData); // Start with new data
          
          // Recursively override with user-modified values
          const overrideUserModifications = (target, userSource) => {
            if (!(target instanceof Object) || !(userSource instanceof Object)) {
              return userSource; // User modification takes precedence
            }
            
            for (const key in userSource) {
              if (key === 'metaData') continue; // Skip metadata field
              
              if (userSource[key] instanceof Object && target[key] instanceof Object) {
                target[key] = overrideUserModifications(target[key], userSource[key]);
              } else {
                target[key] = userSource[key]; // User modification takes precedence
              }
            }
            return target;
          };
          
          return overrideUserModifications(merged, userModifiedData);
        };
        
        newImages.forEach((image, index) => {
          let newItem = newMetaData.find(item => item.metaData && item.metaData.imageId == image.imageId);
          let oldItem = oldMetaData.find(item => item.metaData && item.metaData.imageId == image.imageId);
          if (!newItem) {
            console.log(`No new metadata found for image ${image.imageId}`);
            return;
          }
          if (!oldItem) {
            console.log(`No old metadata found for image ${image.imageId}, treating as new`);
            oldItem = {};
          }
          
          // CRITICAL: Check if this metadata was user-modified at merge time
          const isUserModified = currentUserModifications.has(image.imageId);
          
          let mergedItem;
          if (isUserModified) {
            // If user-modified, preserve user changes while adding new fields
            mergedItem = mergePreservingUserModifications(oldItem, newItem);
          } else {
            // Normal merge - new metadata takes precedence
            mergedItem = Utils.mergeMetadata(oldItem, newItem);
          }
          
          let idx = oldMetaData.findIndex(item => item.metaData && item.metaData.imageId == image.imageId);
          if (idx != -1) {
            oldMetaData[idx] = mergedItem;
          } else {
            oldMetaData.push(mergedItem);
          }
        })

        // IMPORTANT: Also preserve user-modified metadata for images NOT in newImages
        // This ensures user modifications on older images are not lost when new images are processed
        currentUserModifications.forEach(imageId => {
          // Check if this user-modified image was already processed above
          const wasProcessed = newImages.some(img => img.imageId === imageId);
          if (!wasProcessed) {
            // Find the user-modified metadata in the current ref state and ensure it's preserved
            const currentUserModifiedItem = metaDataRef.current.find(item => item.metaData && item.metaData.imageId === imageId);
            if (currentUserModifiedItem) {
              // Find and replace/update in oldMetaData to ensure preservation
              const idx = oldMetaData.findIndex(item => item.metaData && item.metaData.imageId === imageId);
              if (idx !== -1) {
                // Replace with the current user-modified version
                oldMetaData[idx] = Utils.deepClone(currentUserModifiedItem);
              } else {
                // Add if not found (shouldn't happen but safety check)
                oldMetaData.push(Utils.deepClone(currentUserModifiedItem));
              }
            }
          }
        });

        allMetaData = oldMetaData;
        setMetaData(allMetaData);
        console.log("New Metadata:", allMetaData);

        if(res.status == 'failed') {
          setIsGenerating(false);
          setIsDoneGenerating(true);
          throw new Error("Metadata generation failed. You can retry.");
        }
      }

      // Update the graph with statistics
      const updatedGraph = Utils.calculateGraph(allMetaData, partialSchema, newGraph);
      setGraph((prevGraph) => ({...updatedGraph }));
      console.log("Updated Graph:", updatedGraph);
    } catch (error) {
      console.error("Error generating metadata:", error);
      // messageApi.error("Metadata generation failed. You can retry.");
    }
  }

  // Retry metadata generation
  async function retryMetadataGeneration(imageIds) {
    try {
      let newImages = images.filter(image => imageIds.includes(image.imageId));
      console.log("Retrying metadata generation...");
      await tryMetadataGeneration(newImages, retryMetaDataContext.partialSchema);
    } catch (error) {
      console.error("Retry failed for metadata generation:", error);
    }
  }

  const handlePromote = async (suggestion) => {
    setPromptStr(suggestion.newPrompt);
    
    // Helper function to prune object nodes that don't have any attribute descendants
    const pruneObjectsWithoutAttributes = (schema) => {
      const result = {};
      
      // Iterate over the children of the current schema node
      Object.keys(schema).forEach(key => {
        if (key.startsWith('_')) {
          // Metadata is handled during node reconstruction, so skip it here.
          return;
        }
        
        const node = schema[key];
        if (!node || typeof node !== 'object') {
          return;
        }

        if (node._nodeType === 'attribute') {
          // Always keep attribute nodes, as they are the leaves we're looking for.
          result[key] = node;
        } else if (node._nodeType === 'object') {
          // It's an object node. First, recursively prune its children. (Post-order traversal)
          const prunedChildren = pruneObjectsWithoutAttributes(node);
          
          // Now, check if any non-metadata children survived the pruning.
          const hasRemainingDescendants = Object.keys(prunedChildren).some(k => !k.startsWith('_'));
          
          if (hasRemainingDescendants) {
            // If children survived, it means this object has valid attribute descendants.
            // We must keep this object node.
            
            // Reconstruct the node correctly: copy its metadata and add the pruned children.
            const newNode = {};
            Object.keys(node).forEach(prop => {
              if (prop.startsWith('_')) {
                newNode[prop] = node[prop];
              }
            });
            
            // Combine the node's metadata with its surviving (pruned) children.
            result[key] = { ...newNode, ...prunedChildren };
          }
          // If the object has no remaining descendants, we do nothing, effectively pruning it
          // by not adding it to the `result` object.
        }
      });
      
      return result;
    };
    
    // Step 1. Update the graph schema
    let updateSchema = (schema, oldNodeName, newNodeName) => {
      /*
        Update the graph schema by renaming a node and updating its scope.
      */
      if (typeof (schema) != 'object') return;
      let keys = Object.keys(schema);
      for (let key of keys) {
        if (key.startsWith('_')) continue;
        if (key == oldNodeName) {
          // copy the old node's subtree to the new node
          schema[newNodeName] = Utils.deepClone(schema[oldNodeName]);
          // recursively traverse the new node to set its scope
          let traverseNewNode = (curNode) => {
            if (!curNode || typeof(curNode) != 'object') return;
            // Set scope to "auto-extended" type with placeholder for images that will be populated during generation
            curNode._scope = {
              type: 'auto-extended',
              promptIndices: [prompts.length], // Current prompt index (indicator of lazy population)
              images: [] // Placeholder - will be populated in handleGenerateClick
            };
            Object.keys(curNode).forEach((k) => {
              if(k.startsWith('_')) return;
              traverseNewNode(curNode[k]);
            });
          }
          traverseNewNode(schema[newNodeName]);
          // set the new node's scope type to 'fixed'
          schema[newNodeName]._scope.type = 'fixed';
        } else {
          updateSchema(schema[key], oldNodeName, newNodeName);
        }
      }
    }
    let _graphSchema = Utils.deepClone(graphSchema);
    updateSchema(_graphSchema, suggestion.oldNodeName, suggestion.newNodeName);

    // Step 2. Calculate the partial schema (tmpSchemaScope)
    let calculatePartialSchema = (schema, oldNodeName, newNodeName) => {
      /*
        Calculate the partial schema based on the updated graph schema.
        Criteria:
        - Object nodes will be kept if 1) they have attribute descendants, and 2) the scope types of this node as well as its ancestors are auto-extended.
        - Attributes nodes will be kept if the scope types of this node as well as its ancestors are auto-extended.
        - Special case: If the node name = oldNodeName, the whole subtree will be pruned. If the node name = newNodeName, the whole subtree will be kept.
      */
      
      const processNode = (nodeSchema, nodeName, ancestorPath = []) => {
        const result = {};
        
        Object.keys(nodeSchema).forEach(key => {
          if (key.startsWith('_')) {
            // Copy metadata fields
            result[key] = nodeSchema[key];
            return;
          }
          
          const node = nodeSchema[key];
          if (!node || typeof node !== 'object') {
            return;
          }
          
          const currentPath = [...ancestorPath, key];
          
          // Special case: If node name matches oldNodeName, prune the entire subtree
          if (key === oldNodeName) {
            return;
          }
          
          // Special case: If node name matches newNodeName, keep the entire subtree
          if (key === newNodeName) {
            result[key] = Utils.deepClone(node);
            return;
          }
          
          // Check if all ancestors (including current node) have auto-extended scope
          const hasAutoExtendedPath = currentPath.every(pathKey => {
            const pathNode = getNodeAtPath(schema, currentPath.slice(0, currentPath.indexOf(pathKey) + 1));
            return pathNode && pathNode._scope && pathNode._scope.type === 'auto-extended';
          });
          
          if (!hasAutoExtendedPath) {
            return;
          }
          
          if (node._nodeType === 'attribute') {
            // Keep attribute nodes if all ancestors are auto-extended
            result[key] = Utils.deepClone(node);
          } else if (node._nodeType === 'object') {
            // For object nodes, recursively process children first
            const processedChildren = processNode(node, nodeName, currentPath);
            
            // Check if any non-metadata children survived
            const hasAttributeDescendants = Object.keys(processedChildren).some(k => !k.startsWith('_'));
            
            if (hasAttributeDescendants) {
              // Keep object node with its surviving children
              const newNode = {};
              Object.keys(node).forEach(prop => {
                if (prop.startsWith('_')) {
                  newNode[prop] = node[prop];
                }
              });
              result[key] = { ...newNode, ...processedChildren };
            }
          }
        });
        
        return result;
      };
      
      // Helper function to get node at a specific path
      const getNodeAtPath = (rootSchema, path) => {
        let current = rootSchema;
        for (const pathSegment of path) {
          if (!current || !current[pathSegment]) {
            return null;
          }
          current = current[pathSegment];
        }
        return current;
      };
      
      return processNode(schema, null);
    }
    
    let newTmpSchemaScope = calculatePartialSchema(_graphSchema, suggestion.oldNodeName, suggestion.newNodeName);
    console.log("newTmpSchemaScope", newTmpSchemaScope);
    
    // Add placeholders to all nodes that are included in the partial schema
    // const addPlaceholdersToPartialSchema = (graphSchema, partialSchema) => {
    //   const traverseAndAddPlaceholders = (gSchema, pSchema) => {
    //     if (!pSchema || typeof pSchema !== 'object') return;
    //     if (!pSchema._scope.promptIndices) pSchema._scope.promptIndices = [];
    //     if (!pSchema._scope.promptIndices.includes(prompts.length)) pSchema._scope.promptIndices.push(prompts.length); // Add next prompt index (indicator of lazy propagation)

    //     Object.keys(pSchema).forEach(key => {
    //       if (key.startsWith('_')) return;
          
    //       // If this key exists in both schemas, add placeholder to graph schema node
    //       if (gSchema[key] && typeof gSchema[key] === 'object') {
    //         traverseAndAddPlaceholders(gSchema[key], pSchema[key]);
    //       }
    //     });
    //   };
      
    //   traverseAndAddPlaceholders(graphSchema, partialSchema);
    // };
    
    // addPlaceholdersToPartialSchema(_graphSchema, newTmpSchemaScope);
    
    setTmpSchemaScope(newTmpSchemaScope);
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    let updateGraph = (graph, suggestion) => {
      if (!graph || !graph.children) return;
      for (let child of graph.children) {
        if (child.name == suggestion.oldNodeName) {
          let newNode = Utils.deepClone(child);
          newNode.name = suggestion.newNodeName;
          const traverseGraph = (curNode) => {
            // if (!curNode || !curNode.children) return;
            // for (let i = 0; i < curNode.children.length; i++) {
            //   if (curNode.children[i].type == "attribute") {
            //     curNode.children[i] = { name: curNode.children[i].name, type: "attribute", count: 0, children: [] };
            //   } else {
            //     traverseGraph(curNode[i]);
            //   }
            // }
            if (!curNode || typeof(curNode) != 'object' || !curNode.type) return;
            curNode.count = 0;
            curNode.imageInfo = [];
            curNode._scope = [];
            if (curNode.type == 'attribute') {
              delete curNode.list;
              delete curNode.values;
            }
            if (!curNode.children) return;
            curNode.children.forEach((child) => {
              traverseGraph(child);
            });
          }
          traverseGraph(newNode);
          graph.children.push(newNode);
          break;
        } else {
          updateGraph(child, suggestion);
        }
      }
    }
    let _graph = Utils.deepClone(graph);
    updateGraph(_graph, suggestion);
    setGraph(_graph);
    console.log("updatedGraph", _graph);
  }

  const handleExternal = async (suggestion) => {
    setIsGenerating(true);
    setIsDoneGenerating(false);
    setStatusInfo("Start applying the suggestion...");
    // update the schema (but does not store the new value)
    let updateSchema = (schema, suggestion) => {
      if (typeof (schema) != 'object') return;
      let keys = Object.keys(schema);
      for (let key of keys) {
        if (key == suggestion.parentNodeName) {
          schema[key][suggestion.newNodeName] = {
            _nodeType: "attribute",
            _candidateValues: Utils.deepClone(suggestion.candidateValues), // TO BE MODIFIED
            _scope: schema[key]._scope ? Utils.deepClone(schema[key]._scope) : []
          }
        } else if (typeof (schema[key]) == 'object') {
          updateSchema(schema[key], suggestion);
        }
      }
    }
    let _graphSchema = Utils.deepClone(graphSchema);
    updateSchema(_graphSchema, suggestion);
    // setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);

    // use the new schema to relabel the images (get new metadata)
    setStatusInfo("Starting generating metadata for the new schema...");
    let res = await generateMetaData(images, _graphSchema);
    if(res.status == 'failed') {
      setIsGenerating(false);
      setIsDoneGenerating(true);
      messageApi.error("Failed to generate metadata for the new schema.");
      return;
    }
    let newMetaData = res.data;
    setMetaData(newMetaData);

    // store the new schema
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);

    // update the graph (loading)
    const updateGraph = (graph, suggestion) => {
      if (!graph || !graph.children) return;
      for (let child of graph.children) {
        if (child.name == suggestion.parentNodeName) {
          let newNode = { name: suggestion.newNodeName, children: [], count: 0, type: "attribute" };
          child.children.push(newNode);
          break;
        } else {
          updateGraph(child, suggestion);
        }
      }
    }
    let _graph = Utils.deepClone(graph);
    updateGraph(_graph, suggestion);
    console.log(_graph)
    setGraph(_graph);

    
    setStatusInfo(99);

    // update the schema with the new metadata
    for (let item of newMetaData) {
      updateGraphSchemaWithMetaData(_graphSchema, item);
    }

    // store the new schema
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);

    // calculate the graph with statistics
    _graph = Utils.calculateGraph(newMetaData, _graphSchema, Utils.deepClone(_graph));
    console.log(_graph)
    setGraph(_graph);

    setIsGenerating(false);
    setIsDoneGenerating(true);
  }

  const handleSuggestionButtonClick = (suggestion, type) => {
    if (isGenerating) {
      console.log("Generation in progress. Please wait...");
      return;
    }
    if (type == 'promote') {
      handlePromote(suggestion);
    } else if (type == 'external') {
      handleExternal(suggestion);
    }
  }

  const handleNodeEdit = (contextMenuData, newNode, useSceneGraph=true) => {
    let { nodeName: newNodeName, nodeType: newNodeType, candidateValues, scope } = Utils.deepClone(newNode);
    newNodeName = newNodeName.toLowerCase(); // Normalize to lowercase
    candidateValues = candidateValues == '' ? [] : candidateValues.split(',').map(v => v.trim());
    // calculate the path to the root
    let pathToRoot = useSceneGraph ? getTreeNodePath(contextMenuData) : [contextMenuData.name];
    let oldNodeName = pathToRoot[pathToRoot.length - 1];
    // 1. update the schema
    let _graphSchema = Utils.deepClone(graphSchema);
    let curNode = getSchemaNodeFromPath(pathToRoot.slice(0, -1), _graphSchema); // go to the last but one node (the parent of the node to be edited)
    let oldNode = Utils.deepClone(curNode[oldNodeName]);
    delete curNode[oldNodeName];
    curNode[newNodeName] = {
      ...oldNode,
      "_nodeType": newNodeType,
      ...(newNodeType == "attribute" && { "_candidateValues": candidateValues }),
      "_scope": scope,
    }
    updateSchemaPathWithScope(pathToRoot.slice(0, -1), scope);
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    // 2. update the graph
    let _graph = Utils.deepClone(graph);
    curNode = _graph;
    for (let i = 0; i < pathToRoot.length; i++) {
      curNode = curNode.children.find(node => node.name === pathToRoot[i]);
    }
    curNode.name = newNodeName;
    curNode.type = newNodeType;
    if (newNodeType == "attribute") {
      curNode._candidateValues = candidateValues;
    }

    // 3. update metadata
    let oldScope = oldNode._scope;
    let newScope = scope;
    pathToRoot[pathToRoot.length - 1] = newNodeName;
    let partialSchema = getPartialSchema(pathToRoot, _graphSchema);
    console.log("oldScope", oldScope);
    console.log("newScope", newScope);
    console.log("partialSchema", partialSchema);
    let newMetaData = Utils.deepClone(metaData);
    // Extract scope images for both old and new scopes
    const oldScopeImages = oldScope.images || (Array.isArray(oldScope) ? oldScope : []);
    const newScopeImages = newScope.images || (Array.isArray(newScope) ? newScope : []);
    
    // For images in the old scope, update the metadata
    for(let i = 0; i < newMetaData.length; i++) {
      let item = newMetaData[i];
      if (oldScopeImages.some(scopeImg => scopeImg.imageId == item.metaData.imageId && scopeImg.batch == item.metaData.batch)) {
        let newItem = Utils.deepClone(item);
        let curNode = getSchemaNodeFromPath(pathToRoot.slice(0, -1), newItem);
        console.log("curNode", curNode);
        if (curNode) {
          curNode[newNodeName] = curNode[oldNodeName];
          delete curNode[oldNodeName];
        }
        newMetaData[i] = newItem;
      }
    }
    setMetaData(newMetaData);
    console.log("newMetaData", newMetaData);
    // calculate the graph with statistics
    _graph = Utils.calculateGraph(newMetaData, _graphSchema, Utils.deepClone(_graph));
    console.log("updatedGraph", _graph);
    // For images in the new scope but not in the old scope, generate new metadata
    let newImages = images.filter(image => 
      newScopeImages.some(scopeImg => scopeImg.imageId == image.imageId && scopeImg.batch == image.batch) && 
      oldScopeImages.every(scopeImg => scopeImg.imageId != image.imageId || scopeImg.batch != image.batch)
    );
    console.log("newImages", newImages);
    if (newImages.length > 0) {
      tryMetadataGeneration(newImages, partialSchema, _graph);
    } else {
      setGraph(_graph);
    }

  }

  const handleNodeAdd = (contextMenuData, newNode, useSceneGraph=true) => {
    let { nodeName: newNodeName, nodeType: newNodeType, candidateValues, scope } = Utils.deepClone(newNode);
    newNodeName = newNodeName.toLowerCase(); // Normalize to lowercase
    candidateValues = candidateValues == '' ? [] : candidateValues.split(',').map(v => v.trim());
    // calculate the path to the root
    let pathToRoot = useSceneGraph ? getTreeNodePath(contextMenuData) : [];
    // update the schema
    let _graphSchema = Utils.deepClone(graphSchema);
    let curNode = getSchemaNodeFromPath(pathToRoot, _graphSchema);
    curNode[newNodeName] = {
      "_nodeType": newNodeType,
      ...(newNodeType == "attribute" && { "_candidateValues": candidateValues }),
      "_scope": scope,
    }
    updateSchemaPathWithScope(pathToRoot.slice(0, -1), scope);
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    // update the graph
    let _graph = Utils.deepClone(graph);
    curNode = getGraphNodeFromPath(pathToRoot, _graph);
    curNode.children.push({ name: newNodeName, children: [], count: 0, type: newNodeType });
    setGraph(_graph);
    console.log("updatedGraph", _graph);

    if (newNodeType == 'attribute') {
      let partialSchema = getPartialSchema([...pathToRoot, newNodeName], _graphSchema);
      console.log("partialSchema", partialSchema);
      const scopeImages = scope.images || (Array.isArray(scope) ? scope : []);
      tryMetadataGeneration(images.filter(image => scopeImages.some(scopeImg => scopeImg.imageId == image.imageId && scopeImg.batch == image.batch)), partialSchema, _graph);
    }
    
  }

  const handleNodeRelabel = async (contextMenuData, config, useSceneGraph=true) => {
    console.log("relabel: ", contextMenuData, config, useSceneGraph);
    let { newCandidateValues, relabelMode } = Utils.deepClone(config);
    newCandidateValues = newCandidateValues == '' ? [] : newCandidateValues.split(',').map(v => v.trim());
    
    // get the path to the root
    let pathToRoot = useSceneGraph ? getTreeNodePath(contextMenuData) : [contextMenuData.name];
    let partialSchema = Utils.deepClone(graphSchema);
    let curNode = partialSchema;
    for (let i = 0; i < pathToRoot.length - 1; i++) {
      curNode = curNode[pathToRoot[i]];
    }
    
    // Get the target node to relabel
    let targetNodeName = pathToRoot[pathToRoot.length - 1];
    let targetNode = curNode[targetNodeName];
    
    if (!targetNode) {
      console.error("Target node not found for relabeling");
      messageApi.error("Target node not found for relabeling");
      return;
    }
    
    // Store old candidate values for comparison
    let oldCandidateValues = targetNode._candidateValues || [];
    
    // Update candidate values in the schema
    if (newCandidateValues.length > 0) {
      targetNode._candidateValues = Utils.deepClone(newCandidateValues);
    } else {
      delete targetNode._candidateValues;
    }
    
    // Get images in scope for the target node
    let scopeImages = [];
    if (targetNode._scope && targetNode._scope.images) {
      scopeImages = targetNode._scope.images;
    } else if (Array.isArray(targetNode._scope)) {
      // Legacy scope format
      scopeImages = targetNode._scope.map(idx => images[idx]).filter(img => img);
    } else {
      // If no specific scope, use all images
      scopeImages = images.map((img, idx) => ({ 
        imageId: img.imageId, 
        batch: img.batch || prompts.length + 1 
      }));
    }
    
    console.log("Scope images for relabeling:", scopeImages);
    
    let imagesToRelabel = [];
    
    if (relabelMode === 1) {
      // Mode 1: Relabel all images within scope
      imagesToRelabel = scopeImages;
    } else if (relabelMode === 2) {
      // Mode 2: Only relabel images affected by candidate value changes
      if (arraysEqual(oldCandidateValues, newCandidateValues)) {
        messageApi.info("No changes in candidate values, no relabeling needed");
        return;
      }
      
      // Find images that need relabeling based on label changes
      imagesToRelabel = scopeImages.filter(scopeImg => {
        let existingMetadata = metaData.find(m => 
          m.metaData.imageId === scopeImg.imageId && 
          m.metaData.batch === scopeImg.batch
        );
        
        if (!existingMetadata) return true; // New images need labeling
        
        // Check if existing label might be affected by candidate value changes
        let existingLabel = getNestedValue(existingMetadata, pathToRoot);
        
        // If old candidate values existed and current label is not in new values
        if (oldCandidateValues.length > 0 && newCandidateValues.length > 0) {
          return oldCandidateValues.includes(existingLabel) && !newCandidateValues.includes(existingLabel);
        }
        
        // If transitioning from no constraints to constraints or vice versa
        return oldCandidateValues.length !== newCandidateValues.length;
      });
    }
    
    if (imagesToRelabel.length === 0) {
      messageApi.info("No images need relabeling");
      return;
    }
    
    console.log(`Relabeling ${imagesToRelabel.length} images in mode ${relabelMode}`);
    
    // Convert scope images back to full image objects for relabeling
    let imageObjectsToRelabel = imagesToRelabel.map(scopeImg => 
      images.find(img => img.imageId === scopeImg.imageId && img.batch === scopeImg.batch)
    ).filter(img => img);
    
    // Update the global schema
    setGraphSchema(partialSchema);
    
    // Trigger metadata generation for the affected images
    try {
      const res = await generateMetaData(imageObjectsToRelabel, partialSchema);
      if (res.status === 'success') {
        // Mark the relabeled images as user-modified
        const newUserModifiedSet = new Set(userModifiedMetadata);
        imageObjectsToRelabel.forEach(img => {
          newUserModifiedSet.add(img.imageId);
        });
        setUserModifiedMetadata(newUserModifiedSet);
        // CRITICAL: Also update the ref
        userModifiedMetadataRef.current = new Set(newUserModifiedSet);
        
        // Update metadata with the new results
        const newMetaData = Utils.deepClone(metaData);
        res.data.forEach(newItem => {
          const index = newMetaData.findIndex(item => 
            item.metaData.imageId === newItem.metaData.imageId
          );
          if (index !== -1) {
            newMetaData[index] = newItem;
          } else {
            newMetaData.push(newItem);
          }
        });
        setMetaData(newMetaData);
        
        // Update the graph
        const updatedGraph = Utils.calculateGraph(newMetaData, partialSchema, Utils.deepClone(graph));
        setGraph(updatedGraph);
        
        messageApi.success(`Successfully relabeled ${imageObjectsToRelabel.length} images`);
      }
    } catch (error) {
      console.error("Error during relabeling:", error);
      messageApi.error("Error occurred during relabeling");
    }
  }
  
  // Helper function to check if two arrays are equal
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }
  
  // Helper function to get nested value from metadata
  const getNestedValue = (obj, path) => {
    let current = obj;
    for (let key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  const handleLabelEditSave = (newData) => {
    console.log(newData);
    let newMetaData = Utils.deepClone(metaData);
    let index = newMetaData.findIndex(item => item.metaData.imageId == newData.data.imageId);
    newMetaData[index] = { ...Utils.deepClone(newData.metaData), batch: newData.data.batch, metaData: newData.data };
    
    // Mark this metadata as user-modified
    const newUserModifiedSet = new Set(userModifiedMetadata);
    newUserModifiedSet.add(newData.data.imageId);
    setUserModifiedMetadata(newUserModifiedSet);
    // CRITICAL: Also update the ref
    userModifiedMetadataRef.current = new Set(newUserModifiedSet);
    
    setMetaData(newMetaData);
    console.log('newMetaData', newMetaData);
    let _graph = Utils.calculateGraph(newMetaData, graphSchema, Utils.deepClone(graph));
    console.log('_graph', _graph);
    setGraph(_graph);
  }

  const handleReviewResults = ({ updatedMetaData, textAreaValue }) => {
    console.log("handleReviewResults called with:", metaData, updatedMetaData)
    
    // Track which metadata entries were modified by the user
    const newUserModifiedSet = new Set(userModifiedMetadata);
    
    // Helper function to deep compare objects (excluding metaData field)
    const deepCompareExcludingMetaData = (obj1, obj2) => {
      if (obj1 === obj2) return true;
      if (!obj1 || !obj2) return false;
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
      
      const keys1 = Object.keys(obj1).filter(k => k !== 'metaData');
      const keys2 = Object.keys(obj2).filter(k => k !== 'metaData');
      
      if (keys1.length !== keys2.length) return false;
      
      for (let key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepCompareExcludingMetaData(obj1[key], obj2[key])) return false;
      }
      return true;
    };
    
    // Compare old and new metadata to identify user modifications
    updatedMetaData.forEach((newItem, index) => {
      const oldItem = metaData[index];
      if (oldItem && newItem.metaData && newItem.metaData.imageId) {
        // Use deep comparison instead of JSON.stringify
        if (!deepCompareExcludingMetaData(oldItem, newItem)) {
          newUserModifiedSet.add(newItem.metaData.imageId);
          console.log(`Marking image ${newItem.metaData.imageId} as user-modified`);
        }
      }
    });
    
    console.log("User modified metadata set:", newUserModifiedSet);
    setUserModifiedMetadata(newUserModifiedSet);
    // CRITICAL: Also update the ref to ensure it's not lost
    userModifiedMetadataRef.current = new Set(newUserModifiedSet);
    
    setMetaData(updatedMetaData);
    let _graph = Utils.calculateGraph(updatedMetaData, graphSchema, Utils.deepClone(graph));
    console.log(_graph)
    setGraph(_graph);
    if (textAreaValue && textAreaValue !== '') {
      setUserFeedback(textAreaValue);
    }
  }

  //////////////////////////////////////////////////////////////////
  // Helper functions for tree node and schema node manipulation
  //////////////////////////////////////////////////////////////////
  const getTreeNodePath = (graphNode) => {
    /**
     * Recursively finds the path from the root to the given tree node.
     * Note: 'Tree node' is different from 'Graph Node'.
     * Format of Tree nodes: {data, depth, height, parent, x, y, ...}
     * Format of Graph nodes: {children, name, type, count, imageInfo, (list), (values), ...}
     */
    let path = [];
    let curNode = graphNode;
    while (curNode.data.name != 'root') {
      path.push(curNode.data.name);
      curNode = curNode.parent;
    }
    path = path.reverse();
    return path;
  }

  const getSchemaNodeFromPath = (path, schema = graphSchema) => {
    /**
     * Recursively finds the schema node corresponding to a given path.
     */
    let curNode = schema;
    for (let i = 0; i < path.length; i++) {
      if (typeof (curNode) == 'object') {
        curNode = curNode[path[i]];
      } else {
        return null;
      }
    }
    return curNode;
  }

  const getGraphNodeFromPath = (path, _graph = graph) => {
    /**
     * Recursively finds the graph node corresponding to a given path.
     */
    let curNode = _graph;
    for (let i = 0; i < path.length; i++) {
      if (typeof (curNode) == 'object') {
        curNode = curNode.children.find(node => node.name === path[i]);
      } else {
        return null;
      }
    }
    return curNode; 
  }

  const getSchemaNodeFromTreeNode = (treeNode, schema = graphSchema) => {
    /**
     * Recursively finds the schema node corresponding to a given tree node.
     */

    // get the path from root to the tree node
    let path = getTreeNodePath(treeNode);
    // find the schema node
    return getSchemaNodeFromPath(path, schema);
  }

  const updateSchemaPathWithScope = (path, scope, schema = graphSchema) => {
    /**
     * For all nodes on the path within graphSchema, add the scope to the "_scope" field.
     * This is used to update all ancestor nodes when a schema node is modified.
     * Enhanced to handle new scope structure.
     */
    let curNode = schema;
    
    // Helper function to merge scopes
    const mergeScopes = (existingScope, newScope) => {
      // Handle new scope structure
      if (newScope && typeof newScope === 'object' && newScope.type) {
        return newScope; // Replace with new scope structure
      }
      
      // Handle legacy scope (array) being merged with new scope
      if (Array.isArray(existingScope) && newScope && typeof newScope === 'object' && newScope.images) {
        return {
          type: newScope.type || 'auto-extended',
          promptIndices: newScope.promptIndices || [],
          images: [...new Set([...existingScope, ...(newScope.images || [])])]
        };
      }
      
      // Handle both being new scope structure
      if (existingScope && existingScope.type && newScope && newScope.type) {
        const existingImages = existingScope.images || [];
        const newImages = newScope.images || [];
        const existingIndices = existingScope.promptIndices || [];
        const newIndices = newScope.promptIndices || [];
        
        return {
          type: newScope.type, // Use the new scope's type
          promptIndices: [...new Set([...existingIndices, ...newIndices])],
          images: [...new Set([...existingImages, ...newImages])]
        };
      }
      
      // Handle legacy array scope
      if (Array.isArray(existingScope) && Array.isArray(newScope)) {
        return [...new Set([...existingScope, ...newScope])];
      }
      
      // Default case
      return newScope || existingScope;
    };
    
    // Update the root node's _scope first
    schema._scope = mergeScopes(schema._scope, scope);
    
    for (let i = 0; i < path.length; i++) {
      if (typeof (curNode) == 'object') {
        curNode = curNode[path[i]];
        if (curNode) {
          curNode._scope = mergeScopes(curNode._scope, scope);
        }
      } else {
        return null;
      }
    }
  }

  const getPartialSchema = (path, schema) => {
    /**
     * Build a partial schema based on the path within schema.
     */
    let partialSchema = {};
    let curPartialSchemaNode = partialSchema, curNode = schema;
    for (let i = 0; i < path.length; i++) {
      if (typeof (curNode) == 'object') {
        curPartialSchemaNode[path[i]] = {
          _nodeType: curNode[path[i]]._nodeType,
          ...(curNode[path[i]]._nodeType == "attribute" && { _candidateValues: curNode[path[i]]._candidateValues }),
          _scope: curNode[path[i]]._scope
        };
        curPartialSchemaNode = curPartialSchemaNode[path[i]];
        curNode = curNode[path[i]];
      } else {
        return null;
      }
    }

    if (typeof(curNode) == 'object') {
      for (let key in curNode) {
        if (!key.startsWith('_')) {
          curPartialSchemaNode[key] = Utils.deepClone(curNode[key]);
        }
      }
    }
    return partialSchema;

  }

  // Helper function to generate schema scope based on auto-extended criteria
  const generateSchemaScope = (newImages, currentGraphSchema) => {
    if (prompts.length === 0) {
      // For the first prompt, use the entire schema
      return currentGraphSchema;
    }

    // Convert new images to scope format
    const newImageScope = newImages.map(image => ({
      imageId: image.imageId,
      batch: image.batch
    }));

    // Step 1: Create schema with only auto-extended nodes, pruning fixed nodes entirely
    const createAutoExtendedOnlySchema = (schema) => {
      const result = {};
      
      Object.keys(schema).forEach(key => {
        if (key.startsWith('_')) {
          // Copy metadata fields
          result[key] = schema[key];
          return;
        }
        
        const node = schema[key];
        if (node && typeof node === 'object') {
          // Skip fixed nodes entirely (prune the whole branch)
          if (node._scope && node._scope.type !== 'auto-extended') {
            return;
          }
          
          // Include auto-extended nodes (both attribute and object)
          if (node._scope && node._scope.type === 'auto-extended') {
            const clonedNode = Utils.deepClone(node);
            
            // Add new images to the scope for attribute nodes
            if (node._nodeType === 'attribute') {
              if (clonedNode._scope.images) {
                // Merge existing images with new images, avoiding duplicates
                const existingImages = clonedNode._scope.images;
                const mergedImages = [...existingImages];
                
                newImageScope.forEach(newImg => {
                  if (!existingImages.some(existing => 
                    existing.imageId === newImg.imageId && existing.batch === newImg.batch
                  )) {
                    mergedImages.push(newImg);
                  }
                });
                
                clonedNode._scope.images = mergedImages;
              } else {
                // If no images array exists, create one with new images
                clonedNode._scope.images = [...newImageScope];
              }
            }
            
            result[key] = clonedNode;
          } else if (node._nodeType === 'object') {
            // For object nodes without auto-extended scope, recursively process children
            const childSchema = createAutoExtendedOnlySchema(node);
            if (Object.keys(childSchema).some(k => !k.startsWith('_'))) {
              // Only include if there are non-metadata children
              result[key] = {
                ...node,
                ...childSchema
              };
            }
          }
        }
      });
      
      return result;
    };

    // Step 2: Prune object nodes that don't have any attribute descendants
    const pruneObjectsWithoutAttributes = (schema) => {
      const result = {};
      
      // Iterate over the children of the current schema node
      Object.keys(schema).forEach(key => {
        if (key.startsWith('_')) {
          // Metadata is handled during node reconstruction, so skip it here.
          return;
        }
        
        const node = schema[key];
        if (!node || typeof node !== 'object') {
          return;
        }

        if (node._nodeType === 'attribute') {
          // Always keep attribute nodes, as they are the leaves we're looking for.
          result[key] = node;
        } else if (node._nodeType === 'object') {
          // It's an object node. First, recursively prune its children. (Post-order traversal)
          const prunedChildren = pruneObjectsWithoutAttributes(node);
          
          // Now, check if any non-metadata children survived the pruning.
          const hasRemainingDescendants = Object.keys(prunedChildren).some(k => !k.startsWith('_'));
          
          if (hasRemainingDescendants) {
            // If children survived, it means this object has valid attribute descendants.
            // We must keep this object node.
            
            // Reconstruct the node correctly: copy its metadata and add the pruned children.
            const newNode = {};
            Object.keys(node).forEach(prop => {
              if (prop.startsWith('_')) {
                newNode[prop] = node[prop];
              }
            });
            
            // Combine the node's metadata with its surviving (pruned) children.
            result[key] = { ...newNode, ...prunedChildren };
          }
          // If the object has no remaining descendants, we do nothing, effectively pruning it
          // by not adding it to the `result` object.
        }
      });
      
      return result;
    };

    // Create partial schema using two-step process
    const createAutoExtendedSchema = (schema) => {
      // Step 1: Keep only auto-extended nodes, prune fixed branches
      const autoExtendedOnly = createAutoExtendedOnlySchema(schema);
      
      // Step 2: Remove object nodes without attribute descendants
      return pruneObjectsWithoutAttributes(autoExtendedOnly);
    };

    const autoExtendedSchema = createAutoExtendedSchema(currentGraphSchema);
    
    // If no auto-extended nodes found, return null to skip labeling
    if (Object.keys(autoExtendedSchema).every(k => k.startsWith('_'))) {
      return null;
    }
    
    return autoExtendedSchema;
  };

  const treeUtils = {getTreeNodePath, getSchemaNodeFromPath, getSchemaNodeFromTreeNode};

  return (
    <div>
      {contextHolder}
      <Header mode={mode} setMode={setMode}/>
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} ensureImagesSelected={ensureImagesSelected} promptStr={promptStr} setPromptStr={setPromptStr} imageNum={imageNum} setImageNum={setImageNum} failedImageIds={failedImageIds} retryFailedImages={retryFailedImages} retrySceneGraphContext={retrySceneGraphContext} retrySceneGraphGeneration={retrySceneGraphGeneration} failedImageIdsForMetadata={failedImageIdsForMetadata} retryMetadataGeneration={retryMetadataGeneration}/>

      {!isDoneGenerating && <ProcessingIndicator statusInfo={statusInfo} setReviewPanelVisible={setReviewPanelVisible} />}
      <ModalReview isOpen={reviewPanelVisible} images={images} metaData={metaData} graph={graph} onSave={handleReviewResults} onClose={() => setReviewPanelVisible(false)}></ModalReview>
      {prompts.length > 0 && <div className={style.analyzeView}>
        <h1>Analyze</h1>
        <ImageSummary mode={mode} images={images} imagesRef={imagesRef} metaData={metaData} graph={graph} setGraph={setGraph} graphSchema={graphSchema} prompts={prompts} switchChecked={switchChecked} setSwitchChecked={setSwitchChecked} handleSuggestionButtonClick={handleSuggestionButtonClick} handleNodeEdit={handleNodeEdit} handleNodeAdd={handleNodeAdd} handleNodeRelabel={handleNodeRelabel} handleLabelEditSave={handleLabelEditSave} groups={groups} setGroups={setGroups} treeUtils={treeUtils} setPromptStr={setPromptStr}/>
      </div>}


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
      /* total width */
      *::-webkit-scrollbar {
          background-color:#fff;
          width: 8px;
          height: 8px;
      }

      /* background of the scrollbar except button or resizer */
      *::-webkit-scrollbar-track {
          background-color: #eee;
          border-radius: 16px;
      }
      *::-webkit-scrollbar-track:hover {
          background-color:#f4f4f4
          border-radius: 16px;
      }

      /* scrollbar itself */
      *::-webkit-scrollbar-thumb {
          background-color:#babac0;
          border-radius:16px;
          border:5px solid #fff
      }
      *::-webkit-scrollbar-thumb:hover {
          background-color:#a0a0a5;
          border:4px solid #f4f4f4
      }

      /* set button(top and bottom of the scrollbar) */
      *::-webkit-scrollbar-button {display:none}
    `}</style>
    </div>
  );
};

export default Generate;
