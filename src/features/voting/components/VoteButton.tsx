import React from 'react';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { StickerButton } from '@/src/components/ui/StickerButton';

import { useVoting } from '../hooks/useVoting';

interface VoteButtonProps {
  submissionId: string;
  challengeId: string;
  /**
   * Kartın sahibi giriş yapmış kullanıcının kendisiyse `true`. Buton
   * dokunulabilir kalır ama oy vermek yerine nedenini açıklar. Asıl
   * engelleme sunucuda (Firestore kuralları) zaten yapılır; bu sadece
   * kullanıcıyı gereksiz bir hataya sürüklememek içindir.
   */
  isOwnSubmission?: boolean;
}

export const VoteButton = ({
  submissionId,
  challengeId,
  isOwnSubmission,
}: VoteButtonProps) => {
  const { hasVoted, loading, voting, vote } = useVoting(
    submissionId,
    challengeId,
  );

  if (isOwnSubmission) {
    return (
      <StickerButton
        size="sm"
        fullWidth
        variant="white"
        icon="account"
        label="Senin çizimin"
        accessibilityLabel="Kendi çiziminize oy veremezsiniz"
        onPress={() => AppAlert.alert('Kendi çizimine oy veremezsin.')}
      />
    );
  }

  return (
    <StickerButton
      size="sm"
      fullWidth
      variant={hasVoted ? 'pink' : 'white'}
      icon={hasVoted ? 'heart' : 'heart-outline'}
      label={hasVoted ? 'Oy verildi' : 'Oy ver'}
      accessibilityLabel={hasVoted ? 'Oyu geri al' : 'Oy ver'}
      loading={loading || voting}
      onPress={vote}
    />
  );
};
