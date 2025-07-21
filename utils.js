import * as d3 from 'd3';
// deep clone an object
function deepClone(target) {
    let result;
    if (typeof target === 'object') {
        if (Array.isArray(target)) {
            result = [];
            for (let i = 0; i < target.length; i++) {
                result.push(deepClone(target[i]))
            }
        } else if (target === null) {
            result = null;
        } else if (target.constructor === RegExp) {
            result = target;
        } else {
            result = {};
            for (let i in target) {
                result[i] = deepClone(target[i]);
            }
        }
    } else {
        result = target;
    }
    return result;
}

// calculate statistics
function calculateGraph(metaData, graphSchema, graph) {
    console.log("calculateGraph", metaData, graphSchema, graph);
    const buildGraph = (schema) => {
        const result = [];
        Object.keys(schema).forEach((key) => {
            if (key.startsWith("_")) {
                return;
            }
            const node = { name: key, children: [], count: 0, type: schema[key]._nodeType || "object" };
            result.push(node);
            const queue = [{ node, data: schema[key] }];
            while (queue.length) {
                const { node: currentNode, data: currentData } = queue.shift();
                if (currentData._nodeType === 'attribute') {
                    // currentData.forEach((item) => {
                    //     currentNode.children.push({ name: item, children: [], count: 0 });
                    // });
                    // currentNode.children.push({name: 'values', type: "attribute", children: [], count: 0});
                    currentNode.type = "attribute";
                } else if (currentData._nodeType === 'object') {
                    console.assert(typeof(currentData) === 'object', "currentData is not an object");
                    Object.keys(currentData).forEach((subKey) => {
                        if (subKey.startsWith("_")) {
                            return;
                        }
                        const subNode = { name: subKey, children: [], count: 0, type: currentData[subKey]._nodeType || "object" };
                        currentNode.children.push(subNode);
                        queue.push({ node: subNode, data: currentData[subKey] });
                    });
                }
            }
        });
        return result;
    };

    const traverseGraph = (curNode, dataItem, itemMetadata, graphSchema) => {
        // check if itemMetadata.imageId is in graphSchema._scope
        if (graphSchema._scope && graphSchema._scope.length > 0) {
            let ok = false;
            graphSchema._scope.forEach(image => {
                if (image.id == itemMetadata.imageId && image.batch == itemMetadata.batch) {
                    ok = true;
                }
            });
            if (!ok) {
                return;
            }
        }
        curNode.imageInfo.push(itemMetadata);
        curNode.count = curNode.imageInfo.length;

        if (typeof (dataItem) === 'object') {
            for (let key in dataItem) {
                if (curNode.children) {
                    let childNode = curNode.children.find(node => node.name === key);
                    if (childNode && graphSchema[key]) {
                        traverseGraph(childNode, dataItem[key], itemMetadata, graphSchema[key]);
                    }
                }
            }
        } else if (typeof (dataItem) != 'undefined' && dataItem != "") {
            if (curNode.type != 'attribute') {
                return;
            }
            if (!curNode.values) {
                curNode.values = {};
            }
            curNode.values[JSON.stringify({ batch: itemMetadata.batch, imageId: itemMetadata.imageId })] = dataItem;
            if (!curNode.list) {
                curNode.list = [];
            }
            let ok = false;
            curNode.list.forEach(item => {
                if (item.batch == itemMetadata.batch && item.dataItem == dataItem) {
                    if (!item.imageId.includes(itemMetadata.imageId)) {
                        item.count += 1;
                        item.imageId.push(itemMetadata.imageId);
                    }
                    ok = true;
                }
            })
            if (!ok) {
                curNode.list.push({ batch: itemMetadata.batch, imageId: [itemMetadata.imageId], dataItem: dataItem, count: 1 });
            }

            // let childNode = curNode.children.find(node => node.name === dataItem);
            // if (childNode) {
            //     traverseGraph(childNode, undefined, itemMetadata);
            // }
        }
    }

    if (!graph || !graph.children) {
        graph = {
            name: 'root',
            children: buildGraph(graphSchema),
        }
    }
    // recursively make node.imageInfo = [] for nodes in graphSchema
    const makeNodeImageInfo = (node, schema) => {
        if (!schema || !node || typeof(schema) != 'object') {
            return;
        }
        node.imageInfo = [];
        if (node.type == "attribute") {
            node.list = [];
        }
        if (node.children) {
            node.children.forEach(child => {
                // makeNodeImageInfo(child);
                if(schema[child.name]) {
                    makeNodeImageInfo(child, schema[child.name]);
                }
            });
        }
    }
    makeNodeImageInfo(graph, graphSchema);

    metaData.forEach(item => {
        let itemMetadata = item.metaData;
        traverseGraph(graph, item, itemMetadata, graphSchema);
    })
    return graph; // Return the constructed graph
}

