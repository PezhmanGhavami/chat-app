const ProfilePicture = ({
  user,
}: {
  user: {
    bgColor: string;
    displayName: string;
    profilePicture: string | null;
  };
}) => {
  return (
    <div
      className={`bg-gradient-to-b ${user.bgColor} flex h-full w-full select-none items-center justify-center overflow-hidden rounded-full text-white shadow`}
    >
      {user.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.displayName[0].toLocaleUpperCase()}
        />
      ) : (
        <div>{user.displayName[0].toLocaleUpperCase()}</div>
      )}
    </div>
  );
};

export default ProfilePicture;
