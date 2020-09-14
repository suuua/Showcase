const path = require('path');
// eslint-disable-next-line
const express = require('express');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'examples')));
app.use('/dist', express.static(path.join(__dirname, '..', 'dist')));

app.listen(3000);
