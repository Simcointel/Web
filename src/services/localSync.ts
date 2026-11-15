import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const DEFAULT_OPTIONS = {
  prefix: 'simcointel:',
  useBroadcastChannel: true,
  storageEventsEnabled: true,
};

function generateTabId() {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

class LocalSync {
  private options;
  private tabId;
  private channel;
  private listeners;
  private storageListener;
  private initialized;

  constructor(options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.tabId = generateTabId();
    this.listeners = new Map();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    if (this.options.useBroadcastChannel && typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('simcointel-sync');
      this.channel.onmessage = function(event) { this.handleMessage(event.data); }.bind(this);
    }

    if (this.options.storageEventsEnabled) {
      this.storageListener = function(event) {
        if (event.key && event.key.startsWith(this.options.prefix) && event.newValue !== event.oldValue) {
          try {
            var data = JSON.parse(event.newValue || '{}');
            this.notifyListeners('set', event.key.replace(this.options.prefix, ''), data);
          } catch (e) {}
        }
      }.bind(this);
      window.addEventListener('storage', this.storageListener);
    }

    this.initialized = true;
  }

  handleMessage(message) {
    if (message.sourceTabId === this.tabId) return;
    this.notifyListeners(message.type, message.key, message.value);
  }

  notifyListeners(event, key, value) {
    var listeners = this.listeners.get(key) || this.listeners.get('*');
    if (listeners) {
      listeners.forEach(function(listener) {
        try {
          listener(event, key, value);
        } catch (e) {
          console.error('Sync listener error:', e);
        }
      });
    }
  }

  set(key, value) {
    if (!this.initialized) this.init();
    
    var prefixedKey = this.options.prefix + key;
    var timestamp = Date.now();
    
    localStorage.setItem(this.options.prefix + key, JSON.stringify({ value: value, timestamp: timestamp }));
    
    this.broadcast({ type: 'set', key: key, value: value, timestamp: timestamp, sourceTabId: this.tabId });
    
    this.notifyListeners('set', key, value);
  }

  get(key) {
    var item = localStorage.getItem(this.options.prefix + key);
    if (!item) return null;
    
    try {
      var parsed = JSON.parse(item);
      return parsed.value;
    } catch (e) {
      return null;
    }
  }

  delete(key) {
    var prefixedKey = this.options.prefix + key;
    localStorage.removeItem(prefixedKey);
    
    this.broadcast({ type: 'delete', key: key, timestamp: Date.now(), sourceTabId: this.tabId });
    this.notifyListeners('delete', key);
  }

  clear() {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith(this.options.prefix)) {
        keysToRemove.push(key);
      }
    }
    for (var i = 0; i < keysToRemove.length; i++) {
      localStorage.removeItem(keysToRemove[i]);
    }
    
    this.broadcast({ type: 'clear', key: '', timestamp: Date.now(), sourceTabId: this.tabId });
    this.notifyListeners('clear', '');
  }

  broadcast(message) {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  subscribe(key, listener) {
    if (!this.initialized) this.init();
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(listener);
    
    return function() {
      this.listeners.get(key).delete(listener);
    };
  }

  subscribeAll(listener) {
    if (!this.initialized) this.init();
    
    if (!this.listeners.has('*')) {
      this.listeners.set('*', new Set());
    }
    this.listeners.get('*').add(listener);
    
    return function() {
      this.listeners.get('*').delete(listener);
    };
  }

  getAll() {
    var result = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith(this.options.prefix)) {
        var unprefixedKey = key.replace(this.options.prefix, '');
        var item = localStorage.getItem(key);
        if (item) {
          try {
            result[unprefixedKey] = JSON.parse(item).value;
          } catch (e) {}
        }
      }
    }
    return result;
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

var syncInstance = null;

function getLocalSync(options) {
  if (!syncInstance) {
    syncInstance = new LocalSync(options);
    syncInstance.init();
  }
  return syncInstance;
}

function initLocalSync(options) {
  var sync = getLocalSync(options);
  sync.init();
  return sync;
}

function useLocalSync(key, defaultValue) {
  return getLocalSync();
}