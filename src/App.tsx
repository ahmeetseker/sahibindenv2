import InfiniteGridDemo from '@/components/ui/infinite-grid-integration';
import { StoreProvider } from '@/lib/store';

export default function App() {
  return (
    <StoreProvider>
      <InfiniteGridDemo />
    </StoreProvider>
  );
}
