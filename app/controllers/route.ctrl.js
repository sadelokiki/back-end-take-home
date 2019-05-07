const Airports = require('../models/airports.model');
const csv = require('csv-parser');
const fs = require('fs');
const Graph = require('../utils');

const graph = new Graph();

fs.createReadStream(process.cwd() + '/data/routes.csv')
  .pipe(csv())
  .on('data', (data) => {
    graph.addVertex(data.Origin);
    graph.addVertex(data.Destination);
    graph.addEdge(data.Origin, data.Destination);
  })
  .on('error', (err) => console.log(err, 'error populating cache'))
  .on('end', () => console.log('done populating cache'));

function getShortestRoute(source, destination) {
  const bfs = graph.breathFirstSearch(source, destination);
  return Promise.resolve(graph.shortestPathFromTo(bfs, source, destination));
}

function getAirportData(arr) {
  if(arr) {
    return Promise.all(arr.map((iata) => {
      return Airports.find({iata3: iata });
    }))
  }
}

module.exports = {
  fetchShortestRoute: ((req, res) => {
    const { origin, destination } = req.query;

    getShortestRoute(origin, destination)
    .then(getAirportData)
    .then(airports => {
      if(airports && airports.length > 1) {
        res.status(200).json({
          message: 'Found shortest route',
          airports  
        })
      } else {
        res.status(200).json({
          message: `No route found between ${origin} and ${destination}`,
        })
      }
    })
    .catch(error =>{
      res.status(400).json({
        message: 'Source or destination not found',
        error
      })
    });
  }) 
}