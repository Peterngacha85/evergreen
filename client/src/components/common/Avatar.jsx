// Fallback profile photo as base64 (used when no photo is uploaded)
const FALLBACK_PHOTO = '/profile-fallback.png';

const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const sizeClass = `avatar avatar-${size} ${className}`;

  const handleError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_PHOTO;
  };

  if (src && src.trim() !== '') {
    return <img src={src} alt={name} className={sizeClass} onError={handleError} />;
  }

  // Initials fallback
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = ['#2d7a3c', '#1a5c2a', '#8cc63f', '#e63946', '#76a832'];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{
        background: colors[colorIndex],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: size === 'sm' ? '0.65rem' : size === 'md' ? '0.9rem' : size === 'lg' ? '1.3rem' : '1.8rem',
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
};

export default Avatar;
