SystemJS.config({
  paths: {
    "github:": "lib/github/",
    "npm:": "lib/npm/"
  },
  browserConfig: {
    "paths": {
      "circular-shapes/": "/src/"
    }
  },
  nodeConfig: {
    "paths": {
      "circular-shapes/": "src/"
    }
  },
  devConfig: {
    "map": {
      "babel-runtime": "npm:babel-runtime@5.8.35",
      "core-js": "npm:core-js@1.2.6",
      "plugin-babel": "npm:systemjs-plugin-babel@0.0.21"
    },
    "packages": {
      "npm:babel-runtime@5.8.35": {
        "map": {}
      },
      "npm:core-js@1.2.6": {
        "map": {
          "systemjs-json": "github:systemjs/plugin-json@0.1.0"
        }
      }
    }
  },
  transpiler: "plugin-babel",
  babelOptions: {
    "optional": [
      "runtime"
    ]
  },
  map: {
    "babel": "npm:babel-core@5.8.35"
  },
  packages: {
    "circular-shapes": {
      "main": "circular-shapes.js"
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json",
    "github:*/*.json"
  ],
  map: {
    "assert": "npm:jspm-nodelibs-assert@0.2.1",
    "buffer": "npm:jspm-nodelibs-buffer@0.2.3",
    "child_process": "npm:jspm-nodelibs-child_process@0.2.1",
    "constants": "npm:jspm-nodelibs-constants@0.2.1",
    "crypto": "npm:jspm-nodelibs-crypto@0.2.1",
    "d3": "npm:d3@4.8.0",
    "events": "npm:jspm-nodelibs-events@0.2.2",
    "fs": "npm:jspm-nodelibs-fs@0.2.1",
    "gsap": "npm:gsap@1.18.0",
    "http": "npm:jspm-nodelibs-http@0.2.0",
    "https": "npm:jspm-nodelibs-https@0.2.2",
    "os": "npm:jspm-nodelibs-os@0.2.1",
    "paper": "github:paperjs/paper.js@0.10.3",
    "path": "npm:jspm-nodelibs-path@0.2.3",
    "process": "npm:jspm-nodelibs-process@0.2.1",
    "stream": "npm:jspm-nodelibs-stream@0.2.1",
    "string_decoder": "npm:jspm-nodelibs-string_decoder@0.2.1",
    "url": "npm:jspm-nodelibs-url@0.2.1",
    "util": "npm:jspm-nodelibs-util@0.2.2",
    "vm": "npm:jspm-nodelibs-vm@0.2.1"
  },
  packages: {
    "npm:gsap@1.18.0": {
      "map": {}
    },
    "npm:d3@4.8.0": {
      "map": {
        "d3-array": "npm:d3-array@1.2.0",
        "d3-random": "npm:d3-random@1.0.3",
        "d3-axis": "npm:d3-axis@1.0.6",
        "d3-interpolate": "npm:d3-interpolate@1.1.4",
        "d3-collection": "npm:d3-collection@1.0.3",
        "d3-dsv": "npm:d3-dsv@1.0.5",
        "d3-brush": "npm:d3-brush@1.0.4",
        "d3-ease": "npm:d3-ease@1.0.3",
        "d3-path": "npm:d3-path@1.0.5",
        "d3-force": "npm:d3-force@1.0.6",
        "d3-hierarchy": "npm:d3-hierarchy@1.1.4",
        "d3-chord": "npm:d3-chord@1.0.4",
        "d3-queue": "npm:d3-queue@3.0.5",
        "d3-voronoi": "npm:d3-voronoi@1.1.2",
        "d3-format": "npm:d3-format@1.2.0",
        "d3-quadtree": "npm:d3-quadtree@1.0.3",
        "d3-timer": "npm:d3-timer@1.0.5",
        "d3-request": "npm:d3-request@1.0.5",
        "d3-time-format": "npm:d3-time-format@2.0.5",
        "d3-time": "npm:d3-time@1.0.6",
        "d3-zoom": "npm:d3-zoom@1.1.4",
        "d3-transition": "npm:d3-transition@1.0.4",
        "d3-scale": "npm:d3-scale@1.0.5",
        "d3-selection": "npm:d3-selection@1.0.5",
        "d3-polygon": "npm:d3-polygon@1.0.3",
        "d3-color": "npm:d3-color@1.0.3",
        "d3-dispatch": "npm:d3-dispatch@1.0.3",
        "d3-shape": "npm:d3-shape@1.0.6",
        "d3-drag": "npm:d3-drag@1.0.4",
        "d3-geo": "npm:d3-geo@1.6.3"
      }
    },
    "npm:d3-brush@1.0.4": {
      "map": {
        "d3-interpolate": "npm:d3-interpolate@1.1.4",
        "d3-transition": "npm:d3-transition@1.0.4",
        "d3-selection": "npm:d3-selection@1.0.5",
        "d3-dispatch": "npm:d3-dispatch@1.0.3",
        "d3-drag": "npm:d3-drag@1.0.4"
      }
    },
    "npm:d3-force@1.0.6": {
      "map": {
        "d3-collection": "npm:d3-collection@1.0.3",
        "d3-quadtree": "npm:d3-quadtree@1.0.3",
        "d3-timer": "npm:d3-timer@1.0.5",
        "d3-dispatch": "npm:d3-dispatch@1.0.3"
      }
    },
    "npm:d3-chord@1.0.4": {
      "map": {
        "d3-array": "npm:d3-array@1.2.0",
        "d3-path": "npm:d3-path@1.0.5"
      }
    },
    "npm:d3-request@1.0.5": {
      "map": {
        "d3-collection": "npm:d3-collection@1.0.3",
        "d3-dsv": "npm:d3-dsv@1.0.5",
        "d3-dispatch": "npm:d3-dispatch@1.0.3",
        "xmlhttprequest": "npm:xmlhttprequest@1.8.0"
      }
    },
    "npm:d3-time-format@2.0.5": {
      "map": {
        "d3-time": "npm:d3-time@1.0.6"
      }
    },
    "npm:d3-zoom@1.1.4": {
      "map": {
        "d3-interpolate": "npm:d3-interpolate@1.1.4",
        "d3-transition": "npm:d3-transition@1.0.4",
        "d3-selection": "npm:d3-selection@1.0.5",
        "d3-dispatch": "npm:d3-dispatch@1.0.3",
        "d3-drag": "npm:d3-drag@1.0.4"
      }
    },
    "npm:d3-transition@1.0.4": {
      "map": {
        "d3-selection": "npm:d3-selection@1.0.5",
        "d3-ease": "npm:d3-ease@1.0.3",
        "d3-interpolate": "npm:d3-interpolate@1.1.4",
        "d3-timer": "npm:d3-timer@1.0.5",
        "d3-color": "npm:d3-color@1.0.3",
        "d3-dispatch": "npm:d3-dispatch@1.0.3"
      }
    },
    "npm:d3-interpolate@1.1.4": {
      "map": {
        "d3-color": "npm:d3-color@1.0.3"
      }
    },
    "npm:d3-scale@1.0.5": {
      "map": {
        "d3-array": "npm:d3-array@1.2.0",
        "d3-collection": "npm:d3-collection@1.0.3",
        "d3-color": "npm:d3-color@1.0.3",
        "d3-format": "npm:d3-format@1.2.0",
        "d3-interpolate": "npm:d3-interpolate@1.1.4",
        "d3-time": "npm:d3-time@1.0.6",
        "d3-time-format": "npm:d3-time-format@2.0.5"
      }
    },
    "npm:d3-dsv@1.0.5": {
      "map": {
        "rw": "npm:rw@1.3.3",
        "commander": "npm:commander@2.9.0",
        "iconv-lite": "npm:iconv-lite@0.4.17"
      }
    },
    "npm:d3-shape@1.0.6": {
      "map": {
        "d3-path": "npm:d3-path@1.0.5"
      }
    },
    "npm:d3-drag@1.0.4": {
      "map": {
        "d3-dispatch": "npm:d3-dispatch@1.0.3",
        "d3-selection": "npm:d3-selection@1.0.5"
      }
    },
    "npm:d3-geo@1.6.3": {
      "map": {
        "d3-array": "npm:d3-array@1.2.0"
      }
    },
    "npm:commander@2.9.0": {
      "map": {
        "graceful-readlink": "npm:graceful-readlink@1.0.1"
      }
    },
    "npm:jspm-nodelibs-url@0.2.1": {
      "map": {
        "url": "npm:url@0.11.0"
      }
    },
    "npm:jspm-nodelibs-http@0.2.0": {
      "map": {
        "http-browserify": "npm:stream-http@2.7.0"
      }
    },
    "npm:jspm-nodelibs-buffer@0.2.3": {
      "map": {
        "buffer": "npm:buffer@5.0.6"
      }
    },
    "npm:url@0.11.0": {
      "map": {
        "punycode": "npm:punycode@1.3.2",
        "querystring": "npm:querystring@0.2.0"
      }
    },
    "npm:stream-http@2.7.0": {
      "map": {
        "to-arraybuffer": "npm:to-arraybuffer@1.0.1",
        "builtin-status-codes": "npm:builtin-status-codes@3.0.0",
        "inherits": "npm:inherits@2.0.3",
        "xtend": "npm:xtend@4.0.1",
        "readable-stream": "npm:readable-stream@2.2.9"
      }
    },
    "npm:buffer@5.0.6": {
      "map": {
        "ieee754": "npm:ieee754@1.1.8",
        "base64-js": "npm:base64-js@1.2.0"
      }
    },
    "npm:readable-stream@2.2.9": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "core-util-is": "npm:core-util-is@1.0.2",
        "process-nextick-args": "npm:process-nextick-args@1.0.7",
        "buffer-shims": "npm:buffer-shims@1.0.0",
        "util-deprecate": "npm:util-deprecate@1.0.2",
        "string_decoder": "npm:string_decoder@1.0.0",
        "isarray": "npm:isarray@1.0.0"
      }
    },
    "npm:string_decoder@1.0.0": {
      "map": {
        "buffer-shims": "npm:buffer-shims@1.0.0"
      }
    },
    "npm:jspm-nodelibs-stream@0.2.1": {
      "map": {
        "stream-browserify": "npm:stream-browserify@2.0.1"
      }
    },
    "npm:jspm-nodelibs-string_decoder@0.2.1": {
      "map": {
        "string_decoder": "npm:string_decoder@0.10.31"
      }
    },
    "npm:stream-browserify@2.0.1": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "readable-stream": "npm:readable-stream@2.2.9"
      }
    },
    "npm:jspm-nodelibs-crypto@0.2.1": {
      "map": {
        "crypto-browserify": "npm:crypto-browserify@3.11.0"
      }
    },
    "npm:crypto-browserify@3.11.0": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "pbkdf2": "npm:pbkdf2@3.0.9",
        "create-hmac": "npm:create-hmac@1.1.4",
        "browserify-sign": "npm:browserify-sign@4.0.4",
        "browserify-cipher": "npm:browserify-cipher@1.0.0",
        "diffie-hellman": "npm:diffie-hellman@5.0.2",
        "create-hash": "npm:create-hash@1.1.2",
        "public-encrypt": "npm:public-encrypt@4.0.0",
        "create-ecdh": "npm:create-ecdh@4.0.0",
        "randombytes": "npm:randombytes@2.0.3"
      }
    },
    "npm:jspm-nodelibs-os@0.2.1": {
      "map": {
        "os-browserify": "npm:os-browserify@0.2.1"
      }
    },
    "npm:pbkdf2@3.0.9": {
      "map": {
        "create-hmac": "npm:create-hmac@1.1.4"
      }
    },
    "npm:create-hmac@1.1.4": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "create-hash": "npm:create-hash@1.1.2"
      }
    },
    "npm:browserify-sign@4.0.4": {
      "map": {
        "create-hmac": "npm:create-hmac@1.1.4",
        "inherits": "npm:inherits@2.0.3",
        "create-hash": "npm:create-hash@1.1.2",
        "bn.js": "npm:bn.js@4.11.6",
        "browserify-rsa": "npm:browserify-rsa@4.0.1",
        "parse-asn1": "npm:parse-asn1@5.1.0",
        "elliptic": "npm:elliptic@6.4.0"
      }
    },
    "npm:diffie-hellman@5.0.2": {
      "map": {
        "randombytes": "npm:randombytes@2.0.3",
        "bn.js": "npm:bn.js@4.11.6",
        "miller-rabin": "npm:miller-rabin@4.0.0"
      }
    },
    "npm:create-hash@1.1.2": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "cipher-base": "npm:cipher-base@1.0.3",
        "ripemd160": "npm:ripemd160@1.0.1",
        "sha.js": "npm:sha.js@2.4.8"
      }
    },
    "npm:public-encrypt@4.0.0": {
      "map": {
        "create-hash": "npm:create-hash@1.1.2",
        "randombytes": "npm:randombytes@2.0.3",
        "bn.js": "npm:bn.js@4.11.6",
        "browserify-rsa": "npm:browserify-rsa@4.0.1",
        "parse-asn1": "npm:parse-asn1@5.1.0"
      }
    },
    "npm:create-ecdh@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.6",
        "elliptic": "npm:elliptic@6.4.0"
      }
    },
    "npm:browserify-cipher@1.0.0": {
      "map": {
        "browserify-aes": "npm:browserify-aes@1.0.6",
        "browserify-des": "npm:browserify-des@1.0.0",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0"
      }
    },
    "npm:browserify-aes@1.0.6": {
      "map": {
        "create-hash": "npm:create-hash@1.1.2",
        "inherits": "npm:inherits@2.0.3",
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
        "cipher-base": "npm:cipher-base@1.0.3",
        "buffer-xor": "npm:buffer-xor@1.0.3"
      }
    },
    "npm:browserify-des@1.0.0": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "cipher-base": "npm:cipher-base@1.0.3",
        "des.js": "npm:des.js@1.0.0"
      }
    },
    "npm:parse-asn1@5.1.0": {
      "map": {
        "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
        "create-hash": "npm:create-hash@1.1.2",
        "pbkdf2": "npm:pbkdf2@3.0.9",
        "browserify-aes": "npm:browserify-aes@1.0.6",
        "asn1.js": "npm:asn1.js@4.9.1"
      }
    },
    "npm:browserify-rsa@4.0.1": {
      "map": {
        "bn.js": "npm:bn.js@4.11.6",
        "randombytes": "npm:randombytes@2.0.3"
      }
    },
    "npm:evp_bytestokey@1.0.0": {
      "map": {
        "create-hash": "npm:create-hash@1.1.2"
      }
    },
    "npm:miller-rabin@4.0.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.6",
        "brorand": "npm:brorand@1.1.0"
      }
    },
    "npm:cipher-base@1.0.3": {
      "map": {
        "inherits": "npm:inherits@2.0.3"
      }
    },
    "npm:elliptic@6.4.0": {
      "map": {
        "bn.js": "npm:bn.js@4.11.6",
        "inherits": "npm:inherits@2.0.3",
        "brorand": "npm:brorand@1.1.0",
        "minimalistic-crypto-utils": "npm:minimalistic-crypto-utils@1.0.1",
        "hmac-drbg": "npm:hmac-drbg@1.0.1",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0",
        "hash.js": "npm:hash.js@1.0.3"
      }
    },
    "npm:sha.js@2.4.8": {
      "map": {
        "inherits": "npm:inherits@2.0.3"
      }
    },
    "npm:des.js@1.0.0": {
      "map": {
        "inherits": "npm:inherits@2.0.3",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
      }
    },
    "npm:asn1.js@4.9.1": {
      "map": {
        "bn.js": "npm:bn.js@4.11.6",
        "inherits": "npm:inherits@2.0.3",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
      }
    },
    "npm:hmac-drbg@1.0.1": {
      "map": {
        "minimalistic-crypto-utils": "npm:minimalistic-crypto-utils@1.0.1",
        "hash.js": "npm:hash.js@1.0.3",
        "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
      }
    },
    "npm:hash.js@1.0.3": {
      "map": {
        "inherits": "npm:inherits@2.0.3"
      }
    }
  }
});
