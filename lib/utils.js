
var BYTE = 1,
    KB = 1024 * BYTE,
    MB = 1024 * KB,
    GB = 1024 * MB,
    TB = 1024 * GB,
    PB = 1024 * TB;

var MILLISECOND = 1,
    SECOND = 1000 * MILLISECOND,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
    MONTH = 30 * DAY,
    YEAR = 365 * DAY;

// @see - http://killdream.github.io/blog/2011/10/understanding-javascript-oop/index.html

// Aliases for the rather verbose methods on ES5
var descriptor  = Object.getOwnPropertyDescriptor, 
    properties  = Object.getOwnPropertyNames, 
    define_prop = Object.defineProperty;

function clone(parent) {
    var cloned = {};
    properties(parent).forEach(function(key) {
        define_prop(cloned, key, descriptor(parent, key)) 
    });

    return cloned;
};

function extend(original, extensions) {        
    properties(extensions).forEach(function(key) {
        define_prop(original, key, descriptor(extensions, key)) 
    });

    return original;
};


/**
 * 'prototypal' creates and returns a prototypal constructor function.  The 
 *  returned constructor will return a new object spawned from the given 
 *  parent object, initialized by 'initializer', and augmented with 'methods'
 *
 *  prototypal(parent, initializer, methods) {...}
 *
 * parent:
 *  the parent object to extend
 *
 * initializer:
 *  the function to initialize newly constructed instances
 *
 * methods:
 *  an object containing functions to augment newly constructed instances
 *
 */

function prototypal(parent, initializer, methods) {

    // declare init, declare prototype, then assign to it the result
    // of passing a valid parent object's prototype to Object.create
    var func, prototype = Object.create(parent && parent.prototype);

    if (methods) {
        
        Object.keys(methods).forEach(function (key) {
            prototype[key] = methods[key];
        });
    }

    func = function () {
        var that = Object.create(prototype);

        if (typeof initializer === 'function') {
            initializer.apply(that, arguments);
        }
        return that;
    };

    func.prototype = prototype;

    prototype.constructor = func;

    return func;

};

// returns that to which an XOR expression would evaluate
function XOR (a,b) {
  return ( a || b ) && !( a && b );
};


module.exports = {

    clone: clone,

    // emitter: function () {
    //     var cloned 
    // }
    extend: extend,

    prototypal: prototypal,
    XOR: XOR,

    BYTE: BYTE,
    KB: KB,
    MB: MB,
    GB: GB,
    TB: TB,
    PB: PB,
    
    MILLISECOND: MILLISECOND,
    SECOND: SECOND,
    MINUTE: MINUTE,
    HOUR: HOUR,
    DAY: DAY,
    WEEK: WEEK,
    MONTH: MONTH,
    YEAR: YEAR
};
