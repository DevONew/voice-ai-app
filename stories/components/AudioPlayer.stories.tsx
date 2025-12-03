import type { Meta, StoryObj } from '@storybook/react'
import AudioPlayer from '@/app/components/AudioPlayer'

const meta = {
  title: 'Components/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

// Create a simple test audio blob (silence)
const createSilentAudioBlob = (): Blob => {
  // Create 1 second of silence at 48000 Hz
  const sampleRate = 48000
  const duration = 1
  const audioContext = new (typeof window !== 'undefined' ? (window as any).AudioContext || (window as any).webkitAudioContext : null)()
  const audioBuffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate)
  const channelData = audioBuffer.getChannelData(0)

  // Fill with silence (zeros)
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = 0
  }

  // Convert to WAV blob
  const wav = encodeWAV(audioBuffer)
  return new Blob([wav], { type: 'audio/wav' })
}

// Simple WAV encoder
const encodeWAV = (audioBuffer: AudioBuffer): ArrayBuffer => {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const channelData: Float32Array[] = []
  for (let i = 0; i < numChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i))
  }

  const samplesLength = audioBuffer.length * numChannels * bytesPerSample
  const arrayBuffer = new ArrayBuffer(44 + samplesLength)
  const view = new DataView(arrayBuffer)

  // "RIFF" chunk descriptor
  let offset = 0
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset, s.charCodeAt(i))
      offset++
    }
  }

  writeString('RIFF')
  view.setUint32(offset, 36 + samplesLength, true)
  offset += 4
  writeString('WAVE')

  // "fmt " sub-chunk
  writeString('fmt ')
  view.setUint32(offset, 16, true) // chunkSize
  offset += 4
  view.setUint16(offset, format, true)
  offset += 2
  view.setUint16(offset, numChannels, true)
  offset += 2
  view.setUint32(offset, sampleRate, true)
  offset += 4
  view.setUint32(offset, sampleRate * blockAlign, true)
  offset += 4
  view.setUint16(offset, blockAlign, true)
  offset += 2
  view.setUint16(offset, bitDepth, true)
  offset += 2

  // "data" sub-chunk
  writeString('data')
  view.setUint32(offset, samplesLength, true)
  offset += 4

  // Write samples
  const volume = 0.8
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      view.setInt16(offset, channelData[ch][i] * (0x7fff * volume), true)
      offset += 2
    }
  }

  return arrayBuffer
}

export const NoAudio: Story = {
  args: {
    audioBlob: null,
    isPlaying: false,
    onPlayEnd: () => console.log('Play ended'),
  },
}

export const ReadyToPlay: Story = {
  args: {
    audioBlob: createSilentAudioBlob(),
    isPlaying: false,
    onPlayEnd: () => console.log('Play ended'),
  },
}

export const Playing: Story = {
  args: {
    audioBlob: createSilentAudioBlob(),
    isPlaying: true,
    onPlayEnd: () => console.log('Play ended'),
  },
}

export const WithAutoPlay: Story = {
  args: {
    audioBlob: createSilentAudioBlob(),
    isPlaying: true,
    onPlayEnd: () => console.log('Play ended'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player with isPlaying=true will automatically start playback when the component mounts',
      },
    },
  },
}
