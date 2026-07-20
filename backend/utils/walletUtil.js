const path = require('path');
const { Wallets } = require('fabric-network');

exports.getWallet = async () => {
    const walletPath = path.join(__dirname, '../wallet');
    return await Wallets.newFileSystemWallet(walletPath);
};
