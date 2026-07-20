const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// Load the connection profile
const ccpPath = path.resolve(__dirname, '../config/connection-profile.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// Cache of connected gateways/contracts, keyed by username.
// Avoids the cost of re-running peer discovery on every single request.
const contractCache = new Map();

async function getDrugContract(username) {
  if (!username) {
    throw new Error('Username required to get drug contract identity. Cannot proceed without authentication.');
  }

  // Reuse an existing connection for this user if we have one
  const cached = contractCache.get(username);
  if (cached) {
    return cached;
  }

  const walletPath = path.join(__dirname, '../wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identityExists = await wallet.get(username);
  if (!identityExists) {
    throw new Error(`Identity for user "${username}" does not exist in the wallet. Ensure user "${username}" is enrolled correctly.`);
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: username,
    discovery: { enabled: true, asLocalhost: true }
  });

  const network = await gateway.getNetwork('mychannel');
  const contract = network.getContract('drugcontract');

  const entry = { contract, gateway };
  contractCache.set(username, entry);

  return entry;
}

// Function to invoke a chaincode transaction
exports.invokeChaincode = async (fn, args, username) => {
  const { contract } = await getDrugContract(username);
  const result = await contract.submitTransaction(fn, ...args);
  return result.toString();
};

// Function to evaluate a query
exports.queryChaincode = async (fn, args, username) => {
  const { contract } = await getDrugContract(username);
  const result = await contract.evaluateTransaction(fn, ...args);
  return result.toString();
};

exports.getDrugContract = getDrugContract;