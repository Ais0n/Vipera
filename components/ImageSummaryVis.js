import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import numeric from 'numeric';
import { PCA } from 'ml-pca';
import * as Utils from '../utils.js';
import Tooltip from './Tooltip';

const ImageSummaryVis = ({ images, data, graph, setSelectedNode }) => {
    const [tooltipData, setTooltipData] = useState({ visible: false, x: 0, y: 0, image: '', data: {} });
    const [legendData, setLegendData] = useState([]);
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) { return; }

        // PCA Implementation
        const pca = (data) => {
            const matrix = data.map(row => Object.values(row));
            for (let i = 0; i < matrix[0].length; i++) {
                if (typeof (matrix[0][i]) !== 'number') {
                    const uniqueValues = Array.from(new Set(matrix.map(row => row[i])));
                    const valueMap = {};
                    uniqueValues.forEach((value, index) => {
                        valueMap[value] = index;
                    });
                    matrix.forEach(row => {
                        row[i] = valueMap[row[i]];
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

            const pca = new PCA(standardizedMatrix);
            const result = pca.predict(standardizedMatrix, { nComponents: 2 });
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

        let flattenedData = [];
        for (let item of data) {
            let { metaData, ...rest } = item;
            let tmp = {};
            flattenData(rest, '', tmp);
            flattenedData.push(tmp);
        }
        console.log(flattenedData)
        const reducedData = pca(flattenedData);
        // metadata is removed during pca, so we have to restore the information
        for (let i = 0; i < reducedData.length; i++) {
            reducedData[i].data = data[i];
        }
        console.log(reducedData)

        const jitter = (value) => {
            const jitterAmount = 0.1;
            return value + (Math.random() - 0.5) * jitterAmount;
        };

        const jitteredData = reducedData.map(point => [
            jitter(point[0]),
            jitter(point[1]),
            point.data
        ]);

        const svg = d3.select("#scatterplot");
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

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

        const color = d3.scaleOrdinal(d3.schemeCategory10);


        g.selectAll("circle")
            .data(jitteredData)
            .enter().append("circle")
            .attr("cx", d => x(d[0]))
            .attr("cy", d => y(d[1]))
            .attr("r", 5)
            .attr("fill", d => color(d[2].metaData.batch))
            .attr("opacity", 0.7)
            .on("mouseover", function (event, d) {
                let _image = images.find(image => image.id === d[2].metaData.imageId && image.batch === d[2].metaData.batch);
                if (!_image) {
                    return;
                }
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
                setTooltipData(prev => ({ ...prev, visible: false }));
            });

            // Set legend data
            const uniqueBatches = Array.from(new Set(data.map(d => d.metaData.batch)));
            setLegendData(uniqueBatches.map(batch => ({
                batch,
                color: color(batch),
            })));
    }, [data]);

    return (
        <>
            <div id="legend" style={{ display: 'flex', flexDirection: 'row',  gap: '20px', justifyContent: 'right', marginRight: '20px' }}>
                {legendData.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '18px',
                            height: '18px',
                            backgroundColor: item.color,
                            marginRight: '8px',
                            borderRadius: '50%',
                        }} />
                        <span>Batch {item.batch}</span>
                    </div>
                ))}
            </div>
            <svg id="scatterplot" width="800" height="200"></svg>
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