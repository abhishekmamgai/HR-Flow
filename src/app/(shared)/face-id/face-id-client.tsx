'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import * as faceapi from '@vladmandic/face-api'
import { AttendanceResult } from '@/components/face/AttendanceResult'

const MODEL_URL = '/models'
const SCAN_INTERVAL = 500 // ms
const CAPTURE_DELAY = 1000 // ms

type AttendanceResultData = {
  action: 'CHECK_IN' | 'CHECK_OUT' | 'ALREADY_DONE' | 'NO_MATCH'
  employee?: {
    id: string
    name: string
    employee_code: string
    department: string
  }
  attendance?: {
    check_in: string | null
    check_out: string | null
    total_hours: number | null
    total_hours_formatted: string | null
    status: 'present' | 'late' | 'half_day'
  }
  confidence?: number
}

export function FaceIdContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') || 'attend'
  const employeeId = searchParams.get('employeeId')
  const employeeName = searchParams.get('name')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [status, setStatus] = useState({ text: 'Initializing...', color: 'gray' })
  const [captures, setCaptures] = useState<number[][]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<AttendanceResultData | { success: true } | null>(null)
  const [isStable, setIsStable] = useState(false)
  const stableTimer = useRef<NodeJS.Timeout | null>(null)

  // 1. Load Models
  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ])
        console.log('✅ Face models loaded')
        setIsModelLoaded(true)
      } catch (err) {
        console.error('❌ Model load failed:', err)
        // Fallback to CDN
        const CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
        try {
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(CDN),
            faceapi.nets.faceRecognitionNet.loadFromUri(CDN),
            faceapi.nets.faceLandmark68Net.loadFromUri(CDN)
          ])
          console.log('✅ Face models loaded from CDN')
          setIsModelLoaded(true)
        } catch (cdnErr) {
          console.error('❌ CDN fallback failed:', cdnErr)
          setStatus({ text: 'Failed to load face models', color: 'red' })
        }
      }
    }
    loadModels()
  }, [])

  // 2. Setup Camera
  useEffect(() => {
    if (!isModelLoaded) return

    let stream: MediaStream | null = null
    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('❌ Camera setup failed:', err)
        setStatus({ text: 'Camera access denied', color: 'red' })
      }
    }
    setupCamera()

    return () => {
      stream?.getTracks().forEach(track => track.stop())
    }
  }, [isModelLoaded])

  const drawDetectionBox = useCallback((detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>) => {
    if (!canvasRef.current || !videoRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    const displaySize = { width: video.videoWidth, height: video.videoHeight }
    faceapi.matchDimensions(canvas, displaySize)
    const resizedDetections = faceapi.resizeResults(detection, displaySize)
    const context = canvas.getContext('2d')
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
    }
  }, [])

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext('2d')
    context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }, [])

  const processRegistration = useCallback(async (allCaptures: number[][]) => {
    setIsProcessing(true)
    setStatus({ text: 'Processing...', color: 'purple' })

    // Compute average embedding
    const avgDescriptor = new Array(128).fill(0)
    for (let i = 0; i < 128; i++) {
        avgDescriptor[i] = allCaptures.reduce((sum, cap) => sum + cap[i], 0) / 3
    }

    try {
      const response = await fetch('/api/face/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, descriptor: avgDescriptor })
      })
      if (response.ok) {
        setStatus({ text: 'Face Registered! ✓', color: 'green' })
        setResult({ success: true })
      } else {
        throw new Error('Upload failed')
      }
    } catch (err) {
      console.error('❌ Registration failed:', err)
      setStatus({ text: 'Registration failed. Retry.', color: 'red' })
      setCaptures([])
      setIsProcessing(false)
    }
  }, [employeeId])

  const handleRegisterLogic = useCallback((descriptor: Float32Array) => {
    if (captures.length >= 3) return

    setStatus({ text: 'Face detected ✓', color: 'green' })
    
    if (!isStable) {
      setIsStable(true)
      stableTimer.current = setTimeout(() => {
        const newCaptures = [...captures, Array.from(descriptor)]
        setCaptures(newCaptures)
        setIsStable(false)
        stableTimer.current = null
        
        if (newCaptures.length === 3) {
          processRegistration(newCaptures)
        }
      }, CAPTURE_DELAY)
    }
  }, [captures, isStable, processRegistration])

  const handleAttendLogic = useCallback(async (descriptor: Float32Array) => {
    if (isProcessing) return
    setIsProcessing(true)
    setStatus({ text: 'Scanning face...', color: 'blue' })

    try {
      const response = await fetch('/api/face/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor: Array.from(descriptor) })
      })
      const data = await response.json()
      
      if (data.action === 'NO_MATCH') {
        setStatus({ text: 'Face not recognized. Try again.', color: 'red' })
        setTimeout(() => {
          setIsProcessing(false)
        }, 2000)
      } else {
        setResult(data)
      }
    } catch (err) {
      console.error('❌ Attendance failed:', err)
      setStatus({ text: 'Verification failed', color: 'red' })
      setTimeout(() => setIsProcessing(false), 2000)
    }
  }, [isProcessing])

  // 3. Detection Loop
  useEffect(() => {
    if (!isModelLoaded || isProcessing || result) return

    const interval = setInterval(async () => {
      if (!videoRef.current) return

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current, 
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (detection) {
        drawDetectionBox(detection)
        
        if (mode === 'register') {
          handleRegisterLogic(detection.descriptor)
        } else {
          handleAttendLogic(detection.descriptor)
        }
      } else {
        clearCanvas()
        if (mode === 'register') {
          setStatus({ text: 'Position face in frame...', color: 'gray' })
          setIsStable(false)
          if (stableTimer.current) {
            clearTimeout(stableTimer.current)
            stableTimer.current = null
          }
        }
      }
    }, SCAN_INTERVAL)

    return () => clearInterval(interval)
  }, [isModelLoaded, mode, isProcessing, result, captures, drawDetectionBox, handleRegisterLogic, handleAttendLogic, clearCanvas])

  if (result && mode === 'attend' && 'action' in result) {
    return <AttendanceResult result={result} onDone={() => setResult(null)} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-fraunces)' }}>
            {mode === 'register' ? `Register Face — ${employeeName || 'New'}` : 'Attendance Scanner'}
          </h1>
          <p className="text-slate-500 mt-1">Biometric Verification System</p>
        </div>

        {/* Camera Feed */}
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
          
          {/* Scanning Animation for Attend Mode */}
          {mode === 'attend' && !result && (
            <div className="absolute inset-0 border-4 border-blue-500/30 animate-pulse pointer-events-none" />
          )}

          {/* Loading Overlay */}
          {!isModelLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-medium">Loading AI Models...</p>
            </div>
          )}
        </div>

        {/* Status Area */}
        <div className="p-8 text-center bg-slate-50">
          {mode === 'register' ? (
            <div className="space-y-4">
              <p className={`text-lg font-bold ${
                status.color === 'green' ? 'text-green-600' : 
                status.color === 'blue' ? 'text-blue-600' : 
                status.color === 'purple' ? 'text-purple-600' : 
                status.color === 'red' ? 'text-red-600' : 'text-slate-400'
              }`}>
                {captures.length > 0 && captures.length < 3 ? `Capturing ${captures.length + 1}/3...` : status.text}
              </p>
              
              {/* Progress dots for registration */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      captures.length >= i ? 'bg-green-500 scale-125' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {result && (
                <button
                  onClick={() => router.back()}
                  className="mt-6 px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className={`text-xl font-bold ${
                status.color === 'red' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {status.text}
              </p>
              <p className="text-slate-400 text-sm">Please look directly into the camera</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 text-slate-400 text-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        System Active & Encrypted
      </div>
    </div>
  )
}

