// pages/decoupled.js

import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import AnalyzeImages from '../components/AnalyzeImages';
import AnalyzeDistribution from '../components/AnalyzeDistribution';
import GenerateState from '../components/GenerateState';
import Footer from '../components/Footer';
import style from '../styles/GeneratePage.module.css';
import axios from 'axios';
import { testData } from '../testData.js';
import SceneGraph from '../components/SceneGraph.js';
import ProcessingIndicator from '../components/Processing.js';
import ImageSummary from '../components/ImageSummary.js';
import * as Utils from '../utils.js';
import * as nanoid from 'nanoid';

const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDoneGenerating, setIsDoneGenerating] = useState(true);
  const [isDoneImage, setIsDoneImage] = useState(true);
  const [isDoneSceneGraph, setIsDoneSceneGraph] = useState(false);
  const [error, setError] = useState('');
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
  const [stepPercentage, setStepPercentage] = useState(0);
  const [imageNum, setImageNum] = useState(10);

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

  function generateImageIds() {
    let image_num = imageNum, IMAGE_DIR = '', DATE = '';

    let imageIds = [];

    if (isDebug) {
      let keywords = ['doctor', 'picnic', 'nature', 'chef'];
      let timewords = ["2024-08-14T03:20:49.750Z", "2024-08-14T02:52:09.289Z", '2024-08-14T03:07:24.235Z', '2024-08-15T21:54:32.075Z'];
      let num = [5, 20, 18, 20]
      image_num = 0;
      IMAGE_DIR = '', DATE = '';
      for (let i = 0; i < keywords.length; i++) {
        if (userInput.toLowerCase().includes(keywords[i])) {
          IMAGE_DIR = keywords[i];
          DATE = timewords[i];
          image_num = num[i];
          break;
        }
      }
      if (IMAGE_DIR == '') return;
      for (let i = 0; i < image_num; i++) {
        imageIds.push(DATE + '_' + String(i))
      }
    } else {
      for (let i = 0; i < image_num; i++) {
        imageIds.push(new Date().toISOString() + '_' + String(i))
      }
    }
    return imageIds;
  }

  async function generateImages(imageIds, userInput, newImages) { // newImages: array to store the images after the generation
    const batchSize = 1; // Number of images to generate in one batch
    const imageBatches = [];

    // Split the imageIds into batches
    for (let i = 0; i < imageIds.length; i += batchSize) {
      imageBatches.push(imageIds.slice(i, i + batchSize));
    }

    const imagePromises = imageBatches.map(async (batch) => {
      const genImageUrl = `${baseUrl}/generate-images?prompt=${userInput}&num_outputs=${batch.length}`;

      let response;
      const maxTries = 10;
      let tryCount = 0;

      do {
        try {
          response = await axios.get(genImageUrl);
        } catch (error) {
          if (tryCount >= maxTries) {
            console.error(`Error generating images for batch: ${batch}`, error);
            throw new Error(`Failed to generate images for batch (max tries reached): ${batch}`);
          }
        }
        tryCount++;
      } while (response?.status !== 200 && tryCount < maxTries);

      if (response?.status === 200) {
        const imagePaths = response.data.image_path; // Assuming response returns an array of paths

        // Fetch image data for each path in the batch
        const imageDataPromises = imagePaths.map(async (image_path, index) => {
          try {
            const imageData = await axios.get(image_path, { responseType: 'arraybuffer'});
            const base64Image = Utils.arrayBufferToBase64(imageData.data);
            return { batch: prompts.length + 1, id: batch[index], data: base64Image, path: image_path };
          } catch (error) {
            console.error(`Error fetching image data for ID: ${batch[index]}`, error);
            throw new Error(`Failed to fetch image data for ID: ${batch[index]}`);
          }
        });

        return Promise.all(imageDataPromises);
      } else {
        console.error(response);
        throw new Error(`Failed to generate images for batch: ${batch}`);
      }
    });

    try {
      const allImages = await Promise.all(imagePromises);
      const flattenedImages = allImages.flat(); // Flatten the array of arrays
      setImages(prevImages => [...prevImages, ...flattenedImages]); // Append new images
      newImages = [...newImages, ...flattenedImages];
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setIsDoneGenerating(true);
    }
    return newImages;
  }

  async function generateImagesForDebug(imageIds, newImages) {
    for (let imageId of imageIds) {
      const genImageUrl = `/temp_images/${IMAGE_DIR}/${imageId}.png`;
      const imageData = await axios.get(genImageUrl, { responseType: 'arraybuffer' });
      console.log(imageData)
      const base64Image = Utils.arrayBufferToBase64(imageData.data);
      setImages(prevImages => [...prevImages, { batch: prompts.length + 1, id: imageId, data: base64Image, path: genImageUrl }]);
      newImages.push({ batch: prompts.length + 1, id: imageId, data: base64Image, path: genImageUrl });
    }
    return newImages;
  }

  const generateGraphSchema = async (images) => {
    let sample_size = 1;
    // randomly sample images
    let sampleImages = [];
    for (let i = 0; i < sample_size; i++) {
      sampleImages.push(images[Math.floor(Math.random() * images.length)]);
    }

    // get Scene Graph for each image
    let sceneGraphs = [];
    for (let i = 0; i < sampleImages.length; i++) {
      let image = sampleImages[i];
      let genGraphUrl = `${baseUrl}/generate-graph?path=${image.path}`;
      let response = await axios.get(genGraphUrl);
      console.log(response)
      sceneGraphs.push(response.data.res);
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

    console.log(aggregatedGraph);
    return aggregatedGraph;
  }

  const updateGraphSchemaWithPrompt = (graphSchema, prompt) => {
    // // hard code here
    // if (typeof (graphSchema.Foreground) === 'undefined') {
    //   graphSchema.Foreground = {
    //     'doctor': {
    //       'gender': ["male", "female", "others"]
    //     }
    //   }
    // } else {
    //   graphSchema.Foreground = {
    //     'doctor': {
    //       'gender': ["male", "female", "others"],
    //       'smiling?': [true, false]
    //     }
    //   }
    // }
    // if (typeof (graphSchema.Background) === 'undefined') {
    //   graphSchema.Background = {
    //     'cinematic?': [true, false]
    //   }
    // }
    // return graphSchema;
    return graphSchema;
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
          if(typeof(metaData[key]) != 'undefined') {
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

  const generateMetaData = async (images, graphSchema) => {
    let _metaData = [];
    if (isDebug) {
      for (let i = 0; i < metaData.length; i++) {
        _metaData.push(getDataItem(graphSchema, "", metaData[i]));
      }
      for (let i = 0; i < images.length; i++) {
        let currentDataItem = getDataItem(graphSchema, images[i].id, {});
        currentDataItem.batch = prompts.length + 1;
        currentDataItem.metaData = {
          imageId: images[i].id,
          batch: prompts.length + 1,
        }
        // currentDataItem.id = i;
        _metaData.push(currentDataItem);
      }
    } else {
      console.log("newImages", images);
      const promises = images.map(async (image, index) => {
        console.log(index)
        let getLabelURL = `${baseUrl}/generate-labels?path=${image.path}&schema=${JSON.stringify(graphSchema)}`;
        let response = await axios.get(getLabelURL);
        let data = response.data.res;

        const removeRedundantFields = (data, schema) => {
          const result = Utils.deepClone(data);
          const traverse = (curNode, schemaNode) => {
            if (typeof (curNode) !== 'object') return;
            let keys = Object.keys(curNode);
            for (let key of keys) {
              if (typeof (schemaNode[key]) == 'object') {
                traverse(curNode[key], schemaNode[key]);
              } else {
                delete curNode[key];
              }
            }
          };
          traverse(result, schema);
          return result;
        }

        data = removeRedundantFields(data, graphSchema);
        data.batch = image.batch || prompts.length + 1;
        data.metaData = {
          imageId: image.id,
          batch: image.batch || prompts.length + 1
        };

        return data;
      });

      const results = await Promise.all(promises);
      console.log(results)
      _metaData = results;
    }
    return _metaData;
  }


  const handleGenerateClick = async (userInput, append = false) => {
    console.log(userInput)
    if (isGenerating || userInput.trim() === "") {
      console.debug("Either generation in progress or user input is empty.");
      return;
    }

    setIsGenerating(true);
    setIsDoneGenerating(false);
    setIsDoneImage(false);
    setIsDoneSceneGraph(false);
    setStepPercentage(0);

    setError('');

    let imageIds = generateImageIds();

    try {
      // Generate images
      let newImages = Utils.deepClone(images);

      if (isDebug) {
        newImages = await generateImagesForDebug(imageIds, newImages);
      } else {
        newImages = await generateImages(imageIds, userInput, newImages);
      }
      console.log(newImages)

      setIsDoneImage(true);
      setStepPercentage(33);
      if (!useSceneGraph) {
        setIsGenerating(false);
        setIsDoneGenerating(true);
        return;
      }

      // Generate Scene Graph (Graph Schema)
      let currentGraphSchema = Utils.deepClone(graphSchema);
      console.log(currentGraphSchema)
      let updatedGraphSchema = (Object.keys(currentGraphSchema).length == 0) ? (await generateGraphSchema(newImages)) : updateGraphSchemaWithPrompt(currentGraphSchema, userInput);
      setGraphSchema(updatedGraphSchema);
      console.log("updatedGraphSchema", updatedGraphSchema);
      setStepPercentage(66);

      // Generate Meta Data
      let newMetaData = await generateMetaData(newImages, updatedGraphSchema);
      setMetaData(newMetaData);
      console.log("newMetaData", newMetaData);
      setStepPercentage(99);

      // update the graph schema with metaData
      for (let item of newMetaData) {
        updateGraphSchemaWithMetaData(updatedGraphSchema, item);
      }

      // calculate the graph with statistics
      let _graph = Utils.calculateGraph(newMetaData, updatedGraphSchema);
      console.log(graph)
      setGraph(_graph);

      setPrompts([...prompts, userInput]);
      setIsGenerating(false);
      setIsDoneGenerating(true);
    } catch (error) {
      console.error('Error generating images:', error);
      throw error;
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
    let _graph = Utils.calculateGraph(metaData, _graphSchema);
    console.log(_graph)
    setGraph(_graph);
  }

  const handleExternal = async (suggestion) => {
    setIsGenerating(true);
    setIsDoneGenerating(false);
    setStepPercentage(0);
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
    setStepPercentage(50);

    // use the new schema to relabel the images (get new metadata)
    let newMetaData = await generateMetaData(images, _graphSchema);
    setMetaData(newMetaData);
    setStepPercentage(99);

    // update the schema with the new metadata
    for (let item of newMetaData) {
      updateGraphSchemaWithMetaData(_graphSchema, item);
    }

    // store the new schema
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);

    // calculate the graph with statistics
    let _graph = Utils.calculateGraph(newMetaData, _graphSchema);
    console.log(_graph)
    setGraph(_graph);

    setIsGenerating(false);
    setIsDoneGenerating(true);
  }

  const handleSuggestionButtonClick = (suggestion, type) => {
    // let oldPrompt = prompts[prompts.length - 1];
    // let newPrompt = "";
    // if (suggestion.addValue) {
    //   newPrompt = oldPrompt + ', ' + suggestion.addValue;
    // } else if (suggestion.replaceValue) {
    //   newPrompt = oldPrompt.replace(suggestion.replaceValue, suggestion.newValue);
    // }
    // setPromptStr(newPrompt);

    if (type == 'promote') {
      handlePromote(suggestion);
    } else if (type == 'external') {
      handleExternal(suggestion);
    }

  }

  return (
    <div>
      <Header />
      {/* <button onClick={setUseSceneGraph}> Use Scene Graph</button> */}
      {/* <h1 className={style.mainTitle}>Ouroboros</h1> */}
      {/* <GenerateState isGenerating={isGenerating} isDoneGenerating={isDoneGenerating} /> */}
      {/* {images.length <= 0 && (
        <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      )} */}
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} ensureImagesSelected={ensureImagesSelected} promptStr={promptStr} setPromptStr={setPromptStr} imageNum={imageNum} setImageNum={setImageNum} />


      {error && <p>{error}</p>}
      {!isDoneGenerating && <ProcessingIndicator stepPercentage={stepPercentage} />}
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
        <ImageSummary images={images} metaData={metaData} graph={graph} graphSchema={graphSchema} prompts={prompts} handleSuggestionButtonClick={handleSuggestionButtonClick} />

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
