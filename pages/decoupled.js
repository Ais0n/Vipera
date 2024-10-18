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
  const [imageIdMap, setImageIdMap] = useState({});
  const [switchChecked, setSwitchChecked] = React.useState(false);

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

  let image_num = imageNum, IMAGE_DIR = '', DATE = '';

  async function generateNewImages(imageIds, userInput, newImages) { // newImages: array to store the images after the generation
    const batchSize = 1; // Number of images to generate in one batch
    const imageBatches = [];

    // Split the imageIds into batches
    for (let i = 0; i < imageIds.length; i += batchSize) {
      imageBatches.push(imageIds.slice(i, i + batchSize));
    }

    const imagePromises = imageBatches.map(async (batch) => {
      const genImageUrl = `${baseUrl}/generate-images?prompt=${userInput}&num_outputs=${batch.length}&image_ids=${batch.join('|')}`;

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
      newImages = [...newImages, ...flattenedImages];
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setIsDoneGenerating(true);
    }
    return newImages;
  }

  async function getExistingImages(imageIds, newImages) {
    for (let imageId of imageIds) {
      const genImageUrl = `/temp_images${IMAGE_DIR}/${imageId}.png`;
      const imageData = await axios.get(genImageUrl, { responseType: 'arraybuffer' });
      console.log(imageData)
      const base64Image = Utils.arrayBufferToBase64(imageData.data);
      newImages.push({ batch: prompts.length + 1, id: imageId, data: base64Image, path: genImageUrl });
    }
    return newImages;
  }

  const generateGraphSchema = async (images) => {
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
      let genGraphUrl = `${baseUrl}/generate-graph?path=${image.path}&image_dir=${'temp_graphs'+IMAGE_DIR+'.json'}`;
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

  const generateMetaData = async (images, graphSchema, candidateValues) => {
    let _metaData = [];
    if (isDebug) {
      for (let i = 0; i < metaData.length; i++) {
        _metaData.push(getDataItem(graphSchema, "", metaData[i]));
      }
      for (let i = metaData.length; i < images.length; i++) {
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
        let labelFilePath = image.path.replace('temp_images', 'temp_labels');
        labelFilePath = labelFilePath.slice(0, labelFilePath.length - 4) + '.json';
        let checkLabelURL = `${baseUrl}/check-labels?path=${labelFilePath}`;
        let response = await axios.get(checkLabelURL);
        let data, isGenerateNeeded = true;
        if (response.data.res) {
          data = response.data.res;
          console.log(data, graphSchema)
          isGenerateNeeded = !Utils.isObjectSubset(data, graphSchema);
          isGenerateNeeded = false;
        }
        
        if(isGenerateNeeded) {
          let getLabelURL = `${baseUrl}/generate-labels?path=${image.path}&schema=${JSON.stringify(graphSchema)}&label_dir=${labelFilePath}` + (candidateValues ? `&candidate_values=${candidateValues}` : '');
          response = await axios.get(getLabelURL);
          data = response.data.res;
        }

        const removeRedundantFields = (data, schema) => {
          const result = Utils.deepClone(data);
          const traverse = (curNode, schemaNode) => {
            if (typeof (curNode) !== 'object') return;
            let keys = Object.keys(curNode);
            for (let key of keys) {
              if(typeof(schemaNode[key]) == 'undefined') {
                delete curNode[key];
              } else {
                traverse(curNode[key], schemaNode[key]);
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

    // Generate image IDs
    IMAGE_DIR = '/' + userInput.toLowerCase().replace(/ /g, '_');
    let imageIds = [];
    let isImagesExist = false;  // check if there are already images in IMAGE_DIR
    let checkUrl = `${baseUrl}/check-images?path=/temp_images${IMAGE_DIR}`;
    let response = await axios.get(checkUrl);
    if (response.data.res) {
      imageIds = response.data.res.map(item => {
        return item.substring(0, item.length - 4); // remove the suffix .png
      });
      if(imageIdMap[userInput] == undefined) {
        imageIds = imageIds.slice(0, image_num);
        let tmp = {...imageIdMap};
        tmp[userInput] = image_num;
        setImageIdMap(tmp);
      } else {
        imageIds = imageIds.slice(imageIdMap[userInput], imageIdMap[userInput] + image_num);
        let tmp = {...imageIdMap};
        tmp[userInput] += image_num;
        setImageIdMap(tmp);
      }
    }

    isImagesExist = (imageIds.length == image_num);

    if(!isImagesExist) {
      imageIds = [];
      for(let i = 0; i < image_num; i++) {
        imageIds.push(userInput.replace(/ /g, '_') + '_' + String(i));
      }
    }

    try {
      // Generate images
      let newImages = [], allImages = Utils.deepClone(images);

      if (isImagesExist) {
        newImages = await getExistingImages(imageIds, newImages);
      } else {
        newImages = await generateNewImages(imageIds, userInput, newImages);
      }
      console.log(newImages)
      allImages = [...allImages, ...newImages];
      setImages(allImages);

      setIsDoneImage(true);
      setStepPercentage(33);
      if (!useSceneGraph) {
        setIsGenerating(false);
        setIsDoneGenerating(true);
        return;
      }

      // Generate Scene Graph (Graph Schema)
      let updatedGraphSchema = Utils.deepClone(graphSchema);
      if(Object.keys(graphSchema).length == 0) {
        updatedGraphSchema = await generateGraphSchema(newImages);
        setGraphSchema(updatedGraphSchema);
        console.log("updatedGraphSchema", updatedGraphSchema);
      }
      setStepPercentage(66);

      // Generate Meta Data
      let newMetaData = await generateMetaData(newImages, updatedGraphSchema);
      let allMetaData = Utils.deepClone(metaData); 
      allMetaData = [...allMetaData, ...newMetaData];
      setMetaData(allMetaData);
      console.log("newMetaData", allMetaData);
      setStepPercentage(99);
      

      // // update the graph schema with metaData
      // for (let item of newMetaData) {
      //   updateGraphSchemaWithMetaData(updatedGraphSchema, item);
      // }

      // calculate the graph with statistics
      let _graph = Utils.calculateGraph(allMetaData, updatedGraphSchema, Utils.deepClone(graph));
      console.log(_graph)
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
    let updateGraph = (graph, suggestion) => {
      if(!graph || !graph.children) return;
      for(let child of graph.children) {
        if(child.name == suggestion.oldNodeName) {
          let newNode = Utils.deepClone(child);
          newNode.name = suggestion.newNodeName;
          const traverseGraph = (curNode) => {
            if(!curNode || !curNode.children) return;
            for(let i = 0; i < curNode.children.length; i++) {
              if(curNode.children[i].type == "attribute") {
                curNode.children[i] = {name: curNode.children[i].name, type: "attribute", count: 0, children: []};
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

    // store the new schema
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);

    // calculate the graph with statistics
    let _graph = Utils.calculateGraph(metaData, _graphSchema);
    console.log(_graph)
    setGraph(_graph);

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
    _graph = Utils.calculateGraph(newMetaData, _graphSchema);
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

  const handleNodeEdit = (dataObj, newNodeName) => {
    // calculate the path to the root
    let pathToRoot = [];
    let curNode = dataObj;
    while(curNode.data.name != 'root') {
      pathToRoot.push(curNode.data.name);
      curNode = curNode.parent;
    }
    pathToRoot = pathToRoot.reverse();
    // update the schema
    let _graphSchema = Utils.deepClone(graphSchema);
    curNode = _graphSchema;
    for(let i = 0; i < pathToRoot.length - 1; i++) {
      curNode = curNode[pathToRoot[i]];
    }
    curNode[newNodeName] = Utils.deepClone(curNode[pathToRoot[pathToRoot.length - 1]]);
    delete curNode[pathToRoot[pathToRoot.length - 1]];
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    // update the graph
    let _graph = Utils.deepClone(graph);
    curNode = _graph;
    for(let i = 0; i < pathToRoot.length; i++) {
      curNode = curNode.children.find(node => node.name === pathToRoot[i]);
    }
    curNode.name = newNodeName;
    setGraph(_graph);
    console.log("updatedGraph", _graph);
  }

  const handleNodeAdd = (dataObj, newNode) => {
    let {nodeName: newNodeName, nodeType: newNodeType, candidateValues} = newNode;
    // calculate the path to the root
    let pathToRoot = [];
    let curNode = dataObj;
    while(curNode.data.name != 'root') {
      pathToRoot.push(curNode.data.name);
      curNode = curNode.parent;
    }
    pathToRoot = pathToRoot.reverse();
    // update the schema
    let _graphSchema = Utils.deepClone(graphSchema);
    curNode = _graphSchema;
    for(let i = 0; i < pathToRoot.length; i++) {
      curNode = curNode[pathToRoot[i]];
    }
    curNode[newNodeName] = {};
    setGraphSchema(_graphSchema);
    console.log("updatedGraphSchema", _graphSchema);
    // update the graph
    let _graph = Utils.deepClone(graph);
    curNode = _graph;
    for(let i = 0; i < pathToRoot.length; i++) {
      curNode = curNode.children.find(node => node.name === pathToRoot[i]);
    }
    curNode.children.push({ name: newNodeName, children: [], count: 0, type: newNodeType });
    setGraph(_graph);
    console.log("updatedGraph", _graph);

    if(newNodeType == 'attribute') {
      // update labels if the new node is an attribute
      let partialSchema = {}; // The schema for the new node
      curNode = partialSchema;
      for(let i = 0; i < pathToRoot.length; i++) {
        curNode[pathToRoot[i]] = {};
        curNode = curNode[pathToRoot[i]];
      }
      curNode[newNodeName] = "...";
      console.log("partialSchema", partialSchema);
      // Generate Meta Data
      generateMetaData(images, partialSchema, candidateValues).then(labeledSchema => {
        setIsGenerating(true);
        setIsDoneGenerating(false);
        setStepPercentage(50);
        console.log("labeledSchema", labeledSchema);
        // update the metadata
        let newMetaData = Utils.deepClone(metaData);
        images.forEach((image, index) => {
          let item = labeledSchema[index];
          let oldMetaData = newMetaData.find(item => item.metaData.imageId == image.id);
          if(oldMetaData == undefined) {
            oldMetaData = {};
          }
          let res = Utils.mergeMetadata(oldMetaData, item);
          let idx = newMetaData.findIndex(item => item.metaData.imageId == image.id);
          if(idx != -1) {
            newMetaData[idx] = res;
          } else {
            newMetaData.push(res);
          }
        })

        setMetaData(newMetaData);
        console.log("newMetaData", newMetaData);

        _graph = Utils.calculateGraph(newMetaData, _graphSchema, Utils.deepClone(_graph));
        console.log("newgraph", _graph)
        setGraph(_graph);

        setIsGenerating(false);
        setIsDoneGenerating(true);
        setSwitchChecked(true);
      })
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
        <ImageSummary images={images} metaData={metaData} graph={graph} graphSchema={graphSchema} prompts={prompts}  switchChecked={switchChecked} setSwitchChecked={setSwitchChecked} handleSuggestionButtonClick={handleSuggestionButtonClick} handleNodeEdit={handleNodeEdit} handleNodeAdd={handleNodeAdd}/>

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
