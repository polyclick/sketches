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
      "path": "npm:jspm-nodelibs-path@0.2.3",
      "fs": "npm:jspm-nodelibs-fs@0.2.1",
      "process": "npm:jspm-nodelibs-process@0.2.1",
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
    "gsap": "npm:gsap@1.18.0",
    "paper": "github:paperjs/paper.js@0.10.3"
  },
  packages: {
    "npm:gsap@1.18.0": {
      "map": {}
    }
  }
});
