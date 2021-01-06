/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use backend file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {env, KernelConfig, KernelFunc} from '@tensorflow/tfjs-core';
import {FromPixelsAttrs, FromPixelsInputs} from '@tensorflow/tfjs-core';

import {WebGPUBackend} from '../backend_webgpu';
import {FromPixelsAsync} from '../ops/from_pixels_async';

import {fromPixels} from './FromPixels';
import {fromPixelsImageBitmap} from './FromPixelsImageBitmap';

// Not many diffs with fromPixel, keep it here
export const fromPixelsAsyncConfig: KernelConfig = {
  kernelName: FromPixelsAsync,
  backendName: 'webgpu',
  kernelFunc: fromPixelsAsync as {} as KernelFunc,
};

async function fromPixelsAsync(args: {
  inputs: FromPixelsInputs,
  backend: WebGPUBackend,
  attrs: FromPixelsAttrs
}) {
  const {inputs, backend, attrs} = args;
  const {pixels} = inputs;

  if (pixels == null) {
    throw new Error('pixels passed to fromPixelsAsync can not be null');
  }

  if (env().getBool('IS_BROWSER')) {
    // TODO: pixels.data instance of Uint8Array is not ImageBitmapSource,
    // This type should be handled in another shader.
    if (!(pixels instanceof HTMLVideoElement) &&
        !(pixels instanceof HTMLImageElement) &&
        !(pixels instanceof HTMLCanvasElement) &&
        !(pixels instanceof ImageData)) {
      throw new Error(
          'pixels passed to fromPixelsAsync must be either an ' +
          `HTMLVideoElement, HTMLImageElement, HTMLCanvasElement, ImageData` +
          `but was ${(pixels as {}).constructor.name}`);
    }
  }

  const imageBitmap =
      // tslint:disable-next-line:no-any
      await (createImageBitmap as any)
      // tslint:disable-next-line:no-any
      (pixels as any, {premultiplyAlpha: 'none'});

  if (imageBitmap.width !== pixels.width ||
      imageBitmap.height !== pixels.height) {
    return fromPixels({inputs, backend, attrs});
  }

  return fromPixelsImageBitmap({imageBitmap, backend, attrs});
}
