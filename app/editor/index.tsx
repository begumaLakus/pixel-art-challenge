import { useLocalSearchParams } from 'expo-router';

import { PixelEditorScreen } from '@/src/features/editor/screens/PixelEditorScreen';

export default function EditorRoute() {
  const { challengeId } = useLocalSearchParams<{
    challengeId: string;
  }>();

  return <PixelEditorScreen challengeId={challengeId} />;
}