import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url"; // Add this
import { error } from "console";

const __filename = fileURLToPath(import.meta.url); // Add this
const __dirname = path.dirname(__filename);        // Add this

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname, // Changed from import.meta.dirname
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public"); // Changed from import.meta.dirname

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}


// what is this error?
// set NODE_ENV=development && tsx server/index.ts
// file:///C:/Users/SCENTECH%20SERVICES/Desktop/codes/DesignDataChat/server/vite.ts:1
// var __defProp=Object.defineProperty;var __name=(target,value)=>__defProp(target,"name",{value,configurable:true});import express from"express";import fs from"fs";import path from"path";import{createServer as createViteServer,createLogger}from"vite";import viteConfig from"../vite.config";import{nanoid}from"nanoid";import{fileURLToPath}from"url";const __filename=fileURLToPath(import.meta.url);const __dirname=path.dirname(__filename);const viteLogger=createLogger();function log(message,source="express"){const formattedTime=new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true});console.log(`${formattedTime} [${source}] ${message}`)}__name(log,"log");async function setupVite(app,server){const serverOptions={middlewareMode:true,hmr:{server},allowedHosts:true};const vite=await createViteServer({...viteConfig,configFile:false,customLogger:{...viteLogger,error:__name((msg,options)=>{viteLogger.error(msg,options);process.exit(1)},"error")},server:serverOptions,appType:"custom"});app.use(vite.middlewares);app.use("*",async(req,res,next)=>{const url=req.originalUrl;try{const clientTemplate=path.resolve(__dirname,"..","client","index.html");let template=await fs.promises.readFile(clientTemplate,"utf-8");template=template.replace(`src="/src/main.tsx"`,`src="/src/main.tsx?v=${nanoid()}"`);const page=await vite.transformIndexHtml(url,template);res.status(200).set({"Content-Type":"text/html"}).end(page)}catch(e){vite.ssrFixStacktrace(e);next(e)}})}__name(setupVite,"setupVite");function serveStatic(app){const distPath=path.resolve(__dirname,"public");if(!fs.existsSync(distPath)){throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`)}app.use(express.static(distPath));app.use("*",(_req,res)=>{res.sendFile(path.resolve(distPath,"index.html"))})}__name(serveStatic,"serveStatic");export{log,serveStatic,setupVite};
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

// Error: Could not find the build directory: C:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\server\public, make sure to build the client first
//     at serveStatic (c:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\server\vite.ts:78:11)
//     at <anonymous> (c:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\server\index.ts:56:5)

// // This error indicates that the server is trying to serve static files from a directory that does not exist.
// // Specifically, it cannot find the `public` directory inside the `server` directory.
// // This is likely because the client has not been built yet, or the build output directory is not correctly set up.
// // To resolve this, ensure that you have built the client application before starting the server.
// // You can do this by running the build command for your client application, which should generate the `public` directory with the necessary files.
// // If you have already built the client, check the path to ensure it matches where the server expects the static files to be located.
// // The expected path is `C:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\server\public`, so make sure the build output is directed there.
// // If the build output directory is different, you may need to adjust the path in your server code accordingly.
// // If you are using a different build tool or configuration, ensure that the output directory is set correctly in your build configuration file (like `vite.config.js` or similar).
// How to build the client first?
// // To build the client application before starting the server, you typically need to run a build command
// specific to the build tool you are using (like Vite, Webpack, etc.). Since your project uses Vite, you can follow these steps:
// 1. **Navigate to the Client Directory**: Open your terminal or command prompt and navigate to the directory where your client application is located. This is usually the `client` directory in your project structure.

//    ```bash
//    cd C:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\client
//    ```
// 2. **Install Dependencies**: If you haven't already installed the dependencies, run the following command to install them:
//    ```bash
//    npm install
//    ```
//    or
//    ```bash
//    yarn install
//    ```
// 3. **Build the Client**: Run the build command to generate the production-ready files.
//    ```bash
//    npm run build
//    ```
//    or
//    ```bash
//    yarn build
//    ```
//    This command will create a `dist` directory (or whatever output directory is specified in your `vite.config.js` file) containing the built files for your client application.
// 4. **Check the Output Directory**: After the build completes, check the output directory (usually `dist` or `public`) to ensure that the built files are present. The server expects these files to be in the `public` directory, so you may need to copy or move them if your build output is in a different location.
// 5. **Start the Server**: Once the client is built, you can start your server. Navigate back to the server directory and run your server start command:
//    ```bash
//    cd C:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\server
//    npm run start
//    ```
//    or
//    ```bash
//    yarn start
//    ```  
//    must i build the client in the client directory and not in the root directory (C:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\)?
// Yes, you should build the client in the client directory (C:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\client) and not in the root directory. The reason for this is that the client application is typically set up with its own build configuration, dependencies, and scripts that are specific to the client-side code. Building it in the client directory ensures that all the necessary files and configurations are correctly applied, and the output is generated in the expected location.
// If your project structure is set up such that the client code resides in a separate directory (like `client`), then the build process will generate the output files in that directory, usually in a `dist` or `public` folder within the client directory. This is where your server will look for the static files to serve to clients.
// If you attempt to build the client in the root directory (C:\Users\SCENTECH SERVICES\Desktop\codes\DesignDataChat\), it


