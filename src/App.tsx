import React, { useEffect, useState } from 'react';
import AppBar from './AppBar';

function App() {
  console.log(window.ipcRenderer);

  const [isOpen, setOpen] = useState(false);
  const [isSent, setSent] = useState(false);
  const [isClicked, setClicked] = useState(false);
  const [dirPath, setDirPath] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [encryptKey, setEncryptKey] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [encryptedString, setEncryptedString] = useState<string>('');
  const [fromMain, setFromMain] = useState<string | null>(null);

  const handleToggle = () => {
    if (isOpen) {
      setOpen(false);
      setSent(false);
    } else {
      setOpen(true);
      setFromMain(null);
    }
  };
  // NOTE: Temporary not used 
  const sendMessageToElectron = () => {
    if (window.Main) {
      window.Main.sendMessage("Hello I'm from React World");
    } else {
      setFromMain('You are in a Browser, so no Electron functions are available');
    }
    setSent(true);
  };

  const handleButtonClick = (buttonEvent: string, ...data: any[]) => {
    if (window.Main) {
      window.Main.sendButtonClick(buttonEvent, ...data);
    } else {
      // TODO: this should be show as an alert
      setFromMain('You are in a Browser, so no Electron functions are available');
    }
    setClicked(true);
  };

  const handleFileSelect = (e: any) => {
    setSelectedFile(e.target.value);
    setEncryptKey(dirPath + '/' + e.target.value);
  };

  useEffect(() => {
    if (isSent && window.Main)
      window.Main.on('message', (message: string) => {
        console.log(message);
        setFromMain(message);
      });
  }, [fromMain, isSent]);

  // listen to response of button click event from electron
  useEffect(() => {
    if (isClicked && window.Main) {
      window.Main.on('selected-directory', (response: folderInfo) => {
        setDirPath(response.dirPath);
        setFiles(response.files);
      });

      window.Main.on('decrypt', (response: string) => {
        console.log(response);
        setSecret(response);
      });

      window.Main.on('encrypt', (response: string) => {
        console.log(response);
        setEncryptedString(response);
      });
    }
  }, [isClicked]);

  return (
    <div className="flex flex-col h-screen ">
      {window.Main && (
        <div className="flex-none">
          <AppBar />
        </div>
      )}
      <div className="bg-gray-800 p-4 h-full">
        <div className="flex justify-between items-center mb-4 ">
          <select
            className="bg-white shadow rounded border-0 p-4 w-3/4"
            size={1}
            value={selectedFile}
            onChange={(e) => handleFileSelect(e)}
          >
            {files.map((file, index) => (
              <option key={index} value={file}>
                {file}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleButtonClick('selectDirectory')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Select Folder
          </button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <textarea
            rows={10}
            className="bg-white shadow rounded border-0 p-3 w-1/2"
            placeholder="Enter encrypted string here"
            value={encryptedString}
            onChange={(e) => setEncryptedString(e.target.value)}
          />
          <div className="flex justify-center items-center">
            <span className="text-4xl text-white">→</span>
          </div>
          <textarea
            rows={10}
            className="bg-white shadow rounded border-0 p-3 w-1/2"
            placeholder="Enter text here"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleButtonClick('decrypt', encryptKey, encryptedString)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Decrypt
        </button>
        <button
          onClick={() => handleButtonClick('encrypt', encryptKey, secret)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Encrypt
        </button>
      </div>
    </div>
  );
}

export default App;
