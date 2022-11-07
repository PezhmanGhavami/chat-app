import { IUser } from "../user-card/user-card.component";

const ProfilePicture = ({
  user,
}: {
  user: {
    displayName: string;
    profilePicure: string | null;
  };
}) => {
  return (
    <div className="bg-red-500 w-full h-full rounded-full overflow-hidden text-2xl flex justify-center items-center">
      {user.profilePicure ? (
        <img
          src={user.profilePicure}
          alt={`${user.displayName}'s profile picture`}
        />
      ) : (
        <div>{user.displayName[0].toLocaleUpperCase()}</div>
      )}
    </div>
  );
};

export default ProfilePicture;
