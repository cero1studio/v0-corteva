const fs = require("fs");
const buffer = fs.readFileSync("public/placeholder-logo.png");

async function run() {
  try {
    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('formdata-node')).FormData;
    const { fileFromSync } = await import('fetch-blob/from.js');

    const form = new FormData();
    form.append("file", fileFromSync("public/placeholder-logo.png", "image/png"));
    form.append("folder", "distributors");

    const res = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: form
    });
    
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
