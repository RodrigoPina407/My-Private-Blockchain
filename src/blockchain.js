/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({owner: null, star:"Genesis Block"});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to
     * create the `block hash` and push the block into the chain array. Don't for get
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention
     * that this method is a private method.
     */
    _addBlock(block) {
        let self = this;

        return new Promise(async (resolve, reject) => {
          try{
           let chainHeight = await self.getChainHeight();
           let newHeight = chainHeight + 1;

          /* force an invalid block to test validateChain()
           if(newHeight === 2){
             
            let previousBlock =await self.getBlockByHeight(chainHeight);
            block.previousBlockHash = await SHA256(JSON.stringify(block)).toString();
            block.height = newHeight;
            block.hash = await SHA256(JSON.stringify(block)).toString();
            block.time = new Date().getTime().toString().slice(0,-3);
            self.height = newHeight;
           }*/

           if(newHeight > 0){
             let previousBlock =await self.getBlockByHeight(chainHeight);
             block.previousBlockHash = previousBlock.hash;
             block.height = newHeight;
             block.hash = await SHA256(JSON.stringify(block)).toString();
             block.time = new Date().getTime().toString().slice(0,-3);
             self.height = newHeight;
          }
          else{
             block.previousBlockHash = null;
             block.height = newHeight;
             block.hash = await SHA256(JSON.stringify(block)).toString();
             block.time = new Date().getTime().toString().slice(0,-3);
             self.height = newHeight;
          }
           
            self.chain.push(block);                     // push a block into the chain and validate
            let errorLog = await self.validateChain();
           
            if(errorLog[0]){
              console.log(errorLog[0]);
              self.chain.pop(); // if there is an error pop the block from the chain
              console.log(self.chain);
            }
            resolve(block);
           
           
          }
          catch{
             reject(Error("Invalid block created"));
           }

        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address
     */
    requestMessageOwnershipVerification(address) {

        let timestamp = new Date().getTime().toString().slice(0,-3);

        return new Promise((resolve) => {
          let message = `${address}:${timestamp}:starRegistry`;
          resolve(message);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address
     * @param {*} message
     * @param {*} signature
     * @param {*} star
     */
    async submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let initialTime = parseInt(message.split(':')[1]);
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            let deltaTime = (currentTime - initialTime)/(1000*60);

            let isVerified;
            try{
                 isVerified = await bitcoinMessage.verify(message, address, signature);
                }
                catch{
                    reject(Error("Verification failed"));
                }

            if(deltaTime < 5 ){
              if(isVerified){
                resolve(self._addBlock(await new BlockClass.Block({owner: address, signature:signature, message:message, star:star})));
              }
              else{
                reject(Error("Message verification failed!"));
                }
            }
            else{
              reject(Error("More than 5 minutes elapsed!"));
            }


        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
          let block = self.chain.filter(p => p.hash === hash)[0];
          if(block){
              resolve(block);
          } else {
              resolve(null);
          }

        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object
     * with the height equal to the parameter `height`
     * @param {*} height
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address
     */
   getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise(async (resolve, reject) => {
          self.chain.forEach(async block => {
            let decodedBody = await block.getBData();

            if(decodedBody.owner === address){
              stars.push(decodedBody);
            }

          });

          if(stars){
            resolve(stars);
          }
          else{
            resolve(null);
          }

        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            self.chain.forEach((block,i) => {

              if( block.validate() === false){
                errorLog.push({error: `Invalid Block: ${block.height}`});
              }
              if( (block.height > 0) && (block.previousBlockHash != self.chain[block.height - 1].hash)){
                errorLog.push({error: `Previous Block Hash does not match for Block: ${block.height}`});
              }

            });
            resolve(errorLog);

        });
    }

}

module.exports.Blockchain = Blockchain;
