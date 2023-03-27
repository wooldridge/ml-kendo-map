const { XMLParser } = require("fast-xml-parser");

// fast-xml-parser: https://github.com/NaturalIntelligence/fast-xml-parser
const options = {
  ignoreAttributes: false,
  ignoreDeclaration: true,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
  isArray: (name, jpath, isLeafNode, isAttribute) => { 
      if (alwaysArray.indexOf(jpath) !== -1) return true;
  }
};
const parser = new XMLParser(options);

// Optionally force paths to arrays
const alwaysArray = [
  //"person.contacts.contact"
];

const xmlToJson = xml => {
  const json = parser.parse(xml);
  return json;
};

const handleSearchRes = (responseBuffer, proxyRes, req, res) => {
  const response = responseBuffer.toString('utf8'); // Convert buffer to string
  const parsed = JSON.parse(response);
  if (parsed.results && parsed.results.length) {
    parsed.results.forEach((r, i) => {
      if (r.extracted && r.extracted.content) {
        if (typeof r.extracted.content[0] === 'string' && r.extracted.content[0].trim().charAt(0) === '<') {
          // Convert extracted XML to JSON and replace for each search result
          const json = xmlToJson(r.extracted.content[0]);
          parsed.results[i].extracted = json;
        } else {
          parsed.results[i].extracted = r.extracted.content[0];
        }
      }
    })
  }
  return JSON.stringify(parsed);
}

const handleDocumentsRes = (responseBuffer, proxyRes, req, res) => {
  let response = responseBuffer.toString('utf8'); // Convert buffer to string
  if (res.getHeader('content-type').startsWith('application/xml')) {
    const json = xmlToJson(response);
    res.setHeader('content-type', 'application/json'); // Response is now JSON
    return JSON.stringify(json);
  } else {
    return response;
  }
}

const handlers = {
  handleSearchRes: handleSearchRes,
  handleDocumentsRes: handleDocumentsRes,
};

module.exports = {handleDocumentsRes, handleSearchRes};