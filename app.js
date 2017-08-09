function GameOfThrones (config) {
  let signals = {}
  let Dep = {
    // Name of the currently evaluated computed value
    // Doesn’t get overriden even if it depends on other computed values
    target: null,
    // Stores dependency keys of computed values
    subs: {},
    depend (deps, dep) {
      // Add the computed value as depending on this value
      // if not yet added
      if (!deps.includes(this.target)) {
        deps.push(this.target)
      }
      // Add this value as a dependency of the computed value
      // if not yet added
      if (!Dep.subs[this.target].includes(dep)) {
        Dep.subs[this.target].push(dep)
      }
    },
    getValidDeps (deps, key) {
      // Filter only valid dependencies by removing dead dependencies
      // that were not used during last computation
      return deps.filter(dep => this.subs[dep].includes(key))
    },
    notifyDeps (deps) {
      // notify all existing deps
      deps.forEach(notify)
    }
  }

  observeData(config.data)
  subscribeWatchers(config.watch, config.data)

  return {
    data: config.data,
    observe,
    notify
  }

  function subscribeWatchers(watchers, context) {
    for (let key in watchers) {
      if (watchers.hasOwnProperty(key)) {
        observe(key, watchers[key].bind(context))
      }
    }
  }

  function observe (property, signalHandler) {
    if(!signals[property]) signals[property] = []

    signals[property].push(signalHandler)
  }

  function notify (signal) {
    if(!signals[signal] || signals[signal].length < 1) return

    signals[signal].forEach(signalHandler => signalHandler())
  }

  function makeReactive (obj, key, computeFunc) {
    let deps = []
    let val = obj[key]

    Object.defineProperty(obj, key, {
      get () {
        // Run only when getting within a computed value context
        if (Dep.target) {
          Dep.depend(deps, key)
        }

        return val
      },
      set (newVal) {
        val = newVal

        // Clean up and notify valid deps
        deps = Dep.getValidDeps(deps, key)
        Dep.notifyDeps(deps, key)

        // Notify current key observers
        notify(key)
      }
    })
  }

  function makeComputed (obj, key, computeFunc) {
    let cache = null
    let deps = []

    // Observe self to clear cache when deps change
    observe(key, () => {
      // Clear cache
      cache = null

      // Clean up and notify valid deps
      deps = Dep.getValidDeps(deps, key)
      Dep.notifyDeps(deps, key)
    })

    Object.defineProperty(obj, key, {
      get () {
        // If within a computed value context other than self
        if (Dep.target) {
          // Make this computed value a dependency of another
          Dep.depend(deps, key)
        }
        // Normalize Dep.target to self
        Dep.target = key

        if (!cache) {
          // Clear dependencies list to ensure getting a fresh one
          Dep.subs[key] = []
          // Calculate new value and save to cache
          cache = computeFunc.call(obj)
        }

        // Clear the target context
        Dep.target = null
        return cache
      },
      set () {
        // Do nothing!
      }
    })
  }

  function observeData (obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'function') {
          makeComputed(obj, key, obj[key])
        } else {
          makeReactive(obj, key)
        }
      }
    }
    parseDOM(document.body, obj)
  }

  function sync (attr, node, observable, property) {
    node[attr] = observable[property]
    observe(property, () => node[attr] = observable[property])
  }

  function parseDOM (node, observable) {
    const nodes = document.querySelectorAll('[got-text]')
    const inputs = document.querySelectorAll('[got-model]')
    const images = document.querySelectorAll('[got-url]')
    nodes.forEach(node => {
      sync('textContent', node, observable, node.attributes['got-text'].value)
    })
    images.forEach(node => {
      sync('src', node, observable, node.attributes['got-url'].value)
    })
    inputs.forEach(input => {
      sync('value', input, observable, input.attributes['got-model'].value)
    })
  }
}
const houseInformation = {
  'Stark': {
    'motto': 'Winter Is Coming',
    'saying': '',
    'url': './img/stark.jpg'
  },
  'Lannister': {
    'motto': 'Hear Me Roar!',
    'saying': 'A Lannister always pays his debts.',
    'url': './img/lenn.jpg'
  },
  'Greyjoy': {
    'motto': 'We Do Not Sow',
    'saying': '',
    'url': './img/grey.jpg'
  },
  'Targaryen': {
    'motto': 'Fire and Blood',
    'saying': '',
    'url': './img/tar.jpg'
  },
  'Tyrell': {
    'motto': 'Growing Strong',
    'saying': '',
    'url': './img/tyrell.jpg'
  }
};
const App = GameOfThrones({
  data: {
    name: 'No One',
    placeholder: 'Choose your house!',
    house: 'Stark',
    selectedHouse () {
      return `${this.house}`      
    },
    selectedHouseMotto () {
      return houseInformation[this.house]['motto'];
    },
    selectedHouseSaying () {
      return houseInformation[this.house]['saying'];
    },
    selectedHouseUrl () {
      return houseInformation[this.house]['url'];
    },
    getName () {
      return name;
    },
    selectedCharacterSentenceLength () {
      return this.selectedHouse.length
    }
  },
  watch: {
    selectedCharacterSentenceLength () {
      console.log(this.selectedCharacterSentenceLength)
    }
  }
})

function updateText (property, e) {
	App.data[property] = e.target.value
}

function logProperty (property) {
  console.log(App.data[property])
}
