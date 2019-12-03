"use strict";

/* Apple Game Center Auth
https://developer.apple.com/documentation/gamekit/gklocalplayer/1515407-generateidentityverificationsign#discussion

const authData = {
  publicKeyUrl: 'https://valid.apple.com/public/timeout.cer',
  timestamp: 1460981421303,
  signature: 'PoDwf39DCN464B49jJCU0d9Y0J',
  salt: 'saltST==',
  bundleId: 'com.valid.app'
  id: 'playerId',
};
*/
const {
  Parse
} = require('parse/node');

const crypto = require('crypto');

const https = require('https');

const url = require('url');

const cache = {}; // (publicKey -> cert) cache

function verifyPublicKeyUrl(publicKeyUrl) {
  const parsedUrl = url.parse(publicKeyUrl);

  if (parsedUrl.protocol !== 'https:') {
    return false;
  }

  const hostnameParts = parsedUrl.hostname.split('.');
  const length = hostnameParts.length;
  const domainParts = hostnameParts.slice(length - 2, length);
  const domain = domainParts.join('.');
  return domain === 'apple.com';
}

function convertX509CertToPEM(X509Cert) {
  const pemPreFix = '-----BEGIN CERTIFICATE-----\n';
  const pemPostFix = '-----END CERTIFICATE-----';
  const base64 = X509Cert;
  const certBody = base64.match(new RegExp('.{0,64}', 'g')).join('\n');
  return pemPreFix + certBody + pemPostFix;
}

function getAppleCertificate(publicKeyUrl) {
  if (!verifyPublicKeyUrl(publicKeyUrl)) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, `Apple Game Center - invalid publicKeyUrl: ${publicKeyUrl}`);
  }

  if (cache[publicKeyUrl]) {
    return cache[publicKeyUrl];
  }

  return new Promise((resolve, reject) => {
    https.get(publicKeyUrl, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk.toString('base64');
      });
      res.on('end', () => {
        const cert = convertX509CertToPEM(data);

        if (res.headers['cache-control']) {
          var expire = res.headers['cache-control'].match(/max-age=([0-9]+)/);

          if (expire) {
            cache[publicKeyUrl] = cert; // we'll expire the cache entry later, as per max-age

            setTimeout(() => {
              delete cache[publicKeyUrl];
            }, parseInt(expire[1], 10) * 1000);
          }
        }

        resolve(cert);
      });
    }).on('error', reject);
  });
}

function convertTimestampToBigEndian(timestamp) {
  const buffer = new Buffer(8);
  buffer.fill(0);
  const high = ~~(timestamp / 0xffffffff);
  const low = timestamp % (0xffffffff + 0x1);
  buffer.writeUInt32BE(parseInt(high, 10), 0);
  buffer.writeUInt32BE(parseInt(low, 10), 4);
  return buffer;
}

function verifySignature(publicKey, authData) {
  const verifier = crypto.createVerify('sha256');
  verifier.update(authData.playerId, 'utf8');
  verifier.update(authData.bundleId, 'utf8');
  verifier.update(convertTimestampToBigEndian(authData.timestamp));
  verifier.update(authData.salt, 'base64');

  if (!verifier.verify(publicKey, authData.signature, 'base64')) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Apple Game Center - invalid signature');
  }
} // Returns a promise that fulfills if this user id is valid.


async function validateAuthData(authData) {
  if (!authData.id) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Apple Game Center - authData id missing');
  }

  authData.playerId = authData.id;
  const publicKey = await getAppleCertificate(authData.publicKeyUrl);
  return verifySignature(publicKey, authData);
} // Returns a promise that fulfills if this app id is valid.


function validateAppId() {
  return Promise.resolve();
}

