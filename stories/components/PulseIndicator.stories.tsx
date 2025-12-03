import type { Meta, StoryObj } from '@storybook/react'
import PulseIndicator from '@/app/components/PulseIndicator'

const meta = {
  title: 'Components/PulseIndicator',
  component: PulseIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    volumeLevel: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
  },
} satisfies Meta<typeof PulseIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Hidden: Story = {
  args: {
    isVisible: false,
    volumeLevel: 0,
  },
}

export const VisibleMinimumVolume: Story = {
  args: {
    isVisible: true,
    volumeLevel: 0,
  },
  name: 'Visible - Minimum Volume',
}

export const LowVolume: Story = {
  args: {
    isVisible: true,
    volumeLevel: 20,
  },
}

export const MediumVolume: Story = {
  args: {
    isVisible: true,
    volumeLevel: 50,
  },
}

export const HighVolume: Story = {
  args: {
    isVisible: true,
    volumeLevel: 80,
  },
}

export const MaximumVolume: Story = {
  args: {
    isVisible: true,
    volumeLevel: 100,
  },
}

export const Interactive: Story = {
  args: {
    isVisible: true,
    volumeLevel: 50,
  },
  parameters: {
    docs: {
      description: {
        story: 'Try adjusting the volumeLevel slider to see the pulse dots change size',
      },
    },
  },
}
