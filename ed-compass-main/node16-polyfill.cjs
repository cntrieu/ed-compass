const crypto = require('node:crypto');
if (crypto.webcrypto && !crypto.getRandomValues) {
  crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
}
if (crypto.webcrypto && (!globalThis.crypto || !globalThis.crypto.getRandomValues)) {
  globalThis.crypto = crypto.webcrypto;
}
