A prototype chat application made to be a playground for trying out different kinds of tech in a more App like environment with real-time communications.

You can checkout the live version [here](https://chatapp.pezhmanghavami.com/)

To run locally:

> 1 - `cd ./client && npm i`
>
> 2 - While in client direcotry add the following variables to your .env file:
>
> > For [socket.io client](https://socket.io/docs/v4/client-initialization/) `VITE_SOCKET_URL="http://localhost:5000"`
>
> 3 - `cd ../server && npm i`
>
> 4 - While in server directory setup your database as instructed by [prisma docs](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-typescript-postgres)
>
> 5 - While in server directory add the following variables to your .env file:
>
> > For [iron-session](https://github.com/vvo/iron-session) `SECRET_COOKIE_PASSWORD="complex_password_at_least_32_characters_long"`
> >
> > For [socket.io cors](https://socket.io/docs/v4/handling-cors/) `ORIGIN="http://localhost:5173"`
>
> 6 - While in server directory start the project by running `npm run dev`

The UI is heavily inspired by [Telegram](https://telegram.org/)
