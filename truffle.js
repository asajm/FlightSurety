var HDWalletProvider = require('truffle-hdwallet-provider');
// var mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
// var fs = require('fs');
// var mnemonic = fs.readFileSync(".secret").toString().trim();
var mnemonic = 'spawn sign pig sauce glance excess odor spoon riot because harsh submit'

module.exports = {
  networks: {
    development: {
      provider: function () {
        return new HDWalletProvider(mnemonic, 'http://127.0.0.1:7545/', 0, 20);
      },
      network_id: '*',
      gas: 6721975
    }
  },
  compilers: {
    solc: {
      version: '^0.4.24'
    }
  }
};