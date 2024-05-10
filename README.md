# PrivThing

## About

Tool for managing notes with notes/scripts/passwords and other data. 

By default PrivThing uses local browser storage to store notes.

You can also save notes as files on your drive and also open notes from files from your drive.

Optionally it can follow files from different folders using small local server.

Its original intent (and how i use it personally) is to host some kind of server which serves privthing locally and also opens up APIs that allow to read content of some local folders files on this computer (of course such server should not allow this access from outside your computer).
This way i have my local privthing on the computer and it lists me files not only from localStorage but also from selected folders on my computer.

It should act as central and convenient place to store notes. Quick to access and quick to copy fragments of notes (code fragments, passwords) by clicking on line numbers

This repository does not contain server for following additional folders - it is in separate repository - more info below.

### How it looks - DEMO Time!

- go to  **<a href="https://privthing.com/" target="_blank">privthing.com/</a>** - open for anyone who wants to have some notes organizer online

### What it does

- you can add / update / encrypt / remove notes

- PrivThing utilizes CodeMirror for note so it nicely displays code and line numbers + has some other CodeMirror features

- you can pick local file using Choose file field. It can also be encrypted file then you will be able to decrypt it with password

- create new note in browser localStorage or save them sa files. 

- notes can be encrypted (set password when using Save as option)

- passwords or some texts can be hidden by using **hide[[your text]]** or by marking text and choosing in right click menu Hide option

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

I share simple node server in my repositor - https://github.com/Sznapsollo/PrivThingServer - that servers PrivThing

#### PrivThing features which make it nice to use it for notes

- multi note spaces (note spaces next to each other)
- ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/f5735a8a-bd86-441a-9be6-c0af59915256)
- row numbers - clicking on row number puts whole row into clipboard
- you can hide/mask text in your notes (for example of passwords) by wrapping them with **hide[[your text]]** or by selecting text and choosing in right click menu 'Hide option'. Example of hiding below.
- clicking on row number 2 will copy masked text to clipboard
- clicking on masked text will copy it to clipboard
- right clicking on masked text will give options to unveil it for 5 seconds, unhide it permanently or do some additional actions
- ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/d1e1c80d-77bc-4fdc-930a-7c31b909800a)
- when right clicking on selected text (within one line) context menu will appear allowing to hide this text
- ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/a5bc326c-a0e6-46ff-831c-b18f43fefb8e)
- ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/5e7c2f3a-0b5f-48ef-880e-9101d599d685)
- tabs
  - reordable
  - remember scroll for each note
  - remembered
  - ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/d5170b5f-d947-41ef-84c1-925ec71dd8de)
- favourites
  - reordable
  - ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/99dee3bd-2c37-4ab1-90ec-a57e7838bda4)
  - ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/3a90d17d-7e01-4680-818e-afd90f0ad6d4)
- possibility to password secure individual notes
- ![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/906782c4-404b-4332-a36d-7d17d8744440)
- hotkeys
  - ctr + s
  - ctr + f triggers CodeMirror search instead of web search
- draggable vertical resizer between items list and note - its position is remembered
- search of notes titles & notes contents (this is optional and has to be checked in search field in search bar)
- different folders (by default)
