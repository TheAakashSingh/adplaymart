import MobileLayout from '@/components/MobileLayout';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileLayout>{children}</MobileLayout>;
}
