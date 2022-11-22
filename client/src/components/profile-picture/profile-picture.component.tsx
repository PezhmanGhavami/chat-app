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
      className={`bg-gradient-to-b ${user.bgColor} w-full h-full rounded-full overflow-hidden text-white flex justify-center items-center select-none shadow`}
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
