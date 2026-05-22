# MMM-WebsiteImages

*MMM-WebsiteImages* is a module for [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) that displays images retrieved from a website.
The module checks for a JSON file at the specified URL and uses that information to retrieve, cache, and display images.

## Screenshot

![Example of MMM-WebsiteImages display](./example_1.png)

## Installation

### Install

In your terminal, go to the modules directory and clone the repository:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/MetroCS/MMM-WebsiteImages
cd MMM-WebsiteImages
npm install --only=prod
```

### Update

Go to the module directory and pull the latest changes:

```bash
cd ~/MagicMirror/modules/MMM-WebsiteImages
git pull
npm install --only=prod
```

## Configuration

To use this module, you have to add a configuration object to the modules array in the `config/config.js` file.

### Example configuration

Minimal configuration to use the module:

```js
    {
        module: 'MMM-WebsiteImages',
        config: {
            manifestUrl: "YOUR_URL_HERE/manifest.json"
        }
    },
```

Configuration with all options:

```js
    {
        module: 'MMM-WebsiteImages',
        position: 'lower_third',
        config: {
            manifestUrl: "YOUR_URL_HERE/manifest.json",
            updateInterval: 10 * 60 * 1000,
            imageInterval: 30 * 1000,
            animationSpeed: 1000,
            randomize: false,
            showLastUpdated: false,
            maxWidth: "100%",
            maxHeight: "100%"
        }
    },
```

### Configuration options

Option|Possible values|Default|Description
------|------|------|-----------
`manifestURL`|`string`|not available|The URL of the manifest JSON file|
`updateInterval`|`number`|600000|The time (in milliseconds) between updates of the manifest file (default 10 minutes)|
`imageInterval`|`number`|30000|The time (in milliseconds) between image changes (default 30 seconds)|
`animationSpeed`|`number`|1000|The speed (in milliseconds) of the image transition animation (default 1 second)|
`randomize`|`boolean`|`false`|Whether to randomize the order in which images are shown|
`showLastUpdated`|`boolean`|`false`|Whether to show the last updated time of the image|
`maxWidth`|`string`|`100%`|The maximum width of the the displayed image|
`maxHeight`|`string`|`100%`|The maximum height of of the displayed image|

## Developer commands

- `npm install` - Install devDependencies like ESLint.
- `npm run lint:js` - Lint JavaScript files.
- `npm run lint:css` - Lint CSS files.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG.md](CHANGELOG.md) file.
