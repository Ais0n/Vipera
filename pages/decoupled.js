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
  const [graphs, setGraphs] = useState([]);
  const [aggregatedGraph, setAggregatedGraph] = useState({});
  const [useSceneGraph, setUseSceneGraph] = useState(false);
  const [badgeContents, setBadgeContents] = useState(undefined);

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

  // Helper function to combine two distributions
  const combineDistributions = (combinedDistribution, newDistribution) => {
    const totalFaces = combinedDistribution.faceDetectedCount + newDistribution.face_detected_count;

    // Helper function to combine two distributions
    const combineCounts = (combDist, newDist, field) => {
      for (const [key, value] of Object.entries(newDist[field])) {
        if (combDist[field][key]) {
          combDist[field][key] = ((combDist[field][key] * combinedDistribution.faceDetectedCount) + (value * newDistribution.face_detected_count)) / totalFaces;
        } else {
          combDist[field][key] = (value * newDistribution.face_detected_count) / totalFaces;
        }
      }
      // Ensure the sum is 100%
      let sum = Object.values(combDist[field]).reduce((acc, val) => acc + val, 0);
      let diff = 1 - sum;

      // Find the key with the maximum value and adjust it by the difference, to be improved if needed
      let maxKey = Object.keys(combDist[field]).reduce((a, b) => combDist[field][a] > combDist[field][b] ? a : b);
      combDist[field][maxKey] += diff;
    };

    combineCounts(combinedDistribution, newDistribution, 'age');
    combineCounts(combinedDistribution, newDistribution, 'gender');
    combineCounts(combinedDistribution, newDistribution, 'skinTone');

    combinedDistribution.faceDetectedCount += newDistribution.face_detected_count;
    combinedDistribution.faceNotDetectedCount += newDistribution.face_not_detected_count;
  };

  // const handleGenerateClick = async (userInput, append = false) => {
  //   if (isGenerating || userInput.trim() === "") {
  //     console.debug("Either generation in progress or user input is empty.");
  //     return;
  //   }

  //   setIsGenerating(true);
  //   setIsDoneGenerating(false);
  //   setIsDoneImage(false); 
  //   setIsDoneDistribution(false); 

  //   setError('');

  //   // ----- Decoupled Images API Logic ----- //
  //   //Getting the list of images - would be replaced by the new model later on
  //   const generate_url = "https://vtsuohpeo0.execute-api.us-east-1.amazonaws.com/Prod/generate"
  //   const generate_with_id_url = "https://vtsuohpeo0.execute-api.us-east-1.amazonaws.com/Prod/generate_with_ids"
  //   const ouroboros_api_new_url = "http://18.224.86.65:5001/ouroborosSkin"
  //   //"http://18.224.86.65:5001/ouroborosp" for parallelized without skintone
  //   //"http://18.224.86.65:5001/ouroborosnp" for non parallelized without skintone

  //   const generateRequestData = {
  //     num: 100,
  //     prompt: "clear natural portrait or photograph of " + userInput,
  //     width: 512,
  //     height: 512,
  //     num_inference_steps: 31,
  //     guidance_scale: 12,
  //     scheduler: "DPMSolverMultistep", 
  //     negative_prompt: "blurry, black and white image, cartoon, text, painting, building",
  //   };
  //   let generateData;
  //   let predictData;
  //   let generateWithIdsResponse;
  //   let generateWithIdsData;
  //   setPromptStr(userInput);
  //   try {
  //     const generateResponse = await fetch(generate_url, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify(generateRequestData)
  //     });

  //     if (!generateResponse.ok) {
  //       throw new Error(`HTTP generate error! status: ${generateResponse.status}`);
  //     }

  //     generateData = await generateResponse.json();
  //     const predictionIDs = generateData;
  //     while (true) {
  //       generateWithIdsResponse = await fetch(generate_with_id_url, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json"
  //         },
  //         body: JSON.stringify({ ids: predictionIDs })
  //       });

  //       if (!generateWithIdsResponse.ok) {
  //         throw new Error(`HTTP generate_with_ids error! status: ${generateWithIdsResponse.status}`);
  //       }
  //       generateWithIdsData = await generateWithIdsResponse.json();
  //       if (generateWithIdsData.status === "Images still not processed, please try again in sometime") {
  //         console.debug("Images still not processed, waiting...");
  //         await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
  //       } else {
  //         break;
  //       }
  //     }

  //     predictData = generateWithIdsData;
  //     //predict data is a list of strings (urls of images)
  //     console.debug("Generate with IDs API Response:", predictData);
  //     if (append) {
  //       setImages(prevImages => [...prevImages, ...predictData]); // Append new images
  //     } else {
  //       setImages(predictData); // Replace with new images
  //     }

  //     setIsDoneGenerating(true);
  //     //image done generating, display immediately
  //     setIsDoneImage(true); 
  //   }
  //   catch{
  //     console.error("API Error:", error);
  //     setError('Failed to generate images. Please try again.');
  //   }

  //   // generating distribution
  //   try {
  //     const batchSize = 12; // Process images in batches of 12
  //     const batches = [];
  //     for (let i = 0; i < predictData.length; i += batchSize) {
  //       batches.push(predictData.slice(i, i + batchSize));
  //     }

  //     const combinedDistribution = { age: {}, gender: {}, skinTone: {}, faceDetectedCount: 0, faceNotDetectedCount: 0 };

  //     for (const batch of batches) {
  //       console.log("Batch:", batch);
  //       // check if the batch is empty
  //       if (batch.length === 0) {
  //         continue;
  //       }
  //       const oroRequestData = {
  //         imgs: batch
  //       };
  //       console.debug("OuroborosAPI Input:", JSON.stringify(oroRequestData));
  //       const oroResponse = await fetch(ouroboros_api_new_url, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json"
  //         },
  //         body: JSON.stringify(oroRequestData)
  //       });

  //       console.log("Oro Response:", oroResponse);

  //       if (!oroResponse.ok) {
  //         throw new Error(`HTTP oroboros error! status: ${oroResponse.status}`);
  //       }
  //       console.debug("success in oro response");

  //       const oroData = await oroResponse.json();
  //       console.debug("Oro API Response:", oroData); // Print the entire API response

  //       const oroResult = oroData[0];

  //       // Combine distributions
  //       combineDistributions(combinedDistribution, oroResult);
  //     }

  //     if (append) {
  //       setDistribution(prevDistribution => {
  //         const newDistribution = { ...prevDistribution };
  //         combineDistributions(newDistribution, combinedDistribution);
  //         return newDistribution;
  //       });
  //     }
  //     else{
  //       setDistribution(combinedDistribution);
  //     }
  //     setIsDoneDistribution(true); 
  //   } catch (error) {
  //     console.error("API Error:", error);
  //     setError('Failed to generate distribution. Please try again.');
  //   } finally {
  //     setIsGenerating(false);
  //   }

  // };

  const handleGenerateClick = async (userInput, append = false) => {
    if (isGenerating || userInput.trim() === "") {
      console.debug("Either generation in progress or user input is empty.");
      return;
    }

    setIsGenerating(true);
    setIsDoneGenerating(false);
    setIsDoneImage(false);
    setIsDoneSceneGraph(false);

    setError('');
    let IMAGE_DIR = userInput.toLowerCase().includes("doctor") ? 'doctors' : 'picnic';
    let DATE = IMAGE_DIR == 'doctors' ? "2024-08-14T03:20:49.750Z" : "2024-08-14T02:52:09.289Z";
  
    let image_num = 20;
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
        setImages(prevImages => [...prevImages, { id: imageId, data: base64Image }]); // Append new images
        setIsDoneImage(true);
      }

      if(!useSceneGraph) {
        setIsDoneGenerating(true);
        return;
      }

      let sceneGraphResponseData = [];
      for(let imageId of imageIds) {
        const getSceneGraphUrl = `/old_json/${IMAGE_DIR}/${imageId}.json`;
        const sceneGraphResponse = await axios.get(getSceneGraphUrl);
        sceneGraphResponseData.push(sceneGraphResponse.data);
      }

      // const getSceneGraphUrl = `/a2pi/get-scene-graph?image_ids=${imageIds.join(',')}`;
      // const sceneGraphResponse = await axios.get(getSceneGraphUrl);
      // let sceneGraphResponseData = sceneGraphResponse.data;
      // console.log(sceneGraphResponseData);

      // let sceneGraphResponseData = testData;

      // Solve them bugs from LLaVa
      function validateGraph(graph) {
        let {nodes, edges} = graph;
        let nodeIds = {};
        nodes.forEach(node => {
          nodeIds[node.id] = 1;
        })
        // handle non-existing source/target nodes in edges
        edges.forEach(edge => {
          if(!nodeIds[edge.source]) {
            nodes.push({
              id: edge.source,
              attributes: {},
            })
            nodeIds[edge.source] = 1;
          }
          if(!nodeIds[edge.target]) {
            nodes.push({
              id: edge.target,
              attributes: {}
            })
          }
        })
        // handle nodes whose attribute values are not numerical/categorical
        nodes.forEach(node => {
          if(!node.attributes) return;
          let keys = Object.keys(node.attributes);
          keys.forEach(key => {
            if(typeof(node.attributes[key]) == 'object' ) {
              node.attributes = {...node.attributes, ...node.attributes[key]};
              delete node.attributes[key];
            }
          })
        })
        // handle edges: relationship = type
        edges.forEach(edge => {
          if(typeof(edge.relationship) != 'undefined') {
            edge.type = edge.relationship;
            delete edge.relationship;
          }
        })
        // handle nodes: name = id
        nodes.forEach(node => {
          if(typeof(node.name) != 'undefined') {
            node.id = node.name;
            delete node.name;
          }
        })
        return {nodes, edges};
      }

      let _graphs = []
      for (let s of sceneGraphResponseData) {
        // let raw_str = s.match(/```json([\s\S]*)```/);
        // if (raw_str == null || (raw_str instanceof Array && raw_str.length == 0)) {
        //   console.error("Error parsing string ", raw_str)
        // } else {
        //   try {
        //     let obj = JSON.parse(raw_str[1]);
        //     console.log(obj);
        //     _graphs.push(validateGraph(obj));
        //   } catch (err) {
        //     console.error(err);
        //   }
        // }
        try {
          // function extractJsonFromResponse(response) {
          //   const startIndex = Math.min(response.indexOf('{'), response.indexOf('['));
          //   const endIndex = Math.max(response.lastIndexOf('}'), response.lastIndexOf(']')) + 1;
          //   const jsonPart = response.slice(startIndex, endIndex);
          //   return jsonPart;
          // }
          // let raw_str = extractJsonFromResponse(s);
          // if(!raw_str || typeof(raw_str) != 'string' || raw_str.length == 0) {
          //   throw new Error("Error parsing string " + s);
          // }
          // let obj = JSON.parse(raw_str);
          let obj = s;
          obj = JSON.parse(JSON.stringify(obj).toLowerCase())
          // console.log(obj);
          _graphs.push(validateGraph(obj));
        } catch (err) {
          console.error(err);
        }
      }
      setGraphs(_graphs);

      function calculateAggregatedGraph(graphs) {
        function mergeAttr(attrs, newNode) {
          let newNodeAttrs = Object.keys(newNode);
          for (let key of newNodeAttrs) {
            if (typeof (attrs[key]) == 'undefined') {
              attrs[key] = {};
              attrs[key][newNode[key]] = 1;
            } else if (typeof (attrs[key][newNode[key]]) == 'undefined') {
              attrs[key][newNode[key]] = 1;
            } else {
              attrs[key][newNode[key]] += 1;
            }
          }
          return attrs;
        }
        function mergeEdgeType(edges, newEdge) {
          if (typeof (edges[newEdge]) == 'undefined') {
            edges[newEdge] = 1;
          } else {
            edges[newEdge] += 1;
          }
          return edges;
        }
        let nodes = [], edges = [];
        let node_dict = {}, edge_dict = {};
        for (let graph of graphs) {
          for (let node of graph.nodes) {
            if (typeof (node_dict[node.id]) == 'undefined') {
              node_dict[node.id] = nodes.length;
              let mergedAttributes = mergeAttr({}, node.attributes)
              nodes.push({ ...node, size: 1, attributes: mergedAttributes });
            } else {
              nodes[node_dict[node.id]].size += 1;
              nodes[node_dict[node.id]].attributes = mergeAttr(nodes[node_dict[node.id]].attributes, node.attributes);
            }
          }
          for (let edge of graph.edges) {
            let { source, target, type } = edge;
            const edge_id = String(source) + '_' + String(target);
            if (typeof (edge_dict[edge_id]) == 'undefined') {
              edge_dict[edge_id] = edges.length;
              let mergedTypes = mergeEdgeType({}, type);
              edges.push({ ...edge, size: 1, type: mergedTypes })
            } else {
              edges[edge_dict[edge_id]].size += 1;
              edges[edge_dict[edge_id]].type = mergeEdgeType(edges[edge_dict[edge_id]].type, type);
            }
          }
        }
        console.log(nodes, edges)
        
        for (let node of nodes) {
          node.ntype = "object";
        }
        for (let edge of edges) {
          edge.etype = "relationship";
        }
        // separate edges with different 'type' value
        let _edges = []
        for(let edge of edges) {
          if (!edge.type) continue;
          let types = Object.keys(edge.type);
          _edges.push({
            ...edge,
            type: types.join(',')
          })
          // for(let i = 0; i < types.length; i++) {
            // _edges.push({
            //   ...edge,
            //   type: types[i],
            //   size: edge.type[types[i]]
            // })
          // }
        }
        edges = _edges;
        // make each attribute a separate node
        let _nodes = []
        for (let node of nodes) {
          let attributes = node.attributes;
          let attrNames = Object.keys(attributes);
          for(let attrName of attrNames) {
            let _size = 0;
            for (let k in attributes[attrName]) { 
              _size += attributes[attrName][k];
            }
            // a metric of bias: var(p_i) / avg(p_i)
            const measureBias = (values) => {
              if(!values) return 0;
              let keys = Object.keys(values);
              if(keys.length <= 1) return 0;
              let p = [], sum = 0;
              for(let key in values) {
                p.push(values[key]);
                sum += values[key];
              }
              let avg_p_i = 1.0 / keys.length;
              let res = 0.0;
              for(let _p of p) {
                let p_i = _p / sum;
                res += (p_i - avg_p_i) * (p_i-avg_p_i);
              }
              return Math.min(1.0, res / avg_p_i);
            }
            let _node = {
              id: String(node.id) + '_' + String(attrName),
              ntype: "attribute",
              values: node.size == _size ? attributes[attrName] : {...attributes[attrName], '(unknown)': node.size - _size},
              size: _size,
              bias: measureBias(attributes[attrName])
            };
            _nodes.push(_node);
            edges.push({
              source: node.id,
              target: _node.id,
              etype: "attribute",
              size: 1,
            })
          }
        }

        nodes = [...nodes, ..._nodes];

        return { nodes, edges };
      }

      let _aggregatedGraph = calculateAggregatedGraph(_graphs);
      console.log(_aggregatedGraph);
      setAggregatedGraph(_aggregatedGraph);
      setIsDoneSceneGraph(true);
      setIsDoneGenerating(true);
    } catch (error) {
      console.error('Error generating images:', error);
      throw error;
    }
  }

  const handleGenerateMoreClick = () => {
    handleGenerateClick(promptStr, true);
  };

  const handleNodeHover = (d) => {
    console.log(d)
    if(d.ntype == 'attribute') {
      let _badgeContents = [];
      graphs.forEach(graph => {
        let node_id = d.id.split('_')[0];
        let attr_id = d.id.split('_')[1];
        let node = graph.nodes.find(node => node.id == node_id);
        if(!node) return;
        _badgeContents.push(typeof(node.attributes[attr_id]) == 'undefined' ? 'unknown' : node.attributes[attr_id]);
      });
      console.log(_badgeContents)
      setBadgeContents(_badgeContents);
    }
  }

  const handleNodeLeave = (d) => {
    setBadgeContents(undefined);
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
      <SearchBar onGenerateClick={handleGenerateClick} isGenerating={isGenerating} ensureImagesSelected={ensureImagesSelected} />

      
      {error && <p>{error}</p>}
      {isGenerating && <div className={style.analyzeView}>
        {useSceneGraph &&
        <div className={style.sceneGraph}>
          {!isDoneSceneGraph && <ProcessingIndicator />}
          <SceneGraph data={aggregatedGraph} handleNodeHover={handleNodeHover} handleNodeLeave={handleNodeLeave}></SceneGraph>
        </div>}
        <div className={style.imageView}>
          {!isDoneImage && <ProcessingIndicator />}
          <div className={style.imageContainer}>
            {images.map((image, index) => (
              <div key={image.id} className={style.imageItem}>
                <img src={`data:image/png;base64,${image.data}`} alt={`Image ${image.id}`} />
                {badgeContents && <div className={style.imageBadge}> {badgeContents[index]} </div>}
              </div>
            ))}
          </div>
        </div>
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
      * {
        box-sizing: border-box;
      }
    `}</style>
    </div>
  );
};

export default Generate;
