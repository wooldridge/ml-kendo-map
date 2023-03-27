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

  const [selected, setSelected] = useState(null);
  const [center, setCenter] = useState(centerInit);
  const [visible, setVisible] = useState(false);
  const [person, setPerson] = useState(null);

  const shapeStyle = {
    stroke: {
      color: "blue",
      width: 2,
      opacity: 0.2
    },
    fill: {
      color: "blue",
      opacity: 0
    }
  };

  // Load facets on init for heat map
  useEffect(() => {
    mlContext.handleFacets();
  }, []);

  // Color state based on facet count
  const onShapeCreated = (e) => {
    const shape = e.shape;
    const abbrev = e.dataItem.id;
    if (mlContext.facets && abbrev) {
      let val = mlContext.facets.state.facetValues.find(fv => {
        return abbrev === fv.name;
      })
      if (val && val.count) {
        const opacity = (val.count / 40) + 0.05;
        shape.options.set("fill.opacity", opacity);
      }
    }
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
    console.log('handleShapeClick', event);
    setSelected(event.shape.dataItem.properties.name);
    mlContext.handleGeo(event.shape.dataItem.geometry.coordinates);
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
      <MySelected selected={selected} total={mlContext.total} />
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
