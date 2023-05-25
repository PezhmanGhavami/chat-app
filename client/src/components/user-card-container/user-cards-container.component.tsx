import UserCard, { IUser } from "../user-card/user-card.component";

interface IUserCardsContainer {
  users: null | IUser[];
}

const UserCardsContainer = ({ users }: IUserCardsContainer) => {
  if (!users || users?.length === 0) {
    return (
      <div className="flex h-full select-none items-center justify-center p-12 text-center text-xl sm:p-2">
        <p>There are no results for your search</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex h-14 items-center hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700"
        >
          <UserCard user={user} />
        </div>
      ))}
    </div>
  );
};

export default UserCardsContainer;
