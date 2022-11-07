import ProfilePicture from "../profile-picture/profile-picture.component";

export interface IUser {
  id: string;
  displayName: string;
  profilePicure: string | null;
}

interface IUserCard {
  user: IUser;
}

const UserCard = ({ user }: IUserCard) => {
  return (
    <div className="flex items-center px-3 select-none">
      {/* Profile picture */}
      <div className="flex-none w-8 h-8">
        <ProfilePicture user={user} />
      </div>
      {/* Display name */}
      <div className="pl-2">
        <h3>{user.displayName}</h3>
      </div>
    </div>
  );
};

export default UserCard;
