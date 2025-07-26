const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Exposes a function to the renderer process that allows it to listen for
   * log messages sent from the main process on the 'n8n-log' channel.
   *
   * @param {function(string): void} callback - The function to execute when a log is received.
   * It receives the log string as its only argument.
   */
  onN8nLog: (callback) => {
    // We create a new listener function that calls the provided callback.
    // This is safer than exposing ipcRenderer directly.
    const listener = (event, log) => callback(log);
    ipcRenderer.on("n8n-log", listener);

    // Optional: Return a cleanup function to remove the listener.
    // This helps prevent memory leaks if the renderer component that
    // uses this listener is ever destroyed.
    return () => {
      ipcRenderer.removeListener("n8n-log", listener);
    };
  },
});
