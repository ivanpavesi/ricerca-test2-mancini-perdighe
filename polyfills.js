// Polyfill per supportare browser più vecchi
// FormData polyfill per IE
if (typeof window.FormData !== 'function') {
    window.FormData = function() {
        this.data = {};
        
        this.append = function(key, value) {
            this.data[key] = value;
        };
        
        this.entries = function() {
            var entries = [];
            for (var key in this.data) {
                if (this.data.hasOwnProperty(key)) {
                    entries.push([key, this.data[key]]);
                }
            }
            
            // Versione più compatibile senza generator functions
            var index = 0;
            return {
                next: function() {
                    if (index < entries.length) {
                        return { value: entries[index++], done: false };
                    } else {
                        return { done: true };
                    }
                },
                // Per browser che supportano Symbol.iterator
                [Symbol.iterator && Symbol.iterator]: function() { return this; }
            };
        };
        
        // Aggiunta di get per supportare FormData.get()
        this.get = function(key) {
            return this.data[key] || null;
        };
    };
}

// Resto del codice rimane invariato
// Polyfill per Element.classList
if (!("classList" in document.documentElement)) {
    Object.defineProperty(HTMLElement.prototype, 'classList', {
        get: function() {
            var self = this;
            function update(fn) {
                return function(value) {
                    var classes = self.className.split(/\s+/);
                    var index = classes.indexOf(value);
                    fn(classes, index, value);
                    self.className = classes.join(" ");
                    return self;
                };
            }
            
            return {
                add: update(function(classes, index, value) {
                    if (index === -1) classes.push(value);
                }),
                remove: update(function(classes, index) {
                    if (index !== -1) classes.splice(index, 1);
                }),
                toggle: update(function(classes, index, value) {
                    if (index === -1) {
                        classes.push(value);
                    } else {
                        classes.splice(index, 1);
                    }
                }),
                contains: function(value) {
                    return self.className.split(/\s+/).indexOf(value) !== -1;
                }
            };
        }
    });
}

// Polyfill per Promise
if (typeof window.Promise !== 'function') {
    // Semplice polyfill per Promise
    window.Promise = function(executor) {
        var callbacks = [];
        var state = 'pending';
        var value;
        
        function resolve(newValue) {
            if (state !== 'pending') return;
            state = 'fulfilled';
            value = newValue;
            callbacks.forEach(function(callback) {
                setTimeout(function() {
                    callback.onFulfilled(value);
                }, 0);
            });
        }
        
        function reject(reason) {
            if (state !== 'pending') return;
            state = 'rejected';
            value = reason;
            callbacks.forEach(function(callback) {
                setTimeout(function() {
                    callback.onRejected(value);
                }, 0);
            });
        }
        
        this.then = function(onFulfilled, onRejected) {
            return new Promise(function(resolve, reject) {
                callbacks.push({
                    onFulfilled: function(value) {
                        try {
                            resolve(onFulfilled(value));
                        } catch(e) {
                            reject(e);
                        }
                    },
                    onRejected: function(reason) {
                        try {
                            if (onRejected) {
                                resolve(onRejected(reason));
                            } else {
                                reject(reason);
                            }
                        } catch(e) {
                            reject(e);
                        }
                    }
                });
                
                if (state === 'fulfilled') {
                    setTimeout(function() {
                        callbacks[callbacks.length - 1].onFulfilled(value);
                    }, 0);
                } else if (state === 'rejected') {
                    setTimeout(function() {
                        callbacks[callbacks.length - 1].onRejected(value);
                    }, 0);
                }
            });
        };
        
        try {
            executor(resolve, reject);
        } catch(e) {
            reject(e);
        }
    };
}