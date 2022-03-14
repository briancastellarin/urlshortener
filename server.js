require('dotenv').config();
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

//
// MongoDB and mongoose connect
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


//
const URLSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const URLS = mongoose.model('URLS', URLSchema);

//
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//

// POST URL 
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  var finded = false;

  // CHECK URL 
  var u = new URL(url);
  dns.lookup(u.hostname, (error, addr, family) => {
    //ERROR INVALID URL
    if (error) {
      res.json({ error: "invalid url" })
    } else {
      URLS.findOne({ original_url: url }).exec().then((data) => {
        res.json({ original_url: data.original_url, short_url: data.short_url });
        finded = true;
      })

      if (!finded) {
        let index = 1 + url.length + (Math.random() * 100);
        let newUrl = new URLS({ original_url: url, short_url: index.toString() });
        newUrl.save().then(() => {
          res.json({ original_url: url, short_url: index.toString() });
        });
      }
    }
  });

});


//  
app.get('/api/shorturl/:shorturl?', async function (req, res) {
  //
  const shurl = req.params.shorturl;

  //
  let find = URLS.findOne({ short_url: shurl });
  if (find) {
    return res.redirect(find.original_url);
  }
  return res.json({ error: 'invalid shorturl' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
