const { Client } = require("@gradio/client");

async function check() {
    const app = await Client.connect("trellis-community/TRELLIS");
    const api_info = await app.view_api();
    console.log(JSON.stringify(api_info, null, 2));
}
check();