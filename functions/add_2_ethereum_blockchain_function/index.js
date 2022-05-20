

const axios = require('axios');
const catalyst = require('zcatalyst-sdk-node');
var web3 = require('web3');


const CREDENTIALS = {
    CRMConnector_Blockchain: {
        client_id: '1000.ZOMX59C6028DQ4AEE19JN',
        client_secret: 'fda9e56db3sssssf70a563e11ab69',
        auth_url: 'https://accounts.zoho.com/oauth/v2/auth',
        refresh_url: 'https://ccounts.zoho.com/oauth/v2/token',
        refresh_token: '1000.8xxxfeda7429c8b312.4648b79695e1db66a06b1afd3cde2c7e'
    }
};


module.exports = async(context, basicIO) => {


    console.log('receiving incoming ..... ++ ---------  ');
   
    let dealid = basicIO.getArgument('dealid');
    let dealname = basicIO.getArgument('dealname');
    const catalystApp = catalyst.initialize(context);

    const accessToken = await catalystApp.connection(CREDENTIALS).getConnector('CRMConnector_Blockchain').getAccessToken();

    let incomingDealName = dealname;
    let hashed_data = await makeHashOfData(incomingDealName);
    console.log('hashed deal name is  ' + hashed_data);


    let address = await addRecords2Blockchain(hashed_data);

//The name of the CRM field where the blockchain address has to be stored
    let dataToSend = {
        "blockchainAddress": address,
        "id": dealid
    };

    let pushArray = [dataToSend];
    let reqData = { "data": pushArray };
    //   console.log(dataToSend);
    let result = await updateData2CRM(accessToken, reqData);
    console.log(result);

    basicIO.write('record updated in CRM');
    context.close();
};

function makeHashOfData(data) {
    let hash = web3.utils.asciiToHex(data); 
    // const CryptoJS = require('crypto-js');
    // let hash2 = CryptoJS.SHA256(data);
    // let buffer = Buffer.from(hash2.toString(CryptoJS.enc.Hex), 'hex');
    // let hash = new Uint8Array(buffer);
    return hash;

}


async function updateData2CRM(accessToken, data) {
    console.log('updateData2CRM invoked ');

    let config = {
        method: 'put',
        url: 'https://www.zohoapis.com/crm/v2/Deals',
        headers: {
            'Authorization': 'Zoho-oauthtoken ' + accessToken,
            'Content-Type': 'application/json'
        },
        data: data
    };
    console.log(JSON.stringify(config));

    const response = await axios(config);
    console.log(response);
    if (response.status == 200) {
        console.log(" record updated in CRM Deals record ");
        return 'success';
    } else {
        return 'failure';
    }

}
/**
 * 
 *  
 * @param {* hash data to be stored in the blockchain } hashedData 
 * @returns {* the address where the data is stored in the blockchain}
 */

const addRecords2Blockchain = async(hashedData) => {
    console.log('in addRecords2Blockchain ' + hashedData);
    try {
        // Connect to the Blockchain and unlock the wallet to send transaction
        const HDWalletProvider = require("truffle-hdwallet-provider");
        var mnemonic = "charge sweet knee juice camera smoke arrive accuse minimum juice artist exclude";
        //set up your account in infura.io and select the ropsten network. Copy the end-point generated.
        const provider = new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/eaa8e83aef6b4e4d978ce215418d04d4");

        // Load the Truffle artefact
        const truffleContract = require("truffle-contract");
        const DocRegistryJSON = require('./build/contracts/DocRegistry.json');


        const DocRegistry = truffleContract(DocRegistryJSON);
        DocRegistry.setProvider(provider);

        const docRegistryInstance = await DocRegistry.deployed();

        console.log('about to storeHash  ');


  //The from is the Metamask Wallet address 
        var result = await docRegistryInstance.storeHash(hashedData, { from: "0x52e3f64cEFa31d7363b7d51AC42" });

        console.log(result);
        console.log('Can be verified at address  ' + result.logs[0].address + ' from https://ropsten.etherscan.io/address/' + result.logs[0].address);

        let bc_Address = result.logs[0].address;
        console.log(bc_Address);
        return bc_Address;

    } catch (e) {
        console.log("Failure " + e);
        return 'unable to add';
    }
}
