var HDWalletProvider = require('truffle-hdwallet-provider');
// var mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
// var fs = require('fs');
// var mnemonic = fs.readFileSync(".secret").toString().trim();
var mnemonic = 'panda album control traffic possible color cigar soap usual spy trust cart'

module.exports = {
  networks: {
    // development: {
    //   provider: function() {
    //     return new HDWalletProvider(mnemonic, 'http://127.0.0.1:8545/', 0, 20);
    //   },
    //   network_id: '*',
    //   gas: 6721975
    // }
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      accounts: 20,
      gas_limit: 999999999999
    }
  },
  compilers: {
    solc: {
      version: '^0.4.24'
    }
  }
};