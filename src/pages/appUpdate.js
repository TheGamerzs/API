async function get(req, res) {
  if (req.params.os == "windows.exe") {
    res.download("./update.exe");
    return;
  }
  if (req.params.os == "macos.app") {
    res.download("./macos.app");
    return;
  }

  res.setHeader("Content-Type", "text/xml");
  res.send(await require("fs").readFileSync("./updateApp.xml"));
}
module.exports = get;
