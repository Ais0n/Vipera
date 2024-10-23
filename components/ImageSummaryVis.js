import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import numeric from 'numeric';
import { PCA } from 'ml-pca';
import * as Utils from '../utils.js';
import Tooltip from './Tooltip';
import { Empty } from 'antd';

const ImageSummaryVis = ({ images, data, graph, graphSchema, hoveredImageIds, addBookmarkedChart, colorScale, setHighlightTreeNodes }) => {
    const [tooltipData, setTooltipData] = useState({ visible: false, x: 0, y: 0, image: '', data: {} });
    const [legendData, setLegendData] = useState([]);
    const [currentJitteredData, setCurrentJitteredData] = useState([]);
    const checkDataValid = (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) { return false; }
        const matrix = data.map(row => Object.values(row));
        let maxLength = 0;
        for (let i = 0; i < matrix.length; i++) {
            if (matrix[i].length > maxLength) {
                maxLength = matrix[i].length;
            }
        }
        return maxLength > 0;
    }

    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) { return; }

        // PCA Implementation
        const pca = (data) => {
            const matrix = data.map(row => Object.values(row));
            let maxLength = 0;
            for (let i = 0; i < matrix.length; i++) {
                if (matrix[i].length > maxLength) {
                    maxLength = matrix[i].length;
                }
            }

            console.log(data)

            for (let i = 0; i < maxLength; i++) {
                if (typeof (matrix[0][i]) !== 'number') {
                    const uniqueValues = Array.from(new Set(matrix.map(row => row[i])));
                    const valueMap = {};
                    uniqueValues.forEach((value, index) => {
                        valueMap[value] = index;
                    });
                    matrix.forEach(row => {
                        row[i] = valueMap[row[i]];
                        // if(uniqueValues.length == 1) {
                        //     row[i] += Math.random();
                        // }
                    });
                }
            }

            const mean = matrix.reduce((acc, row) => {
                return acc.map((val, i) => val + row[i]);
            }, Array(matrix[0].length).fill(0)).map(val => val / matrix.length);

            const stdDev = matrix.map(row => row.map((val, i) => (val - mean[i]) ** 2))
                .reduce((acc, row) => acc.map((val, i) => val + row[i]), Array(matrix[0].length).fill(0))
                .map(val => Math.sqrt(val / (matrix.length - 1)));

            const standardizedMatrix = matrix.map(row =>
                row.map((val, i) => {
                    return stdDev[i] !== 0 ? (val - mean[i]) / stdDev[i] : 0;
                })
            );

            console.log(standardizedMatrix);
            const pca = new PCA(standardizedMatrix);
            const result = pca.predict(standardizedMatrix);
            return result.data;
        };

        const flattenData = (data, prefixKey, target) => {
            for (let key in data) {
                if (typeof (data[key]) === 'object') {
                    flattenData(data[key], prefixKey === '' ? String(key) : prefixKey + '-' + String(key), target);
                } else {
                    target[prefixKey === '' ? String(key) : prefixKey + '-' + String(key)] = data[key];
                }
            }
        };

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

        let flattenedData = [];
        console.log(data)
        for (let item of data) {
            let { metaData, ...rest } = item;
            let tmp = {};
            rest = removeRedundantFields(Utils.deepClone(rest), graphSchema);
            flattenData(rest, '', tmp);
            flattenedData.push(tmp);
        }
        console.log(flattenedData)
        if (!checkDataValid(flattenedData)) {
            d3.select("#scatterplot").append("text")
                .attr("x", 200)
                .attr("y", 100)
                .text("You need to first add an attribute to an object for this visualization.")
                .style("font-size", "15px")
                .style("font-weight", "bold");
            return;
        }
        flattenedData = flattenedData.map((r) => { return { ...r } });
        const reducedData = pca(flattenedData);
        // metadata is removed during pca, so we have to restore the information
        for (let i = 0; i < reducedData.length; i++) {
            reducedData[i].data = data[i];
            delete reducedData[i].random;
        }
        console.log(reducedData)

        const jitter = (value) => {
            if (!value) value = 0;
            const jitterAmount = 0.5;
            return value + (Math.random() - 0.5) * jitterAmount;
        };

        const jitteredData = reducedData.map(point => [
            jitter(point[0]),
            jitter(point[1]),
            point.data
        ]);
        console.log(jitteredData)
        setCurrentJitteredData(jitteredData);

        const svg = d3.select("#scatterplot");
        let svgWidth = svg.node().getBoundingClientRect().width;
        let svgHeight = svg.node().getBoundingClientRect().height;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;
        const x = d3.scaleLinear()
            .domain(d3.extent(jitteredData, d => d[0])).nice()
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain(d3.extent(jitteredData, d => d[1])).nice()
            .range([height, 0]);

        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // g.append("g")
        //     .attr("class", "x-axis")
        //     .attr("transform", `translate(0,${height})`)
        //     .call(d3.axisBottom(x));

        // g.append("g")
        //     .attr("class", "y-axis")
        //     .call(d3.axisLeft(y));

        // const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


        g.selectAll("circle")
            .data(jitteredData)
            .enter().append("circle")
            .attr("cx", d => x(d[0]))
            .attr("cy", d => y(d[1]))
            .attr("r", 5)
            .attr("fill", d => { return colorScale(d[2].metaData.batch) })
            .attr("opacity", 0.7)
            // .attr("stroke", d => hoveredImageIds.includes(d[2].metaData.imageId) ? 'black' : 'none')
            // .attr("stroke-width", 2)
            .on("mouseover", function (event, d) {
                console.log(event, d)
                let _image = images.find(image => image.id === d[2].metaData.imageId && image.batch === d[2].metaData.batch);
                if (!_image) {
                    return;
                }
                setHighlightTreeNodes(d[2].metaData);
                let graphMetadata = Utils.getMetaDatafromGraph(graph, d[2].metaData.batch, d[2].metaData.imageId);
                let imageMetadata = {};
                for (let key in graphMetadata) {
                    let values = Object.values(graphMetadata[key]);
                    let imageValue = graphMetadata[key][JSON.stringify({ batch: d[2].metaData.batch, imageId: d[2].metaData.imageId })];
                    imageMetadata[key] = {
                        value: `${key}: ${imageValue}`,
                        percentage: values.filter(val => val === imageValue).length / values.length
                    }
                }
                setTooltipData({
                    visible: true,
                    x: event.pageX + 5,
                    y: event.pageY - 28,
                    image: _image.data,
                    data: imageMetadata,
                });
            })
            .on("mouseout", function (d) {
                setHighlightTreeNodes({});
                setTooltipData(prev => ({ ...prev, visible: false }));
            });

        // Set legend data
        const uniqueBatches = Array.from(new Set(data.map(d => d.metaData.batch)));
        setLegendData(uniqueBatches.map(batch => (colorScale(batch) != 'gray' && {
            batch,
            color: colorScale(batch),
        })));
    }, [data]);

    // set stroke for hovered images
    useEffect(() => {
        const svg = d3.select("#scatterplot");
        svg.selectAll("circle")
            .attr("stroke", d => hoveredImageIds.includes(d[2].metaData.imageId) ? 'black' : 'none')
            .attr("stroke-width", 4);
    }, [hoveredImageIds]);

    // reset color when color scale changes
    useEffect(() => {
        const svg = d3.select("#scatterplot");
        svg.selectAll("circle")
            .attr("fill", d => { return colorScale(d[2].metaData.batch) });
        // reset legend data
        const uniqueBatches = Array.from(new Set(data.map(d => d.metaData.batch)));
        setLegendData(uniqueBatches.map(batch => (colorScale(batch) != 'gray' && {
            batch,
            color: colorScale(batch),
        })));
    }, [colorScale]);

    return (
        <>
            <div id="legend" style={{ display: 'flex', flexDirection: 'row', gap: '20px', justifyContent: 'right', marginRight: '20px' }}>
                {legendData.map((item, index) => (item &&
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '18px',
                            height: '18px',
                            backgroundColor: item.color,
                            marginRight: '8px',
                            borderRadius: '50%',
                        }} />
                        <span>Prompt {item.batch}</span>
                    </div>
                ))}
                <img src='/bookmark.svg' style={{ width: '20px', height: '20px', 'cursor': 'pointer' }} onClick={() => { addBookmarkedChart({ "type": "scatterplot", "data": currentJitteredData }) }}></img>
            </div>
            <svg id="scatterplot" width="100%" height="200"></svg>
            <Tooltip
                visible={tooltipData.visible}
                x={tooltipData.x}
                y={tooltipData.y}
                image={tooltipData.image}
                data={tooltipData.data}
            />
        </>

    );
};

export default ImageSummaryVis;