// get metadata for an image from the graph
function getMetaDatafromGraph(graph, batch, imageId) {
    let res = [];
    let curNode = graph;
    const traverseGraph = (curNode, res, path) => {
        if (curNode.imageInfo) {
            let isFound = false;
            curNode.imageInfo.forEach(item => {
                if (item.batch == batch && item.imageId == imageId) {
                    isFound = true;
                }
            })
            if (isFound) {
                if (curNode.values) {
                    res.push({ name: curNode.name, values: curNode.values, path: (path == "") ? curNode.name : path + "." + curNode.name });
                } else if (curNode.children) {
                    curNode.children.forEach(child => {
                        traverseGraph(child, res, (path == "") ? curNode.name : path + "." + curNode.name);
                    })
                }
            }
        }
    }
    traverseGraph(curNode, res, "");
    uniqueName(res);
    let ans = {};
    res.forEach(item => {
        if (!ans[item.name]) {
            ans[item.name] = {};
        }
        ans[item.name] = item.values;
    });
    return ans;
}

function uniqueName(res) {
    const extendName = (path, name) => {
        let nodes = path.split("."), tmpName = "";
        for (let i = nodes.length - 1; i >= 0; i--) {
            tmpName = (tmpName == "") ? nodes[i] : nodes[i] + "." + tmpName;
            if (tmpName == name) {
                tmpName = nodes[i - 1] + "." + tmpName;
                break;
            }
        }
        return tmpName;
    }
    // make sure each node has a unique name
    let group = {};
    res.forEach(item => {
        if (!group[item.name]) {
            group[item.name] = [];
        }
        group[item.name].push(item);
    });
    let queue = Object.keys(group);
    while (queue.length > 0) {
        let name = queue.shift();
        let items = group[name];
        if (items.length > 1) {
            items.forEach(item => {
                item.name = extendName(item.path, item.name);
                if (!group[item.name]) {
                    group[item.name] = [];
                    queue.push(item.name);
                }
                group[item.name].push(item);
            });
            group[name] = undefined;
        }
    }
}

function getImageMetadata(graph, batch, imageId) {
    let graphMetadata = getMetaDatafromGraph(graph, batch, imageId);
    console.log(graphMetadata);
    let imageMetadata = {};
    for (let key in graphMetadata) {
        let values = Object.values(graphMetadata[key]);
        let imageValue = graphMetadata[key][JSON.stringify({ batch: batch, imageId: imageId })];
        imageMetadata[key] = {
            value: `${imageValue}`,
            values: values,
            percentage: values.filter(val => val === imageValue).length / values.length
        }
    }
    return imageMetadata;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function processSceneGraph(graph, images) {
    let imageIds = images.map(image => image.imageId);
    let { foreground, background } = graph;
    let res = { foreground: {_nodeType: 'object'}, background: {_nodeType: 'object'}, _nodeType: 'object' };
    foreground.forEach(item => {
        res["foreground"][item] = {_nodeType: 'object'};
    });
    background.forEach(item => {
        res["background"][item] = {_nodeType: 'object'};
    });
    return res;
}

const mergeMetadata = (oldMetadata, newMetadata) => {
    const mergeDeep = (target, source) => {
        if (!(target instanceof Object) || !(source instanceof Object)) {
            return source;
        }
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                target[key] = mergeDeep(target[key], source[key]);
            } else if (!(key in target)) {
                target[key] = source[key];
            }
        }
        return target;
    };
    return mergeDeep(oldMetadata, newMetadata);
}

const isObjectSubset = (obj1, obj2) => {
    if (typeof obj1 != 'object' || typeof obj2 != 'object' || obj1 == null || obj2 == null || obj1['EXIST'] == false || obj1['exist'] == false || obj1['EXIST'] == 'no' || obj1['exist'] == 'no') {
        return true;
    }
    for (let key in obj2) {
        if (key == 'exist' || key == 'EXIST') continue;
        if (obj1[key] == undefined) {
            return false;
        } else {
            let res = isObjectSubset(obj1[key], obj2[key]);
            if (!res) return false;
        }
    }
    return true;
}

const getColorScale = (index) => {
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    let colors = [];
    for (let i = 0; i < 10; i++) {
        colors.push(colorScale(i));
    }
    if (index == undefined || index < 0) {
        return 'gray';
    } else {
        return colors[index % 10];
    }
}

const getGroupId = (groups, batch) => {
    for (let i = 0; i < groups.length; i++) {
        if (groups[i].items.includes(batch)) {
            return i;
        }
    }
    return -1;
}

const removeRedundantFields = (data, schema) => {
    const result = deepClone(data);
    const traverse = (curNode, schemaNode) => {
        if (typeof (curNode) !== 'object') return;
        let keys = Object.keys(curNode);
        for (let key of keys) {
            if (key == 'exist' || key == 'EXIST') {
                delete curNode[key];
                continue;
            }
            if (typeof (curNode[key]) == 'object') {
                if (typeof (schemaNode[key]) == 'object') {
                    traverse(curNode[key], schemaNode[key]);
                } else {
                    delete curNode[key];
                }
            } else {
                if (typeof (schemaNode[key]) == 'undefined' || curNode[key] == "") {
                    delete curNode[key];
                }
            }
        }
    };
    traverse(result, schema);
    return result;
}

