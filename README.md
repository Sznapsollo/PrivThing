# PrivMatter

## About

Tool for managing notes with notes/scripts/passwords and other data. 

By default PrivMatter uses local browser storage to store notes.

You can also save notes as files on your drive and also open notes from files from your drive.

Optionally it can follow files from different folders using small local server.

This repository does not contain server for following additional folders - more info below.

### How it looks - DEMO Time!

- under **<a href="https://cultrides.com/test/Github/PrivMatter/" target="_blank">UI Demo address</a>** you can have a peek at user interface of PrivMatter. It is deployed on shared host so functionalities regarding saving updates to demo existing notes will return error as it is disabled.

But you can add / change / delete your own new notes in local storage mode. Since it is local storage these will be only visible to you.

There are also examples of encrypted files. Password to these files is in their name (last part).

### What it does

- you can add / update / encrypt / remove notes

- PrivMatter utilizes CodeMirror for note so it nicely displays code and line numbers + has some other CodeMirror features

- you can pick local file using Choose file field. It can also be encrypted file then you will be able to decrypt it with password

- create new file (+ button on top right) and then save it as local file (Save As option for normal save and Save As encrypted to save with password)

### Passwords

PrivMatter has capabilities to encrypt / decrypt notes containg security data like passwords, private data etc.

Password is not saved or send anywhere. There is no reminder for it. You forget it then you have a problem ;-)

Notes can be encrypted with different passwords. 

You have three options in settings of handling passwords.
 - password can be just one time thing so you have to type it each time to open encrypted document
 - it can be valid for some time so you will be able to open encrypted notes for some time after entering password untill password is invalidated
 - it can never forget password for given note (untill you refresh page of course)

#### Optional Server

Optionally you can provide server and configure it to serve PrivMatter as web and provide the following apis so PrivMatter could also handle files from different locations (it all depends what server will provide)

Server is expected to enable APIs 
- getListOfFiles - get list of files (the idea is that server can get files from different folders)
- retrieveFileFromPath - get file content of specific path
- updateFileFromPath - update file from path with specific data

I will upload small example server in separate git. I use vertx based server which can be easily run with java and configured as service.

#### PrivMatter features which make it nice to use it for notes

- tabs
  - reordable
  - remember scroll for each note
  - remembered
- draggable vertical resizer between items list and note - it position is remembered
- search of notes titles
- different folders (by default)
- hotkeys
  - ctr + s
  - ctr + f triggers CodeMirror search instead of web search