import UserCard, {
  IUser,
} from "../user-card/user-card.component";

interface IUserCardsContainer {
  users: null | IUser[];
}

const UserCardsContainer = ({
  users,
}: IUserCardsContainer) => {
  if (!users || users?.length === 0) {
    return (
      <div className="flex justify-center items-center text-center text-xl p-12 sm:p-2 h-full select-none">
        <p>There are no results for your search</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden">
      {users.map((user) => (
        <div
          key={user.id}
          className="hover:bg-neutral-700 hover:cursor-pointer py-3"
        >
          <UserCard user={user} />
        </div>
      ))}
    </div>
  );
};

export default UserCardsContainer;
