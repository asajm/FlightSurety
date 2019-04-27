var HDWalletProvider = require('truffle-hdwallet-provider');
// var mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
// var fs = require('fs');
// var mnemonic = fs.readFileSync(".secret").toString().trim();
var mnemonic = 'liquid exhibit enhance account secret window slow song wool stock write dirt'

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, 'http://127.0.0.1:8545/', 0, 20);
      },
      network_id: '*',
      gas: 999999999999
    }
  },
  compilers: {
    solc: {
      version: '^0.4.24'
    }
  }
};