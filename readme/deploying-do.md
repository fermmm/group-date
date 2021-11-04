## Tutorial to upload to a server like Digital Ocean

1. Follow the instructions on [Installing the project on your computer or server](###installing-the-project-on-your-computer-or-server)
2. In the .env file change the port to 80 (also in the application client .env and in the dasboard/.env)
3. You need to be root to run a process in the port 80, if you are not then run these 2 commands:

   `sudo apt-get install libcap2-bin`

   `` sudo setcap 'cap_net_bind_service=+ep' `which node`  ``

   You may need to run them again in the future if you update node.

4. Set the **SERVER_URL** variable in the .env file with the public url of your server, read the comment on top of the variable to know the correct format of the url you have to set there.