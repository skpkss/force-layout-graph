import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { sampleData } from './sampleData';

const getTransactionCount = (source, target) => {
  return sampleData.filter(
    (data) => (data.from === source.id && data.to === target.id) || (data.from === target.id && data.to === source.id)
  ).length;
}; 

const calculateParticleSpeed = (source, target) => {
  const transactionCount = getTransactionCount(source, target);
  const defaultSpeed = 0.005;
  const speedIncrement = 0.001;

  if (transactionCount === 1) {
    return defaultSpeed;
  } else {
    return defaultSpeed + (transactionCount - 1) * speedIncrement;
  }
};

export default function GraphView() {
  function shortenAddress(address) {
    return address.substring(0, 4) + '...' + address.substring(address.length - 4);
  }

  const nodes = [];
  const links = [];
  for (let i = 0; i < sampleData.length; i++) {
    const nodeFrom = { id: sampleData[i].from, label: sampleData[i].from, amount_in_ic: sampleData[i].amount_in_ic };
    const nodeTo = { id: sampleData[i].to, label: sampleData[i].to, amount_in_ic: sampleData[i].amount_in_ic };
    nodes.push(nodeFrom);
    nodes.push(nodeTo);
    const link = { id: sampleData[i].from + '--' + sampleData[i].to, source: nodeFrom.id, target: nodeTo.id, directedParticles: 1, directedParticleColor: 'white', transactionType: sampleData[i].transaction_type };
    links.push(link);
  }

  const myData = {
    nodes: nodes,
    links: links,
  };

  const calculateParticleWidth = (amount_in_ic) => {
    const averageVolume = 1000;
    const minWidth = 0.1;
    const maxWidth = 1;

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

  const linkLabel = (link) => {
    const particleSpeed = calculateParticleSpeed(link.source, link.target);
    const particleWidth = calculateParticleWidth(sampleData.find(data => data.from === link.source.id && data.to === link.target.id)?.amount_in_ic || 0);
    return `
      <div>
        <p>Transaction Type: ${link.transactionType}</p>
        <p>Particle Speed: ${particleSpeed.toFixed(3)}</p>
        <p>Particle Width: ${particleWidth.toFixed(3)}</p>
      </div>
    `;
  };

  const nodeColor = (node) => {
    if (sampleData.some(data => data.from === node.label)) {
      return 'red';
    } else if (sampleData.some(data => data.to === node.label)) {
      return 'pink';
    } else {
      return 'orange';
    }
  };

  const calculateNodeSize = (totalVolume) => {
    return totalVolume * 2;
  };
  
  return (
    <div className='container'>
      <ForceGraph2D
        graphData={myData}
        nodeLabel={nodeLabel}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeVal={node => calculateNodeSize(node.totalVolume)}
        width={800}
        height={600}
        backgroundColor="light"
        showNavInfo={true}
        nodeColor={nodeColor}
        linkLabel={linkLabel}
        linkHoverPrecision={8}
        linkDirectionalParticles={link => link.directedParticles}
        linkDirectionalParticleSpeed={(link) => calculateParticleSpeed(link.source, link.target)}
        linkDirectionalParticleWidth={link => calculateParticleWidth(sampleData.find(data => data.from === link.source.id && data.to === link.target.id)?.amount_in_ic || 0)}
        linkDirectionalParticleColor={link => link.directedParticleColor}
        linkColor={() => 'white'}
        linkDirectionalArrowLength={3} // Length of the arrow head
        linkDirectionalArrowColor={(link) => link.transactionType === 'TRANSFER' ? 'white' : 'gray'}
      />
    </div>
  );
}