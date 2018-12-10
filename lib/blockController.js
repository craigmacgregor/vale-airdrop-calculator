var Client = require('bitcoin-core');
var config = require('config');
var mongoose = require('mongoose');

var BlockModel = require('./models/block');

var settings = config.get('client');

var debug = true;

var navClient = new Client({
  username: settings.navCoin.user,
  password: settings.navCoin.pass,
  port: settings.navCoin.port,
  host: settings.navCoin.host,
})

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

var blockController = {};

blockController.deleteEntries = () => {
  console.log('deleteEntries');
  BlockModel.deleteMany(function(err, result) {
    console.log('result', result);
    BlockModel.find(function (err, blockRows) {
      if (err) return handleError(err);
      console.log('blockRows', blockRows);
    });
  });
}

blockController.scanBlockchain = () => {
  if (debug) console.log('scanBlockchain');

  //get the latest blockheight
  navClient.command('getblockcount').then((data) => {
    if (debug) console.log('getblockcount', data);

    //check where we've already scanned upto in the database
      BlockModel.find().limit(1).sort({$natural:-1}).exec(function(err, latest) {
      if (err) return handleError(err);
      if (debug) console.log('BlockModel.find', latest);

      if (latest.length == 0) {
        blockController.getBlockHash(config.blockStart);
      } else {
        console.log('latest', latest);
        var nextHeight = latest[0].blockIndex + 1;
        blockController.getBlockHash(nextHeight);
      }
    });

  });

}

blockController.getBlockHash = (blockIndex) => {
  if (debug) console.log('getBlockHash', blockIndex);
  navClient.command('getblockhash', blockIndex).then((blockHash) => {
    //console.log('getblockhash', blockHash);
    blockController.getBlock(blockHash, blockIndex);
  });
}

blockController.getBlock = (blockHash, blockIndex) => {
  if (debug) console.log('getBlock', blockHash, blockIndex);
  navClient.command('getblock', blockHash).then((data) => {
    //console.log('block', data);
    blockController.getCoinBaseTx(data.tx[1], blockIndex, blockHash);
  });
}

blockController.getCoinBaseTx = (txid, blockIndex, blockHash) => {
  if (debug) console.log('getCoinBaseTx', txid, blockIndex, blockHash);
  navClient.command('getrawtransaction', txid).then((hex) => {
    //console.log('hex', hex);
    navClient.command('decoderawtransaction', hex).then((tx) => {
      //console.log('staker address', blockIndex, blockHash, tx.vout[1].scriptPubKey.addresses[0]);
      var blockData = {
        address: tx.vout[1].scriptPubKey.addresses[0],
        blockIndex: blockIndex,
        blockHash: blockHash,
      }
      console.log(blockData);
      BlockModel.create(blockData, function (err, newRecord) {
        if (err) return handleError(err);
        console.log('record saved', newRecord);
        var nextHeight = newRecord.blockIndex + 1;
        blockController.getBlockHash(nextHeight);
      });
    });
  });
}

module.exports = blockController;
