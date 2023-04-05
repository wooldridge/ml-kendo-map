import React, { useState, useContext, useEffect } from 'react';
import { Map, MapLayers, MapTileLayer, MapMarkerLayer, 
  MapShapeLayer, MapMarkerLayerTooltip} from "@progress/kendo-react-map";
import MLContext from './ML';
import MySelected from "./MySelected";
import MyWindow from "./MyWindow";
import shapes from "./us-states.json";
import './MyMap.css';

const centerInit = [37.686020, -90.335571];
const tileSubdomains = ["a", "b", "c"];
const tileUrl = (e) =>
  `https://${e.subdomain}.tile.openstreetmap.org/${e.zoom}/${e.x}/${e.y}.png`;
const attribution =
  '&copy; <a href="https://osm.org/copyright">OpenStreetMap contributors</a>';

const MyMap = () => {

  const mlContext = useContext(MLContext);

  const [selected, setSelected] = useState({
    current: null, 
    previous: null // Allows deselection
  });
  const [center, setCenter] = useState(centerInit);
  const [visible, setVisible] = useState(false);
  const [person, setPerson] = useState(null);
  const shapesByName = {};

  const shapeStyle = {
    stroke: {
      color: "blue",
      width: 2,
      opacity: 0.2
    },
    fill: {
      opacity: 0
    }
  };

  const selectedStyle = {
    stroke: {
      color: "#C00",
      width: 4,
      opacity: 0.5
    }
  };

  // Load facets on init for heat map
  useEffect(() => {
    mlContext.handleFacets();
  }, []);

  const onShapeCreated = (e) => {
    // Color state based on facet count
    const shape = e.shape;
    const abbrev = e.dataItem.id;
    if (mlContext.facets && abbrev) {
      let val = mlContext.facets.state.facetValues.find(fv => {
        return abbrev === fv.name;
      })
      if (val) {
        const opacity = val.count / 40;
        shape.options.set("fill.opacity", opacity);
        shape.options.set("fill.color", "blue");
      }
    }
    // Create object of shapes for reference
    let name = e.dataItem.properties.name;
    shapesByName[name] = shapesByName[name] || [];
    shapesByName[name].push(shape);
    // Handle selection if it exists (e.g. on pan redraw)
    if (selected.current) handleSelection(selected.current);
  };

  // Document change updates the person panel
  useEffect(() => {
    console.log(mlContext.document);
    if (mlContext.document) {
      setPerson(mlContext.document.person);
    };
  }, [mlContext.document]);

  // Shape clicks trigger a geospatial search query
  const handleShapeClick = (event) => {
    setSelected((prevSelected) => {
      return {
        previous: prevSelected.current,
        current: event.shape.dataItem.properties.name
      };
    })
    mlContext.handleGeo(event.shape.dataItem.geometry.coordinates);
  }

  // After marker location update, update selection borders
  // NOTE Updating in handleShapeClick clobbers selection styles
  useEffect(() => {
    let prevShapes = shapesByName[selected.previous];
    if (prevShapes) {
      // Deselect previous
      prevShapes.map(shape => {
        shape.options.set('stroke', shapeStyle.stroke);
      })
    }
    // Select current
    handleSelection(selected.current);
  }, [mlContext.locations]);

  // Add selection style
  const handleSelection = (name) => {
    let selectedShapes = shapesByName[name];
    if (selectedShapes) {
      selectedShapes.map(shape => {
        shape.options.set('stroke', selectedStyle.stroke);
      })
    }
  }

  // Marker clicks trigger a document load
  const handleMarkerClick = (event) => {
    console.log('handleMarkerClick', event);
    setVisible(true);
    setPerson(null);
    mlContext.handleDocument(event.marker.dataItem.uri);
  }

  const toggleDialog = () => {
    setVisible(!visible);
  }

  // Avoid re-centering on redraw
  const handlePan = (e) => {
    console.log('handlePan', e.center);
    setCenter(e.center);
  };

  // TODO Can we do the same with zoom?
  const handleZoom = (e) => {
    console.log('handleZoom', e);
  };

  return (
    <div>
      <MySelected selected={selected.current} total={mlContext.total} />
      <Map center={center} zoom={5}  
        onShapeClick={handleShapeClick} 
        onMarkerClick={handleMarkerClick} 
        onShapeCreated={onShapeCreated}
        onPanEnd={handlePan}
        onZoomEnd={handleZoom}
        zoomable={false} // TODO disable zoom until we can manage on redraw
        style={{position: "relative", height: "100vh"}}
        navigator={false}
      >
        <MapLayers>
          <MapTileLayer
            urlTemplate={tileUrl}
            subdomains={tileSubdomains}
            attribution={attribution}
          />
          <MapShapeLayer
            data={shapes}
            style={shapeStyle}
          />
          <MapMarkerLayer
            data={mlContext.locations}
            locationField="latlng"
            titleField="name"
          >
            {/* <MapMarkerLayerTooltip render={(props) => (
              <span>{props.dataItem.name}<br/>({props.location.toString()})</span>
            )} /> */}
          </MapMarkerLayer>
        </MapLayers>
      </Map>
      { visible && <MyWindow person={person} toggleDialog={toggleDialog} /> }
    </div>
  );
}

export default MyMap;
