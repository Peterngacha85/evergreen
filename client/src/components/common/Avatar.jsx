// Fallback profile photo as base64 (used when no photo is uploaded)
const FALLBACK_PHOTO = '/profile-fallback.png';

const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const sizeClass = `avatar avatar-${size} ${className}`;

  const handleError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_PHOTO;
  };

  return (
    <img src={src && src.trim() !== '' ? src : FALLBACK_PHOTO} alt={name || 'Avatar'} className={sizeClass} onError={handleError} />
  );
};

export default Avatar;