module.exports = {
  validateAppId,
  validateAuthData
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BZGFwdGVycy9BdXRoL2djZW50ZXIuanMiXSwibmFtZXMiOlsiUGFyc2UiLCJyZXF1aXJlIiwiY3J5cHRvIiwiaHR0cHMiLCJ1cmwiLCJjYWNoZSIsInZlcmlmeVB1YmxpY0tleVVybCIsInB1YmxpY0tleVVybCIsInBhcnNlZFVybCIsInBhcnNlIiwicHJvdG9jb2wiLCJob3N0bmFtZVBhcnRzIiwiaG9zdG5hbWUiLCJzcGxpdCIsImxlbmd0aCIsImRvbWFpblBhcnRzIiwic2xpY2UiLCJkb21haW4iLCJqb2luIiwiY29udmVydFg1MDlDZXJ0VG9QRU0iLCJYNTA5Q2VydCIsInBlbVByZUZpeCIsInBlbVBvc3RGaXgiLCJiYXNlNjQiLCJjZXJ0Qm9keSIsIm1hdGNoIiwiUmVnRXhwIiwiZ2V0QXBwbGVDZXJ0aWZpY2F0ZSIsIkVycm9yIiwiT0JKRUNUX05PVF9GT1VORCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiZ2V0IiwicmVzIiwiZGF0YSIsIm9uIiwiY2h1bmsiLCJ0b1N0cmluZyIsImNlcnQiLCJoZWFkZXJzIiwiZXhwaXJlIiwic2V0VGltZW91dCIsInBhcnNlSW50IiwiY29udmVydFRpbWVzdGFtcFRvQmlnRW5kaWFuIiwidGltZXN0YW1wIiwiYnVmZmVyIiwiQnVmZmVyIiwiZmlsbCIsImhpZ2giLCJsb3ciLCJ3cml0ZVVJbnQzMkJFIiwidmVyaWZ5U2lnbmF0dXJlIiwicHVibGljS2V5IiwiYXV0aERhdGEiLCJ2ZXJpZmllciIsImNyZWF0ZVZlcmlmeSIsInVwZGF0ZSIsInBsYXllcklkIiwiYnVuZGxlSWQiLCJzYWx0IiwidmVyaWZ5Iiwic2lnbmF0dXJlIiwidmFsaWRhdGVBdXRoRGF0YSIsImlkIiwidmFsaWRhdGVBcHBJZCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7OztBQWFBLE1BQU07QUFBRUEsRUFBQUE7QUFBRixJQUFZQyxPQUFPLENBQUMsWUFBRCxD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O0FBQ0FVLEVBQUFBLFFBQVEsQ0FBQ0UsTUFBVCxDQUFnQkgsUUFBUSxDQUFDTSxJQUF6QixFQUErQixRQUEvQjs7QUFFQSxNQUFJLENBQUNMLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQlIsU0FBaEIsRUFBMkJDLFFBQVEsQ0FBQ1EsU0FBcEMsRUFBK0MsUUFBL0MsQ0FBTCxFQUErRDtBQUM3RCxVQUFNLElBQUk5RCxLQUFLLENBQUM0QixLQUFWLENBQ0o1QixLQUFLLENBQUM0QixLQUFOLENBQVlDLGdCQURSLEVBRUosdUNBRkksQ0FBTjtBQUlEO0FBQ0YsQyxDQUVEOzs7QUFDQSxlQUFla0MsZ0JBQWYsQ0FBZ0NULFFBQWhDLEVBQTBDO0FBQ3hDLE1BQUksQ0FBQ0EsUUFBUSxDQUFDVSxFQUFkLEVBQWtCO0FBQ2hCLFVBQU0sSUFBSWhFLEtBQUssQ0FBQzRCLEtBQVYsQ0FDSjVCLEtBQUssQ0FBQzRCLEtBQU4sQ0FBWUMsZ0JBRFIsRUFFSix5Q0FGSSxDQUFOO0FBSUQ7O0FBQ0R5QixFQUFBQSxRQUFRLENBQUNJLFFBQVQsR0FBb0JKLFFBQVEsQ0FBQ1UsRUFBN0I7QUFDQSxRQUFNWCxTQUFTLEdBQUcsTUFBTTFCLG1CQUFtQixDQUFDMkIsUUFBUSxDQUFDL0MsWUFBVixDQUEzQztBQUNBLFNBQU82QyxlQUFlLENBQUNDLFNBQUQsRUFBWUMsUUFBWixDQUF0QjtBQUNELEMsQ0FFRDs7O0FBQ0EsU0FBU1csYUFBVCxHQUF5QjtBQUN2QixTQUFPbkMsT0FBTyxDQUFDQyxPQUFSLEVBQVA7QUFDRDs7QUFFRG1DLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmRixFQUFBQSxhQURlO0FBRWZGLEVBQUFBO0FBRmUsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBBcHBsZSBHYW1lIENlbnRlciBBdXRoXG5odHRwczovL2RldmVsb3Blci5hcHBsZS5jb20vZG9jdW1lbnRhdGlvbi9nYW1la2l0L2drbG9jYWxwbGF5ZXIvMTUxNTQwNy1nZW5lcmF0ZWlkZW50aXR5dmVyaWZpY2F0aW9uc2lnbiNkaXNjdXNzaW9uXG5cbmNvbnN0IGF1dGhEYXRhID0ge1xuICBwdWJsaWNLZXlVcmw6ICdodHRwczovL3ZhbGlkLmFwcGxlLmNvbS9wdWJsaWMvdGltZW91dC5jZXInLFxuICB0aW1lc3RhbXA6IDE0NjA5ODE0MjEzMDMsXG4gIHNpZ25hdHVyZTogJ1BvRHdmMzlEQ040NjRCNDlqSkNVMGQ5WTBKJyxcbiAgc2FsdDogJ3NhbHRTVD09JyxcbiAgYnVuZGxlSWQ6ICdjb20udmFsaWQuYXBwJ1xuICBpZDogJ3BsYXllcklkJyxcbn07XG4qL1xuXG5jb25zdCB7IFBhcnNlIH0gPSByZXF1aXJlKCdwYXJzZS9ub2RlJyk7XG5jb25zdCBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTtcbmNvbnN0IGh0dHBzID0gcmVxdWlyZSgnaHR0cHMnKTtcbmNvbnN0IHVybCA9IHJlcXVpcmUoJ3VybCcpO1xuXG5jb25zdCBjYWNoZSA9IHt9OyAvLyAocHVibGljS2V5IC0+IGNlcnQpIGNhY2hlXG5cbmZ1bmN0aW9uIHZlcmlmeVB1YmxpY0tleVVybChwdWJsaWNLZXlVcmwpIHtcbiAgY29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHB1YmxpY0tleVVybCk7XG4gIGlmIChwYXJzZWRVcmwucHJvdG9jb2wgIT09ICdodHRwczonKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGhvc3RuYW1lUGFydHMgPSBwYXJzZWRVcmwuaG9zdG5hbWUuc3BsaXQoJy4nKTtcbiAgY29uc3QgbGVuZ3RoID0gaG9zdG5hbWVQYXJ0cy5sZW5ndGg7XG4gIGNvbnN0IGRvbWFpblBhcnRzID0gaG9zdG5hbWVQYXJ0cy5zbGljZShsZW5ndGggLSAyLCBsZW5ndGgpO1xuICBjb25zdCBkb21haW4gPSBkb21haW5QYXJ0cy5qb2luKCcuJyk7XG4gIHJldHVybiBkb21haW4gPT09ICdhcHBsZS5jb20nO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0WDUwOUNlcnRUb1BFTShYNTA5Q2VydCkge1xuICBjb25zdCBwZW1QcmVGaXggPSAnLS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tXFxuJztcbiAgY29uc3QgcGVtUG9zdEZpeCA9ICctLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tJztcblxuICBjb25zdCBiYXNlNjQgPSBYNTA5Q2VydDtcbiAgY29uc3QgY2VydEJvZHkgPSBiYXNlNjQubWF0Y2gobmV3IFJlZ0V4cCgnLnswLDY0fScsICdnJykpLmpvaW4oJ1xcbicpO1xuXG4gIHJldHVybiBwZW1QcmVGaXggKyBjZXJ0Qm9keSArIHBlbVBvc3RGaXg7XG59XG5cbmZ1bmN0aW9uIGdldEFwcGxlQ2VydGlmaWNhdGUocHVibGljS2V5VXJsKSB7XG4gIGlmICghdmVyaWZ5UHVibGljS2V5VXJsKHB1YmxpY0tleVVybCkpIHtcbiAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICBQYXJzZS5FcnJvci5PQkpFQ1RfTk9UX0ZPVU5ELFxuICAgICAgYEFwcGxlIEdhbWUgQ2VudGVyIC0gaW52YWxpZCBwdWJsaWNLZXlVcmw6ICR7cHVibGljS2V5VXJsfWBcbiAgICApO1xuICB9XG4gIGlmIChjYWNoZVtwdWJsaWNLZXlVcmxdKSB7XG4gICAgcmV0dXJuIGNhY2hlW3B1YmxpY0tleVVybF07XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBodHRwc1xuICAgICAgLmdldChwdWJsaWNLZXlVcmwsIHJlcyA9PiB7XG4gICAgICAgIGxldCBkYXRhID0gJyc7XG4gICAgICAgIHJlcy5vbignZGF0YScsIGNodW5rID0+IHtcbiAgICAgICAgICBkYXRhICs9IGNodW5rLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcy5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNlcnQgPSBjb252ZXJ0WDUwOUNlcnRUb1BFTShkYXRhKTtcbiAgICAgICAgICBpZiAocmVzLmhlYWRlcnNbJ2NhY2hlLWNvbnRyb2wnXSkge1xuICAgICAgICAgICAgdmFyIGV4cGlyZSA9IHJlcy5oZWFkZXJzWydjYWNoZS1jb250cm9sJ10ubWF0Y2goL21heC1hZ2U9KFswLTldKykvKTtcbiAgICAgICAgICAgIGlmIChleHBpcmUpIHtcbiAgICAgICAgICAgICAgY2FjaGVbcHVibGljS2V5VXJsXSA9IGNlcnQ7XG4gICAgICAgICAgICAgIC8vIHdlJ2xsIGV4cGlyZSB0aGUgY2FjaGUgZW50cnkgbGF0ZXIsIGFzIHBlciBtYXgtYWdlXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVtwdWJsaWNLZXlVcmxdO1xuICAgICAgICAgICAgICB9LCBwYXJzZUludChleHBpcmVbMV0sIDEwKSAqIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGNlcnQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUaW1lc3RhbXBUb0JpZ0VuZGlhbih0aW1lc3RhbXApIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEJ1ZmZlcig4KTtcbiAgYnVmZmVyLmZpbGwoMCk7XG5cbiAgY29uc3QgaGlnaCA9IH5+KHRpbWVzdGFtcCAvIDB4ZmZmZmZmZmYpO1xuICBjb25zdCBsb3cgPSB0aW1lc3RhbXAgJSAoMHhmZmZmZmZmZiArIDB4MSk7XG5cbiAgYnVmZmVyLndyaXRlVUludDMyQkUocGFyc2VJbnQoaGlnaCwgMTApLCAwKTtcbiAgYnVmZmVyLndyaXRlVUludDMyQkUocGFyc2VJbnQobG93LCAxMCksIDQpO1xuXG4gIHJldHVybiBidWZmZXI7XG59XG5cbmZ1bmN0aW9uIHZlcmlmeVNpZ25hdHVyZShwdWJsaWNLZXksIGF1dGhEYXRhKSB7XG4gIGNvbnN0IHZlcmlmaWVyID0gY3J5cHRvLmNyZWF0ZVZlcmlmeSgnc2hhMjU2Jyk7XG4gIHZlcmlmaWVyLnVwZGF0ZShhdXRoRGF0YS5wbGF5ZXJJZCwgJ3V0ZjgnKTtcbiAgdmVyaWZpZXIudXBkYXRlKGF1dGhEYXRhLmJ1bmRsZUlkLCAndXRmOCcpO1xuICB2ZXJpZmllci51cGRhdGUoY29udmVydFRpbWVzdGFtcFRvQmlnRW5kaWFuKGF1dGhEYXRhLnRpbWVzdGFtcCkpO1xuICB2ZXJpZmllci51cGRhdGUoYXV0aERhdGEuc2FsdCwgJ2Jhc2U2NCcpO1xuXG4gIGlmICghdmVyaWZpZXIudmVyaWZ5KHB1YmxpY0tleSwgYXV0aERhdGEuc2lnbmF0dXJlLCAnYmFzZTY0JykpIHtcbiAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoXG4gICAgICBQYXJzZS5FcnJvci5PQkpFQ1RfTk9UX0ZPVU5ELFxuICAgICAgJ0FwcGxlIEdhbWUgQ2VudGVyIC0gaW52YWxpZCBzaWduYXR1cmUnXG4gICAgKTtcbiAgfVxufVxuXG4vLyBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIGlmIHRoaXMgdXNlciBpZCBpcyB2YWxpZC5cbmFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlQXV0aERhdGEoYXV0aERhdGEpIHtcbiAgaWYgKCFhdXRoRGF0YS5pZCkge1xuICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihcbiAgICAgIFBhcnNlLkVycm9yLk9CSkVDVF9OT1RfRk9VTkQsXG4gICAgICAnQXBwbGUgR2FtZSBDZW50ZXIgLSBhdXRoRGF0YSBpZCBtaXNzaW5nJ1xuICAgICk7XG4gIH1cbiAgYXV0aERhdGEucGxheWVySWQgPSBhdXRoRGF0YS5pZDtcbiAgY29uc3QgcHVibGljS2V5ID0gYXdhaXQgZ2V0QXBwbGVDZXJ0aWZpY2F0ZShhdXRoRGF0YS5wdWJsaWNLZXlVcmwpO1xuICByZXR1cm4gdmVyaWZ5U2lnbmF0dXJlKHB1YmxpY0tleSwgYXV0aERhdGEpO1xufVxuXG4vLyBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIGlmIHRoaXMgYXBwIGlkIGlzIHZhbGlkLlxuZnVuY3Rpb24gdmFsaWRhdGVBcHBJZCgpIHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdmFsaWRhdGVBcHBJZCxcbiAgdmFsaWRhdGVBdXRoRGF0YSxcbn07XG4iXX0=