# Icon Generation Instructions

This folder contains SVG files and a HTML generator to create the icons for the Pomodoro AI Chrome extension.

## Option 1: Using the HTML Generator

1. Open the `generate-icons.html` file in your web browser
2. You will see previews of the icons in each size (16x16, 48x48, and 128x128)
3. Click the "Download" button under each icon to save it as a PNG file
4. You can also click "Download All Icons" to get all three sizes at once
5. Move the downloaded PNG files to this folder, ensuring they're named correctly:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

## Option 2: Using an SVG Converter Tool Online

If the HTML generator doesn't work for you, you can use online SVG to PNG conversion tools:

1. Use one of these files as input:
   - `icon-tiny.svg` for the 16x16 icon
   - `icon-small.svg` for the 48x48 icon
   - `icon.svg` for the 128x128 icon

2. Convert using one of these free online tools:
   - [convertio.co](https://convertio.co/svg-png/)
   - [svgtopng.com](https://svgtopng.com/)
   - [onlineconvertfree.com](https://onlineconvertfree.com/convert/svg-to-png/)

3. Make sure to specify the correct dimensions during conversion.

## Option 3: Using Design Software

If you have access to design software like Adobe Illustrator, Figma, or Inkscape:

1. Open the appropriate SVG file
2. Export/Save as PNG at the correct size
3. Place the PNG files in this folder with the correct names

## Placeholder Files

The current `.png` files in this folder are empty placeholders. Replace them with actual icons generated using one of the methods above.

## Icon Sizes

Chrome extensions require icons in specific sizes:
- 16x16: Used for favicon and Chrome extension management page
- 48x48: Used in the extension management page
- 128x128: Used in the Chrome Web Store and installation dialog 