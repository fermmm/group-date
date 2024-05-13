## Running the project and the different modes it has

> There are many commands to start the server, use the one that you need depending if you need to make code changes or you are running in production with a specific infrastructure.

### Development mode

If you want to make code changes or run it in local just for testing if it works, run the development mode:
This runs the server with error reporting and automatic restart when the code changes. Also database information is removed when closing (when pressing Ctrl + C), this is recommended to force user registration to be well debugged.

```
npm run dev
```

The same than `npm run dev` but in this case the database information is persistent (all backup logic enabled)

```
npm run dev-persistent
```

### Running tests

```
npm run test
```

### Formatting the code with Prettier

There is a configuration that prevents committing to git if the code is not formatted with prettier.

```
npm run format
```

### Production mode: All in one

This runs everything, the database and the application logic. The database has a schedule of backups every day, week and month, also makes a backup when the applications exits and when application starts restores the backup if any. The database is memory only, so making backups in files is the way to not lose the information.
This is what you may want to run in servers like Digital Ocean.

```
npm start
```

Stops the server in production

```
npm run stop
```

### Production mode: Logic only, no database

This is useful when you want to run the database in another server or you have a managed database service like AWS Neptune so you don't need to run the database.

```
npm run no-database
```

### Production mode: Database only, no logic

This is useful if you want to run the database in one server and the application logic in another one. You may want to run this commands if you are not using a managed database in a service like Digital Ocean and you want to use multiple instances. This command starts the database and a node.js application that schedules database backups every day, week, month and at exit (same backups than npm start).

```
npm run database-only
```

### About PM2

The production commands works with PM2, which is a wrapper of node that converts the process into a deamon process (a process that will not close when closing terminal). You can manage and view information about processes with the `pm2` command, see thier [documentation](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/).
