"use client";

const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6',
  '#E59866', '#AED6F1', '#D7BDE2', '#A3E4D7', '#FAD7A0',
];

function hashEmail(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(email: string): string {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase()).filter(Boolean).slice(0, 2).join('');
}

export function UserAvatar({ email, onClick }: { email: string; onClick?: () => void }) {
  const initials = getInitials(email);
  const bgColor = avatarColors[hashEmail(email) % avatarColors.length];

  return (
    <div
      onClick={onClick}
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        userSelect: 'none',
        lineHeight: 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s ease',
      }}
      title={email}
      onMouseOver={(e) => { if (onClick) e.currentTarget.style.opacity = '0.8' }}
      onMouseOut={(e) => { if (onClick) e.currentTarget.style.opacity = '1' }}
    >
      {initials}
    </div>
  );
}
