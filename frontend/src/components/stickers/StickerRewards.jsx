import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StickerUnlockModal from './StickerUnlockModal.jsx';

/** Drop into any result screen: opens the unlock reveal when the server reports new stickers (and only then). */
export default function StickerRewards({ stickers }) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  if (dismissed || !Array.isArray(stickers) || stickers.length === 0) return null;
  return <StickerUnlockModal stickers={stickers} onClose={() => setDismissed(true)} onViewAlbum={() => navigate('/dashboard')} />;
}
