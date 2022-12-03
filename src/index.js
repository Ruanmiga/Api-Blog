const express = require('express');
const morgan = require('morgan');


const app = express();
const PORT = process.env.PORT || 3000;

app.set("json spaces", 2);
app.use(morgan('dev'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Routes
app.use('/api', require('./api/api'));

app.listen(PORT, () => console.log('Listen port: ' + PORT));
