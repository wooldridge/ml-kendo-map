import { createContext, useState, useEffect } from "react";
import axios from "axios";

const MLContext = createContext({
  results: [],
  locations: [],
  query: undefined,
  start: 1,
  pageLength: 10,
  total: 0,
  loading: false,
  document: {},
  facets: {},
  handlePaging: () => {},
  handleQuery: () => {},
  handleGeo: () => {},
  handleDocument: () => {},
  handleFacets: () => {},
});

export function MLProvider(props) {

  const [results, setResults] = useState([]);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState(undefined);
  const [start, setStart] = useState(1);
  const [pageLength, setPageLength] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState({});
  const [facets, setFacets] = useState(null);

  useEffect(() => {
    handleSearch();
  }, [query, start]);

  // {
  //   latlng: [30.2675, -97.7409],
  //   name: "Zevo Toys",
  // },
  // {
  //   latlng: [30.2707, -97.749],
  //   name: "Foo Bars",
  // },
  // {
  //   latlng: [30.2705, -97.7409],
  //   name: "Mainway Toys",
  // },
  // {
  //   latlng: [30.2686, -97.7494],
  //   name: "Acme Toys",
  // },

  const getLocations = (results) => {
    let locations = [];
    results.forEach(r => {
      let addressesArr = Array.isArray(r.extracted.person.addresses.address) ? 
        r.extracted.person.addresses.address : 
        [r.extracted.person.addresses.address];
      let addresses = addressesArr.map(a => {
        return {
          latlng: [a.latitude, a.longitude],
          name: a.street.concat(', ', a.city, ', ', a.state)
        }
      })
      locations = [...locations, ...addresses]
      let schoolsArr = Array.isArray(r.extracted.person.schools.school) ? 
        r.extracted.person.schools.school : 
        [r.extracted.person.schools.school];
      let schools = schoolsArr.map(s => {
        return {
          latlng: [s.latitude, s.longitude],
          name: s.name.concat(', ', s.country)
        }
      })
      locations = [...locations, ...schools]
    });
    return locations;
  }

  const handleSearch = async () => {
    if (query === undefined) return;
    const endpoint = props.scheme + "://" + props.host + ":" + props.port + '/v1/search' + 
      '?q=/' + query + '&format=json&start=' + start + '&pageLength=' + pageLength + '&options=search-options';
    setLoading(true);
    try {
      const response = await axios.get(endpoint);
      if (response && response.status === 200) {
        console.log("response.data.results", response.data.results);
        setResults(response.data.results);
        setLocations(getLocations(response.data.results));
        setTotal(response.data.total);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error: handleSearch", error);
    }
  }

  const transformShapes = (shapes) => {
    let polygons = shapes.map(arr1 => {
      return { 
        point: (typeof arr1[0][0] === 'number') ? arr1.map(arr2 => {
          return {
            "latitude": arr2[1],
            "longitude": arr2[0]
          }
        }) : arr1[0].map(arr2 => {
          return {
            "latitude": arr2[1],
            "longitude": arr2[0]
          }
        })
      }
    });
    return {
      "query": {
        "queries": [
            {
          "geo-elem-pair-query": {
              "lat": {
                  "name": "latitude"
              },
              "lon": {
                  "name": "longitude"
              },
              "parent": {
                  "name": "address"
              },
              "polygon": polygons
            }
          }
        ]
      }
    };
  }

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
        // setResults(response.data.results);
        setLocations(getLocationsGeo(response.data.results));
        setTotal(response.data.total);
        // setLoading(false);
      }
    } catch (error) {
      console.error("Error: handleGeo", error);
    }
  }

  const handleDocument = async (uri) => {
    const endpoint = props.scheme + "://" + props.host + ":" + props.port + '/v1/documents?format=json&uri='+uri;
    setLoading(true);
    // const body = transformShapes(shapes);
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response && response.status === 200) {
        console.log("handleDocument response.data.results", response.data);
        setDocument(response.data);
        // setResults(response.data.results);
        // setLocations(getLocationsGeo(response.data.results));
        // setTotal(response.data.total);
        // setLoading(false);
      }
    } catch (error) {
      console.error("Error: handleDocument", error);
    }
  }

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


  const handleQuery = async (query) => {
    setQuery(query);
    setStart(1);
  }

  const handlePaging = async (event) => {
    console.log("handlePaging", event);
    setStart(event.skip + 1);
  }

  const context = {
    results: results,
    locations: locations,
    query: query,
    start: start,
    pageLength: pageLength,
    total: total,
    loading: loading,
    document: document,
    facets: facets,
    handlePaging: handlePaging,
    handleQuery: handleQuery, 
    handleGeo: handleGeo,
    handleDocument: handleDocument,
    handleFacets: handleFacets,
  };

  return <MLContext.Provider value={context}>
    {props.children}
  </MLContext.Provider>
}

export default MLContext;
