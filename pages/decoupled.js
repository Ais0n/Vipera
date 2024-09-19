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
  const [isDoneGenerating, setIsDoneGenerating] = useState(false);
  const [isDoneImage, setIsDoneImage] = useState(false);
  const [isDoneSceneGraph, setIsDoneSceneGraph] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [distribution, setDistribution] = useState({ age: {}, gender: {}, skinTone: {}, faceDetectedCount: 0, faceNotDetectedCount: 0 });
  const [selectedCategory, setSelectedCategory] = useState('images'); // Default to 'images'
  const [promptStr, setPromptStr] = useState('');
  const [graph, setGraph] = useState({});
  const [graphSchema, setGraphSchema] = useState({});
  const [metaData, setMetaData] = useState([]);
  const [aggregatedGraph, setAggregatedGraph] = useState({});
  const [useSceneGraph, setUseSceneGraph] = useState(false);
  const [badgeContents, setBadgeContents] = useState(undefined);
  const [prompts, setPrompts] = useState([]);

  const TRENDING_IMAGES = [
    { id: 'post1', src: '/post1.svg', alt: 'Post 1' },
    { id: 'post2', src: '/post2.svg', alt: 'Post 2' },
    { id: 'post3', src: '/post3.svg', alt: 'Post 3' }
  ];

  const ensureImagesSelected = () => {
    setSelectedCategory('images');
  };


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

    setError('');
    let keywords = ['doctor', 'picnic', 'nature', 'chef'];
    let timewords = ["2024-08-14T03:20:49.750Z", "2024-08-14T02:52:09.289Z", '2024-08-14T03:07:24.235Z', '2024-08-15T21:54:32.075Z'];
    let num = [20, 20, 18, 20]
    let image_num = 0;
    // let IMAGE_DIR = userInput.toLowerCase().includes("doctor") ? 'doctors' : 'picnic';
    let IMAGE_DIR = '', DATE = '';
    for (let i = 0; i < keywords.length; i++) {
      if (userInput.toLowerCase().includes(keywords[i])) {
        IMAGE_DIR = keywords[i];
        DATE = timewords[i];
        image_num = num[i];
        break;
      }
    }
    if (IMAGE_DIR == '') return;
    // let DATE = IMAGE_DIR == 'doctors' ? "2024-08-14T03:20:49.750Z" : "2024-08-14T02:52:09.289Z";


    let imageIds = [];
    for (let i = 0; i < image_num; i++) {
      imageIds.push(DATE + '_' + String(i))
    }

    try {
      const baseUrl = '/temp_images';

      for (let imageId of imageIds) {
        const getImageUrl = `${baseUrl}/${IMAGE_DIR}/${imageId}.png`;

        const imageData = await axios.get(getImageUrl, { responseType: 'arraybuffer' });
        function arrayBufferToBase64(buffer) {
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        }
        const base64Image = arrayBufferToBase64(imageData.data);
        setImages(prevImages => [...prevImages, { batch: prompts.length + 1, id: imageId, data: base64Image }]); // Append new images
        setIsDoneImage(true);
      }

      if (!useSceneGraph) {
        setIsGenerating(false);
        setIsDoneGenerating(true);
        return;
      }

      // let sceneGraphResponseData = [];
      // for (let imageId of imageIds) {
      //   // const getSceneGraphUrl = `/old_json/${IMAGE_DIR}/${imageId}.json`;
      //   const getSceneGraphUrl = `/old_json/sampleData/sample.json`;
      //   const sceneGraphResponse = await axios.get(getSceneGraphUrl);
      //   sceneGraphResponseData.push(sceneGraphResponse.data);
      // }
      let currentGraphSchema = Utils.deepClone(graphSchema);

      const updateGraphSchemaWithPrompt = (graphSchema, prompt) => {
        // hard code here
        if (typeof (graphSchema.Foreground) === 'undefined') {
          graphSchema.Foreground = {
            'doctor': {
              'gender': ["male", "female", "others"]
            }
          }
        } else {
          graphSchema.Foreground = {
            'doctor': {
              'gender': ["male", "female", "others"],
              'smiling?': [true, false]
            }
          }
        }
        if (typeof (graphSchema.Background) === 'undefined') {
          graphSchema.Background = {
            'cinematic?': [true, false]
          }
        }
        return graphSchema;
      }

      let updatedGraphSchema = updateGraphSchemaWithPrompt(currentGraphSchema, userInput);
      setGraphSchema(updatedGraphSchema);
      console.log("updatedGraphSchema", updatedGraphSchema);

      const getDataItem = (schema, imageId, dataItem) => {
        for (let key in schema) {
          if (typeof (schema[key]) === 'object' && !Array.isArray(schema[key])) {
            dataItem[key] = getDataItem(schema[key], imageId, dataItem[key] || {});
          } else {
            // randomly choose a value from the array
            if(dataItem && typeof(dataItem[key]) == 'undefined') {
              dataItem[key] = schema[key][Math.floor(Math.random() * schema[key].length)];
            }
          }
        }
        return dataItem;
      }

      let _metaData = [];
      for(let i = 0; i < metaData.length; i++) {
        _metaData.push(getDataItem(updatedGraphSchema, "", metaData[i]));
      }
      
      for (let i = 0; i < imageIds.length; i++) {
        let currentDataItem = getDataItem(updatedGraphSchema, imageIds[i], {});
        currentDataItem.batch = prompts.length;
        currentDataItem.metaData = {
          imageId: imageIds[i],
          batch: prompts.length + 1,
        }
        // currentDataItem.id = i;
        _metaData.push(currentDataItem);
      }
      let newMetaData = [..._metaData];
      setMetaData(newMetaData);
      console.log("newMetaData", newMetaData);

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

  const handleNodeHover = (d) => {
    console.log(d)
    if (d.ntype == 'attribute') {
      let _badgeContents = [];
      graphs.forEach(graph => {
        let node_id = d.id.split('_')[0];
        let attr_id = d.id.split('_')[1];
        let node = graph.nodes.find(node => node.id == node_id);
        if (!node) {
          _badgeContents.push('');
        }
        else {
          _badgeContents.push(typeof (node.attributes[attr_id]) == 'undefined' ? 'unknown' : node.attributes[attr_id]);
        }

      });
      console.log(_badgeContents)
      setBadgeContents(_badgeContents);
    }
  }

  const handleNodeLeave = (d) => {
    setBadgeContents(undefined);
  }

  const handleSuggestionButtonClick = (suggestion) => {
    let oldPrompt = prompts[prompts.length - 1];
    let newPrompt = oldPrompt + ', ' + suggestion.addValue;
    setPromptStr(newPrompt);
  }

  return (
    <div>
      <Header />
      <button onClick={setUseSceneGraph}> Use Scene Graph</button>
      <h1 className={style.mainTitle}>Ouroboros</h1>
      <GenerateState isGenerating={isGenerating} isDoneGenerating={isDoneGenerating} />
      {/* {images.length <= 0 && (
        <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} />
      )} */}
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} ensureImagesSelected={ensureImagesSelected} promptStr={promptStr} setPromptStr={setPromptStr} />


      {error && <p>{error}</p>}
      {useSceneGraph && <div className={style.analyzeView}>
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
        {!isDoneImage && <ProcessingIndicator />}
        <h1>Analyze</h1>
        <ImageSummary images={images} metaData={metaData} graph={graph} graphSchema={graphSchema} prompts={prompts} handleSuggestionButtonClick={handleSuggestionButtonClick}/>
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
