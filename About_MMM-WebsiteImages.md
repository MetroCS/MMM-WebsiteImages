# About MMM-WebsiteImages

MMM-WebsiteImages is a MagicMirror module that allows you to display a sequence of images from accessible URLs.
The supported image types include the standard, web-friendly image file formats like JPG/JPEG, PNG, GIF, WebP, BMP, and SVG.

## The JSON manifest
Instead of asking MagicMirror to scrape an HTML page or some network directory, we expose a JSON manifest as the single source of valid images.
The manifest can live on a local drive or any remote server accessible via standard web and network protocols.

Every time images are added or removed, the manifest file needs to be updated.

The JSON manifest file has the following structure:
<pre>
{
  "lastUpdated": <i>&lt;an ISO 8601 formatted date/time string&gt;</i> ,
  "images": [
     <i>&lt;a comma-separated list of quoted image URLs&gt;</i>
  ]
}
</pre>

Here is an example:
```
{
  "lastUpdated": "2026-05-24T21:27:+0600",
  "images": [
    "https://yourserver.com/directoryname/nameofimage1.jpg",
    "https://yourserver.com/directoryname/nameofimage2.png",
     "file:///location/of/images/nameofimage3.svg"
  ]
}
```
Note the use of fully-qualified URLs for the images.
This enables the module to work with images that are hosted on multiple servers, use multiple protocols,
as well as images that are available locally (e.g., <samp>file://, ftp://, https://, nfs://, smb://, s3://</samp>)

## How the module works
**Automated Updates:** The backend of MMM-WebsiteImages uses the manifest to determine whether there have been changes since the last time it was checked and identify which images need to be added or removed. It fetches the manifest on a fixed time interval, configurable by the user with a default of every 10 minutes.

**Local Caching:** It creates a cache of the images and manifest, so that the frontend only reads from files that exist locally. The frontend never directly connects to the internet or other servers. 

**Offline Resilience:** This also ensures that if the image-hosting server drops offline or the network connection goes down, the error is handled gracefully and images continue to be displayed by the module from the list of already cached images.

**Cache Cleanup:** When an image URL is removed from the JSON manifest array, the backend automatically deletes that image from the local cache.

**Error Handling:** If an error is detected, such as a malformed JSON manifest file, the module will display a small error message on the MagicMirror screen.
