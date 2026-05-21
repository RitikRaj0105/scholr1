interface AvatarUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  avatarUrl?: string | null;
}

interface Props {
  user: AvatarUser | null | undefined;
  size?: number; // pixels
  className?: string;
  ring?: boolean;
}

export const Avatar = ({ user, size = 40, className = '', ring = false }: Props) => {
  const initials = ((user?.firstName?.[0] || user?.email?.[0] || '?') + (user?.lastName?.[0] || ''))
    .toUpperCase()
    .slice(0, 2);

  const fontSize = Math.max(10, Math.round(size * 0.36));

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.firstName || user.email || 'User'}
        className={`rounded-full object-cover flex-shrink-0 ${
          ring ? 'ring-2 ring-violet-500/30' : ''
        } ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          // Hide broken image and let initials fallback render via parent re-render path
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0 ${
        ring ? 'ring-2 ring-violet-500/30' : ''
      } ${className}`}
      style={{ width: size, height: size, fontSize }}
    >
      {initials}
    </div>
  );
};
