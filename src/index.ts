import dotenv from "dotenv";
import path from "path";
dotenv.config();

if (process.env.NODE_ENV === "production") {
    const envPath = path.resolve("/root/myapp/.env");
    dotenv.config({ path: envPath });
}

import express, { Express } from "express";
import getApp from "./app";

(async () => {
    try {
        if (process.env.NODE_ENV === "development") {
            console.log(process.env);
        }
        const app: Express = express();
        const port = process.env.PORT || 3000;
        const main = getApp(app);

        app.listen(port, () => {
            console.log(`⚡️[${process.env.NODE_ENV}]: Server is running at ${port}`);
        });
    } catch (error) {
        console.log(error);
    }
})();
