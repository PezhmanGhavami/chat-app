import UserCard, {
  IUser,
} from "../user-card/user-card.component";

interface IUserCardsContainer {
  users: null | IUser[];
}

const UserCardsContainer = ({
  users,
}: IUserCardsContainer) => {
  if (!users) {
    return (
      <div className="flex justify-center items-center text-center text-xl p-12 sm:p-2 h-full select-none">
        <p>There are no results for your search</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-scroll overflow-x-hidden">
      {users.map((user) => (
        <UserCard user={user} />
      ))}
    </div>
  );
};

export default UserCardsContainer;
