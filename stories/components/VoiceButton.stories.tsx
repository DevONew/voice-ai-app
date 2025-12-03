import type { Meta, StoryObj } from '@storybook/react'
import VoiceButton from '@/app/components/VoiceButton'

const meta = {
  title: 'Components/VoiceButton',
  component: VoiceButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VoiceButton>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  args: {
    isAnimating: false,
    isListening: false,
    scale: 0.8,
    size: 200,
    onClick: () => console.log('Clicked'),
  },
}

export const Listening: Story = {
  args: {
    isAnimating: true,
    isListening: true,
    scale: 1.0,
    size: 200,
    onClick: () => console.log('Clicked'),
  },
}

export const ListeningLoudSound: Story = {
  args: {
    isAnimating: true,
    isListening: true,
    scale: 1.08,
    size: 200,
    onClick: () => console.log('Clicked'),
  },
  name: 'Listening with Loud Sound',
}

export const SmallSize: Story = {
  args: {
    isAnimating: false,
    isListening: false,
    scale: 0.8,
    size: 120,
    onClick: () => console.log('Clicked'),
  },
}

export const LargeSize: Story = {
  args: {
    isAnimating: true,
    isListening: true,
    scale: 1.05,
    size: 300,
    onClick: () => console.log('Clicked'),
  },
}
