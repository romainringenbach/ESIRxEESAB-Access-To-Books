const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const {ipcMain} = require('electron')


const fs = require('fs')
const klaw = require('klaw')
const through2 = require('through2')


// Library
var library = require('./library.json')

function saveLibrairy(){
  var jsonData = JSON.stringify(library);
  fs.writeFile("library.json", jsonData, function(err) {
      if(err) {
          return console.log(err);
      }
  });
}

//----------------------------------------------------------------------
// Librairy building
//----------------------------------------------------------------------

var book = {}
var libraryPath = "./"
var libraryBooksPath = "./library/"

const Exts = [
  "jpeg",
  "jpg",
  "png",
  "webp",
  "tiff",
  "gif",
  "svg"
]

function checkExt(ext){
  for (var i = 0; i < Exts.length; i++) {
    if(Exts[i].toUpperCase() === ext.toUpperCase()){
      return true
    }
  }
  return false
}

const addPage = through2.obj(function (item, enc, next) {
  if (!item.stats.isDirectory() && checkExt(path.extname(item.path))) {
    this.push(item)

    sharp(item.path)
    .resize(560, 360, {
      kernel: sharp.kernel.lanczos3
    })
    .max()
    .toFile(book.path+"page_"+book.page.length+".png",function(err){
      if (err === undefined) {
        book.pages.push({
          originalPath:item.path,
          description:"page "+book.page.length,
          path:"page_"+book.page.length+".png",
          id:book.name+'_'+book.page.length
        })
        next()
      } else {
        console.log(err)
      }
    })
  } else {
    next()
  }
})

function walkBook(bookPath){

  var pages = []

  klaw(bookPath)
    .pipe(addPage)
    .on('data', item => {
      if (!item.deleted) return
      pages.push(item.path)
    })
    .on('end', () => {
      console.dir(pages)
      library.books.push(book)
      saveLibrairy()
    }) // => all deleted files

}

function addBook(name,bookPath){
  book={
    name:name,
    path:libraryBooksPath+name+'/',
    originalpath = bookPath,
    pages:[

    ]
  }
}

//----------------------------------------------------------------------
// ipc
//----------------------------------------------------------------------

ipcMain.on('stripMoved',(event,arg) => {
  console.log(arg)
})

ipcMain.on('getLibrary',(event,arg) => {

  console.log('ask for library');
  event.sender.send('receiveLibrary',library)

})


//----------------------------------------------------------------------
// window
//----------------------------------------------------------------------

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({fullscreen:true,autoHideMenuBar:true})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))




  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })


}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
