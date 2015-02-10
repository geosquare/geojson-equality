!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.GeojsonEquality=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//index.js

var Equality = function(opt) {
  this.precision = opt && opt.precision ? opt.precision : 17; 
  this.direction = opt && opt.direction ? opt.direction : false;
  this.pseudoNode = opt && opt.pseudoNode ? opt.pseudoNode : false;
  this.objectComparator = opt && opt.objectComparator ? opt.objectComparator : objectComparator;
};

Equality.prototype.compare = function(g1,g2) {
  if (g1.type !== g2.type || !sameLength(g1,g2)) return false;

  switch(g1.type) {
  case 'Point': 
    return this.compareCoord(g1.coordinates, g2.coordinates);
    break;
  case 'LineString':
    return this.compareLine(g1.coordinates, g2.coordinates,0,false);
    break;
  case 'Polygon':
    return this.comparePolygon(g1,g2);
    break;
  case 'Feature':
    return this.compareFeature(g1, g2);
  default:
    if (g1.type.indexOf('Multi') === 0) {
      var context = this;
      var g1s = explode(g1);
      var g2s = explode(g2);
      return g1s.every(function(g1part) {
        return this.some(function(g2part) {
          return context.compare(g1part,g2part);
        });
      },g2s);
    }
  }
  return false;
};

function explode(g) {
  return g.coordinates.map(function(part) {
    return { 
      type: g.type.replace('Multi', ''),
      coordinates: part} 
  });
}
//compare length of coordinates/array
function sameLength(g1,g2) {
   return g1.hasOwnProperty('coordinates') ? 
    g1.coordinates.length === g2.coordinates.length
    : g1.length === g2.length;
}

// compare the two coordinates [x,y]
Equality.prototype.compareCoord = function(c1,c2) {
  return c1[0].toFixed(this.precision) === c2[0].toFixed(this.precision)
    && c1[1].toFixed(this.precision) === c2[1].toFixed(this.precision);
};

Equality.prototype.compareLine = function(path1,path2,ind,isPoly) {
  if (!sameLength(path1,path2)) return false;
  var p1 = this.pseudoNode ? path1 : this.removePseudo(path1);
  var p2 = this.pseudoNode ? path2 : this.removePseudo(path2);
  if (isPoly && !this.compareCoord(p1[0],p2[0])) { 
    // fix start index of both to same point
    p2 = this.fixStartIndex(p2,p1);
    if(!p2) return;
  }
  // for linestring ind =0 and for polygon ind =1
  var sameDirection = this.compareCoord(p1[ind],p2[ind]);
  if (this.direction || sameDirection 
  ) {
    return this.comparePath(p1, p2);
  } else {
    if (this.compareCoord(p1[ind],p2[p2.length - (1+ind)])
    ) {
      return this.comparePath(p1.slice().reverse(), p2); 
    }
    return false;
  } 
};
Equality.prototype.fixStartIndex = function(sourcePath,targetPath) {
  //make sourcePath first point same as of targetPath
  var correctPath,ind = -1;
  for (var i=0; i< sourcePath.length; i++) {
    if(this.compareCoord(sourcePath[i],targetPath[0])) {
      ind = i;
      break;
    }
  }
  if (ind >= 0) {
    correctPath = [].concat(
      sourcePath.slice(ind,sourcePath.length),
      sourcePath.slice(1,ind+1));
  }
  return correctPath;
};
Equality.prototype.comparePath = function (p1,p2) {
  var cont = this;
  return p1.every(function(c,i) {
    return cont.compareCoord(c,this[i]);
  },p2);
};

Equality.prototype.comparePolygon = function(g1,g2) {
  if (this.compareLine(g1.coordinates[0],g2.coordinates[0],1,true)) {
    var holes1 = g1.coordinates.slice(1,g1.coordinates.length);
    var holes2 = g2.coordinates.slice(1,g2.coordinates.length);
    var cont = this;
    return holes1.every(function(h1) {
      return this.some(function(h2) {
        return cont.compareLine(h1,h2,1,true);
      });
    },holes2);
  } else {
    return false;
  }
};

Equality.prototype.compareFeature = function(g1,g2) {
  if (
    g1.id !== g2.id ||
    !this.objectComparator(g1.properties, g2.properties)
  ) {
    return false;
  }

  return this.compare(g1.geometry, g2.geometry);
};

Equality.prototype.removePseudo = function(path) {
  //TODO to be implement 
  return path;
};

function objectComparator(obj1, obj2) {
  var i;
  var objKeys = Object.keys(obj1);
  
  if (objKeys.length !== Object.keys(obj2).length) {
    return false;
  }
  
  for (i = 0; i < objKeys.length; i++) {
    if (!(objKeys[i] in obj2)) {
      return false;
    }
    if (obj1[objKeys[i]] !== obj2[objKeys[i]]) {
      return false
    }
  }
  
  return true;
}

module.exports = Equality;

},{}]},{},[1])(1)
});


//# sourceMappingURL=geojson-equality.js.map