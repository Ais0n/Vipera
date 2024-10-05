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
function calculateGraph(metaData, graphSchema) {
    const buildGraph = (data) => {
        const result = [];
        Object.keys(data).forEach((key) => {
            const node = { name: key, children: [], count: 0 };
            result.push(node);
            const queue = [{ node, data: data[key] }];
            while (queue.length) {
                const { node: currentNode, data: currentData } = queue.shift();
                if (Array.isArray(currentData)) {
                    // currentData.forEach((item) => {
                    //     currentNode.children.push({ name: item, children: [], count: 0 });
                    // });
                    currentNode.children.push({name: 'values', children: [], count: 0});
                } else {
                    Object.keys(currentData).forEach((subKey) => {
                        const subNode = { name: subKey, children: [], count: 0 };
                        currentNode.children.push(subNode);
                        queue.push({ node: subNode, data: currentData[subKey] });
                    });
                }
            }
        });
        return result;
    };

    const traverseGraph = (curNode, dataItem, itemMetadata) => {
        if (!curNode.imageInfo) {
            curNode.imageInfo = [];
        }

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
        } else if (typeof (dataItem) != 'undefined') {
            if (!curNode.children[0]) {
                return;
            }
            if (!curNode.values) {
                curNode.values = {};
            }
            curNode.values[JSON.stringify({ batch: itemMetadata.batch, imageId: itemMetadata.imageId })] = dataItem;
            if (!curNode.children[0].list) {
                curNode.children[0].list = [];
            }
            let ok = false;
            curNode.children[0].list.forEach(item => {
                if (item.batch == itemMetadata.batch && item.dataItem == dataItem) {
                    item.count += 1;
                    item.imageId.push(itemMetadata.imageId);
                    ok = true;
                }
            })
            if (!ok) {
                curNode.children[0].list.push({ batch: itemMetadata.batch, imageId: [itemMetadata.imageId], dataItem: dataItem, count: 1 });
            }

            // let childNode = curNode.children.find(node => node.name === dataItem);
            // if (childNode) {
            //     traverseGraph(childNode, undefined, itemMetadata);
            // }
        }
    }

    let graph = {
        name: 'root',
        children: buildGraph(graphSchema),
    }
    metaData.forEach(item => {
        let itemMetadata = item.metaData;
        traverseGraph(graph, item, itemMetadata);
    })
    return graph; // Return the constructed graph
}

// get metadata for an image from the graph
function getMetaDatafromGraph(graph, batch, imageId) {
    let res = {};
    let curNode = graph;
    const traverseGraph = (curNode, res) => {
        if (curNode.imageInfo) {
            let isFound = false;
            curNode.imageInfo.forEach(item => {
                if (item.batch == batch && item.imageId == imageId) {
                    isFound = true;
                }
            })
            if (isFound) {
                if (curNode.values) {
                    res[curNode.name] = curNode.values;
                } else if (curNode.children) {
                    curNode.children.forEach(child => {
                        traverseGraph(child, res);
                    })
                }
            }
        }
    }
    traverseGraph(curNode, res);
    return res;
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

export { deepClone, calculateGraph, getMetaDatafromGraph, arrayBufferToBase64 };