const repairDataWithSchema = (data, schema) => {
    console.log("repairDataWithSchema", data, schema, Object.keys(schema));
    const result = deepClone(data);
    const traverse = (curNode, schemaNode) => {
        if (typeof (curNode) !== 'object') return;
        let keys = Object.keys(schemaNode);
        for (let key of keys) {
            if (key == 'exist' || key == 'EXIST') continue;
            if (typeof (curNode[key]) == 'undefined') {
                curNode[key] = {"exist": "no"};
            } else {
                if (typeof (curNode[key]) == 'object' && typeof (schemaNode[key]) == 'object') {
                    traverse(curNode[key], schemaNode[key]);
                }
            }
        }
    };
    traverse(result, schema);
    return result;
}

function removeUnderscoreFields(obj) { // remove the fields that start with "_"
    // Check if the input is an object
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    // Create a new object to hold the filtered properties
    const result = {};

    // Iterate over the object's properties
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            // If the key does not start with "_", add it to the result
            if (!key.startsWith('_')) {
                result[key] = removeUnderscoreFields(obj[key]);
            }
        }
    }

    return result;
}

function getScope(imageInfo, graphSchema) {
    /**
     * Get a subschema from the graph schema that contains the imageInfo
     */
    let res = {};
    Object.keys(graphSchema).forEach((key) => {
        if (key.startsWith("_")) {
            // res[key] = deepClone(graphSchema[key]);
            return;
        }
        if (graphSchema.scope && graphSchema.scope.length > 0) {
            // check if all imageInfo are in the graphSchema.scope
            let ok = true;
            imageInfo.forEach(i => {
                if (!graphSchema.scope.some(image => image.imageId == i.id && image.batch == i.batch)) {
                    ok = false;
                }
            });
            if (ok) {
                res[key] = getScope(imageInfo, graphSchema[key]);
            }
        }
    });
    return res;
}

function updateGraphSchemaWithScope(graphSchema, subSchema, imageInfo) {
    /**
     * Update the graph schema by adding imageInfo to the "_scope" for all nodes within the subSchema
     */
    if (typeof(subSchema) !== 'object' || subSchema === null) {
        return;
    }
    if (!graphSchema._scope) {
        graphSchema._scope = [];
    }
    graphSchema._scope.push(...imageInfo);

    // Recursively update children that exist in subSchema
    Object.keys(graphSchema).forEach((key) => {
        // Skip keys starting with "_"
        if (key.startsWith("_")) {
            return;
        }

        if (subSchema[key]) {
            updateGraphSchemaWithScope(graphSchema[key], subSchema[key], imageInfo);
        }
    });
}

function wrapSchemaForLabeling(graphSchema) {
    /**
     * Wrap the graph schema by (a) modifying all attribute nodes to a string of the format "Choose from the following candidate values: [...]" or "..." (if no candidate values are provided) (b) removing all fields that start with "_" for other nodes
     * @param {object} graphSchema - The graph schema to be wrapped
     * @returns {object} - The wrapped graph schema
     */
    let res = {};
    if (typeof(graphSchema) !== 'object' || graphSchema === null) {
        return graphSchema;
    }
    Object.keys(graphSchema).forEach((key) => {
        if (key.startsWith("_")) {
            return;
        }
        if (graphSchema[key]._nodeType === 'attribute') {
            let isCandidateValuesSpecified = graphSchema[key]._candidateValues instanceof Array && graphSchema[key]._candidateValues.length > 0; 
            res[key] = isCandidateValuesSpecified ? `Choose from the following candidate values: ${graphSchema[key]._candidateValues.join(",")}` : `...`;
        } else if (graphSchema[key]._nodeType === 'object') {
            res[key] = wrapSchemaForLabeling(graphSchema[key]);
        } else {
            res[key] = graphSchema[key];
        }
    });
    return res;
}

function getLeafNodes(graph) {
    /**
     * Return a list of all leaf nodes in the given scene graph.
     * A leaf node is defined as a node with no children.
     */
    const leafNodes = [];

    function traverse(node) {
        if (!node.children || node.children.length === 0) {
            leafNodes.push(node);
        } else {
            for (const child of node.children) {
                traverse(child);
            }
        }
    }

    traverse(graph);

    return leafNodes;
}

export { deepClone, calculateGraph, getMetaDatafromGraph, getImageMetadata, arrayBufferToBase64, processSceneGraph, mergeMetadata, isObjectSubset, getColorScale, getGroupId, removeRedundantFields, repairDataWithSchema, uniqueName, removeUnderscoreFields, getScope, updateGraphSchemaWithScope, wrapSchemaForLabeling, getLeafNodes };