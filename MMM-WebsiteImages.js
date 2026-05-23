Module.register("MMM-WebsiteImages", {
  defaults: {
    manifestUrl: "https://raw.githubusercontent.com/MetroCS/MMM-WebsiteImages/main/sample_manifest.json",
    updateInterval: 10 * 60 * 1000,
    imageInterval: 30 * 1000,
    animationSpeed: 1000,
    randomize: false,
    showLastUpdated: false,
    maxWidth: "100%",
    maxHeight: "100%"
  },

  start() {
    Log.info("[MMM-WebsiteImages] front-end start()")

    this.images = []
    this.currentIndex = 0
    this.lastUpdated = null
    this.error = null
    this.message = null
    this.cacheStatus = null

    this.fetchManifest()

    this.manifestTimer = setInterval(() => {
      this.fetchManifest()
    }, this.config.updateInterval)

    this.imageTimer = setInterval(() => {
      this.nextImage()
    }, this.config.imageInterval)
  },

  fetchManifest() {
    Log.info("[MMM-WebsiteImages] sending FETCH_MANIFEST")

    this.sendSocketNotification("FETCH_MANIFEST", {
      manifestUrl: this.config.manifestUrl
    })
  },

  getStyles() {
    return ["MMM-WebsiteImages.css"]
  },

  socketNotificationReceived(notification, payload) {
    Log.info("[MMM-WebsiteImages] front-end received:", notification)

    if (notification === "MANIFEST_RESULT") {
      this.error = null
      this.images = payload.images || []
      this.lastUpdated = payload.lastUpdated || null
      this.cacheStatus = payload.cacheStatus || null
      this.message = payload.message || null
      this.currentIndex = 0
      this.updateDom(this.config.animationSpeed)
    }

    if (notification === "MANIFEST_ERROR") {
      this.error = payload.message
      this.updateDom(this.config.animationSpeed)
    }
  },

  nextImage() {
    if (!this.images.length) return

    if (this.config.randomize) {
      this.currentIndex = Math.floor(Math.random() * this.images.length)
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.images.length
    }

    this.updateDom(this.config.animationSpeed)
  },

  getDom() {
    const wrapper = document.createElement("div")
    wrapper.className = "mmm-website-images"

    if (this.error) {
      wrapper.innerHTML = `<div class="dimmed small">Image manifest error: ${this.error}</div>`
      return wrapper
    }

    if (!this.images.length) {
      wrapper.innerHTML = "<div class=\"dimmed small\">Loading images...</div>"
      return wrapper
    }

    const img = document.createElement("img")
    img.src = this.images[this.currentIndex]
    img.style.maxWidth = this.config.maxWidth
    img.style.maxHeight = this.config.maxHeight
    img.className = "mmm-website-images-photo"
    wrapper.appendChild(img)

    if (this.config.showLastUpdated && this.lastUpdated) {
      const caption = document.createElement("div")
      caption.className = "dimmed xsmall mmm-website-images-caption"
      caption.innerText = `Updated: ${this.lastUpdated}`
      wrapper.appendChild(caption)
    }

    if (this.message) {
      const status = document.createElement("div")
      status.className = "dimmed xsmall mmm-website-images-status"
      status.innerText = this.message
      wrapper.appendChild(status)
    }

    return wrapper
  }
})
