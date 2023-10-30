# PrivMatter

## About

Tool for managing files with notes/scripts/passwords and other data. Can follow files from different folders using small local server.

Also has capabilities to encrypt / decrypt files containg security data like passwords, private data etc.
Password is used for local encryption/decryption of files that you choose to encrypt. 
It is not saved or send anywhere. You forget it then you have a problem ;-)
Chosen files can be of course encrypted with different passwords.

Something like bitwarden & evernote but smaller, easier to use and completely local - no sending data anywhere outside your system.

This repository includes only front end with limited functionality - more info below

### How it looks - DEMO Time!

- under **<a href="https://cultrides.com/test/Github/PrivMatter/" target="_blank">UI Demo address</a>** you can have a peek at user interface of PrivMatter. It is deployed on shared host so functionalities regarding saving updates to existing notes will return error as it is disabled.

### What it does

#### Without server

- you can pick local file using Choose file field. It can also be encrypted file then you will be able to decrypt it with password
- create new file (+ button on top right) and then save it as local file (Save As option for normal save and Save As encrypted to save with password)
- if you open encrypted file system will start count down to auto forget access to file - can be changed in settings (top right button) with options never forget, immediately forget, forget after specific amount of time

#### With server

- same as without server + functionalities below
- list of file is present as in Demo
- quick search through list of files
- sorting of file list
- files can be updated

Server is expected to enable APIs 
- getListOfFiles - get list of files (the idea is that server can get files from different folders)
- retrieveFileFromPath - get file content of specific path
- updateFileFromPath - update file from path with specific data

I will upload small server in separate git. I use vertx based server which can be easily run with java and configured as service.