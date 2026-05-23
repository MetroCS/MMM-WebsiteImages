const NodeHelper = require("node_helper")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

module.exports = NodeHelper.create({
  start() {
    this.cacheDir = path.join(__dirname, "cache")
    this.cacheIndexPath = path.join(this.cacheDir, "cache.json")

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }

    console.log("[MMM-WebsiteImages] node_helper started")
  },

  async socketNotificationReceived(notification, config) {
    console.log("[MMM-WebsiteImages] socket notification received:", notification)
    console.log("[MMM-WebsiteImages] config:", JSON.stringify(config, null, 2))

    if (notification !== "FETCH_MANIFEST") return

    console.log("[MMM-WebsiteImages] received FETCH_MANIFEST")

    try {
      const remoteManifest = await this.fetchManifest(config.manifestUrl)
      const localCache = this.readLocalCache()

      const cacheIsCurrent
        = localCache
          && localCache.lastUpdated === remoteManifest.lastUpdated
          && this.cacheIsUsable(localCache)

      if (cacheIsCurrent) {
        console.log("[MMM-WebsiteImages] using current local cache")
        this.sendCachedImages(localCache)
        return
      }

      console.log("[MMM-WebsiteImages] cache missing, stale, or incomplete; updating")
      const updatedCache = await this.updateCache(remoteManifest, config.manifestUrl)

      this.writeLocalCache(updatedCache)
      this.sendCachedImages(updatedCache)
    } catch (err) {
      console.error("[MMM-WebsiteImages] refresh failed:", err)

      const fallbackCache = this.readLocalCache()

      if (this.cacheIsUsable(fallbackCache)) {
        this.sendSocketNotification("MANIFEST_RESULT", {
          lastUpdated: fallbackCache.lastUpdated,
          images: fallbackCache.images.map(img => this.localUrlFor(img.localFile)),
          cacheStatus: "offline-cache",
          message: `Using cached images because refresh failed: ${err.message}`
        })
      } else {
        this.sendSocketNotification("MANIFEST_ERROR", {
          message: err.message
        })
      }
    }
  },

  async fetchManifest(manifestUrl) {
    console.log("[MMM-WebsiteImages] fetching manifest:", manifestUrl)

    const response = await fetch(manifestUrl, {
      headers: {
        Accept: "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Manifest fetch failed: HTTP ${response.status}`)
    }

    const manifest = await response.json()

    const lastUpdated = manifest.lastUpdated

    if (!lastUpdated) {
      throw new Error("Manifest is missing lastUpdated")
    }

    if (!Array.isArray(manifest.images)) {
      throw new Error("Manifest is missing images array")
    }

    return {
      lastUpdated,
      images: manifest.images
    }
  },

  readLocalCache() {
    if (!fs.existsSync(this.cacheIndexPath)) {
      return null
    }

    try {
      return JSON.parse(fs.readFileSync(this.cacheIndexPath, "utf8"))
    } catch (err) {
      console.error("[MMM-WebsiteImages] could not read cache.json:", err)
      return null
    }
  },

  writeLocalCache(cache) {
    fs.writeFileSync(
      this.cacheIndexPath,
      JSON.stringify(cache, null, 2),
      "utf8"
    )

    console.log("[MMM-WebsiteImages] wrote cache index:", this.cacheIndexPath)
  },

  cacheIsUsable(cache) {
    if (!cache || !Array.isArray(cache.images) || cache.images.length === 0) {
      return false
    }

    return cache.images.every((img) => {
      if (!img.localFile) return false

      const localPath = path.join(this.cacheDir, img.localFile)
      return fs.existsSync(localPath)
    })
  },

  async updateCache(manifest, manifestUrl) {
    console.log("[MMM-WebsiteImages] updating cache")
    console.log("[MMM-WebsiteImages] image count:", manifest.images.length)

    const cachedImages = []

    for (const imageUrl of manifest.images) {
      const remoteUrl = this.normalizeImageUrl(imageUrl, manifestUrl)
      const localFile = this.filenameForUrl(remoteUrl)
      const localPath = path.join(this.cacheDir, localFile)

      if (!fs.existsSync(localPath)) {
        await this.downloadImage(remoteUrl, localPath)
      } else {
        console.log("[MMM-WebsiteImages] already cached:", localFile)
      }

      cachedImages.push({
        remoteUrl,
        localFile
      })
    }

    this.removeOldImages(cachedImages)

    return {
      lastUpdated: manifest.lastUpdated,
      images: cachedImages
    }
  },

  normalizeImageUrl(imageUrl, manifestUrl) {
    return new URL(imageUrl, manifestUrl).href
  },

  async downloadImage(remoteUrl, localPath) {
    console.log("[MMM-WebsiteImages] downloading:", remoteUrl)
    console.log("[MMM-WebsiteImages] writing:", localPath)

    const response = await fetch(remoteUrl)

    if (!response.ok) {
      throw new Error(`Image fetch failed for ${remoteUrl}: HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    fs.writeFileSync(localPath, buffer)
  },

  filenameForUrl(remoteUrl) {
    const parsed = new URL(remoteUrl)
    const ext = path.extname(parsed.pathname) || ".jpg"

    const hash = crypto
      .createHash("sha256")
      .update(remoteUrl)
      .digest("hex")
      .slice(0, 16)

    return `${hash}${ext}`
  },

  localUrlFor(localFile) {
    return `/modules/MMM-WebsiteImages/cache/${localFile}`
  },

  sendCachedImages(cache) {
    this.sendSocketNotification("MANIFEST_RESULT", {
      lastUpdated: cache.lastUpdated,
      images: cache.images.map(img => this.localUrlFor(img.localFile)),
      cacheStatus: "cache"
    })
  },

  removeOldImages(currentImages) {
    const keep = new Set(currentImages.map(img => img.localFile))

    for (const file of fs.readdirSync(this.cacheDir)) {
      if (file === "cache.json") continue

      if (!keep.has(file)) {
        const oldPath = path.join(this.cacheDir, file)
        fs.unlinkSync(oldPath)
        console.log("[MMM-WebsiteImages] removed old cached image:", oldPath)
      }
    }
  }
})
