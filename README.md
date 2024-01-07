# PrivThing

## About

Tool for managing notes with notes/scripts/passwords and other data. 

By default PrivThing uses local browser storage to store notes.

You can also save notes as files on your drive and also open notes from files from your drive.

Optionally it can follow files from different folders using small local server.

Its original intent (and how i use it personally) is to host some kind of server which serves privthing locally and also opens up APIs that allow to read content of some local folders files on this computer (of course such server should not allow this access from outside your computer).
This way i have my local privthing on the computer and it lists me files not only from localStorage but also from selected folders on my computer.

This repository does not contain server for following additional folders - more info below.

### How it looks - DEMO Time!

- go to  **<a href="https://privthing.com/" target="_blank">privthing.com/</a>** - open for anyone who wants to have some notes organizer online

### What it does

- you can add / update / encrypt / remove notes

- PrivThing utilizes CodeMirror for note so it nicely displays code and line numbers + has some other CodeMirror features

- you can pick local file using Choose file field. It can also be encrypted file then you will be able to decrypt it with password

- create new note in browser localStorage or save them sa files. 

- notes can be encrypted

### Passwords

PrivThing has capabilities to encrypt / decrypt notes containg security data like passwords, private data etc.

Password is not saved or send anywhere. There is no reminder for it. You forget it then you have a problem ;-)

Notes can be encrypted with different passwords. 

You have three options in settings of handling passwords.
 - password can be just one time thing so you have to type it each time to open encrypted document
 - it can be valid for some time so you will be able to open encrypted notes for some time after entering password untill password is invalidated
 - it can never forget password for given note (untill you refresh page of course)

#### Optional Server

Optionally you can provide server and configure it to serve PrivThing as web and provide the following apis so PrivThing could also handle files from different locations (it all depends what server will provide)

Server is expected to enable APIs 
- getListOfFiles - get list of files (the idea is that server can get files from different folders)
- retrieveFileFromPath - get file content of specific path
- updateFileFromPath - update file from path with specific data

I will upload small example server in separate git. I use vertx based server which can be easily run with java and configured as service.

#### PrivThing features which make it nice to use it for notes

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