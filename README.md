# PrivThing

![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/62dc426d-a544-4c84-88f8-5e5d27cee6fd)

A place to keep notes, scripts, snippets and passwords. Quick to open, quick to copy something
out of, and able to keep the sensitive parts out of sight.

Notes live in your browser by default. You can also open and save files from your drive, and -
if you run the small optional server - work directly on files from chosen folders on your
computer.

Nothing is sent anywhere. There is no account, no cloud, no telemetry.

## Try it

**<a href="https://privthing.com/" target="_blank">privthing.com</a>** - the same app, open to
anyone who wants a notes organizer online. Your notes stay in your own browser.

---

## What it can do

### Keeping notes

- Create, edit and delete notes stored in your browser
- Open a file from your drive with **Choose file**, edit it, and save it back out
- Save any note to your drive as a file
- With the optional server: open, edit and create files inside folders you configured
- Deleted browser notes go to a **30 day trash** you can restore from in Settings - they are
  not destroyed on the spot

### Writing

- The editor is CodeMirror, so you get line numbers, search, bracket matching and the rest
- **Syntax highlighting follows the file name** - `.json`, `.md`, `.sql`, `.sh`, `.yaml`,
  `.xml`, `.html`, `.css`, `.py`, `.groovy` and more. Anything else is treated as JavaScript
- **Markdown preview** side by side with the editor for `.md` notes
- **Wrap rows** on or off, remembered separately for each pane
- **Several note spaces side by side**, each with its own note

![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/f5735a8a-bd86-441a-9be6-c0af59915256)

### Copying things out quickly

- **Click a line number** and the whole line goes to the clipboard
- **Click masked text** and the hidden value goes to the clipboard - without ever showing it

### Hiding sensitive text

Wrap anything in `hide[[your text]]`, or select it and choose **Hide** from the right click
menu. It shows as asterisks from then on.

- Click masked text to copy it
- Right click it to unveil it for 5 seconds, unhide it for good, or other actions
- Hidden text stays hidden in the markdown preview too

![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/d1e1c80d-77bc-4fdc-930a-7c31b909800a)

Right clicking selected text (within one line) offers to hide it:

![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/a5bc326c-a0e6-46ff-831c-b18f43fefb8e)
![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/5e7c2f3a-0b5f-48ef-880e-9101d599d685)

### Encrypting whole notes

Set a password when saving with **Save as** and the note is encrypted before it is stored.
A strength meter tells you how good the password is while you type it.

![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/906782c4-404b-4332-a36d-7d17d8744440)

More about how passwords are handled in [Passwords](#passwords) below.

### Finding your way around

- **Ctrl + P** (or **Ctrl + K**) opens a quick search - type part of a name, press Enter
- Search by note name, or tick the box in the search bar to search note **contents**
- **Pin** any note or file to the top of the list
- Filter by folder, sort by name or date
- **Tabs** - reorderable, remembered between sessions, each with its own scroll position

![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/d5170b5f-d947-41ef-84c1-925ec71dd8de)

- **Favourites** - reorderable

![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/99dee3bd-2c37-4ab1-90ec-a57e7838bda4)
![image](https://github.com/Sznapsollo/PrivThing/assets/20971560/3a90d17d-7e01-4680-818e-afd90f0ad6d4)

### Not losing work

- **Crash-safe drafts** - what you type is kept aside a moment after you stop, and offered
  back if the tab dies before you saved. Encrypted notes are deliberately not drafted
- The browser asks before you close a tab with unsaved changes
- **Conflict detection** - if a file changed on disk since you opened it, saving asks whether
  to overwrite, reload, or cancel, instead of quietly replacing somebody's work
- **Export and import** all browser notes, optionally **encrypted with a password**

### Comparing

Open two notes side by side and click the compare icon between them for a line by line diff.

### Making it yours

- **Light, dark, or follow the system** - switch from the icon in the header, next to the flag
- 16 editor themes, or build your own colours
- English, German and Polish
- Draggable divider between the list and the note, position remembered

---

## Hotkeys

| | |
|---|---|
| **Ctrl + S** / **Cmd + S** | save the note |
| **Ctrl + F** | search inside the note (instead of the browser's own search) |
| **Ctrl + P** / **Ctrl + K** | quick open by name |

---

## Passwords

PrivThing can encrypt and decrypt notes holding passwords, private data and anything else you
would rather not leave lying around.

**The password is never saved and never sent anywhere. There is no reminder and no recovery.
Forget it and the note is gone.**

Different notes can use different passwords.

Settings offers three ways of handling a password once you have typed it:

- **forget immediately** - type it again every time you open the note
- **forget after a while** - encrypted notes stay open for a set time, then lock again
- **never forget** - until you reload the page

---

## Optional server

PrivThing can work on files from folders on your computer if you give it a server to talk to.
The server serves PrivThing itself and exposes a small API:

- **getListOfFiles** - list files from the configured folders
- **retrieveFileFromPath** - read one file
- **updateFileFromPath** - write one file
- **createFileInFolder** - create a new file in a configured folder

A ready one is in a separate repository: **https://github.com/Sznapsollo/PrivThingServer**

Turn it on in Settings with **Enable file server**.

Originally this is how it was meant to be used, and how the author still uses it: a small
server running locally that serves PrivThing *and* lets it read chosen folders, so the list
shows browser notes and real files together. Such a server should never be reachable from
outside your own computer.

---

## Running it yourself

You need Node 20 or newer.

```
npm install
npm start          # development server on http://localhost:3000
npm run build      # production build into build/
npm test           # run the test suite
npm run lint       # lint
npm run typecheck  # TypeScript check
```

`npm start` proxies `/actions` to `http://localhost:8180`, so you can develop against a local
PrivThingServer.

### Releasing alongside the server

`npm run release` builds, copies the result into the sibling PrivThingServer checkout's
`client/build`, stamps the version, and prints what to commit:

```
npm run release
npm run release -- --dry-run   # show what it would do
```

Set `PRIVTHING_SERVER_DIR` if the server checkout is not a sibling folder.
