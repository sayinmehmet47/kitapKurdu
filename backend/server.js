const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const books = require('./routes/api/books');
const user = require('./routes/api/user');
const messages = require('./routes/api/messages');

app.use(express.json());

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(console.log('connected'));
const corsOptions = {
  origin: '*',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use('/books', books);
app.use('/user', user);
app.use('/messages', messages);

if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
