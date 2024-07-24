import { HfInference } from "@huggingface/inference";
import sharp from "sharp";
import config from "./config.js";
class imageModel {
  constructor() {
    this.hf = new HfInference(config.HF_TOKEN);
  }

  async generateTextToImage(inputText, options = {}) {
    try {
      console.time("API Request");
      const defaultParams = {
        negative_prompt: "blurry, low quality, distorted",
        num_inference_steps: 50,
        guidance_scale: 7.5,
      };
      const params = { ...defaultParams, ...options };
      const response = await this.hf.textToImage({
        inputs: inputText,
        model: config.IMAGE_MODEL,
        parameters: params,
      });
      console.timeEnd("API Request");

      if (response instanceof Blob) {
        console.time("Buffer Conversion");
        const buffer = Buffer.from(await response.arrayBuffer());
        console.timeEnd("Buffer Conversion");

        return this.processImage(buffer, options);
      } else {
        throw new Error("No valid image data in the response");
      }
    } catch (error) {
      console.error("Error generating text to image:", error);
      return null;
    }
  }
  async generateTextToImage2(inputText, options = {}) {
    try {
      console.time("API Request");
      const defaultParams = {
        negative_prompt: "blurry, low quality, distorted",
        num_inference_steps: 50,
        guidance_scale: 7.5,
      };
      const params = { ...defaultParams, ...options };
      const response = await this.hf.textToImage({
        inputs: inputText,
        model: "stabilityai/stable-diffusion-2",
        parameters: params,
      });
      console.timeEnd("API Request");

      if (response instanceof Blob) {
        console.time("Buffer Conversion");
        const buffer = Buffer.from(await response.arrayBuffer());
        console.timeEnd("Buffer Conversion");

        return this.processImage(buffer, options);
      } else {
        throw new Error("No valid image data in the response");
      }
    } catch (error) {
      console.error("Error generating text to image:", error);
      return null;
    }
  }

  async processImage(buffer, options = {}) {
    try {
      console.time("Image Processing");
      let image = sharp(buffer);
      if (options.resize) {
        image = image.resize(options.resize.width, options.resize.height, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }
      if (options.format) {
        image = image.toFormat(options.format, {
          quality: options.quality || 80,
        });
      }
      if (options.metadata) {
        image.metadata(options.metadata);
      }
      const resultBuffer = await image.toBuffer();
      console.timeEnd("Image Processing");

      return resultBuffer;
    } catch (error) {
      console.error("Error processing image:", error);
      return buffer; // Return original buffer if processing fails
    }
  }

  async generateImageVariation(imageBuffer, options = {}) {
    try {
      const response = await this.hf.imageToImage({
        inputs: imageBuffer,
        model: config.IMAGE_VARIATION_MODEL,
        parameters: options,
      });
      if (response instanceof Blob) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return this.processImage(buffer, options);
      } else {
        throw new Error("No valid image data in the response");
      }
    } catch (error) {
      console.error("Error generating image variation:", error);
      return null;
    }
  }
}
export default new imageModel();
