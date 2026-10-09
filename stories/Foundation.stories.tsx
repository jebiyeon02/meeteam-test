import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import HomePage from '@/app/(with-nav)/page';
import UiShowcase from '@/components/features/home/UiShowcase';

const meta = {
  title: '3주차/화면 구조',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  name: '홈과 공통 레이아웃',
  render: () => <HomePage />,
};

export const SharedUi: Story = {
  name: '공통 UI 쇼케이스',
  render: () => <UiShowcase />,
};
