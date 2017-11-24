const {JSDOM} = require('jsdom');
const jsdom = new JSDOM(`
<body>
  <div id="container">
    <canvas id="screen" width$="[[width]]" height$="[[height]]"></canvas>
    <canvas id="cursor"></canvas>
    <input id="input" autocomplete="off" autofocus />
    <span id="preedit"></span>
  </div>
</body>
`);
const document = jsdom.window.document;

const dom = {
    cursor: document.getElementById('cursor'),
    container: document.getElementById('container'),
    input: document.getElementById('input'),
    preedit: document.getElementById('preedit'),
    screen: document.getElementById('screen'),
};

module.exports = {document, dom};
