import { useLocalSearchParams } from 'expo-router';

import { SubmissionsScreen } from '@/src/features/submission/screens/SubmissionsScreen';

export default function SubmissionsRoute() {
  const { challengeId } = useLocalSearchParams<{
    challengeId: string;
  }>();

  return <SubmissionsScreen challengeId={challengeId} />;
}