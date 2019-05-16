const os = require('os');


export default (isArray = false) => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  Object.getOwnPropertyNames(interfaces).forEach(name => {
    interfaces[name].forEach(address => {
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    });
  });
  return isArray ? addresses : addresses[0];
};
