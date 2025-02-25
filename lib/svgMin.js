const sharp = require('sharp');
const {optimize} = require('svgo');

/**
 *
 * @param   {string} data
 * @param   {object} options
 * @returns {Promise}
 */
module.exports = async (data, options = {minifyRasterImages: true}) => {
  let result = data;

  if (options.minifyRasterImages) {
    // Match <image> elements with xlink:href containing PNG, JPEG, or GIF base64 data
    const imageTagRegex =
      /<image\b[^>]*?xlink:href="(data:image\/(png|jpeg|jpg|gif);base64,[\s\S]+?)"[^>]*?>/gm;
    let matches = [...result.matchAll(imageTagRegex)];

    for (const match of matches) {
      let fullMatch = match[0]; // The entire <image> tag
      let imageDataUri = match[1]; // Extracted image data URI
      let imageType = match[2]; // Extracted format (png, jpeg, jpg, gif)

      // Extract the base64 data and remove any whitespace/newlines
      let base64Image = imageDataUri
        .replace(/^data:image\/(png|jpeg|jpg|gif);base64,/, '')
        .replace(/\s+/g, '');
      let imageBuffer = Buffer.from(base64Image, 'base64');

      // Convert PNG, JPEG, or GIF to WebP using sharp
      let webpBuffer = await sharp(imageBuffer).webp().toBuffer();
      let base64Webp = webpBuffer.toString('base64');

      // Replace image data URI with WebP data URI inside the <image> tag
      let webpDataUri = `data:image/webp;base64,${base64Webp}`;
      let updatedImageTag = fullMatch.replace(imageDataUri, webpDataUri);

      // Update the SVG content
      result = result.replace(fullMatch, updatedImageTag);
    }
  }

  // Optimize using SVGO
  result = (
    await optimize(result, {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false
            }
          }
        }
      ]
    })
  ).data;

  return result;
};
