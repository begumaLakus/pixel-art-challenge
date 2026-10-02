import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { getChallengeThemeStyle } from '@/src/features/challenges/constants/challengeThemes';
import type { Submission } from '@/src/features/submission/types/types';

import { captureView } from './captureView';
import { ShareCard } from './ShareCard';
import { buildShareFileName, shareImage } from './shareImage';
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from './shareSizes';

interface ShareArtButtonProps {
  submission: Pick<Submission, 'pixels' | 'resolution'>;
  themeTitle: string;
  /** Tema adı (rengi ve ikonu belirler). */
  theme: string;
  headline: string;
  detail: string;
  compact?: boolean;
}

/** Görünüm çizildikten sonra yakalamak için iki kare bekler. */
const waitForRender = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

/**
 * "Paylaş": çizimi hikaye boyutunda bir kart görseline çevirip paylaşır.
 * Kart yalnızca paylaşım sırasında (ekran dışında) çizilir; listelerde
 * her öğe için gizli bir kart tutulmaz.
 */
export const ShareArtButton = ({
  submission,
  themeTitle,
  theme,
  headline,
  detail,
  compact = false,
}: ShareArtButtonProps) => {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const { accent, sprite } = getChallengeThemeStyle(theme);

  const handleShare = useCallback(async (): Promise<void> => {
    setBusy(true);

    try {
      await waitForRender();

      const uri = await captureView(cardRef);

      await shareImage(uri, buildShareFileName(themeTitle));
    } catch (error) {
      console.error('Paylaşım hazırlanamadı:', error);
      AppAlert.alert('Paylaşılamadı', 'Görsel hazırlanamadı. Birazdan tekrar dene.');
    } finally {
      setBusy(false);
    }
  }, [themeTitle]);

  return (
    <>
      <StickerButton
        size="sm"
        variant="white"
        icon="share-variant"
        label={compact ? undefined : 'Paylaş'}
        accessibilityLabel="Çizimi paylaş"
        loading={busy}
        onPress={handleShare}
      />

      {busy ? (
        <View pointerEvents="none" style={styles.offscreen}>
          <View ref={cardRef} collapsable={false}>
            <ShareCard
              pixels={submission.pixels}
              resolution={submission.resolution}
              themeTitle={themeTitle}
              accent={accent}
              sprite={sprite}
              headline={headline}
              detail={detail}
            />
          </View>
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: 0,
    left: -SHARE_CARD_WIDTH * 2,
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
  },
});
