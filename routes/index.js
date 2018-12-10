var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var BlockModel = require('../lib/models/block');
var config = require('config');

//setup database
//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/blockdb';
mongoose.connect(mongoDB, { useNewUrlParser: true });
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'VALE Mining Estimator' });
});

/* GET home page. */
router.get('/estimate', function(req, res, next) {
  var address = req.query.address;

  if (!address) {
    res.render('index', { title: 'No Address Provided' });
    return
  }

  BlockModel.find({address: address}).countDocuments().exec(function(err, numBlocks) {
    if (err) return handleError(err);
    if (numBlocks == 0) {
      res.render('index', {
        title: 'No Blocks or Invalid Address'
      });
      return;
    }
    BlockModel.find().limit(1).sort({$natural:-1}).exec(function(err, latest) {
      if (err) return handleError(err);

      var totalBlocks = latest[0].blockIndex - config.blockStart;

      var estimate = config.VALE / totalBlocks * numBlocks;

      var formatted = new Intl.NumberFormat('en-NZ', { style: "decimal" }).format(estimate);

      res.render('estimate', {
        title: 'Your VALE Mining Estimate',
        address: address,
        blockStart: config.blockStart,
        numBlocks: numBlocks,
        latestBlock: latest[0].blockIndex,
        estimate: formatted,
      });
      return;
    })
  });
});

module.exports = router;
