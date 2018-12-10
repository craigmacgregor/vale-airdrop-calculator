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
  res.render('index', { title: 'VALE Airdrop Estimator' });
});

/* GET home page. */
router.get('/estimate', function(req, res, next) {
  var address = req.query.address;

  if (!address) {
    res.render('notfound', { title: 'VALE Airdrop Estimator' });
    return
  }

  BlockModel.find({address: address}).countDocuments().exec(function(err, numBlocks) {
    if (err) return handleError(err);
    if (numBlocks == 0) {
      res.render('notfound', {
        title: 'VALE Airdrop Estimator'
      });
      return;
    }
    BlockModel.find().limit(1).sort({$natural:-1}).exec(function(err, latest) {
      if (err) return handleError(err);

      var totalBlocks = latest[0].blockIndex - config.blockStart;

      var estimate = config.VALE / totalBlocks * numBlocks;

      var fmtEstimate = new Intl.NumberFormat('en-NZ', { style: "decimal" }).format(estimate);
      var fmtBlockStart = new Intl.NumberFormat('en-NZ', { style: "decimal" }).format(config.blockStart);
      var fmtNumBlocks = new Intl.NumberFormat('en-NZ', { style: "decimal" }).format(numBlocks);

      res.render('estimate', {
        title: 'VALE Airdrop Estimator',
        address: address,
        blockStart: fmtBlockStart,
        numBlocks: fmtNumBlocks,
        latestBlock: latest[0].blockIndex,
        estimate: fmtEstimate,
      });
      return;
    })
  });
});

module.exports = router;
