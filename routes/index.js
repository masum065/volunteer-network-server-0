const express = require('express');
const router = express.Router();
const multer = require('multer');
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs');
const {
  promisify
} = require('util');
const pipeline = promisify(require('stream').pipeline);

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express',
  });
});

const upload = multer();
const MongoClient = require('mongodb').MongoClient;
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.fwfle.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const eventCollections = client.db(`${process.env.DB_NAME}`).collection('eventsCollection');
  const eventRegisteredCollections = client
    .db(`${process.env.DB_NAME}`)
    .collection('registers');

  // get and post data from user
  router.post('/upload', upload.single('file'), async function (
    req,
    res,
    next
  ) {
    const url = req.protocol + 's://' + req.get('host');
    const {
      file,
      body: {
        title,
        date,
        description
      },
    } = req;
    const fileName = Date.now() * 110000 + file.detectedFileExtension;
    await pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/images/${fileName}`)
    );
    res.send(req.file);

    const eventData = {
      imageBanner: url + '/images/' + fileName,
      title,
      description,
      date,
    };

    eventCollections.insertOne(eventData).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // show/ Update Operation
  router.get('/events', (req, res) => {
    eventCollections.find({}).toArray((errr, docs) => {
      res.send(docs);
    });
  });

  // get events by dynamic id
  router.get('/event/:key', (req, res) => {
    eventCollections
      .find({
        _id: ObjectId(req.params.key),
      })
      .toArray((err, docs) => {
        res.send(docs[0]);
      });
  });

  router.post('/eventregister', (req, res) => {
    const data = req.body;
    eventRegisteredCollections.insertOne(data).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // show/ Update Operation
  router.get('/registers', (req, res) => {
    eventRegisteredCollections.find({}).toArray((errr, docs) => {
      res.send(docs);
    });
  });

  router.get('/tasks', (req, res) => {
    eventRegisteredCollections
      .find({
        email: req.query.email
      })
      .toArray((errr, docs) => {
        res.send(docs);
      });
  });
  // Delete Operation Mongo
  router.delete('/registers/delete/:id', (req, res) => {
    eventRegisteredCollections
      .deleteOne({
        _id: ObjectId(req.params.id),
      })
      .then((result) => {
        res.send(result.deletedCount > 0);
      });
  });
});

router.get('/images', (req, res) => {
  res.send(`${__dirname}/../public/images`);
});

module.exports = router;