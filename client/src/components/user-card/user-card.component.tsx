const user: {
  profilePicure: string | null;
  displayName: string;
} = {
  profilePicure: null,
  displayName: "Toasty test",
};

const UserCard = () => {
  return (
    <div className="flex items-center px-3 select-none">
      {/* Profile picture */}
      <div className="flex-none bg-red-500 w-8 h-8 rounded-full overflow-hidden text-2xl flex justify-center items-center">
        {user?.profilePicure ? (
          <img
            src={user.profilePicure}
            alt={`${user.displayName}'s profile picture`}
          />
        ) : (
          <div>
            {user.displayName[0].toLocaleUpperCase()}
          </div>
        )}
      </div>
      {/* Display name */}
      <div className="pl-2">
        <h3>{user.displayName}</h3>
      </div>
    </div>
  );
};

export default UserCard;
