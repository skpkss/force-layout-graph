import React, { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';

const DEFAULT_NETWORK_GRAPH_EDGE_SPEED = 0.005;
const DEFAULT_NETWORK_GRAPH_SPEED_INCREMENT = 0.001;
const DEFAULT_PARTICLE_AVERAGE_VOLUME = 1000;
const DEFAULT_PARTICLE_MIN_WIDTH = 0.1;
const DEFAULT_PARTICLE_MAX_WIDTH = 1; 

const fetchTransactionData = async (duration) => {
  try {
    const response = await axios.get(`http://localhost:4000/analytics/network-graph?duration=${duration}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    return [];
  }
};

function shortenAddress(address) {
  return address.substring(0, 4) + '...' + address.substring(address.length - 4);
}

const calculateParticleSpeed = (source, target, transactions) => {
  const transactionCount = transactions.filter(
    (t) => t.from === source.id && t.to === target.id
  ).length;
  const defaultSpeed = DEFAULT_NETWORK_GRAPH_EDGE_SPEED;
  const speedIncrement = DEFAULT_NETWORK_GRAPH_SPEED_INCREMENT;
  if (transactionCount === 1) {
    return defaultSpeed;
  } else {
    return defaultSpeed + (transactionCount - 1) * speedIncrement;
  }
};

const calculateParticleWidth = (transactions, from, to) => {
  const amount_in_ic = transactions.find(
    (t) => t.from === from && t.to === to
  )?.amount_in_ic;
  const averageVolume = DEFAULT_PARTICLE_AVERAGE_VOLUME;
  const minWidth = DEFAULT_PARTICLE_MIN_WIDTH;
  const maxWidth = DEFAULT_PARTICLE_MAX_WIDTH;
  if (amount_in_ic <= averageVolume) {
    const ratio = amount_in_ic / averageVolume;
    return minWidth + ratio * (maxWidth - minWidth);
  } else {
    const ratio = Math.log10(amount_in_ic / averageVolume);
    return minWidth + ratio * (maxWidth - minWidth);
  }
};

const nodeLabel = (node) => {
  return `
      <div>
        <p>Wallet Address: ${shortenAddress(node.label)}</p>
      </div>
    `;
};

const linkLabel = (link, transactions) => {
  const particleSpeed = calculateParticleSpeed(link.source, link.target, transactions);
  const particleWidth = calculateParticleWidth(transactions, link.source.id, link.target.id);
  return `
    <div>
      <p>Transaction Type: ${link.transactionType}</p>
      <p>Particle Speed: ${particleSpeed.toFixed(3)}</p>
      <p>Particle Width: ${particleWidth.toFixed(3)}</p>
    </div>
  `;
};

const nodeColor = (node, transactions) => {
  const isFromNode = transactions.some((data) => data.from === node.label);
  const isToNode = transactions.some((data) => data.to === node.label);

  if (isFromNode && !isToNode) {
    return 'red';
  } else if (isFromNode && isToNode) {
    return 'pink';
  } else {
    return 'orange';
  }
};

export default function GraphView() {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loadedImage, setLoadedImage] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchData(60);

    // Load image
    const image = new Image();
    image.src = "https://assets-global.website-files.com/6364e65656ab107e465325d2/637add10bbca04e8468c02ed_Aqh_6YjMgGzy59Q0yCt9pah_JM3nPhIjNfGmrwK0lBo.jpeg";
    image.onload = function () {
      setLoadedImage(image);
    };
    image.onerror = (err) => {
      console.log("Error while loading the image: ", image.src);
    };
  }, []);

  const fetchData = async (timer) => {
    const transactionData = await fetchTransactionData(timer); // Fetch data for the last 60 seconds
    setTransactions(transactionData);

    let nodes = new Set();
    const links = [];
    let uniqueNodeSet = new Set();

    for (const data of transactionData) {
      let { from = "Thin Air", to, amount_in_ic, transaction_type } = data;


      if (!uniqueNodeSet.has(from)) {
        nodes.add({ id: from, label: from, nodeColor: 'red', nodeSize: 6, nodeImage: false });
        uniqueNodeSet.add(from);
      }
      if (!uniqueNodeSet.has(to)) {
        nodes.add({ id: to, label: to, nodeColor: 'orange', nodeSize: 6, nodeImage: true });
        uniqueNodeSet.add(to);
      }

      if (from && to) {
        links.push({
          id: `${from}--${to}`,
          source: from,
          target: to,
          directedParticles: 1,
          directedParticleColor: 'white', // camel case
          transactionType: transaction_type,
          amount_in_ic: amount_in_ic, // snake case
        });
      }
    }

    const myData = {
      nodes: Array.from(nodes),
      links,
    };
    setData(myData);
  };



  const nodeCanvasObject = (node, ctx, globalScale) => {
    const isFromNode = transactions.some(data => data.from === node.label);
    const isToNode = transactions.some(data => data.to === node.label);
    const isBothFromAndTo = isFromNode && isToNode;
    let radius = node.nodeSize || 6; // Use the provided nodeSize, or default to 6

    if (node.nodeImage && loadedImage) {
      // If nodeImage is true and the image is loaded, draw the image
      const logoSize = radius * 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, logoSize / 2, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        loadedImage,
        node.x - logoSize / 2,
        node.y - logoSize / 2,
        logoSize,
        logoSize
      );
      ctx.restore();
    } else if (isBothFromAndTo) {
      // If the node is both from and to, draw a pink circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'pink';
      ctx.fill();
    } else {
      // Otherwise, draw a circle with the provided nodeColor or a default color
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.nodeColor || nodeColor(node, transactions);
      ctx.fill();
    }

    ctx.font = '10px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText('', node.x, node.y + 14);
  };
  return (
    <div className='container'>
      <ForceGraph2D
        graphData={data}
        nodeLabel={nodeLabel}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeVal={6}
        width={1200}
        height={600}
        backgroundColor="light"
        showNavInfo={true}
        linkLabel={(link) => linkLabel(link, transactions)}
        linkHoverPrecision={8}
        linkDirectionalParticles={(link) => link.directedParticles}
        linkDirectionalParticleSpeed={(link) => calculateParticleSpeed(link.source, link.target, transactions)}
        linkDirectionalParticleWidth={(link) => calculateParticleWidth(transactions, link.source.id, link.target.id)}
        linkDirectionalParticleColor={(link) => link.directedParticleColor}
        linkColor={() => 'white'}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowColor={(link) => link.transactionType === 'TRANSFER' ? 'white' : 'gray'}
        nodeCanvasObject={(node, ctx, globalScale) =>
          nodeCanvasObject(node, ctx, globalScale, transactions)
        }
        nodeCanvasObjectMode={() => 'replace'}
      />
    </div>
  );
}