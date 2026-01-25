import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DeviceType {
  key: string
  name: string
  width: number
  height: number
  type: 'mobile' | 'tablet' | 'desktop'
}

export const DEVICE_PRESETS: DeviceType[] = [
  { key: 'desktop-hd', name: 'Desktop 1920', width: 1920, height: 1080, type: 'desktop' },
  { key: 'macbook-air', name: 'Laptop 1366', width: 1366, height: 768, type: 'desktop' },
  { key: 'ipad-pro', name: 'Tablet 1024', width: 1024, height: 768, type: 'tablet' },
  { key: 'iphone-14-pro', name: 'Mobile 393', width: 393, height: 852, type: 'mobile' },
]

export const useSizeStore = defineStore('size', () => {
  // Default to 1920x1080 (Desktop)
  const width = ref(1920)
  const height = ref(1080)
  const currentPresetKey = ref<string>('desktop-hd')

  const canvasConfig = ref({
    backgroundColor: '#F2F4F7', // Infinite canvas bg
    stageColor: '#FFFFFF', // Container bg
    gridColor: 'rgba(0,0,0,0.08)',
  })

  function setSize(w: number, h: number) {
    width.value = w
    height.value = h
    // Reset preset if custom size doesn't match
    const match = DEVICE_PRESETS.find((d) => d.width === w && d.height === h)
    currentPresetKey.value = match ? match.key : ''
  }

  function setPreset(key: string) {
    const device = DEVICE_PRESETS.find((d) => d.key === key)
    if (device) {
      width.value = device.width
      height.value = device.height
      currentPresetKey.value = key
    }
  }

  return {
    width,
    height,
    currentPresetKey,
    canvasConfig,
    setSize,
    setPreset,
  }
})
