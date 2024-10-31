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
    const buildGraph = (data) => {
        const result = [];
        Object.keys(data).forEach((key) => {
            const node = { name: key, children: [], count: 0, type: "object" };
            result.push(node);
            const queue = [{ node, data: data[key] }];
            while (queue.length) {
                const { node: currentNode, data: currentData } = queue.shift();
                if (Array.isArray(currentData)) {
                    // currentData.forEach((item) => {
                    //     currentNode.children.push({ name: item, children: [], count: 0 });
                    // });
                    // currentNode.children.push({name: 'values', type: "attribute", children: [], count: 0});
                    currentNode.type = "attribute";
                } else {
                    Object.keys(currentData).forEach((subKey) => {
                        const subNode = { name: subKey, children: [], count: 0, type: "object" };
                        currentNode.children.push(subNode);
                        queue.push({ node: subNode, data: currentData[subKey] });
                    });
                }
            }
        });
        return result;
    };

    const traverseGraph = (curNode, dataItem, itemMetadata) => {
        curNode.imageInfo.push(itemMetadata);
        curNode.count = curNode.imageInfo.length;

        if (typeof (dataItem) === 'object') {
            for (let key in dataItem) {
                if (curNode.children) {
                    let childNode = curNode.children.find(node => node.name === key);
                    if (childNode) {
                        traverseGraph(childNode, dataItem[key], itemMetadata);
                    }
                }
            }
        } else if (typeof (dataItem) != 'undefined' && dataItem != "") {
            if(curNode.type != 'attribute') {
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
                    if(!item.imageId.includes(itemMetadata.imageId)) {
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

    if(!graph || !graph.children) {
        graph = { 
            name: 'root',
            children: buildGraph(graphSchema),
        } 
    }
    // recursively make node.imageInfo = []
    const makeNodeImageInfo = (node) => {
        node.imageInfo = [];
        if(node.type == "attribute") {
            node.list = [];
        }
        if(node.children) {
            node.children.forEach(child => {
                makeNodeImageInfo(child);
            });
        }
    }
    makeNodeImageInfo(graph);

    metaData.forEach(item => {
        let itemMetadata = item.metaData;
        traverseGraph(graph, item, itemMetadata);
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
                    res.push({name: curNode.name, values: curNode.values, path: (path == "") ? curNode.name :  path + "." + curNode.name});
                } else if (curNode.children) {
                    curNode.children.forEach(child => {
                        traverseGraph(child, res, (path == "") ? curNode.name : path + "." + curNode.name);
                    })
                }
            }
        }
    }
    traverseGraph(curNode, res, "");
    const extendName = (path, name) => {
        let nodes = path.split("."), tmpName = "";
        for(let i = nodes.length - 1; i >= 0; i--) {
            tmpName = (tmpName == "") ? nodes[i] : nodes[i] + "." + tmpName;
            if(tmpName == name) {
                tmpName = nodes[i-1] + "." + tmpName;
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
    while(queue.length > 0) {
        let name = queue.shift();
        let items = group[name];
        if(items.length > 1) {
            items.forEach(item => {
                item.name = extendName(item.path, item.name);
                if(!group[item.name]) {
                    group[item.name] = [];
                    queue.push(item.name);
                }
                group[item.name].push(item);
            });
            group[name] = undefined;
        }
    }
    let ans = {};
    res.forEach(item => {
        if(!ans[item.name]) {
            ans[item.name] = {};
        }
        ans[item.name] = item.values;
    });
    return ans;
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

function processSceneGraph(graph) {
    // // remove all leaf nodes (set null value)
    // const removeLeafNodes = (node, depth) => {
    //     if(depth >= 2) return {};
    //     let keys = Object.keys(node);
    //     if (keys.length == 0) {
    //         return {};
    //     } else {
    //         for(let key of keys) {
    //             if(!node[key] || typeof(node[key]) != 'object') {
    //                 node[key] = {};
    //                 continue;
    //             }
    //             node[key] = removeLeafNodes(node[key], depth + 1);
    //         }
    //         return node;
    //     }
    // };
    // graph = removeLeafNodes(graph, 0);
    // return graph;
    let {foreground, background} = graph;
    let res = {foreground: {}, background: {}};
    foreground.forEach(item => {
        res["foreground"][item] = {};
    });
    background.forEach(item => {
        res["background"][item] = {};
    });
    return res;
}

const mergeMetadata = (oldMetadata, newMetadata) => {
    const mergeDeep = (target, source) => {
        if(!(target instanceof Object) || !(source instanceof Object)) {
            return source;
        }
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                target[key] = mergeDeep(target[key], source[key]);
            } else if(!(key in target)) {
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
        if(key == 'exist' || key == 'EXIST') continue;
        if (obj1[key] == undefined) {
            return false;
        } else {
            let res = isObjectSubset(obj1[key], obj2[key]);
            if(!res) return false;
        }
    }
    return true;
}

const getColorScale = (index) => {
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    let colors = [];
    for(let i = 0; i < 10; i++) {
        colors.push(colorScale(i));
    }
    if (index == undefined || index < 0) {
        return 'gray';
    } else {
        return colors[index % 10];
    }
}

const getGroupId = (groups, batch) => {
    for(let i = 0; i < groups.length; i++) {
        if(groups[i].items.includes(batch)) {
            return i;
        }
    }
    return -1;
}

export { deepClone, calculateGraph, getMetaDatafromGraph, arrayBufferToBase64, processSceneGraph, mergeMetadata, isObjectSubset, getColorScale, getGroupId };