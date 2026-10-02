import { useEffect, useMemo, useState } from 'react';

import { subscribeToBlockedUsers } from '../services/moderationService';

/** Engellediğin kullanıcıların id'lerini canlı izler. */
export const useBlockedUsers = (): { blockedIds: string[]; blockedSet: Set<string> } => {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  useEffect(
    () =>
      subscribeToBlockedUsers(setBlockedIds, (error) =>
        console.error('Engel listesi okunamadı:', error),
      ),
    [],
  );

  const blockedSet = useMemo(() => new Set(blockedIds), [blockedIds]);

  return { blockedIds, blockedSet };
};
