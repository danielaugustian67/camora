import { FaceLandmarker, FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision'

const BASE = import.meta.env.BASE_URL

let fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> | null = null
let segP: Promise<ImageSegmenter | null> | null = null
let faceP: Promise<FaceLandmarker | null> | null = null

async function files() {
  fileset ??= await FilesetResolver.forVisionTasks(`${BASE}mediapipe`)
  return fileset
}

async function withDelegate<T>(make: (d: 'GPU' | 'CPU') => Promise<T>) {
  try { return await make('GPU') } catch { return await make('CPU') }
}

export function getSegmenter() {
  segP ??= files().then(fs => withDelegate(d => ImageSegmenter.createFromOptions(fs, {
    baseOptions: { modelAssetPath: `${BASE}models/selfie_segmenter.tflite`, delegate: d },
    runningMode: 'VIDEO', outputCategoryMask: false, outputConfidenceMasks: true,
  }))).catch(e => { console.error('segmenter', e); return null })
  return segP
}

export function getFaceLandmarker() {
  faceP ??= files().then(fs => withDelegate(d => FaceLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: `${BASE}models/face_landmarker.task`, delegate: d },
    runningMode: 'VIDEO', numFaces: 4,
  }))).catch(e => { console.error('face', e); return null })
  return faceP
}
