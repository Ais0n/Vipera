// pages/decoupled.js

import React, { useEffect, useState, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import AnalyzeImages from '../components/AnalyzeImages';
import AnalyzeDistribution from '../components/AnalyzeDistribution';
import GenerateState from '../components/GenerateState';
import Footer from '../components/Footer';
import style from '../styles/GeneratePage.module.css';
import axios from 'axios';
import ProcessingIndicator from '../components/Processing.js';
import ImageSummary from '../components/ImageSummary.js';
import * as Utils from '../utils.js';
import * as nanoid from 'nanoid';
import ModalReview from '../components/ModalReview.js';
import { message } from 'antd';

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDoneGenerating, setIsDoneGenerating] = useState(true);
  const [isDoneImage, setIsDoneImage] = useState(true);
  const [isDoneSceneGraph, setIsDoneSceneGraph] = useState(false);
  const [images, setImages] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skinTone: {}, faceDetectedCount: 0, faceNotDetectedCount: 0 });
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'
  const [promptStr, setPromptStr] = useState('A cinematic photo of a doctor');
  const [graph, setGraph] = useState({});
  const [graphSchema, setGraphSchema] = useState({});
  const [metaData, setMetaData] = useState([]);
  const [aggregatedGraph, setAggregatedGraph] = useState({});
  const [useSceneGraph, setUseSceneGraph] = useState(true);
  const [badgeContents, setBadgeContents] = useState(undefined);
  const [prompts, setPrompts] = useState([]);
  const [statusInfo, setStatusInfo] = useState(0);
  const [imageNum, setImageNum] = useState(10);
  const [imageIdMap, setImageIdMap] = useState({});
  const [switchChecked, setSwitchChecked] = useState(false);
  const [groups, setGroups] = useState([]);
  const [reviewPanelVisible, setReviewPanelVisible] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const [failedImageIds, setFailedImageIds] = useState([]);
  const [retrySceneGraphContext, setRetrySceneGraphContext] = useState(false);
  const [failedImageIdsForMetadata, setFailedImageIdsForMetadata] = useState([]);
  const [retryMetaDataContext, setRetryMetaDataContext] = useState({});
  const [messageApi, contextHolder] = message.useMessage();

  const isDebug = false;
  const baseUrl = '/api';

  const TRENDING_IMAGES = [
    { id: 'post1', src: '/post1.svg', alt: 'Post 1' },
    { id: 'post2', src: '/post2.svg', alt: 'Post 2' },
    { id: 'post3', src: '/post3.svg', alt: 'Post 3' }
  ];

  const ensureImagesSelected = () => {
    setSelectedCategory('images');
  };

  let image_num = imageNum;

  // Function to generate a single image
  async function generateImage(imageId, userInput, maxTries = 10) {
    const genImageUrl = `${baseUrl}/generate-images?prompt=${userInput}&image_id=${imageId}`;
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
          const updatedGraphSchema = await trySceneGraphGeneration(retriedImages, IMAGE_DIR);

          
          if (updatedGraphSchema === null) {
            throw new Error("Scene graph generation failed. You can retry.");
          } 
          
          // Step 4: Try generating metadata
          await tryMetadataGeneration(retriedImages, updatedGraphSchema);
        }

        setPrompts((prevPrompts) => [...prevPrompts, promptStr]);
      }
    } catch (error) {
      console.error("Error while retrying failed images:", error);
      messageApi.error("An error occurred while retrying failed images.");
    } finally {
      setIsGenerating(false);
      setIsDoneGenerating(true);
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
    let sample_size = 1;
    // randomly sample images
    let sampleImages = [];
    for (let i = 0; i < sample_size; i++) {
      // sampleImages.push(images[Math.floor(Math.random() * images.length)]);
      sampleImages.push(images[i]);
    }

    // check if the scene graph is already generated
    let checkGraphUrl = `${baseUrl}/check-graph?path=/temp_graphs${IMAGE_DIR}.json`;
    let response = await axios.get(checkGraphUrl);
    console.log(response)
    if (response.data.res) {
      return Utils.processSceneGraph(response.data.res);
    }

    // get Scene Graph for each image
    let sceneGraphs = [];
    for (let i = 0; i < sampleImages.length; i++) {
      let image = sampleImages[i];
      let genGraphUrl = `${baseUrl}/generate-graph?path=${image.path}&image_dir=${'temp_graphs' + IMAGE_DIR + '.json'}`;
      let response = await axios.get(genGraphUrl);
      console.log(response)
      let metaGraph = response.data.res;
      sceneGraphs.push(Utils.processSceneGraph(metaGraph));
    }

    // aggregate the scene graphs, merge leaf values as a list
    let aggregatedGraph = {};
    const aggregateGraphs = (graph, curGraph) => {
      let keys = Object.keys(curGraph);
      for (let key of keys) {
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

    // add an option "others" to each leaf node
    // const addOthers = (graph) => {
    //   let keys = Object.keys(graph);
    //   for (let key of keys) {
    //     if (!(graph[key] instanceof Array)) {
    //       addOthers(graph[key]);
    //     } else {
    //       graph[key].push("others");
    //     }
    //   }
    // }
    // addOthers(aggregatedGraph);

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

  const getDataItem = (schema, imageId, dataItem) => {
    for (let key in schema) {
      if (typeof (schema[key]) === 'object' && !Array.isArray(schema[key])) {
        dataItem[key] = getDataItem(schema[key], imageId, dataItem[key] || {});
      } else {
        // randomly choose a value from the array
        if (dataItem && typeof (dataItem[key]) == 'undefined') {
          dataItem[key] = schema[key][Math.floor(Math.random() * schema[key].length)];
        }
      }
    }
    return dataItem;
  }

  const generateMetaData = async (images, graphSchema, candidateValues) => {
    setIsGenerating(true);
    setIsDoneGenerating(false);
    setStatusInfo("Start generating metadata...");

    let _metaData = [], _failedImageIdsForMetadata = [];
    if (isDebug) {
      for (let i = 0; i < metaData.length; i++) {
        _metaData.push(getDataItem(graphSchema, "", metaData[i]));
      }
      for (let i = metaData.length; i < images.length; i++) {
        let currentDataItem = getDataItem(graphSchema, images[i].imageId, {});
        currentDataItem.batch = prompts.length + 1;
        currentDataItem.metaData = {
          imageId: images[i].imageId,
          batch: prompts.length + 1,
        }
        // currentDataItem.id = i;
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
          isGenerateNeeded = !Utils.isObjectSubset(data, graphSchema);
          console.log(data, graphSchema, isGenerateNeeded);
          // isGenerateNeeded = false;
        }

        if (isGenerateNeeded) {
          let getLabelURL = `${baseUrl}/generate-labels?path=${image.path}&schema=${JSON.stringify(graphSchema)}&label_dir=${labelFilePath}&feedback=${userFeedback}` + (candidateValues ? `&candidate_values=${candidateValues}` : '');
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
        data = Utils.removeRedundantFields(data, graphSchema);
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
      console.debug("Either a generation is in progress or the user input is empty.");
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
        const updatedGraphSchema = await trySceneGraphGeneration(newImages, IMAGE_DIR);

        if(updatedGraphSchema === null) {
          setRetrySceneGraphContext({newImages, IMAGE_DIR});
          throw new Error("Scene graph generation failed. You can retry.");
        } 
        
        // Step 4: Try generating metadata
        await tryMetadataGeneration(newImages, updatedGraphSchema);
      }

      setPrompts((prevPrompts) => [...prevPrompts, userInput]);
    } catch (error) {
      console.error("Error during generation process:", error);
      // messageApi.error(error.message);
    } finally {
      setIsGenerating(false);
      setIsDoneGenerating(true);
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
  };

  // Step 1: Get or generate image IDs
  const getImageIds = async (userInput, IMAGE_DIR) => {
    try {
      let isImagesExist, imageIds;
      const checkUrl = `${baseUrl}/check-images?path=/temp_images${IMAGE_DIR}`;
      const response = await axios.get(checkUrl);

      // if (response.data.res) {
      //   let imageIds = response.data.res.map((item) => item.replace(/\.png$/, ""));
      //   const currentImageIndex = imageIdMap[userInput] || 0;

      //   // Update image ID map
      //   setImageIdMap((prevMap) => ({
      //     ...prevMap,
      //     [userInput]: currentImageIndex + image_num,
      //   }));

      //   return imageIds.slice(currentImageIndex, currentImageIndex + image_num);
      // } else {
      //   // Generate new image IDs if none exist
      //   return Array.from({ length: image_num }, (_, i) => `${userInput.replace(/ /g, "_")}_${i}`);
      // }

      if (response.data.res instanceof Array) { // the image ids exist
        isImagesExist = true;
        imageIds = response.data.res.map(item => {
          return item.substring(0, item.length - 4); // remove the suffix .png
        });
        if (imageIdMap[userInput] == undefined) {
          imageIds = imageIds.slice(0, image_num);
          let tmp = { ...imageIdMap };
          tmp[userInput] = image_num;
          setImageIdMap(tmp);
        } else {
          imageIds = imageIds.slice(imageIdMap[userInput], imageIdMap[userInput] + image_num);
          let tmp = { ...imageIdMap };
          tmp[userInput] += image_num;
          setImageIdMap(tmp);
        }
        return {isImagesExist, imageIds};
      } else if (response.data.res === null) {
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
      const updatedGraphSchema = await trySceneGraphGeneration(newImages, IMAGE_DIR);
      if(updatedGraphSchema === null) {
        setRetrySceneGraphContext({newImages, IMAGE_DIR});
        throw new Error("Scene graph generation failed. You can retry.");
      } 
      setRetrySceneGraphContext(undefined);
      
      // Step 4: Try generating metadata
      await tryMetadataGeneration(newImages, updatedGraphSchema);

      setPrompts((prevPrompts) => [...prevPrompts, promptStr]);
    } catch (error) {
      console.error("Retry failed for scene graph generation:", error);
      // messageApi.error("Scene graph generation failed again. Please try later.");
    } finally {
      setIsGenerating(false);
      setIsDoneGenerating(true);
    }
  }

  // Try generating metadata
  async function tryMetadataGeneration(newImages, updatedGraphSchema, candidateValues, newGraph) {
    if(!newGraph) {
      newGraph = Utils.deepClone(graph);
    }

    try {
      // Generate Meta Data
      let newMetaData, allMetaData = [];
      if (prompts.length > 0) {
        setStatusInfo("Generating metadata...");
        let res = await generateMetaData(newImages, updatedGraphSchema, candidateValues);
        setFailedImageIdsForMetadata(res.failedImageIdsForMetadata);
        newMetaData = res.data;
        setRetryMetaDataContext({updatedGraphSchema, candidateValues});

        // merge metadata with old metadata
        let oldMetaData = Utils.deepClone(metaData);
        console.log(newMetaData, oldMetaData);
        newImages.forEach((image, index) => {
          let newItem = newMetaData.find(item => item.metaData && item.metaData.imageId == image.imageId);
          let oldItem = oldMetaData.find(item => item.metaData && item.metaData.imageId == image.imageId);
          if (!newItem) return;
          if (!oldItem) oldItem = {};
          let mergedItem = Utils.mergeMetadata(oldItem, newItem);
          let idx = newMetaData.findIndex(item => item.metaData && item.metaData.imageId == image.imageId);
          if (idx != -1) {
            newMetaData[idx] = mergedItem;
          } else {
            newMetaData.push(mergedItem);
          }
        })

        allMetaData = [...Utils.deepClone(metaData), ...newMetaData];
        setMetaData(allMetaData);
        console.log("New Metadata:", allMetaData);

        if(res.status == 'failed') {
          setIsGenerating(false);
          setIsDoneGenerating(true);
          throw new Error("Metadata generation failed. You can retry.");
        }
      }

      // Update the graph with statistics
      const updatedGraph = Utils.calculateGraph(allMetaData, updatedGraphSchema, newGraph);
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
      await tryMetadataGeneration(newImages, retryMetaDataContext.updatedGraphSchema, retryMetaDataContext.candidateValues);
    } catch (error) {
      console.error("Retry failed for metadata generation:", error);
    }
  }

  const handlePromote = async (suggestion) => {
    setPromptStr(suggestion.newPrompt);
    let updateSchema = (schema, oldNodeName, newNodeName) => {
      if (typeof (schema) != 'object') return;
      let keys = Object.keys(schema);
      for (let key of keys) {
        if (key == oldNodeName) {
          schema[newNodeName] = Utils.deepClone(schema[oldNodeName]);
        } else {
          if (typeof (schema[key]) == 'object') {
            updateSchema(schema[key], oldNodeName, newNodeName);
          }
        }
      }
    }
    let _graphSchema = Utils.deepClone(graphSchema);
    updateSchema(_graphSchema, suggestion.oldNodeName, suggestion.newNodeName);
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    let updateGraph = (graph, suggestion) => {
      if (!graph || !graph.children) return;
      for (let child of graph.children) {
        if (child.name == suggestion.oldNodeName) {
          let newNode = Utils.deepClone(child);
          newNode.name = suggestion.newNodeName;
          const traverseGraph = (curNode) => {
            if (!curNode || !curNode.children) return;
            for (let i = 0; i < curNode.children.length; i++) {
              if (curNode.children[i].type == "attribute") {
                curNode.children[i] = { name: curNode.children[i].name, type: "attribute", count: 0, children: [] };
              } else {
                traverseGraph(curNode[i]);
              }
            }
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
          schema[key][suggestion.newNodeName] = Utils.deepClone(suggestion.candidateValues);
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
    if (type == 'promote') {
      handlePromote(suggestion);
    } else if (type == 'external') {
      handleExternal(suggestion);
    }
  }

  const handleNodeEdit = (dataObj, newNodeName) => {
    // calculate the path to the root
    let pathToRoot = [];
    let curNode = dataObj;
    while (curNode.data.name != 'root') {
      pathToRoot.push(curNode.data.name);
      curNode = curNode.parent;
    }
    pathToRoot = pathToRoot.reverse();
    // update the schema
    let _graphSchema = Utils.deepClone(graphSchema);
    curNode = _graphSchema;
    for (let i = 0; i < pathToRoot.length - 1; i++) {
      curNode = curNode[pathToRoot[i]];
    }
    curNode[newNodeName] = Utils.deepClone(curNode[pathToRoot[pathToRoot.length - 1]]);
    delete curNode[pathToRoot[pathToRoot.length - 1]];
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    // update the graph
    let _graph = Utils.deepClone(graph);
    curNode = _graph;
    for (let i = 0; i < pathToRoot.length; i++) {
      curNode = curNode.children.find(node => node.name === pathToRoot[i]);
    }
    curNode.name = newNodeName;
    setGraph(_graph);
    console.log("updatedGraph", _graph);
  }

  const handleNodeAdd = (dataObj, newNode) => {
    let { nodeName: newNodeName, nodeType: newNodeType, candidateValues } = newNode;
    // calculate the path to the root
    let pathToRoot = [];
    let curNode = dataObj;
    while (curNode.data.name != 'root') {
      pathToRoot.push(curNode.data.name);
      curNode = curNode.parent;
    }
    pathToRoot = pathToRoot.reverse();
    // update the schema
    let _graphSchema = Utils.deepClone(graphSchema);
    curNode = _graphSchema;
    for (let i = 0; i < pathToRoot.length; i++) {
      curNode = curNode[pathToRoot[i]];
    }
    curNode[newNodeName] = candidateValues == '' ? [] : candidateValues.split(',');

    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    // update the graph
    let _graph = Utils.deepClone(graph);
    curNode = _graph;
    for (let i = 0; i < pathToRoot.length; i++) {
      curNode = curNode.children.find(node => node.name === pathToRoot[i]);
    }
    curNode.children.push({ name: newNodeName, children: [], count: 0, type: newNodeType });
    setGraph(_graph);
    console.log("updatedGraph", _graph);

    if (newNodeType == 'attribute') {
      // update labels if the new node is an attribute
      let partialSchema = {}; // The schema for the new node
      curNode = partialSchema;
      for (let i = 0; i < pathToRoot.length; i++) {
        curNode[pathToRoot[i]] = {};
        curNode = curNode[pathToRoot[i]];
      }
      curNode[newNodeName] = "...";
      console.log("partialSchema", partialSchema);
      // Generate Meta Data
      // const updateMetaData = (resMetaData) => {
      //   if(resMetaData.status == 'failed') {
      //     setIsGenerating(false);
      //     setIsDoneGenerating(true);
      //     setFailedImageIdsForMetadata(resMetaData.failedImageIdsForMetadata);
      //     messageApi.error("Failed to generate metadata for the new node.");
      //     return;
      //   }
      //   let labeledSchema = resMetaData.data;
      //   console.log("labeledSchema", labeledSchema);
      //   // update the metadata
      //   let newMetaData = Utils.deepClone(metaData);
      //   images.forEach((image, index) => {
      //     let item = labeledSchema[index];
      //     let oldMetaData = newMetaData.find(item => item.metaData.imageId == image.imageId);
      //     if (oldMetaData == undefined) {
      //       oldMetaData = {};
      //     }
      //     let res = Utils.mergeMetadata(oldMetaData, item);
      //     let idx = newMetaData.findIndex(item => item.metaData.imageId == image.imageId);
      //     if (idx != -1) {
      //       newMetaData[idx] = res;
      //     } else {
      //       newMetaData.push(res);
      //     }
      //   })

      //   setMetaData(newMetaData);
      //   console.log("newMetaData", newMetaData);
      //   // update the graph
      //   _graph = Utils.calculateGraph(newMetaData, _graphSchema, Utils.deepClone(_graph));
      //   console.log("newgraph", _graph)
      //   setGraph(_graph);

      //   // setIsGenerating(false);
      //   // setIsDoneGenerating(true);
      //   // setSwitchChecked(true);
      // }
      // generateMetaData(images, partialSchema, candidateValues)
      tryMetadataGeneration(images, partialSchema, candidateValues, _graph);
    }
    
  }

  // const retryNodeAdd

  const handleLabelEditSave = (newData) => {
    console.log(newData);
    let newMetaData = Utils.deepClone(metaData);
    newMetaData[newData.index] = { ...Utils.deepClone(newData.metaData), batch: newData.data.batch, metaData: newData.data };
    setMetaData(newMetaData);
    console.log('newMetaData', newMetaData);
    let _graph = Utils.calculateGraph(newMetaData, graphSchema, Utils.deepClone(graph));
    console.log('_graph', _graph);
    setGraph(_graph);
  }

  const handleReviewResults = ({ updatedMetaData, textAreaValue }) => {
    console.log(metaData, updatedMetaData)
    setMetaData(updatedMetaData);
    let _graph = Utils.calculateGraph(updatedMetaData, graphSchema, Utils.deepClone(graph));
    console.log(_graph)
    setGraph(_graph);
    if (textAreaValue && textAreaValue !== '') {
      setUserFeedback(textAreaValue);
    }
  }

  return (
    <div>
      {contextHolder}
      <Header />
      {/* <button onClick={setUseSceneGraph}> Use Scene Graph</button> */}
      {/* <h1 className={style.mainTitle}>Ouroboros</h1> */}
      {/* <GenerateState isGenerating={isGenerating} isDoneGenerating={isDoneGenerating} /> */}
      {/* {images.length <= 0 && (
        <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      )} */}
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} ensureImagesSelected={ensureImagesSelected} promptStr={promptStr} setPromptStr={setPromptStr} imageNum={imageNum} setImageNum={setImageNum} failedImageIds={failedImageIds} retryFailedImages={retryFailedImages} retrySceneGraphContext={retrySceneGraphContext} retrySceneGraphGeneration={retrySceneGraphGeneration} failedImageIdsForMetadata={failedImageIdsForMetadata} retryMetadataGeneration={retryMetadataGeneration}/>

      {!isDoneGenerating && <ProcessingIndicator statusInfo={statusInfo} setReviewPanelVisible={setReviewPanelVisible} />}
      <ModalReview isOpen={reviewPanelVisible} images={images} metaData={metaData} graph={graph} onSave={handleReviewResults} onClose={() => setReviewPanelVisible(false)}></ModalReview>
      {useSceneGraph && prompts.length > 0 && <div className={style.analyzeView}>
        {/* <div className={style.imageView}>
          {!isDoneImage && <ProcessingIndicator />}
          <div className={style.imageContainer}>
            {images.map((image, index) => (
              <div key={image.id} className={style.imageItem}>
                <Image width={'100%'} src={`data:image/png;base64,${image.data}`} alt={`Image ${image.id}`} />
                {badgeContents && <div className={style.imageBadge}> {badgeContents[index]} </div>}
              </div>
            ))}
          </div>
        </div> */}
        <h1>Analyze</h1>
        <ImageSummary images={images} metaData={metaData} graph={graph} setGraph={setGraph} graphSchema={graphSchema} prompts={prompts} switchChecked={switchChecked} setSwitchChecked={setSwitchChecked} handleSuggestionButtonClick={handleSuggestionButtonClick} handleNodeEdit={handleNodeEdit} handleNodeAdd={handleNodeAdd} handleLabelEditSave={handleLabelEditSave} groups={groups} setGroups={setGroups} />

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
          width:10px;
          height: 10px;
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
