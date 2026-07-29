import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("finora", {
  version: "1.0.0",
});

export {};
