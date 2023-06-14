A prototype chat application made to be a playground for trying out different kinds of tech in a more App like environment with real-time communications using socket.io and video call functionality using simple-peer as its WebRTC implementation.

You can checkout the live version [here](https://chatapp.pezhmanghavami.com/)

## Get Started

```
┌── /.github
|   └── /workflows               # Github Actions workflows
|
├── /client                      # Frontend files (React)
|   └── /src
│       ├── /components          # Shared React components
│       ├── /context             # Global React context
│       ├── /hooks               # Reusable custom hooks
│       ├── /pages               # Components that render as their own page
│       └── /utils               # Utility modules
|
├── /server                      # Backend files (Express.js, Socket.io and Prisma)
│   ├── /controllers             # Route controllers
│   ├── /middlewares             # Express middlewares
│   ├── /prisma                  # Prisma schema and database associated files
│   ├── /routes                  # Express routes definitions
|   └── /utils                   # Utility modules
```

## Stack

This project uses the following libraries and services:

- Frontend - [React](https://react.dev/)
- Frontend router - [React Router](https://reactrouter.com/en/main)
- Frontend build tool - [Vite](https://vitejs.dev/)
- Styling - [Tailwind CSS](https://tailwindcss.com/)
- Async state manager - [SWR](https://swr.vercel.app/)
- WebRTC - [simple-peer](https://github.com/feross/simple-peer)
- API - [Express](https://expressjs.com/) + [Socket.IO](https://socket.io/)
- Session utility - [iron-session](https://github.com/vvo/iron-session)
- Database - [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io)
- TURN server - [Metered](https://www.metered.ca/)

## To run locally:

> 1 - `cd ./client && npm i`
>
> 2 - While in the client direcotry add the following variables to your .env file:
>
> > For [socket.io client](https://socket.io/docs/v4/client-initialization/) `VITE_SOCKET_URL="http://localhost:5000"`
>
> 3 - `cd ../server && npm i`
>
> 4 - While in the server directory setup your database as instructed by [prisma docs](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-typescript-postgres)
>
> 5 - While in the server directory add the following variables to your .env file:
>
> > For [iron-session](https://github.com/vvo/iron-session) `SECRET_COOKIE_PASSWORD="complex_password_at_least_32_characters_long"`
> >
> > For [socket.io cors](https://socket.io/docs/v4/handling-cors/) `ORIGIN="http://localhost:5173"`
> > For [Metered TURN server](https://www.metered.ca/docs/turn-rest-api/get-credential) `METERED_API="Your metered API URL plus its API key as instructed by Metered.ca"`
>
> 6 - While in the server directory start the project by running `npm run dev`

The UI is heavily inspired by [Telegram](https://telegram.org/)
