import { computeAutoToneRecipe } from '../src/develop/autoTone';
import { bakePreviewDataUri } from '../src/develop/bakePreview';
import { recipeToColorMatrix } from '../src/develop/colorMatrix';
import { createTriXWarmRecipe } from '../src/develop/presets/triXWarm';

/** Synthetic gradient image for Auto Tone */
function makePixels(width = 64, height = 64) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = Math.round((x / (width - 1)) * 255);
      data[i] = v;
      data[i + 1] = Math.round(v * 0.9);
      data[i + 2] = Math.round(v * 0.75);
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

const pixels = makePixels();
const auto = computeAutoToneRecipe(pixels, 1);
const trix = createTriXWarmRecipe();
const matrix = recipeToColorMatrix(trix);
const uri = bakePreviewDataUri(pixels, trix, { maxEdge: 64 });

console.log('Auto Tone exposure/contrast:', auto.tone.exposure, auto.tone.contrast);
console.log('Tri-X Warm presetId:', trix.presetId, 'bw:', trix.bw.enabled);
console.log('Matrix[0..4]:', matrix.slice(0, 5));
console.log('Baked data URI prefix:', uri.slice(0, 32));
console.log('smoke-develop OK');
