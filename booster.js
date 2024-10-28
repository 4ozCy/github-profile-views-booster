const fs = require("fs");
const axios = require("axios");
const readline = require("readline");
const chalk = require("chalk");

let config;
try {
    config = JSON.parse(fs.readFileSync("config.json", "utf8"));
} catch (err) {
    console.error("Error reading config file:", err);
    process.exit(1);
}

const proxies = config.use_proxy
    ? fs.readFileSync("proxies.txt", "utf8").split("\n").map((p) => p.trim())
    : [];

const createAxiosInstance = (proxy) => {
    return axios.create({
        ...(proxy
            ? { proxy: { host: proxy.split(":")[0], port: proxy.split(":")[1] || 80 } }
            : {}),
        timeout: 5000
    });
};

const updateLine = (newLine) => {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(newLine);
};

const sendRequests = async (url, concurrency) => {
    let count = 0;

    const requests = Array.from({ length: concurrency }, async () => {
        while (true) {
            const proxy = proxies.length ? proxies[Math.floor(Math.random() * proxies.length)] : null;
            const axiosInstance = createAxiosInstance(proxy);

            try {
                const response = await axiosInstance.get(url);
                if (response.status === 200) {
                    count++;
                    updateLine(`${chalk.green("[+] ")}Successful request! Total sent views: ${chalk.yellow(count)}`);
                }
            } catch (error) {
                updateLine(`${chalk.red("[-] ")}Error making request: ${error.message}`);
            }
        }
    });

    await Promise.all(requests);
};

const run = async () => {
    const concurrency = 300; // Adjust as needed based on network limits and proxy availability
    const url = config.counter_url;

    console.log("Starting to send requests...");
    await sendRequests(url, concurrency);
};

run();
