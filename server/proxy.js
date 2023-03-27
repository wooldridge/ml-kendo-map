const config = require('../config');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const { XMLParser } = require('fast-xml-parser');
const { handleDocumentsRes, handleSearchRes} = require('./handlers');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

const PORT = config.server.port;
const HOST = config.host;
const API_URL = "http://" + config.host + ":" + config.rest["rest-api"].port;

// fast-xml-parser: https://github.com/NaturalIntelligence/fast-xml-parser
const options = {
  ignoreAttributes: false,
  ignoreDeclaration: true,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
  // isArray: (name, jpath, isLeafNode, isAttribute) => { 
  //     if (alwaysArray.indexOf(jpath) !== -1) return true;
  // }
};
const parser = new XMLParser(options);

const xmlToJson = xml => {
  const json = parser.parse(xml);
  return json;
};

app.all('/v1/*', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    auth: config.user["user-name"] + ":" + config.user.password,
    selfHandleResponse: true, // Required since tranforming response
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      let result = responseBuffer;
      switch (req.path) {
        case '/v1/search':
          result = handleSearchRes(responseBuffer, proxyRes, req, res);
          break;
        case '/v1/documents':
          result = handleDocumentsRes(responseBuffer, proxyRes, req, res);
          break;
      }
      // console.log(result);
      return result;
    })
}));

app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
});