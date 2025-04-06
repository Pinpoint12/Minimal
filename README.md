# Minimal

A browser extension that creates a cleaner, more focused web experience by removing distractions, unnecessary UI elements, and the bane of our existence - *ALGORITHM DRIVEN CONTENT*.

## Recent Updates & Roadmap

### Done
- ✅ Fixed YouTube homepage with minimal search-only interface
- ✅ Added browser tab title cleanup (removes notification numbers)
- ✅ Removed Reddit side tabs with recommended posts, etc
- ✅ Centered YouTube video content after removing recommended videos

### Todo:
- 🔜 Minimalist Reddit homepage
- 🔜 Support for additional websites
- 🔜 Settings panel for specific user control

## Features

Minimal transforms popular websites by:

- **Removing distractions** - hides sidebars, notifications, and other attention-grabbing elements
- **Focusing on content** - prioritizes what you came to see, not what sites want to show you
- **Simplifying interfaces** - cleans up cluttered designs for a more peaceful browsing experience

## Supported Websites

- YouTube
- Twitter/X
- Reddit
- Amazon
- Google
- Yahoo
- Netflix
- Facebook

## How It Works

Minimal uses targeted CSS and JavaScript to modify the appearance and behavior of websites. The extension automatically activates when you visit supported sites, immediately cleaning up the interface.

### YouTube
Transforms the homepage into a clean search interface and centers video content.

### Reddit
Hides distracting elements and ensures proper responsiveness across all device sizes.

### Twitter/X
Removes suggested content and notifications to help you focus on the timeline.

## Installation

1. Clone this repository
2. Load as an unpacked extension in your browser:
   - Chrome: Open Extensions → Enable Developer Mode → Load Unpacked
   - Firefox: Open about:debugging → This Firefox → Load Temporary Add-on

## License & Attribution

This project is licensed under the GNU General Public License v3.

This is a GitHub mirror of the Minimal Master browser extension, originally created by [AUPYA](https://gitlab.com/aupya). The original project is hosted on [GitLab](https://gitlab.com/aupya/minimal).

# Minimal, the browser extension for peace of mind
Minimal is a browser extension to experience a minimal, less attention grabbing internet experience. Internet should be a tool, not a trap.

You can watch the Minimal introductory video [here](https://youtu.be/Gtf9DYDtsHw)

Minimal is driven by core values:

- The user must actively make choices by themselves.
- A user should easily find the content they are searching for on a page, not the content a platform wants them to see.
- A service provider can convince the user to use their platform, but only through their services' inner quality.

To get a (mostly) complete list of the changes made to the user experience by the minimal browser extension, check the [Changes page](https://minimal.aupya.org/#about_changes). Those changes are following [minimal's manifesto](MANIFESTO.md).

This extension is being developed for the greater good, it is an open source project, you can check its code and contribute.

Some details to know:
 - All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.

 - This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 - Minimal is fully transparent about what it does once installed, being open source and well documented (see the [Changes page](https://minimal.aupya.org/#about_changes) ). Minimal has no effect on the website themeselves, minimal is an add-on that allows you to customize your experience while browsing on the internet.

 - Minimal does not collect any data.
 
 - Your browser will require you to add permissions for minimal to access any website. Those permissions are necessary for minimal to be able to add the stylesheets and the scripts needed for its functioning. If this requirement frighten you, it's a good thing, you should not accept to give permissions that easily. In the case of Minimal, you should know that it is an open-source add-on, everyone is free and invited to check its source code and see that it's never collecting or sending anything.

# Want to contribute?

We would be more than happy to receive some more help from the community:

## As a user
If you spot something that you think minimal should act upon on a common website let us know by creating a ticket [here](https://gitlab.com/aupya/minimal/issues).

If you encounter any problem while using minimal, please create a new [issue](https://gitlab.com/aupya/minimal/issues).

## As a (web)designer
If you have ideas about what a common website should look like or act like for it to be minimal, please, add your ideas [here](https://gitlab.com/aupya/minimal/issues). 
Please, try to follow [minimal's manifesto](./MANIFESTO.md).

## As a (web)developer
This is a browser extension, if you are not familiar about how it works, [here is a guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions).

When contributing, if you make a new change, add a comment to explain it.

The comment has to fit on one line and has to follow this pattern:
1. `/* - ` 
2. The explanation of the change
3. ` - ` 
4. One or more code of a rule from the [manifesto](./MANIFESTO.md)
5. ` */`

Changes must follow at least one rule from the [manifesto](./MANIFESTO.md). Rules codes are the first letter of a main section followed by the number of the rule. Multiple codes can be specifed, separated by spaces.

Exemples of the comment pattern:

```
/* - Explaination of the change - C3 P1 */
```
```
/* - Explaination - U2 */
```

# How to build the extension?

Put everything inside a .zip and you should be able to use it [as described here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing).

## Install on Chrome/Chromium browsers

### Chrome
1. Download the latest release .zip file
2. Go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" in the top left
5. Select the unzipped folder containing the extension files
6. The extension should now be installed and active

### Brave
1. Download the latest release .zip file
2. Go to `brave://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" in the top left
5. Select the unzipped folder containing the extension files
6. The extension should now be installed and active

Note: For both browsers, you may need to approve permissions when first using the extension on supported sites.
