import { createContext, useState, useEffect } from "react";
import axios from "axios";

const MLContext = createContext({
  locations: [],
  pageLength: 10,
  total: 0,
  loading: false,
  document: {},
  facets: {},
  handleGeo: () => {},
  handleDocument: () => {},
  handleFacets: () => {},
});

// Provide global functions for performing MarkLogic REST calls
export function MLProvider(props) {

  const [locations, setLocations] = useState([]);
  const [pageLength, setPageLength] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState({});
  const [facets, setFacets] = useState(null);

  // Transform GeoJSON shape(s) into MarkLogic geospatial payload
  const transformShapes = (shapes) => {
    let polygons = shapes.map(arr1 => {
      return { 
        point: (typeof arr1[0][0] === 'number') ? arr1.map(arr2 => {
          return {
            latitude: arr2[1],
            longitude: arr2[0]
          }
        }) : arr1[0].map(arr2 => {
          return {
            latitude: arr2[1],
            longitude: arr2[0]
          }
        })
      }
    });
    return {
      query: {
        queries: [
            {
          "geo-elem-pair-query": {
              lat: {
                  name: "latitude"
              },
              lon: {
                  name: "longitude"
              },
              parent: {
                  name: "address"
              },
              polygon: polygons
            }
          }
        ]
      }
    };
  }

  // Get locations from MarkLogic results payload
  const getLocationsGeo = (results) => {
    let locations = [];
    results.forEach(r => {
      let addressesArr = Array.isArray(r.extracted.person.addresses.address) ? 
        r.extracted.person.addresses.address : 
        [r.extracted.person.addresses.address];
      let addresses = addressesArr.map(a => {
        return {
          latlng: [a.latitude, a.longitude],
          name: a.street.concat(', ', a.city, ', ', a.state),
          uri: '/person/'+r.extracted.person.personId+'.xml'
        }
      })
      locations = [...locations, ...addresses]
    });
    return locations;
  }

  // Execute MarkLogic geospatial structured search query
  const handleGeo = async (shapes) => {
    const endpoint = props.scheme + "://" + props.host + ":" + props.port + '/v1/search?collection=person&q=&format=json&options=search-options';
    setLoading(true);
    const body = transformShapes(shapes);
    try {
      const response = await axios.post(endpoint, JSON.stringify(body), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response && response.status === 200) {
        console.log("handleGeo response.data.results", response.data.results);
        setLocations(getLocationsGeo(response.data.results));
        setTotal(response.data.total);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error: handleGeo", error);
    }
  }

  // Get MarkLogic document
  const handleDocument = async (uri) => {
    const endpoint = props.scheme + "://" + props.host + ":" + props.port + '/v1/documents?format=json&uri='+uri;
    setLoading(true);
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response && response.status === 200) {
        console.log("handleDocument response.data.results", response.data);
        setDocument(response.data);
      }
    } catch (error) {
      console.error("Error: handleDocument", error);
    }
  }

  // Get MarkLogic facets from search query
  const handleFacets = async () => {
    const endpoint = props.scheme + "://" + props.host + ":" + props.port + '/v1/search' + 
      '?format=json&start=0&pageLength=200&options=search-options&view=facets';
    setLoading(true);
    try {
      const response = await axios.get(endpoint);
      if (response && response.status === 200) {
        console.log("handleFacets response.data.results", response.data.facets);
        setFacets(response.data.facets);
        setLoading(false);
        return response;
      }
    } catch (error) {
      console.error("Error: handleFacets", error);
    }
  }

  const context = {
    locations: locations,
    pageLength: pageLength,
    total: total,
    loading: loading,
    document: document,
    facets: facets,
    handleGeo: handleGeo,
    handleDocument: handleDocument,
    handleFacets: handleFacets,
  };

  return <MLContext.Provider value={context}>
    {props.children}
  </MLContext.Provider>
}

export default MLContext;
